import certifi

from langchain_openai import OpenAIEmbeddings
from langchain_mongodb import MongoDBAtlasVectorSearch
from pymongo import MongoClient
from langchain_core.documents import Document

def setup_mongodb_collection(mongo_db_url: str, db_name: str, collection_name: str):
    """Set up MongoDB collection for vector storage."""
    client = MongoClient(mongo_db_url, tlsCAFile=certifi.where())
    db = client[db_name]
    
    # Create collection if it doesn't exist
    if collection_name not in db.list_collection_names():
        db.create_collection(collection_name)
        print(f"Created collection: {collection_name}")
    else:
        # Clear existing documents for fresh ingestion
        db[collection_name].delete_many({})
        print(f"Cleared existing documents in: {collection_name}")
    
    return client, db[collection_name]

def create_vector_store(collection, documents: list[Document], openai_api_key, index_name):
    """Create embeddings and store in MongoDB Atlas Vector Search."""
    embeddings = OpenAIEmbeddings(
        model="text-embedding-3-small",
        openai_api_key=openai_api_key
    )
    
    print("\nCreating embeddings and storing in MongoDB...")
    
    vector_store = MongoDBAtlasVectorSearch.from_documents(
        documents=documents,
        embedding=embeddings,
        collection=collection,
        index_name=index_name
    )
    
    print(f"Successfully stored {len(documents)} document chunks in MongoDB")
    return vector_store

def print_vector_search_index_instructions():
    """Print instructions for creating the vector search index in MongoDB Atlas."""
    print("\n" + "=" * 70)
    print("IMPORTANT: Create Vector Search Index in MongoDB Atlas")
    print("=" * 70)
    print("""
        To enable vector search, create an index in MongoDB Atlas with this definition:

        1. Go to MongoDB Atlas → Your Cluster → Atlas Search → Create Search Index
        2. Select "JSON Editor" and use this configuration:

        {
        "fields": [
            {
            "type": "vector",
            "path": "embedding",
            "numDimensions": 1536,
            "similarity": "cosine"
            }
        ]
        }

        3. Set the index name to: naive
        4. Select database: rag_playbook
        5. Select collection: naive_rag

        After creating the index, wait for it to become "Active" before running queries.
        """
    )
    print("=" * 70)