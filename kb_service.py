import logging
from typing import List, Optional
from .models import ArticleMatch

logger = logging.getLogger(__name__)

class KnowledgeBaseService:
    """
    Knowledge base service for article search and retrieval
    """
    
    def __init__(self):
        # Sample knowledge base articles
        self.articles = [
            {
                "id": "kb_001",
                "title": "How to update your payment method",
                "body": "To update your payment method, go to Account Settings > Billing > Payment Methods. Click 'Add Payment Method' and follow the prompts. You can also remove old payment methods from this page. All changes take effect immediately.",
                "tags": ["billing", "payments", "account"],
                "category": "billing"
            },
            {
                "id": "kb_002",
                "title": "Troubleshooting 500 Internal Server Errors",
                "body": "A 500 error indicates a server-side problem. First, try refreshing the page. If the error persists, check your internet connection. Clear your browser cache and cookies. If you're still seeing the error, please contact support with the exact error message and steps to reproduce.",
                "tags": ["tech", "errors", "troubleshooting", "500"],
                "category": "tech"
            },
            {
                "id": "kb_003",
                "title": "How to track your shipment",
                "body": "You can track your shipment using the tracking number provided in your shipping confirmation email. Visit our tracking page and enter your tracking number. Updates are provided in real-time from our shipping partners. Typical delivery time is 3-5 business days.",
                "tags": ["shipping", "delivery", "tracking"],
                "category": "shipping"
            },
            {
                "id": "kb_004",
                "title": "Password reset instructions",
                "body": "To reset your password, click 'Forgot Password' on the login page. Enter your email address and check your inbox for a reset link. The link expires in 24 hours for security. If you don't receive the email, check your spam folder.",
                "tags": ["tech", "password", "login", "account"],
                "category": "tech"
            },
            {
                "id": "kb_005",
                "title": "Refund policy and process",
                "body": "We offer full refunds within 30 days of purchase. To request a refund, go to Order History and click 'Request Refund'. Include the reason for return. Refunds are processed within 3-5 business days to your original payment method.",
                "tags": ["billing", "refund", "policy"],
                "category": "billing"
            },
            {
                "id": "kb_006",
                "title": "Shipping address changes",
                "body": "You can change your shipping address before your order ships. Go to Order History, find your order, and click 'Change Address'. If your order has already shipped, contact our support team immediately. Some restrictions may apply for international orders.",
                "tags": ["shipping", "address", "orders"],
                "category": "shipping"
            },
            {
                "id": "kb_007",
                "title": "Login troubleshooting",
                "body": "If you can't log in, first check that you're using the correct email and password. Try resetting your password if needed. Clear your browser cache and cookies. Disable browser extensions temporarily. If issues persist, your account may be temporarily locked for security.",
                "tags": ["tech", "login", "troubleshooting"],
                "category": "tech"
            },
            {
                "id": "kb_008",
                "title": "Billing cycle and charges",
                "body": "Your billing cycle starts on the date you first subscribe. Monthly subscriptions renew automatically. Annual subscriptions provide a 20% discount. You'll receive an email notification 3 days before each renewal. You can view your billing history in Account Settings.",
                "tags": ["billing", "subscription", "charges"],
                "category": "billing"
            }
        ]
    
    async def search_articles(self, query: str, 
                            category: Optional[str] = None) -> List[ArticleMatch]:
        """
        Search knowledge base articles using keyword matching
        """
        query_lower = query.lower()
        query_words = set(query_lower.split())
        
        matches = []
        
        for article in self.articles:
            score = 0.0
            
            # Title matching (highest weight)
            title_words = set(article["title"].lower().split())
            title_matches = len(query_words.intersection(title_words))
            score += title_matches * 3.0
            
            # Body matching
            body_words = set(article["body"].lower().split())
            body_matches = len(query_words.intersection(body_words))
            score += body_matches * 1.0
            
            # Tag matching (medium weight)
            tag_words = set(" ".join(article["tags"]).lower().split())
            tag_matches = len(query_words.intersection(tag_words))
            score += tag_matches * 2.0
            
            # Category match bonus
            if category and article.get("category") == category:
                score += 2.0
            
            # Normalize by query length
            if len(query_words) > 0:
                score = score / len(query_words)
            
            if score > 0.1:  # Minimum relevance threshold
                # Create snippet
                snippet = article["body"][:150]
                if len(article["body"]) > 150:
                    snippet += "..."
                
                matches.append(ArticleMatch(
                    id=article["id"],
                    title=article["title"],
                    score=score,
                    snippet=snippet
                ))
        
        # Sort by relevance score
        matches.sort(key=lambda x: x.score, reverse=True)
        
        # Return top 3 matches
        top_matches = matches[:3]
        
        logger.info(f"Found {len(matches)} articles, returning top {len(top_matches)}")
        
        return top_matches
