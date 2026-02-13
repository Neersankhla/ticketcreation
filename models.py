from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from enum import Enum

class CategoryEnum(str, Enum):
    BILLING = "billing"
    TECH = "tech" 
    SHIPPING = "shipping"
    OTHER = "other"

class TicketData(BaseModel):
    id: str
    title: str
    description: str
    category: Optional[CategoryEnum] = CategoryEnum.OTHER

class TriageRequest(BaseModel):
    ticket: TicketData
    traceId: str

class ClassificationResult(BaseModel):
    predictedCategory: CategoryEnum
    confidence: float

class ArticleMatch(BaseModel):
    id: str
    title: str
    score: float
    snippet: str

class AgentSuggestion(BaseModel):
    predictedCategory: CategoryEnum
    articleIds: List[str]
    draftReply: str
    confidence: float
    modelInfo: Dict[str, Any]

class TriageResponse(BaseModel):
    suggestion: AgentSuggestion
    processingTimeMs: int
