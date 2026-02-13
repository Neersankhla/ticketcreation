import os
import re
import logging
from typing import List
import google.generativeai as genai
from .models import ClassificationResult, CategoryEnum

logger = logging.getLogger(__name__)

class LLMProvider:
    """
    LLM provider supporting both Gemini AI and deterministic stub mode
    """
    
    def __init__(self):
        self.stub_mode = os.getenv("STUB_MODE", "false").lower() == "true"
        
        if not self.stub_mode:
            api_key = os.getenv("GEMINI_API_KEY")
            if not api_key:
                logger.warning("No Gemini API key found, falling back to stub mode")
                self.stub_mode = True
            else:
                genai.configure(api_key=api_key)
                self.model = genai.GenerativeModel('gemini-pro')
    
    def get_provider_name(self) -> str:
        return "stub" if self.stub_mode else "gemini"
    
    def get_model_name(self) -> str:
        return "deterministic-v1" if self.stub_mode else "gemini-pro"
    
    async def classify_ticket(self, text: str) -> ClassificationResult:
        """Classify ticket category"""
        if self.stub_mode:
            return self._stub_classify(text)
        else:
            return await self._gemini_classify(text)
    
    async def draft_response(self, ticket, articles: List, category: str) -> str:
        """Draft response for ticket"""
        if self.stub_mode:
            return self._stub_draft(ticket, articles, category)
        else:
            return await self._gemini_draft(ticket, articles, category)
    
    def _stub_classify(self, text: str) -> ClassificationResult:
        """Deterministic classification using keywords"""
        text_lower = text.lower()
        
        # Keyword patterns for each category
        patterns = {
            CategoryEnum.BILLING: [
                "refund", "invoice", "payment", "charge", "bill", "money",
                "cost", "price", "subscription", "credit", "debit", "account"
            ],
            CategoryEnum.TECH: [
                "error", "bug", "crash", "broken", "not working", "stack trace",
                "exception", "500", "404", "login", "password", "api", "database"
            ],
            CategoryEnum.SHIPPING: [
                "delivery", "shipment", "package", "tracking", "shipping",
                "address", "delayed", "lost", "arrived", "courier", "order"
            ]
        }
        
        # Calculate scores for each category
        scores = {}
        for category, keywords in patterns.items():
            matches = sum(1 for keyword in keywords if keyword in text_lower)
            if matches > 0:
                scores[category] = matches / len(keywords) + 0.3
        
        # Determine predicted category and confidence
        if scores:
            predicted_category = max(scores, key=scores.get)
            confidence = min(0.95, scores[predicted_category])
        else:
            predicted_category = CategoryEnum.OTHER
            confidence = 0.2
        
        return ClassificationResult(
            predictedCategory=predicted_category,
            confidence=confidence
        )
    
    async def _gemini_classify(self, text: str) -> ClassificationResult:
        """Classify using Gemini AI"""
        try:
            prompt = f"""
            Classify the following support ticket into one of these categories:
            - billing: payment, refund, invoice, subscription issues
            - tech: technical problems, errors, bugs, login issues  
            - shipping: delivery, package, tracking, shipping issues
            - other: general inquiries, other topics
            
            Ticket: {text}
            
            Respond with JSON format: {{"category": "billing|tech|shipping|other", "confidence": 0.0-1.0}}
            """
            
            response = self.model.generate_content(prompt)
            result_text = response.text.strip()
            
            # Extract JSON from response
            import json
            result = json.loads(result_text)
            
            return ClassificationResult(
                predictedCategory=CategoryEnum(result["category"]),
                confidence=float(result["confidence"])
            )
            
        except Exception as e:
            logger.error(f"Gemini classification failed: {e}")
            # Fallback to stub
            return self._stub_classify(text)
    
    def _stub_draft(self, ticket, articles: List, category: str) -> str:
        """Generate deterministic draft response"""
        # Category-specific templates
        templates = {
            "billing": "Thank you for contacting us regarding your billing inquiry.",
            "tech": "Thank you for reporting this technical issue.",
            "shipping": "Thank you for contacting us about your shipment.",
            "other": "Thank you for contacting our support team."
        }
        
        response = templates.get(category, templates["other"])
        response += " I'm here to help you resolve this matter.\n\n"
        
        if articles:
            response += "Based on our knowledge base, here are some relevant resources:\n\n"
            for i, article in enumerate(articles, 1):
                response += f"{i}. {article.title}\n"
                response += f"   {article.snippet}\n\n"
            
            response += "Please review these resources. If they don't resolve your issue, "
            response += "I'll escalate this to a human agent for further assistance."
        else:
            response += "I'm researching this issue and will provide you with a "
            response += "detailed response shortly. If this is urgent, please "
            response += "don't hesitate to contact us directly."
        
        response += "\n\nBest regards,\nSupport Team"
        return response
    
    async def _gemini_draft(self, ticket, articles: List, category: str) -> str:
        """Generate response using Gemini AI"""
        try:
            # Prepare articles context
            articles_text = ""
            if articles:
                articles_text = "\n\nRelevant knowledge base articles:\n"
                for i, article in enumerate(articles, 1):
                    articles_text += f"{i}. {article.title}\n{article.snippet}\n\n"
            
            prompt = f"""
            You are a helpful customer support agent. Write a professional, empathetic response to this support ticket.

            Ticket Title: {ticket.title}
            Ticket Description: {ticket.description}
            Category: {category}
            {articles_text}
            
            Guidelines:
            - Be helpful and professional
            - Reference relevant articles if provided
            - Offer next steps or escalation if needed
            - Keep response concise but complete
            - End with a professional closing
            """
            
            response = self.model.generate_content(prompt)
            return response.text.strip()
            
        except Exception as e:
            logger.error(f"Gemini drafting failed: {e}")
            # Fallback to stub
            return self._stub_draft(ticket, articles, category)
