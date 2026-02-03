"""
Metadata-Filtered RAG - Generation Module
Uses retrieved context with optional metadata filtering to generate answers.
"""

import os
from typing import Optional
from dotenv import load_dotenv

from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

from src.retrieval.common import retrieve_with_filter, format_context, category_map

# Load environment variables
load_dotenv()

# Configuration
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

# LLM Configuration
MODEL_NAME = "gpt-4o-mini"
TEMPERATURE = 0.0
TOP_K = 5


# RAG Prompt Template
RAG_PROMPT_TEMPLATE = """You are a helpful assistant that answers questions based on the provided context from Trakref's Zendesk Help online articles.

Use ONLY the information from the context below to answer the question. If the context doesn't contain enough information to fully answer the question, acknowledge what you can answer and what information is missing.

Context:
{context}

Question: {question}

Answer:"""


def get_category_id(category_name: str) -> Optional[int]:
    """
    Look up category ID by name.

    Args:
        category_name: Human-readable category name

    Returns:
        Category ID or None if not found
    """
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
    category_id: Optional[int] = None,
    category_name: Optional[str] = None,
    section_id: Optional[int] = None,
    updated_at: Optional[int] = None,
    verbose: bool = False
) -> dict:
    """
    Generate an answer using the metadata-filtered RAG pipeline.

    Args:
        question: The user's question
        top_k: Number of documents to retrieve
        category_id: Filter by category ID (takes precedence over category_name)
        category_name: Filter by category name (e.g., "Release Notes")
        section_id: Filter by section ID
        updated_at: Filter by article update date (timestamp)
        verbose: If True, include retrieved documents in response

    Returns:
        Dictionary containing the answer, sources, and applied filters
    """
    # Resolve category_name to category_id if provided
    resolved_category_id = category_id
    if resolved_category_id is None and category_name is not None:
        resolved_category_id = get_category_id(category_name)
        if resolved_category_id is None:
            return {
                "answer": f"Unknown category: '{category_name}'. Available categories: {', '.join(list_categories())}",
                "sources": [],
                "filters_applied": {}
            }

    # Build filter info for response
    filters_applied = {}
    if resolved_category_id is not None:
        filters_applied["category_id"] = resolved_category_id
        # Include name for readability
        for name, cid in category_map.items():
            if cid == resolved_category_id:
                filters_applied["category_name"] = name
                break
    if section_id is not None:
        filters_applied["section_id"] = section_id
    if updated_at is not None:
        filters_applied["updated_at"] = updated_at

    # Step 1: Retrieve relevant documents with filters
    documents = retrieve_with_filter(
        query=question,
        top_k=top_k,
        category_id=resolved_category_id,
        section_id=section_id,
        updated_at=updated_at
    )

    if not documents:
        return {
            "answer": "I couldn't find any relevant information matching your query and filters.",
            "sources": [],
            "filters_applied": filters_applied
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
        "filters_applied": filters_applied
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
    """Run an interactive Q&A session with optional filtering."""
    print("\n" + "=" * 60)
    print("Metadata-Filtered RAG - Interactive Q&A")
    print("Ask questions about anything Trakref related")
    print("=" * 60)
    print("\nAvailable categories for filtering:")
    for name in list_categories():
        print(f"  • {name}")
    print("\nCommands:")
    print("  filter <category>  - Set category filter (e.g., 'filter Release Notes')")
    print("  clear              - Clear all filters")
    print("  quit               - Exit the session")
    print("=" * 60)

    current_category = None

    while True:
        print()
        if current_category:
            prompt_prefix = f"[{current_category}] "
        else:
            prompt_prefix = ""

        user_input = input(f"{prompt_prefix}Your question: ").strip()

        if not user_input:
            continue

        # Handle commands
        if user_input.lower() in ['quit', 'exit', 'q']:
            print("\nGoodbye!")
            break

        if user_input.lower() == 'clear':
            current_category = None
            print("Filters cleared.")
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

        # Process question
        print("\nRetrieving relevant documents...")
        print("Generating answer...\n")

        try:
            result = generate_answer(
                question=user_input,
                category_name=current_category,
                verbose=False
            )

            print("-" * 50)
            print("Answer:")
            print("-" * 50)
            print(result["answer"])

            if result["filters_applied"]:
                print(f"\nFilters applied: {result['filters_applied']}")

            print("\nSources:")
            for source in result["sources"]:
                print(f"  • {source['Category']} > {source['Section']} > {source['Article']}")
                print(f"    URL: {source['URL']}")

        except Exception as e:
            print(f"Error: {e}")


if __name__ == "__main__":
    interactive_mode()
