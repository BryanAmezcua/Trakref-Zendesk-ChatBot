"""
Naive RAG - Generation Module
Uses retrieved context to generate answers using OpenAI LLM.
"""

import os
from dotenv import load_dotenv

from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

from src.retrieval.common import retrieve_documents, format_context

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


def generate_answer(question: str, top_k: int = TOP_K, verbose: bool = False) -> dict:
    """
    Generate an answer using the naive RAG pipeline.
    
    Args:
        question: The user's question
        top_k: Number of documents to retrieve
        verbose: If True, include retrieved documents in response
    
    Returns:
        Dictionary containing the answer and optionally the sources
    """
    # Step 1: Retrieve relevant documents
    documents = retrieve_documents(question, top_k=top_k)
    
    if not documents:
        return {
            "answer": "I couldn't find any relevant information to answer your question.",
            "sources": []
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
        ]
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
    """Run an interactive Q&A session."""
    print("\n" + "=" * 60)
    print("Naive RAG - Interactive Q&A")
    print("Ask questions about anything Trakref related")
    print("Type 'quit' or 'exit' to end the session")
    print("=" * 60)
    
    while True:
        print()
        question = input("Your question: ").strip()
        
        if not question:
            continue
        
        if question.lower() in ['quit', 'exit', 'q']:
            print("\nGoodbye!")
            break
        
        print("\n🔍 Retrieving relevant documents...")
        print("🤖 Generating answer...\n")
        
        try:
            result = generate_answer(question, verbose=False)
            
            print("-" * 50)
            print("Answer:")
            print("-" * 50)
            print(result["answer"])
            
            print("\n📚 Sources:")
            for source in result["sources"]:
                print(f"  • {source['Category']} > {source['Section']} > {source['Article']} (URL: {source["URL"]})")
            
        except Exception as e:
            print(f"❌ Error: {e}")
