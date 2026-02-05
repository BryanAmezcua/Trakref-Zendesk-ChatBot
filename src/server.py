"""
FastAPI server for the Trakref Zendesk ChatBot RAG pipeline.
Exposes endpoints for chat and retrieval using MongoDB vector store with hybrid search.
"""

import sys
from pathlib import Path

# Add project root to path for imports
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import os
from typing import Optional
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from src.pipeline.hybrid.generation import generate_answer
from src.retrieval.strategies.hybrid import retrieve_hybrid, retrieve_hybrid_with_metadata_filter
from src.agent.supervisor import run_agent_pipeline

# Load environment variables
load_dotenv()

app = FastAPI(
    title="Trakref Zendesk ChatBot API",
    description="RAG pipeline for Trakref help documentation using hybrid search",
    version="1.0.0"
)

# CORS middleware for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Request/Response models
class ChatRequest(BaseModel):
    message: str
    sessionId: Optional[str] = None
    top_k: int = 5
    agent_mode: bool = False


class Citation(BaseModel):
    article_id: str
    title: str
    url: str


class ChatResponse(BaseModel):
    answer: str
    sufficient_context: bool
    missing_info: Optional[str]
    citations: list[Citation]
    confidence: float
    clarifying_question: Optional[str] = None
    agent_action: Optional[str] = None  # 'answer', 'clarify', or None for non-agent mode


class RetrieveRequest(BaseModel):
    query: str
    top_k: int = 6
    category_id: Optional[int] = None
    section_id: Optional[int] = None


class RetrievedDocument(BaseModel):
    article_id: str
    title: str
    url: str
    chunk_text: str
    score: float
    metadata: Optional[dict] = None


class RetrieveResponse(BaseModel):
    query: str
    top_k: int
    documents: list[RetrievedDocument]


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "ok", "mode": "production", "version": "1.0.0"}


@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    Chat endpoint that retrieves context and generates an answer.
    Uses hybrid RAG pipeline (vector + BM25) with MongoDB vector store.
    Supports agent_mode for supervised RAG with clarifying questions.
    """
    try:
        if request.agent_mode:
            # Use agent-supervised pipeline
            result = run_agent_pipeline(
                question=request.message,
                top_k=request.top_k,
                verbose=True
            )

            agent_action = result.get("agent_action", "answer")
            answer = result["answer"]
            sources = result.get("sources", [])
            clarifying_question = result.get("clarifying_question")

            # If agent is asking for clarification
            if agent_action == "clarify":
                return ChatResponse(
                    answer=answer,
                    sufficient_context=False,
                    missing_info="Need more specific information",
                    citations=[],
                    confidence=0.3,
                    clarifying_question=clarifying_question,
                    agent_action=agent_action
                )

            # Agent provided an answer - process normally
            insufficient_context = "INSUFFICIENT_CONTEXT" in answer.upper()

        else:
            # Use standard RAG pipeline
            result = generate_answer(
                question=request.message,
                top_k=request.top_k,
                verbose=True
            )

            answer = result["answer"]
            sources = result.get("sources", [])
            agent_action = None

            # Check if we have sufficient context
            insufficient_context = "INSUFFICIENT_CONTEXT" in answer.upper()

        # Build citations from sources
        citations = []
        seen_articles = set()

        for source in sources:
            article_title = source.get("Article", "Unknown")
            article_url = source.get("URL", "")

            # Skip duplicates
            if article_url in seen_articles:
                continue
            seen_articles.add(article_url)

            citations.append(Citation(
                article_id=article_url.split("/")[-1] if article_url else article_title,
                title=article_title,
                url=article_url
            ))

        # Calculate confidence based on retrieval results
        confidence = 0.0 if insufficient_context else min(0.95, 0.6 + (len(citations) * 0.07))

        # Clean up the answer if it contains INSUFFICIENT_CONTEXT marker
        if insufficient_context:
            answer = answer.replace("INSUFFICIENT_CONTEXT", "").strip()
            if not answer:
                answer = "I couldn't find enough information in the help documentation to fully answer your question. Could you try rephrasing or ask about a specific Trakref feature?"

        return ChatResponse(
            answer=answer,
            sufficient_context=not insufficient_context,
            missing_info="More specific documentation needed" if insufficient_context else None,
            citations=citations,
            confidence=confidence,
            clarifying_question=None,
            agent_action=agent_action
        )

    except Exception as e:
        print(f"[Chat API Error] {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/retrieve", response_model=RetrieveResponse)
async def retrieve(request: RetrieveRequest):
    """
    Retrieve relevant documents from the vector store using hybrid search.
    Supports optional metadata filtering.
    """
    try:
        # Use filtered retrieval if filters provided
        if request.category_id or request.section_id:
            docs = retrieve_hybrid_with_metadata_filter(
                query=request.query,
                top_k=request.top_k,
                category_id=request.category_id,
                section_id=request.section_id
            )
        else:
            docs = retrieve_hybrid(
                query=request.query,
                top_k=request.top_k
            )

        # Format documents for response
        documents = []
        for i, doc in enumerate(docs):
            metadata = doc.metadata
            documents.append(RetrievedDocument(
                article_id=str(metadata.get("article_id", f"doc_{i}")),
                title=metadata.get("article_name", "Unknown"),
                url=metadata.get("url", ""),
                chunk_text=doc.page_content,
                score=1.0 - (i * 0.05),  # Approximate score based on rank
                metadata={
                    "category_name": metadata.get("category_name"),
                    "section_name": metadata.get("section_name"),
                    "category_id": metadata.get("category_id"),
                    "section_id": metadata.get("section_id"),
                }
            ))

        return RetrieveResponse(
            query=request.query,
            top_k=request.top_k,
            documents=documents
        )

    except Exception as e:
        print(f"[Retrieve API Error] {e}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
