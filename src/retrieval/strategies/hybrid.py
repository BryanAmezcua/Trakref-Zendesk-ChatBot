"""
Hybrid RAG - Retrieval Module
Combines vector search (semantic) with full-text search (BM25) using Reciprocal Rank Fusion.

PREREQUISITE: You must create a full-text search index in MongoDB Atlas.
See the docstring in get_hybrid_retriever() for setup instructions.
"""

import os
import certifi
from typing import Optional
from dotenv import load_dotenv

from langchain_openai import OpenAIEmbeddings
from langchain_mongodb import MongoDBAtlasVectorSearch
from langchain_mongodb.retrievers import MongoDBAtlasHybridSearchRetriever
from pymongo import MongoClient
from langchain_core.documents import Document

# Load environment variables
load_dotenv()

# Configuration
MONGO_DB_URL = os.getenv("MONGO_DB_URL")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

# MongoDB configuration
DB_NAME = "rag_playbook"
COLLECTION_NAME = "naive_rag"
VECTOR_INDEX_NAME = "naive"
FULLTEXT_INDEX_NAME = "fulltext"  # Must be created in MongoDB Atlas

# Retrieval configuration
DEFAULT_TOP_K = 5
DEFAULT_OVERSAMPLING = 10  # Sample k * oversampling candidates before RRF

# RRF parameters (higher penalty = lower scores for that method)
DEFAULT_VECTOR_PENALTY = 60.0
DEFAULT_FULLTEXT_PENALTY = 60.0
DEFAULT_VECTOR_WEIGHT = 1.0
DEFAULT_FULLTEXT_WEIGHT = 1.0


def get_hybrid_retriever(
    top_k: int = DEFAULT_TOP_K,
    oversampling_factor: int = DEFAULT_OVERSAMPLING,
    vector_penalty: float = DEFAULT_VECTOR_PENALTY,
    fulltext_penalty: float = DEFAULT_FULLTEXT_PENALTY,
    vector_weight: float = DEFAULT_VECTOR_WEIGHT,
    fulltext_weight: float = DEFAULT_FULLTEXT_WEIGHT,
    pre_filter: Optional[dict] = None,
) -> tuple[MongoDBAtlasHybridSearchRetriever, MongoClient]:
    """
    Create a hybrid search retriever combining vector and full-text search.

    PREREQUISITE: Create a full-text search index in MongoDB Atlas:

    1. Go to MongoDB Atlas -> Your Cluster -> Atlas Search tab
    2. Click "Create Search Index"
    3. Select "JSON Editor"
    4. Use this configuration:

        {
            "name": "fulltext",
            "definition": {
                "analyzer": "lucene.standard",
                "searchAnalyzer": "lucene.standard",
                "mappings": {
                    "dynamic": false,
                    "fields": {
                        "text": {
                            "type": "string",
                            "analyzer": "lucene.standard"
                        }
                    }
                }
            }
        }

    5. Wait for index status to become "Active"

    Args:
        top_k: Number of documents to return
        oversampling_factor: Sample multiplier for candidate pool (k * factor)
        vector_penalty: RRF penalty for vector search (higher = lower weight)
        fulltext_penalty: RRF penalty for full-text search (higher = lower weight)
        vector_weight: Weight multiplier for vector scores
        fulltext_weight: Weight multiplier for full-text scores
        pre_filter: Optional MongoDB query filter for metadata

    Returns:
        Tuple of (retriever, client) - remember to close client when done
    """
    client = MongoClient(MONGO_DB_URL, tlsCAFile=certifi.where())
    collection = client[DB_NAME][COLLECTION_NAME]

    embeddings = OpenAIEmbeddings(
        model="text-embedding-3-small",
        openai_api_key=OPENAI_API_KEY
    )

    vectorstore = MongoDBAtlasVectorSearch(
        collection=collection,
        embedding=embeddings,
        index_name=VECTOR_INDEX_NAME
    )

    retriever = MongoDBAtlasHybridSearchRetriever(
        vectorstore=vectorstore,
        search_index_name=FULLTEXT_INDEX_NAME,
        top_k=top_k,
        oversampling_factor=oversampling_factor,
        vector_penalty=vector_penalty,
        fulltext_penalty=fulltext_penalty,
        vector_weight=vector_weight,
        fulltext_weight=fulltext_weight,
        pre_filter=pre_filter,
    )

    return retriever, client


def retrieve_hybrid(
    query: str,
    top_k: int = DEFAULT_TOP_K,
    vector_weight: float = DEFAULT_VECTOR_WEIGHT,
    fulltext_weight: float = DEFAULT_FULLTEXT_WEIGHT,
    pre_filter: Optional[dict] = None,
) -> list[Document]:
    """
    Retrieve documents using hybrid search (vector + BM25 with RRF).

    Args:
        query: The search query string
        top_k: Number of documents to retrieve
        vector_weight: Weight for semantic similarity (default 1.0)
        fulltext_weight: Weight for keyword matching (default 1.0)
        pre_filter: Optional metadata filter

    Returns:
        List of relevant document chunks
    """
    retriever, client = get_hybrid_retriever(
        top_k=top_k,
        vector_weight=vector_weight,
        fulltext_weight=fulltext_weight,
        pre_filter=pre_filter,
    )

    try:
        results = retriever.invoke(query)
        return results
    finally:
        client.close()


def retrieve_hybrid_with_metadata_filter(
    query: str,
    top_k: int = DEFAULT_TOP_K,
    category_id: Optional[int] = None,
    section_id: Optional[int] = None,
    vector_weight: float = DEFAULT_VECTOR_WEIGHT,
    fulltext_weight: float = DEFAULT_FULLTEXT_WEIGHT,
) -> list[Document]:
    """
    Retrieve documents using hybrid search with metadata pre-filtering.

    Args:
        query: The search query string
        top_k: Number of documents to retrieve
        category_id: Filter by category ID
        section_id: Filter by section ID
        vector_weight: Weight for semantic similarity
        fulltext_weight: Weight for keyword matching

    Returns:
        List of relevant document chunks
    """
    # Build pre-filter from metadata
    conditions = []
    if category_id is not None:
        conditions.append({"category_id": {"$eq": category_id}})
    if section_id is not None:
        conditions.append({"section_id": {"$eq": section_id}})

    pre_filter = None
    if conditions:
        pre_filter = conditions[0] if len(conditions) == 1 else {"$and": conditions}

    return retrieve_hybrid(
        query=query,
        top_k=top_k,
        vector_weight=vector_weight,
        fulltext_weight=fulltext_weight,
        pre_filter=pre_filter,
    )


def debug_search_indexes():
    """Debug function to check MongoDB search index status."""
    client = MongoClient(MONGO_DB_URL, tlsCAFile=certifi.where())
    collection = client[DB_NAME][COLLECTION_NAME]

    print("=" * 50)
    print("DEBUG: MongoDB Search Index Status")
    print("=" * 50)

    try:
        search_indexes = list(collection.list_search_indexes())
        print(f"\nFound {len(search_indexes)} search index(es):\n")

        has_vector = False
        has_fulltext = False

        for idx in search_indexes:
            name = idx.get('name', 'unknown')
            status = idx.get('status', 'unknown')
            print(f"  - Name: {name}")
            print(f"    Status: {status}")

            if name == VECTOR_INDEX_NAME:
                has_vector = True
            if name == FULLTEXT_INDEX_NAME:
                has_fulltext = True

        print("\n" + "-" * 50)
        print("Hybrid Search Readiness:")
        print(f"  Vector index ({VECTOR_INDEX_NAME}): {'Ready' if has_vector else 'MISSING'}")
        print(f"  Full-text index ({FULLTEXT_INDEX_NAME}): {'Ready' if has_fulltext else 'MISSING'}")

        if not has_fulltext:
            print("\n  To create the full-text index, see instructions in get_hybrid_retriever() docstring.")

    except Exception as e:
        print(f"\nError listing search indexes: {e}")

    client.close()


def main():
    """Test hybrid retrieval."""
    print("=" * 50)
    print("Hybrid RAG - Retrieval Test")
    print("=" * 50)

    # First check index status
    debug_search_indexes()

    print("\n" + "=" * 50)
    print("Running Hybrid Search Test")
    print("=" * 50)

    test_query = "What is a work order?"
    print(f"\nQuery: {test_query}")
    print("-" * 50)

    try:
        results = retrieve_hybrid(test_query, top_k=3)

        print(f"\nRetrieved {len(results)} documents:\n")

        for i, doc in enumerate(results, 1):
            print(f"--- Document {i} ---")
            print(f"Category: {doc.metadata.get('category_name', 'Unknown')}")
            print(f"Section: {doc.metadata.get('section_name', 'Unknown')}")
            print(f"Article: {doc.metadata.get('article_name', 'Unknown')}")
            print(f"Content preview: {doc.page_content[:200]}...")
            print()

    except Exception as e:
        print(f"\nError during hybrid search: {e}")
        print("\nMake sure the full-text search index is created in MongoDB Atlas.")


if __name__ == "__main__":
    main()
