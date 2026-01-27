import os
from dotenv import load_dotenv

from src.pipeline.naive.generation import interactive_mode, generate_answer

# Load environment variables
load_dotenv()

# Configuration
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")


def main():
    """Run example queries or interactive mode."""
    print("=" * 50)
    print("Naive RAG - Generation Pipeline")
    print("=" * 50)
    
    # Validate environment
    if not OPENAI_API_KEY:
        raise ValueError("OPENAI_API_KEY environment variable not set")
    
    # Example queries
    example_questions = [
        "What is a work order for?",
        "How do I add a new link between System Owner and Contractor Instance?",
        "What type of service events are there",
    ]
    
    print("\n📋 Example Questions Available:")
    for i, q in enumerate(example_questions, 1):
        print(f"  {i}.) {q}")
    
    print("\n" + "-" * 50)
    choice = input("Enter question number (1-3), 'i' for interactive mode, or your own question: ").strip()
    
    if choice.lower() == 'i':
        interactive_mode()
    elif choice in ['1', '2', '3']:
        question = example_questions[int(choice) - 1]
        print(f"\n📝 Question: {question}\n")
        print("🔍 Retrieving relevant documents...")
        print("🤖 Generating answer...\n")
        
        result = generate_answer(question, verbose=True)
        
        print("-" * 50)
        print("Answer:")
        print("-" * 50)
        print(result["answer"])
        
        print("\n📚 Sources:")
        for source in result["sources"]:
            print(f"  • {source['Category']} > {source['Section']} > {source['Article']} (URL: {source["URL"]})")
    elif choice:
        print(f"\n📝 Question: {choice}\n")
        print("🔍 Retrieving relevant documents...")
        print("🤖 Generating answer...\n")
        
        result = generate_answer(choice, verbose=False)
        
        print("-" * 50)
        print("Answer:")
        print("-" * 50)
        print(result["answer"])
        
        print("\n📚 Sources:")
        for source in result["sources"]:
            print(f"  • {source['Category']} > {source['Section']} > {source['Article']} (URL: {source["URL"]})")
    else:
        print("\n👋 No question provided. Run again to try!")


if __name__ == "__main__":
    main()