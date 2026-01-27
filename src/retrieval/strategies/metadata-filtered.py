"""
Naive RAG - Retrieval Module
Performs vector search against MongoDB to retrieve relevant document chunks.
"""

import os
import certifi
from dotenv import load_dotenv

from langchain_openai import OpenAIEmbeddings
from langchain_mongodb import MongoDBAtlasVectorSearch
from pymongo import MongoClient
from src.retrieval.common import format_context, get_vector_store, retrieve_with_filter, print_results

# Load environment variables
load_dotenv()

# Configuration
MONGO_DB_URL = os.getenv("MONGO_DB_URL")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

# MongoDB configuration (must match ingestion.py)
DB_NAME = "rag_playbook"
COLLECTION_NAME = "naive_rag"
INDEX_NAME = "naive"

# Retrieval configuration
DEFAULT_TOP_K = 5

def debug_collection():
    """Debug function to check MongoDB collection status."""
    client = MongoClient(MONGO_DB_URL, tlsCAFile=certifi.where())
    collection = client[DB_NAME][COLLECTION_NAME]
    
    print("=" * 50)
    print("DEBUG: MongoDB Collection Status")
    print("=" * 50)
    
    # Check document count
    doc_count = collection.count_documents({})
    print(f"\nTotal documents in collection: {doc_count}")
    
    if doc_count > 0:
        # Get a sample document to check structure
        sample = collection.find_one()
        print(f"\nSample document fields: {list(sample.keys())}")   
        
        # Check if embedding field exists
        if "embedding" in sample:
            print(f"Embedding field exists with {len(sample['embedding'])} dimensions")
        else:
            print("WARNING: 'embedding' field NOT found!")
            print(f"Available fields: {list(sample.keys())}")
    
    # List indexes
    print("\nIndexes on collection:")
    for index in collection.list_indexes():
        print(f"  - {index['name']}: {index.get('key', 'N/A')}")
    
    # Try to list search indexes (Atlas Vector Search)
    try:
        search_indexes = list(collection.list_search_indexes())
        print(f"\nVector Search Indexes: {len(search_indexes)}")
        for idx in search_indexes:
            print(f"  - Name: {idx.get('name')}")
            print(f"    Status: {idx.get('status', 'unknown')}")
            print(f"    Definition: {idx.get('latestDefinition', idx.get('definition', 'N/A'))}")
    except Exception as e:
        print(f"\nCould not list search indexes: {e}")
    
    client.close()
    return doc_count

def retrieve_documents_with_scores(query: str, top_k: int = DEFAULT_TOP_K) -> list:
    """
    Retrieve the top-k most relevant documents with similarity scores.
    
    Args:
        query: The search query string
        top_k: Number of documents to retrieve (default: 5)
    
    Returns:
        List of tuples (document, score)
    """
    vector_store, client = get_vector_store()
    
    try:
        # Perform similarity search with scores
        results = vector_store.similarity_search_with_score(
            query=query,
            k=top_k
        )
        return results
    finally:
        client.close()

def main():
    """Test retrieval with various filters."""
    print("=" * 60)
    print("Metadata-Filtered RAG - Retrieval Test")
    print("=" * 60)
    
    # Validate environment
    if not MONGO_DB_URL:
        raise ValueError("MONGO_DB_URL environment variable not set")
    if not OPENAI_API_KEY:
        raise ValueError("OPENAI_API_KEY environment variable not set")
    
    # First, debug the collection
    doc_count = debug_collection()
    
    if doc_count == 0:
        print("\n❌ No documents found! Run ingestion.py first.")
        return
    
    # Test queries with different filters
    print("\n" + "=" * 60)
    print("Running Filtered Retrieval Tests")
    print("=" * 60)
    
    # Test 1: No filter (baseline)
    test_query = "What can I do on the mobile experience?"
    print("\n📝 Test 1: No filter (baseline)")
    print(f"   Query: {test_query}")
    results = retrieve_with_filter(test_query, top_k=3)
    print(f"   Retrieved: {len(results)} documents")
    for doc in results:
        print(f"   - {doc.metadata.get('category_id')}")


    # Test 2: Filter by topic bucket
    print("\n📝 Test 2: Filter by category=Release Notes")
    test_query = "Release notes for November 2025?"
    results = retrieve_with_filter(
        test_query, 
        top_k=3, 
        category_id=23789686430605
    )
    print(f"   Retrieved: {len(results)} documents")
    for doc in results:
        print(f"   - {doc.metadata.get('category_id')}")

    print_results(results=results)

if __name__ == "__main__":
    main()