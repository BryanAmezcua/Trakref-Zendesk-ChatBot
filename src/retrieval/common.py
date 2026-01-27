import os
from dotenv import load_dotenv
from typing import Optional
import certifi

from langchain_openai import OpenAIEmbeddings
from langchain_mongodb import MongoDBAtlasVectorSearch
from pymongo import MongoClient
from langchain_core.documents import Document

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

def get_vector_store():
    """Connect to the MongoDB vector store."""
    client = MongoClient(MONGO_DB_URL, tlsCAFile=certifi.where())
    collection = client[DB_NAME][COLLECTION_NAME]
    
    embeddings = OpenAIEmbeddings(
        model="text-embedding-3-small",
        openai_api_key=OPENAI_API_KEY
    )
    
    vector_store = MongoDBAtlasVectorSearch(
        collection=collection,
        embedding=embeddings,
        index_name=INDEX_NAME
    )
    
    return vector_store, client

def retrieve_documents(query: str, top_k: int = DEFAULT_TOP_K) -> list:
    """
    Retrieve the top-k most relevant documents for a given query.
    
    Args:
        query: The search query string
        top_k: Number of documents to retrieve (default: 5)
    
    Returns:
        List of relevant document chunks with metadata
    """
    vector_store, client = get_vector_store()
    
    try:
        # Perform similarity search
        results = vector_store.similarity_search(
            query=query,
            k=top_k
        )
        return results
    finally:
        client.close()

def format_context(documents: list) -> str:
    """
    Format retrieved documents into a context string for the LLM.
    
    Args:
        documents: List of retrieved document objects
    
    Returns:
        Formatted context string
    """
    context_parts = []
    
    for i, doc in enumerate(documents, 1):
        category_name = doc.metadata.get('category_name', 'Unknown')
        section_name = doc.metadata.get('section_name', 'Unknown')
        article_name= doc.metadata.get('article_name', 'Unknown')

        context_parts.append(
            f"[Document {i}]\n"
            f"Category: {category_name} (Section: {section_name}, Article: {article_name})\n"
            f"Content:\n{doc.page_content}\n"
        )
    
    return "\n---\n".join(context_parts)

def build_pre_filter(
    category_id: int = None,
    section_id: int = None,
    updated_at: int = None,
) -> dict:
    """
    Build a MongoDB pre-filter for vector search.
    
    Args:
        category_id: Category of article (general scope: Support, troubleshooting, release notes, etc.)
        section_id: Different parts of the website (Account Details, Service Events, Work Orders etc.)
        updated_at: Date of article
    
    Returns:
        MongoDB filter dictionary
    """
    conditions = []
    
    # category_id filter
    if category_id is not None:
        conditions.append({"category_id": {"$eq": category_id}})
    
    # section_id filter
    if section_id is not None:
        conditions.append({"section_id": {"$eq": section_id}})
    
    # updated_at filter - gte means greater than or equal to
    if updated_at is not None:
        conditions.append({"updated_at": {"$gte": updated_at}})
    
    # Combine all conditions with AND
    if not conditions:
        return {}
    elif len(conditions) == 1:
        return conditions[0]
    else:
        return {"$and": conditions}

def retrieve_with_filter(
    query: str,
    top_k: int = DEFAULT_TOP_K,
    category_id: int = None,
    section_id: int = None,
    updated_at: int = None,
) -> list:
    """
    Retrieve documents with metadata pre-filtering.
    
    Args:
        query: The search query string
        top_k: Number of documents to retrieve
        category_id: Filter by Category
        section_id: Filter by Section
        updated_at: Filter by daate of article
    
    Returns:
        List of relevant document chunks
    """
    vector_store, client = get_vector_store()
    
    try:
        # Build pre-filter
        pre_filter = build_pre_filter(
            category_id=category_id,
            section_id=section_id,
            updated_at=updated_at,
        )
        
        # Perform filtered similarity search
        if pre_filter:
            results = vector_store.similarity_search(
                query=query,
                k=top_k,
                pre_filter=pre_filter
            )
        else:
            results = vector_store.similarity_search(
                query=query,
                k=top_k
            )
        
        return results
    finally:
        client.close()


category_map = {
    "Getting Started": 23789579667213,
    "Using TR4": 23789663034765,
    "Tips and Troubleshooting": 23789677764109,
    "Support Team": 23789686995469,
    "Release Notes": 23789686430605
}

def print_results(results: Document):
    #print("Documents")
    """ for i, (doc, score) in enumerate(results, 1):
        print(f"--- Document {i} (Score: {score:.4f}) ---")
        print(f"Category Name: {doc.metadata.get('category_name', 'Unknown')}")
        print(f"Section Name: {doc.metadata.get('section_name', 'Unknown')}")
        print(f"Article Name: {doc.metadata.get('article_name', 'Unknown')}")
        #print(f"Full Page Content : {doc.page_content}")
        print(f"Content preview: {doc.page_content[:300]}...") """
    
    for result in results:
        print(f"Category Name: {result.metadata.get('category_name', 'Unknown')}")
        print(f"Article Name: {result.metadata.get('article_name', 'Unknown')}")