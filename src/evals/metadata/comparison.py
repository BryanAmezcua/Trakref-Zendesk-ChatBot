"""
Metadata-Filtered RAG vs Naive RAG - Comparison Evaluation

Compares retrieval quality and answer groundedness between:
- Naive RAG: Pure vector similarity search
- Metadata-Filtered RAG: Vector search with category/section pre-filtering

Metrics:
- Precision: Are retrieved documents from the expected category?
- Groundedness: Are answers supported by retrieved context?
- Category Hit Rate: How often does filtering improve relevance?
"""

import os
import sys
import json
import time
from typing import Optional
from dataclasses import dataclass, asdict
from dotenv import load_dotenv

from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

from src.retrieval.common import (
    retrieve_documents,
    retrieve_with_filter,
    format_context,
    category_map,
)

# Load environment variables
load_dotenv()

# Configuration
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

# Evaluation configuration
DEFAULT_K = 5
GENERATION_MODEL = "gpt-4o-mini"
JUDGE_MODEL = "gpt-4o-mini"

# RAG Generation Prompt
RAG_PROMPT_TEMPLATE = """You are a helpful assistant that answers questions based on the provided context from Trakref's Zendesk Help online articles.

Use ONLY the information from the context below to answer the question. If the context doesn't contain enough information to fully answer the question, acknowledge what you can answer and what information is missing.

Context:
{context}

Question: {question}

Answer:"""

# LLM-as-Judge prompt for groundedness
GROUNDEDNESS_JUDGE_PROMPT = """You are a groundedness evaluator. Your task is to determine if the given answer is fully supported by the provided context.

An answer is GROUNDED if:
- Every claim and statement in the answer can be traced back to information in the context
- The answer does not include information that isn't present in the context
- The answer does not make assumptions or inferences beyond what the context supports

An answer is NOT GROUNDED if:
- It contains claims not supported by the context (hallucinations)
- It adds information or details not present in the context
- It makes unsupported generalizations or conclusions

Context:
{context}

Question: {question}

Answer to evaluate:
{answer}

Evaluate the groundedness of this answer. First, briefly explain your reasoning (2-3 sentences), then provide your verdict.

Respond in this exact format:
REASONING: <your brief explanation>
VERDICT: <GROUNDED or NOT_GROUNDED>"""


# Test cases with expected categories for filtering comparison
# These are designed to benefit from metadata filtering
TEST_CASES = [
    {
        "id": "release_notes_features",
        "question": "What new features were added in the latest release?",
        "expected_category": "Release Notes",
        "description": "Should benefit from Release Notes filter"
    },
    {
        "id": "release_notes_updates",
        "question": "What updates were made to the work order system?",
        "expected_category": "Release Notes",
        "description": "Release notes about work orders"
    },
    {
        "id": "getting_started_basics",
        "question": "How do I get started with Trakref?",
        "expected_category": "Getting Started",
        "description": "Onboarding question"
    },
    {
        "id": "troubleshooting_error",
        "question": "What should I do if I encounter an error?",
        "expected_category": "Tips and Troubleshooting",
        "description": "Error handling question"
    },
    {
        "id": "using_tr4_service_event",
        "question": "How do I record a service event in TR4?",
        "expected_category": "Using TR4",
        "description": "Core functionality question"
    },
    {
        "id": "using_tr4_work_order",
        "question": "How do I create and assign a work order?",
        "expected_category": "Using TR4",
        "description": "Work order management"
    },
    {
        "id": "support_contact",
        "question": "How do I contact the support team?",
        "expected_category": "Support Team",
        "description": "Support contact info"
    },
    {
        "id": "general_search",
        "question": "What is global search in Trakref?",
        "expected_category": None,  # General question, no specific category
        "description": "General feature question - no filter expected to help"
    },
]


@dataclass
class RetrievalResult:
    """Results from a single retrieval."""
    question: str
    method: str  # "naive" or "filtered"
    category_filter: Optional[str]
    num_retrieved: int
    categories_retrieved: list[str]
    category_match_rate: float  # % of docs from expected category
    retrieval_time_ms: float


@dataclass
class GenerationResult:
    """Results from answer generation."""
    answer: str
    is_grounded: bool
    grounding_reasoning: str
    generation_time_ms: float


@dataclass
class ComparisonResult:
    """Combined comparison result for a single test case."""
    test_id: str
    question: str
    expected_category: Optional[str]

    # Naive results
    naive_retrieval: RetrievalResult
    naive_generation: GenerationResult

    # Filtered results
    filtered_retrieval: RetrievalResult
    filtered_generation: GenerationResult

    # Comparison metrics
    category_precision_delta: float  # filtered - naive
    both_grounded: bool
    winner: str  # "naive", "filtered", or "tie"


def generate_answer(question: str, context: str) -> str:
    """Generate an answer using the RAG pipeline."""
    prompt = ChatPromptTemplate.from_template(RAG_PROMPT_TEMPLATE)

    llm = ChatOpenAI(
        model=GENERATION_MODEL,
        temperature=0.0,
        openai_api_key=OPENAI_API_KEY
    )

    chain = prompt | llm | StrOutputParser()

    answer = chain.invoke({
        "context": context,
        "question": question
    })

    return answer


def judge_groundedness(question: str, context: str, answer: str) -> dict:
    """Use LLM to judge if an answer is grounded in the context."""
    prompt = ChatPromptTemplate.from_template(GROUNDEDNESS_JUDGE_PROMPT)

    llm = ChatOpenAI(
        model=JUDGE_MODEL,
        temperature=0.0,
        openai_api_key=OPENAI_API_KEY
    )

    chain = prompt | llm | StrOutputParser()

    response = chain.invoke({
        "question": question,
        "context": context,
        "answer": answer
    })

    # Parse the response
    reasoning = ""
    is_grounded = False

    if "REASONING:" in response:
        reasoning_start = response.find("REASONING:") + len("REASONING:")
        reasoning_end = response.find("VERDICT:")
        if reasoning_end > reasoning_start:
            reasoning = response[reasoning_start:reasoning_end].strip()

    is_grounded = "VERDICT: GROUNDED" in response.upper() and "NOT_GROUNDED" not in response.upper()

    return {
        "is_grounded": is_grounded,
        "reasoning": reasoning,
    }


def evaluate_retrieval(
    question: str,
    method: str,
    expected_category: Optional[str] = None,
    k: int = DEFAULT_K,
) -> tuple[RetrievalResult, list]:
    """
    Evaluate retrieval quality for a question.

    Args:
        question: The question to retrieve for
        method: "naive" or "filtered"
        expected_category: Expected category name for filtering
        k: Number of documents to retrieve

    Returns:
        Tuple of (RetrievalResult, documents)
    """
    start_time = time.time()

    category_filter = None
    if method == "filtered" and expected_category:
        category_id = category_map.get(expected_category)
        if category_id:
            category_filter = expected_category
            documents = retrieve_with_filter(
                query=question,
                top_k=k,
                category_id=category_id
            )
        else:
            # Fall back to naive if category not found
            documents = retrieve_documents(question, top_k=k)
    else:
        documents = retrieve_documents(question, top_k=k)

    retrieval_time = (time.time() - start_time) * 1000  # ms

    # Analyze retrieved categories
    categories_retrieved = [
        doc.metadata.get("category_name", "Unknown")
        for doc in documents
    ]

    # Calculate category match rate
    category_match_rate = 0.0
    if expected_category and documents:
        matches = sum(1 for cat in categories_retrieved if cat == expected_category)
        category_match_rate = matches / len(documents)

    result = RetrievalResult(
        question=question,
        method=method,
        category_filter=category_filter,
        num_retrieved=len(documents),
        categories_retrieved=categories_retrieved,
        category_match_rate=category_match_rate,
        retrieval_time_ms=retrieval_time
    )

    return result, documents


def evaluate_generation(
    question: str,
    documents: list,
) -> GenerationResult:
    """
    Evaluate answer generation and groundedness.

    Args:
        question: The question
        documents: Retrieved documents

    Returns:
        GenerationResult with answer and groundedness assessment
    """
    if not documents:
        return GenerationResult(
            answer="No documents retrieved.",
            is_grounded=False,
            grounding_reasoning="No context available",
            generation_time_ms=0
        )

    context = format_context(documents)

    # Generate answer
    start_time = time.time()
    answer = generate_answer(question, context)
    generation_time = (time.time() - start_time) * 1000

    # Judge groundedness
    judgment = judge_groundedness(question, context, answer)

    return GenerationResult(
        answer=answer,
        is_grounded=judgment["is_grounded"],
        grounding_reasoning=judgment["reasoning"],
        generation_time_ms=generation_time
    )


def run_comparison(test_case: dict, k: int = DEFAULT_K) -> ComparisonResult:
    """
    Run comparison between naive and filtered RAG for a single test case.
    """
    question = test_case["question"]
    expected_category = test_case.get("expected_category")

    # Naive RAG evaluation
    naive_retrieval, naive_docs = evaluate_retrieval(
        question=question,
        method="naive",
        expected_category=expected_category,
        k=k
    )
    naive_generation = evaluate_generation(question, naive_docs)

    # Filtered RAG evaluation
    filtered_retrieval, filtered_docs = evaluate_retrieval(
        question=question,
        method="filtered",
        expected_category=expected_category,
        k=k
    )
    filtered_generation = evaluate_generation(question, filtered_docs)

    # Calculate comparison metrics
    category_precision_delta = (
        filtered_retrieval.category_match_rate - naive_retrieval.category_match_rate
    )

    both_grounded = naive_generation.is_grounded and filtered_generation.is_grounded

    # Determine winner
    if expected_category:
        # For category-specific questions, prefer higher category match
        if filtered_retrieval.category_match_rate > naive_retrieval.category_match_rate:
            winner = "filtered"
        elif filtered_retrieval.category_match_rate < naive_retrieval.category_match_rate:
            winner = "naive"
        else:
            # Tie on category match, prefer grounded
            if filtered_generation.is_grounded and not naive_generation.is_grounded:
                winner = "filtered"
            elif naive_generation.is_grounded and not filtered_generation.is_grounded:
                winner = "naive"
            else:
                winner = "tie"
    else:
        # For general questions, just compare groundedness
        if filtered_generation.is_grounded and not naive_generation.is_grounded:
            winner = "filtered"
        elif naive_generation.is_grounded and not filtered_generation.is_grounded:
            winner = "naive"
        else:
            winner = "tie"

    return ComparisonResult(
        test_id=test_case["id"],
        question=question,
        expected_category=expected_category,
        naive_retrieval=naive_retrieval,
        naive_generation=naive_generation,
        filtered_retrieval=filtered_retrieval,
        filtered_generation=filtered_generation,
        category_precision_delta=category_precision_delta,
        both_grounded=both_grounded,
        winner=winner
    )


def run_full_evaluation(
    test_cases: list = None,
    k: int = DEFAULT_K,
    verbose: bool = False
) -> dict:
    """
    Run full comparison evaluation on all test cases.

    Returns summary statistics and detailed results.
    """
    if test_cases is None:
        test_cases = TEST_CASES

    print("=" * 70)
    print("Metadata-Filtered RAG vs Naive RAG - Comparison Evaluation")
    print("=" * 70)
    print(f"\nConfiguration:")
    print(f"  - k (documents retrieved): {k}")
    print(f"  - Generation model: {GENERATION_MODEL}")
    print(f"  - Judge model: {JUDGE_MODEL}")
    print(f"  - Test cases: {len(test_cases)}")
    print(f"\nAvailable categories: {list(category_map.keys())}")
    print("\n" + "-" * 70)

    results = []

    # Aggregate metrics
    naive_grounded_count = 0
    filtered_grounded_count = 0
    naive_total_category_match = 0.0
    filtered_total_category_match = 0.0
    category_specific_cases = 0
    filtered_wins = 0
    naive_wins = 0
    ties = 0

    for i, test_case in enumerate(test_cases, 1):
        print(f"\n[{i}/{len(test_cases)}] {test_case['id']}")
        print(f"    Q: {test_case['question'][:55]}...")
        if test_case.get("expected_category"):
            print(f"    Expected category: {test_case['expected_category']}")

        result = run_comparison(test_case, k=k)
        results.append(result)

        # Update aggregates
        if result.naive_generation.is_grounded:
            naive_grounded_count += 1
        if result.filtered_generation.is_grounded:
            filtered_grounded_count += 1

        if result.expected_category:
            category_specific_cases += 1
            naive_total_category_match += result.naive_retrieval.category_match_rate
            filtered_total_category_match += result.filtered_retrieval.category_match_rate

        if result.winner == "filtered":
            filtered_wins += 1
        elif result.winner == "naive":
            naive_wins += 1
        else:
            ties += 1

        # Print comparison
        print(f"\n    {'Method':<12} | {'Cat Match':<10} | {'Grounded':<10} | Categories Retrieved")
        print(f"    {'-'*12}-+-{'-'*10}-+-{'-'*10}-+-{'-'*30}")

        naive_cat_match = f"{result.naive_retrieval.category_match_rate:.0%}"
        naive_grounded = "Yes" if result.naive_generation.is_grounded else "No"
        naive_cats = ", ".join(set(result.naive_retrieval.categories_retrieved))[:30]
        print(f"    {'Naive':<12} | {naive_cat_match:<10} | {naive_grounded:<10} | {naive_cats}")

        filtered_cat_match = f"{result.filtered_retrieval.category_match_rate:.0%}"
        filtered_grounded = "Yes" if result.filtered_generation.is_grounded else "No"
        filtered_cats = ", ".join(set(result.filtered_retrieval.categories_retrieved))[:30]
        print(f"    {'Filtered':<12} | {filtered_cat_match:<10} | {filtered_grounded:<10} | {filtered_cats}")

        # Winner indicator
        if result.winner == "filtered":
            print(f"    --> Winner: FILTERED (+{result.category_precision_delta:.0%} category precision)")
        elif result.winner == "naive":
            print(f"    --> Winner: NAIVE")
        else:
            print(f"    --> TIE")

        if verbose:
            print(f"\n    Naive answer: {result.naive_generation.answer[:100]}...")
            print(f"    Filtered answer: {result.filtered_generation.answer[:100]}...")

    # Calculate summary metrics
    total = len(results)
    naive_groundedness_rate = naive_grounded_count / total if total else 0
    filtered_groundedness_rate = filtered_grounded_count / total if total else 0

    avg_naive_category_match = (
        naive_total_category_match / category_specific_cases
        if category_specific_cases else 0
    )
    avg_filtered_category_match = (
        filtered_total_category_match / category_specific_cases
        if category_specific_cases else 0
    )

    summary = {
        "configuration": {
            "k": k,
            "num_test_cases": total,
            "category_specific_cases": category_specific_cases,
        },
        "naive_metrics": {
            "groundedness_rate": naive_groundedness_rate,
            "grounded_count": naive_grounded_count,
            "avg_category_match_rate": avg_naive_category_match,
        },
        "filtered_metrics": {
            "groundedness_rate": filtered_groundedness_rate,
            "grounded_count": filtered_grounded_count,
            "avg_category_match_rate": avg_filtered_category_match,
        },
        "comparison": {
            "filtered_wins": filtered_wins,
            "naive_wins": naive_wins,
            "ties": ties,
            "category_precision_improvement": avg_filtered_category_match - avg_naive_category_match,
            "groundedness_improvement": filtered_groundedness_rate - naive_groundedness_rate,
        },
        "results": [asdict(r) for r in results]
    }

    # Print summary
    print("\n" + "=" * 70)
    print("EVALUATION SUMMARY")
    print("=" * 70)

    print(f"\n{'Metric':<35} | {'Naive':<12} | {'Filtered':<12} | {'Delta':<10}")
    print(f"{'-'*35}-+-{'-'*12}-+-{'-'*12}-+-{'-'*10}")

    print(f"{'Groundedness Rate':<35} | {naive_groundedness_rate:<12.1%} | {filtered_groundedness_rate:<12.1%} | {filtered_groundedness_rate - naive_groundedness_rate:+.1%}")
    print(f"{'Avg Category Match (filtered Qs)':<35} | {avg_naive_category_match:<12.1%} | {avg_filtered_category_match:<12.1%} | {avg_filtered_category_match - avg_naive_category_match:+.1%}")

    print(f"\nWin/Loss/Tie: Filtered {filtered_wins} / Naive {naive_wins} / Tie {ties}")

    print(f"\nPer-Query Results:")
    for r in results:
        naive_icon = "G" if r.naive_generation.is_grounded else "X"
        filtered_icon = "G" if r.filtered_generation.is_grounded else "X"
        winner_icon = {"filtered": "F>", "naive": "<N", "tie": "=="}[r.winner]
        print(f"  {winner_icon} {r.test_id}: Naive[{naive_icon}] vs Filtered[{filtered_icon}]")

    return summary


def main():
    """Run the comparison evaluation."""
    if not OPENAI_API_KEY:
        raise ValueError("OPENAI_API_KEY environment variable not set")

    import argparse
    parser = argparse.ArgumentParser(
        description="Compare Metadata-Filtered RAG vs Naive RAG"
    )
    parser.add_argument(
        "-k", type=int, default=DEFAULT_K,
        help=f"Number of documents to retrieve (default: {DEFAULT_K})"
    )
    parser.add_argument(
        "-v", "--verbose", action="store_true",
        help="Show answer previews"
    )
    parser.add_argument(
        "--output", type=str,
        help="Save results to JSON file"
    )

    args = parser.parse_args()

    summary = run_full_evaluation(k=args.k, verbose=args.verbose)

    if args.output:
        with open(args.output, "w") as f:
            json.dump(summary, f, indent=2, default=str)
        print(f"\nResults saved to: {args.output}")


if __name__ == "__main__":
    main()
