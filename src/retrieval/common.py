import certifi

from langchain_openai import OpenAIEmbeddings
from langchain_mongodb import MongoDBAtlasVectorSearch
from pymongo import MongoClient

def get_vector_store(
    mongo_db_url: str,
    db_name: str,
    collection_name: str,
    openai_api_key: str,
    index_name: str
):
    """Connect to the MongoDB vector store."""
    client = MongoClient(mongo_db_url, tlsCAFile=certifi.where())
    collection = client[db_name][collection_name]
    
    embeddings = OpenAIEmbeddings(
        model="text-embedding-3-small",
        openai_api_key=openai_api_key
    )
    
    vector_store = MongoDBAtlasVectorSearch(
        collection=collection,
        embedding=embeddings,
        index_name=index_name
    )
    
    return vector_store, client