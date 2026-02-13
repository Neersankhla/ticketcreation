from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import os
import logging
from .models import TriageRequest, TriageResponse
from .agent import AgentService

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Smart Helpdesk Agent",
    description="AI Agent for ticket triage and response generation",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize agent
agent_service = AgentService()

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "agent-worker",
        "version": "1.0.0"
    }

@app.post("/triage", response_model=TriageResponse)
async def triage_ticket(request: TriageRequest):
    """
    Process ticket triage using agentic workflow
    """
    try:
        logger.info(f"Processing triage for ticket {request.ticket.id}")
        
        result = await agent_service.process_triage(request)
        
        logger.info(f"Triage completed for ticket {request.ticket.id}")
        return result
        
    except Exception as e:
        logger.error(f"Triage failed: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Triage processing failed: {str(e)}"
        )

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
