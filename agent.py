import time
import logging
from typing import List
from .models import (
    TriageRequest, TriageResponse, ClassificationResult,
    AgentSuggestion, CategoryEnum
)
from .llm_provider import LLMProvider
from .kb_service import KnowledgeBaseService

logger = logging.getLogger(__name__)

class AgentService:
    """
    Main agent service that orchestrates the triage workflow
    """
    
    def __init__(self):
        self.llm_provider = LLMProvider()
        self.kb_service = KnowledgeBaseService()
    
    async def process_triage(self, request: TriageRequest) -> TriageResponse:
        """
        Execute the complete agentic triage workflow
        """
        start_time = time.time()
        
        try:
            # Step 1: Plan the workflow
            plan = self._create_plan(request.ticket)
            logger.info(f"Created plan: {plan}")
            
            # Step 2: Classify the ticket
            classification = await self._classify_ticket(request.ticket)
            logger.info(f"Classification: {classification.predictedCategory} "
                       f"(confidence: {classification.confidence:.3f})")
            
            # Step 3: Retrieve relevant KB articles
            articles = await self._retrieve_articles(request.ticket, classification)
            logger.info(f"Retrieved {len(articles)} articles")
            
            # Step 4: Draft response
            draft_reply = await self._draft_response(
                request.ticket, articles, classification
            )
            logger.info(f"Generated draft reply ({len(draft_reply)} chars)")
            
            # Step 5: Calculate final confidence
            final_confidence = self._calculate_confidence(
                classification.confidence, len(articles)
            )
            
            # Create suggestion
            suggestion = AgentSuggestion(
                predictedCategory=classification.predictedCategory,
                articleIds=[article.id for article in articles],
                draftReply=draft_reply,
                confidence=final_confidence,
                modelInfo={
                    "provider": self.llm_provider.get_provider_name(),
                    "model": self.llm_provider.get_model_name(),
                    "promptVersion": "v1.0",
                    "latencyMs": int((time.time() - start_time) * 1000)
                }
            )
            
            return TriageResponse(
                suggestion=suggestion,
                processingTimeMs=int((time.time() - start_time) * 1000)
            )
            
        except Exception as e:
            logger.error(f"Triage processing failed: {str(e)}")
            raise
    
    def _create_plan(self, ticket) -> List[str]:
        """Create execution plan for the ticket"""
        return [
            "classify_category",
            "retrieve_kb_articles", 
            "draft_response",
            "calculate_confidence"
        ]
    
    async def _classify_ticket(self, ticket) -> ClassificationResult:
        """Classify ticket category"""
        text = f"{ticket.title} {ticket.description}"
        return await self.llm_provider.classify_ticket(text)
    
    async def _retrieve_articles(self, ticket, classification) -> List:
        """Retrieve relevant KB articles"""
        query = f"{ticket.title} {ticket.description}"
        return await self.kb_service.search_articles(
            query, classification.predictedCategory.value
        )
    
    async def _draft_response(self, ticket, articles, classification) -> str:
        """Draft response using ticket and articles"""
        return await self.llm_provider.draft_response(
            ticket, articles, classification.predictedCategory.value
        )
    
    def _calculate_confidence(self, classification_confidence: float, 
                            num_articles: int) -> float:
        """Calculate final confidence score"""
        confidence = classification_confidence
        
        # Boost confidence based on article matches
        if num_articles > 0:
            confidence += 0.05 * min(num_articles, 3)
        
        return min(0.98, confidence)
