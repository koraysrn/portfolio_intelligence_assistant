import sys
import os

# Add backend/ directory to Python path so the 'app' module can be found
sys.path.insert(
    0, os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
)

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.endpoints import router as api_router
from app.core.config import settings

app = FastAPI(
    title="AI Portfolio Intelligence Assistant API",
    version="1.0.0",
    description=(
        "Autonomous portfolio analysis engine using Dual LLM Architecture, "
        "LangGraph, and MCP."
    )
)

# CORS settings: allows the frontend (Next.js) to access the API seamlessly
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API router
app.include_router(api_router, prefix="/api")


@app.get("/")
async def root():
    return {
        "status": "online",
        "project": "AI Portfolio Intelligence Assistant",
        "documentation": "/docs"
    }


if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=True
    )
