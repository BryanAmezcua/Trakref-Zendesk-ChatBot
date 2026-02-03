"""
Hybrid RAG - Generation Module
Uses hybrid retrieval (vector + BM25 with RRF) to generate answers.

Hybrid search excels at:
- Exact phrase matching (e.g., "BRK.A stock split")
- Acronyms and rare terms
- Combining semantic understanding with keyword precision
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

# Load environment variables
load_dotenv()

# Configuration
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

# LLM Configuration
MODEL_NAME = "gpt-4o-mini"
TEMPERATURE = 0.0
TOP_K = 5

# Default hybrid weights
DEFAULT_VECTOR_WEIGHT = 1.0
DEFAULT_FULLTEXT_WEIGHT = 1.0

# RAG Prompt Template
RAG_PROMPT_TEMPLATE = """You are a helpful assistant that answers questions based on the provided context from Trakref's Zendesk Help online articles.

Use ONLY the information from the context below to answer the question. If the context doesn't contain enough information to fully answer the question, acknowledge what you can answer and what information is missing.

Context:
{context}

Question: {question}

Answer:"""


def get_category_id(category_name: str) -> Optional[int]:
    """Look up category ID by name."""
    return category_map.get(category_name)


def list_categories() -> list[str]:
    """Return list of available category names."""
    return list(category_map.keys())


def create_rag_chain():
    """Create the RAG chain with prompt template and LLM."""
    prompt = ChatPromptTemplate.from_template(RAG_PROMPT_TEMPLATE)

    llm = ChatOpenAI(
        model=MODEL_NAME,
        temperature=TEMPERATURE,
        openai_api_key=OPENAI_API_KEY
    )

    output_parser = StrOutputParser()

    chain = prompt | llm | output_parser
    return chain


def generate_answer(
    question: str,
    top_k: int = TOP_K,
    vector_weight: float = DEFAULT_VECTOR_WEIGHT,
    fulltext_weight: float = DEFAULT_FULLTEXT_WEIGHT,
    category_id: Optional[int] = None,
    category_name: Optional[str] = None,
    section_id: Optional[int] = None,
    verbose: bool = False
) -> dict:
    """
    Generate an answer using the hybrid RAG pipeline.

    Args:
        question: The user's question
        top_k: Number of documents to retrieve
        vector_weight: Weight for semantic similarity (default 1.0)
        fulltext_weight: Weight for keyword matching (default 1.0)
        category_id: Filter by category ID
        category_name: Filter by category name (e.g., "Release Notes")
        section_id: Filter by section ID
        verbose: If True, include retrieved documents in response

    Returns:
        Dictionary containing the answer, sources, and search configuration
    """
    # Resolve category_name to category_id if provided
    resolved_category_id = category_id
    if resolved_category_id is None and category_name is not None:
        resolved_category_id = get_category_id(category_name)
        if resolved_category_id is None:
            return {
                "answer": f"Unknown category: '{category_name}'. Available categories: {', '.join(list_categories())}",
                "sources": [],
                "search_config": {}
            }

    # Build search config info for response
    search_config = {
        "method": "hybrid (vector + BM25 + RRF)",
        "vector_weight": vector_weight,
        "fulltext_weight": fulltext_weight,
    }

    filters_applied = {}
    if resolved_category_id is not None:
        filters_applied["category_id"] = resolved_category_id
        for name, cid in category_map.items():
            if cid == resolved_category_id:
                filters_applied["category_name"] = name
                break
    if section_id is not None:
        filters_applied["section_id"] = section_id

    if filters_applied:
        search_config["filters"] = filters_applied

    # Step 1: Retrieve relevant documents using hybrid search
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

    if not documents:
        return {
            "answer": "I couldn't find any relevant information matching your query.",
            "sources": [],
            "search_config": search_config
        }

    # Step 2: Format context
    context = format_context(documents)

    # Step 3: Generate answer
    chain = create_rag_chain()
    answer = chain.invoke({
        "context": context,
        "question": question
    })

    # Prepare response
    response = {
        "answer": answer,
        "sources": [
            {
                "Category": doc.metadata.get("category_name", "Unknown"),
                "Section": doc.metadata.get("section_name", "Unknown"),
                "Article": doc.metadata.get("article_name", "Unknown"),
                "URL": doc.metadata.get("url", "Unknown")
            }
            for doc in documents
        ],
        "search_config": search_config
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


def interactive_mode():
    """Run an interactive Q&A session with hybrid search."""
    print("\n" + "=" * 60)
    print("Hybrid RAG - Interactive Q&A")
    print("Combines vector search (semantic) + BM25 (keywords)")
    print("=" * 60)
    print("\nAvailable categories for filtering:")
    for name in list_categories():
        print(f"  - {name}")
    print("\nCommands:")
    print("  filter <category>    - Set category filter")
    print("  weight v=X f=Y       - Set weights (e.g., 'weight v=1.5 f=0.5')")
    print("  clear                - Clear filters and reset weights")
    print("  quit                 - Exit the session")
    print("=" * 60)

    current_category = None
    vector_weight = DEFAULT_VECTOR_WEIGHT
    fulltext_weight = DEFAULT_FULLTEXT_WEIGHT

    while True:
        print()
        # Build prompt prefix showing current settings
        settings = []
        if current_category:
            settings.append(f"cat:{current_category}")
        if vector_weight != 1.0 or fulltext_weight != 1.0:
            settings.append(f"v={vector_weight}/f={fulltext_weight}")

        prompt_prefix = f"[{', '.join(settings)}] " if settings else ""

        user_input = input(f"{prompt_prefix}Your question: ").strip()

        if not user_input:
            continue

        # Handle commands
        if user_input.lower() in ['quit', 'exit', 'q']:
            print("\nGoodbye!")
            break

        if user_input.lower() == 'clear':
            current_category = None
            vector_weight = DEFAULT_VECTOR_WEIGHT
            fulltext_weight = DEFAULT_FULLTEXT_WEIGHT
            print("Filters cleared, weights reset to 1.0/1.0")
            continue

        if user_input.lower().startswith('filter '):
            category = user_input[7:].strip()
            if category in category_map:
                current_category = category
                print(f"Filter set to: {category}")
            else:
                print(f"Unknown category: '{category}'")
                print(f"Available: {', '.join(list_categories())}")
            continue

        if user_input.lower().startswith('weight '):
            # Parse weight command: "weight v=1.5 f=0.5"
            parts = user_input[7:].strip().split()
            for part in parts:
                if part.startswith('v='):
                    try:
                        vector_weight = float(part[2:])
                    except ValueError:
                        print(f"Invalid vector weight: {part}")
                elif part.startswith('f='):
                    try:
                        fulltext_weight = float(part[2:])
                    except ValueError:
                        print(f"Invalid fulltext weight: {part}")
            print(f"Weights set: vector={vector_weight}, fulltext={fulltext_weight}")
            continue

        # Process question
        print("\nRetrieving with hybrid search...")
        print("Generating answer...\n")

        try:
            result = generate_answer(
                question=user_input,
                category_name=current_category,
                vector_weight=vector_weight,
                fulltext_weight=fulltext_weight,
                verbose=False
            )

            print("-" * 50)
            print("Answer:")
            print("-" * 50)
            print(result["answer"])

            print(f"\nSearch config: {result['search_config']}")

            print("\nSources:")
            for source in result["sources"]:
                print(f"  - {source['Category']} > {source['Section']} > {source['Article']}")
                print(f"    URL: {source['URL']}")

        except Exception as e:
            print(f"Error: {e}")
            print("\nMake sure the full-text search index is created in MongoDB Atlas.")
            print("Run: python -m src.retrieval.strategies.hybrid")


if __name__ == "__main__":
    interactive_mode()
