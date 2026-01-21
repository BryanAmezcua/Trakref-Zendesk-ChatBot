"""
Ingestion Pipeline
Fetch Articles from Zendesk help API, chunk them, and store vectors in MongoDB.
"""

import os
import certifi
from dotenv import load_dotenv

from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings
from langchain_mongodb import MongoDBAtlasVectorSearch
from pymongo import MongoClient
from src.api.zendesk_client import ZendeskClient

# Load environment variables
load_dotenv()

# Configuration
TRAKREF_ZENDESK_BASE = os.getenv("TRAKREF_ZENDESK_BASE")
MONGO_DB_URL = os.getenv("MONGO_DB_URL")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

# MongoDB configuration
DB_NAME = "rag_playbook"
COLLECTION_NAME = "naive_rag"
INDEX_NAME = "naive"

# Chunking configuration
CHUNK_SIZE = 1000
CHUNK_OVERLAP = 200


def ingest():
    """Main ingestion pipeline."""
    print("=" * 50)
    print("Naive RAG - Ingestion Pipeline")
    print("=" * 50)
    
    # Validate environment
    if not MONGO_DB_URL:
        raise ValueError("MONGO_DB_URL environment variable not set")
    if not OPENAI_API_KEY:
        raise ValueError("OPENAI_API_KEY environment variable not set")
    
    # Instantiate Zendesk Client to fetch data
    client = ZendeskClient(base=TRAKREF_ZENDESK_BASE)
    
    # Step 1: Get documents
    for category in client.iterate_categories():
        print(f"category: {category}")
    
    """ if not articles:
        raise ValueError("No articles found in Zendesk")
     """
    """ # Step 2: Load and chunk PDFs
    documents = load_and_chunk_pdfs(pdf_files)
    
    # Step 3: Setup MongoDB
    client, collection = setup_mongodb_collection()
    
    try:
        # Step 4: Create embeddings and store in vector database
        vector_store = create_vector_store(collection, documents)
        
        print("\n✅ Ingestion complete!")
        print(f"   Database: {DB_NAME}")
        print(f"   Collection: {COLLECTION_NAME}")
        print(f"   Documents stored: {len(documents)}")
        
        # Print instructions for creating the vector search index
        print_vector_search_index_instructions()
        
    finally:
        client.close() """


if __name__ == "__main__":
    ingest()