import os
from dotenv import load_dotenv
import certifi

from langchain_openai import OpenAIEmbeddings
from langchain_mongodb import MongoDBAtlasVectorSearch
from pymongo import MongoClient

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

def format_retrieved_context(documents: list) -> str:
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