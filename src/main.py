import os
from dotenv import load_dotenv

from src.pipeline.naive.generation import interactive_mode as naive_interactive
from src.pipeline.naive.generation import generate_answer as naive_generate
from src.pipeline.metadata.generation import interactive_mode as filtered_interactive
from src.pipeline.metadata.generation import generate_answer as filtered_generate
from src.pipeline.metadata.generation import list_categories

# Load environment variables
load_dotenv()

# Configuration
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")


def main():
    """Run example queries or interactive mode."""
    print("=" * 50)
    print("Trakref Zendesk RAG - Generation Pipeline")
    print("=" * 50)

    # Validate environment
    if not OPENAI_API_KEY:
        raise ValueError("OPENAI_API_KEY environment variable not set")

    # Mode selection
    print("\nSelect mode:")
    print("  1. Naive RAG (no filtering)")
    print("  2. Metadata-Filtered RAG")
    print("-" * 50)
    mode = input("Enter mode (1 or 2): ").strip()

    if mode == "2":
        run_filtered_mode()
    else:
        run_naive_mode()


def run_naive_mode():
    """Run the naive RAG pipeline."""
    print("\n" + "=" * 50)
    print("Naive RAG Mode")
    print("=" * 50)

    example_questions = [
        "What is a work order for?",
        "How do I add a new link between System Owner and Contractor Instance?",
        "What type of service events are there",
    ]

    print("\nExample Questions:")
    for i, q in enumerate(example_questions, 1):
        print(f"  {i}. {q}")

    print("\n" + "-" * 50)
    choice = input("Enter question number (1-3), 'i' for interactive mode, or your own question: ").strip()

    if choice.lower() == 'i':
        naive_interactive()
    elif choice in ['1', '2', '3']:
        question = example_questions[int(choice) - 1]
        _run_query(question, naive_generate)
    elif choice:
        _run_query(choice, naive_generate)
    else:
        print("\nNo question provided. Run again to try!")


def run_filtered_mode():
    """Run the metadata-filtered RAG pipeline."""
    print("\n" + "=" * 50)
    print("Metadata-Filtered RAG Mode")
    print("=" * 50)

    print("\nAvailable categories for filtering:")
    for name in list_categories():
        print(f"  - {name}")

    print("\n" + "-" * 50)
    print("Options:")
    print("  i          - Interactive mode (set filters during session)")
    print("  <question> - Ask a question (optionally prefix with category)")
    print("\nExamples:")
    print("  'What new features were added?' (no filter)")
    print("  'Release Notes: What new features were added?' (filtered)")
    print("-" * 50)

    choice = input("Enter 'i' for interactive, or your question: ").strip()

    if choice.lower() == 'i':
        filtered_interactive()
    elif choice:
        # Check if question has category prefix
        category_name = None
        question = choice

        for cat in list_categories():
            prefix = f"{cat}:"
            if choice.startswith(prefix):
                category_name = cat
                question = choice[len(prefix):].strip()
                break

        print(f"\nQuestion: {question}")
        if category_name:
            print(f"Category filter: {category_name}")

        result = filtered_generate(question, category_name=category_name, verbose=False)

        print("\n" + "-" * 50)
        print("Answer:")
        print("-" * 50)
        print(result["answer"])

        if result.get("filters_applied"):
            print(f"\nFilters applied: {result['filters_applied']}")

        print("\nSources:")
        for source in result["sources"]:
            print(f"  - {source['Category']} > {source['Section']} > {source['Article']}")
            print(f"    URL: {source['URL']}")
    else:
        print("\nNo question provided. Run again to try!")


def _run_query(question: str, generate_fn):
    """Helper to run a query and display results."""
    print(f"\nQuestion: {question}\n")
    print("Retrieving relevant documents...")
    print("Generating answer...\n")

    result = generate_fn(question, verbose=False)

    print("-" * 50)
    print("Answer:")
    print("-" * 50)
    print(result["answer"])

    print("\nSources:")
    for source in result["sources"]:
        print(f"  - {source['Category']} > {source['Section']} > {source['Article']}")
        print(f"    URL: {source['URL']}")


if __name__ == "__main__":
    main()