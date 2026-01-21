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
from src.pipeline.models import Category, Section, Article
from src.text.clean import html_to_text

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

    categories_by_id = {}
    sections_by_id = {}
    articles_by_id = {}
    
    # Step 1: Get categories, sections, and articles
    for cat in client.iterate_categories():
        category = Category(
            id=cat["id"],
            name=cat["name"]
        )
        categories_by_id[category.id] = category

    for sec in client.iterate_sections():
        section = Section(
            id=sec["id"],
            name=sec["name"],
            category_id=sec["category_id"],
            category_name=categories_by_id[sec["category_id"]].name
        )
        sections_by_id[section.id] = section

    for art in client.iterate_articles():
        article = Article(
            id = art["id"],
            text = html_to_text(art["body"]),
            article_name=art["name"],
            category_id=sections_by_id[art["section_id"]].category_id,
            category_name=sections_by_id[art["section_id"]].category_name,
            section_id=art["section_id"],
            section_name=sections_by_id[art["section_id"]].name,
            url=art["url"],
            title=art["title"],
            updated_at=art["updated_at"],
        )
        print(f"article: {article}")
        articles_by_id[article.id] = article

        #print(f"articles_by_id: {articles_by_id}")



    
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