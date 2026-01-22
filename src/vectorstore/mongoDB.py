import certifi

from pymongo import MongoClient

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