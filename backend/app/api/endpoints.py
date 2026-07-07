import os
import shutil
import uuid
from typing import List, Dict, Any, Optional

from fastapi import APIRouter, UploadFile, File, HTTPException, Body
from pydantic import BaseModel, Field

from app.services.parser import PortfolioParserService
from app.services.vector_store import VectorStoreService
from app.agent.graph import portfolio_agent

router = APIRouter()
vector_store = VectorStoreService()


class ChatRequest(BaseModel):
    message: str = Field(
        ..., description="The user's question to the agent"
    )
    portfolio_id: str = Field(
        ..., description="Unique identifier of the target portfolio"
    )
    provider: str = Field(
        default="ollama",
        description="Selected LLM provider (ollama or deepseek)"
    )
    model: str = Field(
        default="llama3.2",
        description="Selected model name (llama3.2, qwen2.5, gemma3, etc.)"
    )
    temperature: float = Field(
        default=0.2, ge=0.0, le=1.0
    )
    history: List[Dict[str, Any]] = Field(
        default_factory=list,
        description="Previous chat history (message list)"
    )


class ChatResponse(BaseModel):
    answer: str
    metrics: Dict[str, Any]
    context_used: str


@router.post("/upload")
async def upload_portfolio(file: UploadFile = File(...)):
    """
    Accepts a PDF, CSV, or Excel portfolio document, parses it,
    and indexes it in ChromaDB.
    """
    temp_dir = "./temp_uploads"
    os.makedirs(temp_dir, exist_ok=True)

    # Generate a safe temporary file name
    portfolio_id = str(uuid.uuid4())
    ext = os.path.splitext(file.filename)[1].lower()
    temp_file_path = os.path.join(temp_dir, f"{portfolio_id}{ext}")

    try:
        # 1. Save file temporarily to disk
        with open(temp_file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # 2. Call parser service to extract text
        parsed_data = PortfolioParserService.parse_file(temp_file_path)

        # 3. Index extracted text in ChromaDB with BAAI embedding model
        metadata = parsed_data.metadata or {}
        metadata["original_name"] = file.filename

        success = vector_store.add_portfolio_document(
            portfolio_id=portfolio_id,
            raw_text=parsed_data.raw_text,
            metadata=metadata
        )

        if not success:
            raise HTTPException(
                status_code=500,
                detail="Vector database indexing failed."
            )

        return {
            "status": "success",
            "portfolio_id": portfolio_id,
            "file_name": file.filename,
            "message": (
                "Portfolio successfully parsed and stored in smart memory."
            )
        }

    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"System error: {str(e)}"
        )
    finally:
        # Clean up temporary file (cost and hygiene optimization)
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)


@router.post("/chat", response_model=ChatResponse)
async def chat_with_agent(request: ChatRequest):
    """
    Combines the user message with RAG context and runs the autonomous
    LangGraph agent.
    """
    try:
        # 1. Retrieve portfolio context from ChromaDB based on the query
        relevant_chunks = vector_store.retrieve_relevant_chunks(
            portfolio_id=request.portfolio_id,
            query=request.message,
            top_k=3
        )

        context_text = "\n\n".join(
            [chunk["content"] for chunk in relevant_chunks]
        )
        if not context_text:
            context_text = (
                "No document content for this portfolio found in memory yet."
            )

        # 2. Build LangGraph initial state (including chat history)
        messages_input = []
        for msg in request.history:
            if msg.get("role") == "user":
                messages_input.append(("user", msg.get("content")))
            elif msg.get("role") == "assistant":
                messages_input.append(("assistant", msg.get("content")))

        messages_input.append(("user", request.message))

        initial_state = {
            "messages": messages_input,
            "provider": request.provider,
            "model": request.model,
            "temperature": request.temperature,
            "context": context_text,
            "portfolio_assets": [],
            "metrics": {}
        }

        # 3. Run the LangGraph autonomous graph
        final_state = portfolio_agent.invoke(initial_state)

        # Extract the last AI message and measured performance metrics
        last_ai_message = final_state["messages"][-1].content
        metrics = final_state.get("metrics", {})

        return ChatResponse(
            answer=last_ai_message,
            metrics=metrics,
            context_used=(
                context_text[:300] + "..."
                if len(context_text) > 300 else context_text
            )
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Agent encountered an error: {str(e)}"
        )
