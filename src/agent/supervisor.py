"""
Agent Supervisor Module

A lightweight agent that wraps the RAG pipeline and evaluates retrieval quality.
When retrieval yields poor results, it generates a clarifying question instead
of providing a weak answer.
"""

import os
from typing import Optional
from dotenv import load_dotenv

from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

from src.retrieval.strategies.hybrid import (
    retrieve_hybrid,
    retrieve_hybrid_with_metadata_filter,
)
from src.retrieval.common import format_context, category_map
from src.pipeline.hybrid.generation import create_rag_chain, get_category_id, list_categories

load_dotenv()

# Configuration
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
MODEL_NAME = "gpt-4o-mini"

# Retrieval quality thresholds
MIN_DOCS_THRESHOLD = 2  # Minimum documents needed for good context
SCORE_THRESHOLD = 0.65  # Minimum relevance score (approximate)

# Clarifying question prompt
CLARIFY_PROMPT_TEMPLATE = """You are a helpful assistant for Trakref's help documentation.

The user asked a question, but the search results were not relevant enough to provide a good answer.

User's question: {question}

What was found (may be partially relevant):
{context_summary}

Generate a brief, friendly clarifying question to help the user get better results.
Focus on:
- Asking for specific feature names or workflows they're asking about
- Clarifying if they mean a particular Trakref module or feature
- Asking for more details about what they're trying to accomplish

Keep the response conversational and helpful. Do not apologize excessively.
Start with acknowledging what you found (if anything), then ask your clarifying question.

Response:"""


def evaluate_retrieval_quality(documents: list, query: str) -> dict:
    """
    Evaluate the quality of retrieved documents.

    Returns:
        dict with 'is_good' boolean and 'reason' string
    """
    if not documents:
        return {
            "is_good": False,
            "reason": "no_documents",
            "score": 0.0
        }

    # Check document count
    if len(documents) < MIN_DOCS_THRESHOLD:
        return {
            "is_good": False,
            "reason": "insufficient_documents",
            "score": 0.3
        }

    # Check if query terms appear in retrieved content
    query_terms = set(query.lower().split())
    stop_words = {'how', 'do', 'i', 'the', 'a', 'an', 'to', 'in', 'is', 'what', 'where', 'when', 'why', 'can'}
    meaningful_terms = query_terms - stop_words

    if meaningful_terms:
        # Check how many query terms appear in the top documents
        top_content = " ".join([doc.page_content.lower() for doc in documents[:3]])
        matches = sum(1 for term in meaningful_terms if term in top_content)
        match_ratio = matches / len(meaningful_terms) if meaningful_terms else 0

        if match_ratio < 0.3:
            return {
                "is_good": False,
                "reason": "low_term_overlap",
                "score": match_ratio
            }

    # If we have enough documents and reasonable term overlap, consider it good
    return {
        "is_good": True,
        "reason": "sufficient_context",
        "score": 0.8
    }


def generate_clarifying_question(question: str, documents: list) -> str:
    """
    Generate a clarifying question when retrieval quality is poor.
    """
    # Summarize what was found (if anything)
    if documents:
        found_topics = set()
        for doc in documents[:3]:
            category = doc.metadata.get("category_name", "")
            section = doc.metadata.get("section_name", "")
            if category:
                found_topics.add(category)
            if section:
                found_topics.add(section)

        context_summary = f"Found some content related to: {', '.join(found_topics)}" if found_topics else "Found some general documentation"
    else:
        context_summary = "No directly relevant articles were found"

    # Create the clarifying question chain
    prompt = ChatPromptTemplate.from_template(CLARIFY_PROMPT_TEMPLATE)
    llm = ChatOpenAI(
        model=MODEL_NAME,
        temperature=0.7,  # Slightly higher for more natural questions
        openai_api_key=OPENAI_API_KEY
    )
    chain = prompt | llm | StrOutputParser()

    clarifying_question = chain.invoke({
        "question": question,
        "context_summary": context_summary
    })

    return clarifying_question


def run_agent_pipeline(
    question: str,
    top_k: int = 5,
    vector_weight: float = 1.0,
    fulltext_weight: float = 1.0,
    category_id: Optional[int] = None,
    category_name: Optional[str] = None,
    section_id: Optional[int] = None,
    verbose: bool = False
) -> dict:
    """
    Run the agent-supervised RAG pipeline.

    The agent:
    1. Retrieves documents using hybrid search
    2. Evaluates retrieval quality
    3. If quality is poor -> generates clarifying question
    4. If quality is good -> generates answer normally

    Returns:
        Dictionary containing answer/clarification, sources, and agent metadata
    """
    # Resolve category name to ID if provided
    resolved_category_id = category_id
    if resolved_category_id is None and category_name is not None:
        resolved_category_id = get_category_id(category_name)
        if resolved_category_id is None:
            return {
                "answer": f"Unknown category: '{category_name}'. Available categories: {', '.join(list_categories())}",
                "sources": [],
                "search_config": {},
                "agent_action": "error",
                "clarifying_question": None
            }

    # Step 1: Retrieve documents
    if resolved_category_id is not None or section_id is not None:
        documents = retrieve_hybrid_with_metadata_filter(
            query=question,
            top_k=top_k,
            category_id=resolved_category_id,
            section_id=section_id,
            vector_weight=vector_weight,
            fulltext_weight=fulltext_weight,
        )
    else:
        documents = retrieve_hybrid(
            query=question,
            top_k=top_k,
            vector_weight=vector_weight,
            fulltext_weight=fulltext_weight,
        )

    # Step 2: Evaluate retrieval quality
    quality = evaluate_retrieval_quality(documents, question)

    # Build search config
    search_config = {
        "method": "hybrid (vector + BM25 + RRF)",
        "vector_weight": vector_weight,
        "fulltext_weight": fulltext_weight,
        "agent_mode": True,
        "retrieval_quality": quality
    }

    # Step 3: Decide action based on quality
    if not quality["is_good"]:
        # Generate clarifying question
        clarifying_question = generate_clarifying_question(question, documents)

        return {
            "answer": clarifying_question,
            "sources": [],
            "search_config": search_config,
            "agent_action": "clarify",
            "clarifying_question": clarifying_question,
            "quality_reason": quality["reason"]
        }

    # Step 4: Quality is good - generate answer normally
    context = format_context(documents)
    chain = create_rag_chain()
    answer = chain.invoke({
        "context": context,
        "question": question
    })

    # Prepare sources
    sources = [
        {
            "Category": doc.metadata.get("category_name", "Unknown"),
            "Section": doc.metadata.get("section_name", "Unknown"),
            "Article": doc.metadata.get("article_name", "Unknown"),
            "URL": doc.metadata.get("url", "Unknown")
        }
        for doc in documents
    ]

    response = {
        "answer": answer,
        "sources": sources,
        "search_config": search_config,
        "agent_action": "answer",
        "clarifying_question": None
    }

    if verbose:
        response["retrieved_documents"] = [
            {
                "content": doc.page_content,
                "metadata": doc.metadata
            }
            for doc in documents
        ]

    return response
