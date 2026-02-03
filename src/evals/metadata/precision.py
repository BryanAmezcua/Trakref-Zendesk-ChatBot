"""
Metadata-Filtered RAG - Precision Evaluation

Measures retrieval precision: Are the retrieved documents relevant to the query?

For metadata-filtered RAG, we specifically measure:
- Category Precision: % of retrieved docs from the expected category
- Section Precision: % of retrieved docs from expected section (if specified)
- Relevance: LLM-judged relevance of retrieved content to query
"""

import os
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
    category_map,
)

# Load environment variables
load_dotenv()

# Configuration
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

# Evaluation configuration
DEFAULT_K = 5
JUDGE_MODEL = "gpt-4o-mini"

# LLM-as-Judge prompt for relevance assessment
RELEVANCE_JUDGE_PROMPT = """You are a relevance evaluator. Your task is to determine if a retrieved document is relevant to answering the given question.

A document is RELEVANT if:
- It contains information that directly helps answer the question
- It provides context, definitions, or explanations related to the question topic
- It would be useful as part of a response to the question

A document is NOT RELEVANT if:
- It discusses unrelated topics
- It doesn't contain information useful for answering the question
- It's only tangentially related and wouldn't help answer the question

Question: {question}

Document content:
{document}

Is this document relevant to answering the question?

Respond with ONLY one word: RELEVANT or NOT_RELEVANT"""


# Test cases for precision evaluation
TEST_CASES = [
    {
        "id": "release_notes_1",
        "question": "What new features were released recently?",
        "expected_category": "Release Notes",
    },
    {
        "id": "release_notes_2",
        "question": "What bug fixes were included in the latest update?",
        "expected_category": "Release Notes",
    },
    {
        "id": "getting_started_1",
        "question": "How do I set up my Trakref account?",
        "expected_category": "Getting Started",
    },
    {
        "id": "getting_started_2",
        "question": "What are the first steps to use Trakref?",
        "expected_category": "Getting Started",
    },
    {
        "id": "using_tr4_1",
        "question": "How do I create a service event?",
        "expected_category": "Using TR4",
    },
    {
        "id": "using_tr4_2",
        "question": "How do I manage work orders in Trakref?",
        "expected_category": "Using TR4",
    },
    {
        "id": "troubleshooting_1",
        "question": "What should I do if data isn't syncing?",
        "expected_category": "Tips and Troubleshooting",
    },
    {
        "id": "troubleshooting_2",
        "question": "How do I fix login issues?",
        "expected_category": "Tips and Troubleshooting",
    },
    {
        "id": "support_1",
        "question": "How can I contact Trakref support?",
        "expected_category": "Support Team",
    },
    {
        "id": "general_1",
        "question": "What is Trakref used for?",
        "expected_category": None,  # General question
    },
]


@dataclass
class PrecisionResult:
    """Precision metrics for a single query."""
    test_id: str
    question: str
    expected_category: Optional[str]
    method: str  # "naive" or "filtered"

    # Retrieval metrics
    num_retrieved: int
    category_precision: float  # % docs from expected category
    unique_categories: list[str]

    # Relevance metrics (LLM-judged)
    relevance_scores: list[bool]  # Per-document relevance
    relevance_precision: float  # % docs judged relevant

    # Timing
    retrieval_time_ms: float
    relevance_eval_time_ms: float


def judge_relevance(question: str, document_content: str) -> bool:
    """Use LLM to judge if a document is relevant to the question."""
    prompt = ChatPromptTemplate.from_template(RELEVANCE_JUDGE_PROMPT)

    llm = ChatOpenAI(
        model=JUDGE_MODEL,
        temperature=0.0,
        openai_api_key=OPENAI_API_KEY
    )

    chain = prompt | llm | StrOutputParser()

    response = chain.invoke({
        "question": question,
        "document": document_content[:2000]  # Truncate long documents
    })

    return "RELEVANT" in response.upper() and "NOT_RELEVANT" not in response.upper()


def evaluate_precision(
    question: str,
    method: str,
    expected_category: Optional[str] = None,
    k: int = DEFAULT_K,
    judge_relevance_flag: bool = True,
) -> PrecisionResult:
    """
    Evaluate retrieval precision for a single query.

    Args:
        question: The query
        method: "naive" or "filtered"
        expected_category: Expected category for filtering
        k: Number of documents to retrieve
        judge_relevance_flag: Whether to run LLM relevance judging

    Returns:
        PrecisionResult with metrics
    """
    # Retrieve documents
    start_time = time.time()

    if method == "filtered" and expected_category:
        category_id = category_map.get(expected_category)
        if category_id:
            documents = retrieve_with_filter(
                query=question,
                top_k=k,
                category_id=category_id
            )
        else:
            documents = retrieve_documents(question, top_k=k)
    else:
        documents = retrieve_documents(question, top_k=k)

    retrieval_time = (time.time() - start_time) * 1000

    # Calculate category precision
    categories = [doc.metadata.get("category_name", "Unknown") for doc in documents]
    unique_categories = list(set(categories))

    category_precision = 0.0
    if expected_category and documents:
        matches = sum(1 for cat in categories if cat == expected_category)
        category_precision = matches / len(documents)

    # Judge relevance for each document
    relevance_scores = []
    relevance_start = time.time()

    if judge_relevance_flag and documents:
        for doc in documents:
            is_relevant = judge_relevance(question, doc.page_content)
            relevance_scores.append(is_relevant)

    relevance_eval_time = (time.time() - relevance_start) * 1000

    relevance_precision = (
        sum(relevance_scores) / len(relevance_scores)
        if relevance_scores else 0.0
    )

    return PrecisionResult(
        test_id="",  # Will be set by caller
        question=question,
        expected_category=expected_category,
        method=method,
        num_retrieved=len(documents),
        category_precision=category_precision,
        unique_categories=unique_categories,
        relevance_scores=relevance_scores,
        relevance_precision=relevance_precision,
        retrieval_time_ms=retrieval_time,
        relevance_eval_time_ms=relevance_eval_time
    )


def run_precision_comparison(
    test_cases: list = None,
    k: int = DEFAULT_K,
    judge_relevance_flag: bool = True,
) -> dict:
    """
    Run precision evaluation comparing naive vs filtered retrieval.

    Returns comparison metrics and detailed results.
    """
    if test_cases is None:
        test_cases = TEST_CASES

    print("=" * 70)
    print("Metadata-Filtered RAG - Precision Evaluation")
    print("=" * 70)
    print(f"\nConfiguration:")
    print(f"  - k (documents retrieved): {k}")
    print(f"  - Judge model: {JUDGE_MODEL}")
    print(f"  - Test cases: {len(test_cases)}")
    print(f"  - Relevance judging: {'Enabled' if judge_relevance_flag else 'Disabled'}")
    print("\n" + "-" * 70)

    naive_results = []
    filtered_results = []

    for i, test_case in enumerate(test_cases, 1):
        question = test_case["question"]
        expected_category = test_case.get("expected_category")

        print(f"\n[{i}/{len(test_cases)}] {test_case['id']}")
        print(f"    Q: {question[:55]}...")
        if expected_category:
            print(f"    Filter: {expected_category}")

        # Naive retrieval
        naive_result = evaluate_precision(
            question=question,
            method="naive",
            expected_category=expected_category,
            k=k,
            judge_relevance_flag=judge_relevance_flag
        )
        naive_result.test_id = test_case["id"]
        naive_results.append(naive_result)

        # Filtered retrieval
        filtered_result = evaluate_precision(
            question=question,
            method="filtered",
            expected_category=expected_category,
            k=k,
            judge_relevance_flag=judge_relevance_flag
        )
        filtered_result.test_id = test_case["id"]
        filtered_results.append(filtered_result)

        # Print comparison
        print(f"\n    {'Method':<10} | {'Cat Prec':<10} | {'Rel Prec':<10} | Categories")
        print(f"    {'-'*10}-+-{'-'*10}-+-{'-'*10}-+-{'-'*25}")

        naive_cat = f"{naive_result.category_precision:.0%}"
        naive_rel = f"{naive_result.relevance_precision:.0%}" if judge_relevance_flag else "N/A"
        naive_cats = ", ".join(naive_result.unique_categories)[:25]
        print(f"    {'Naive':<10} | {naive_cat:<10} | {naive_rel:<10} | {naive_cats}")

        filtered_cat = f"{filtered_result.category_precision:.0%}"
        filtered_rel = f"{filtered_result.relevance_precision:.0%}" if judge_relevance_flag else "N/A"
        filtered_cats = ", ".join(filtered_result.unique_categories)[:25]
        print(f"    {'Filtered':<10} | {filtered_cat:<10} | {filtered_rel:<10} | {filtered_cats}")

        # Delta
        cat_delta = filtered_result.category_precision - naive_result.category_precision
        rel_delta = filtered_result.relevance_precision - naive_result.relevance_precision
        if cat_delta > 0:
            print(f"    --> Filtered wins: +{cat_delta:.0%} category precision")
        elif cat_delta < 0:
            print(f"    --> Naive wins: {cat_delta:.0%} category precision")

    # Calculate aggregate metrics
    category_specific = [tc for tc in test_cases if tc.get("expected_category")]
    num_category_specific = len(category_specific)

    # Filter results for category-specific cases
    naive_cat_specific = [r for r in naive_results if r.expected_category]
    filtered_cat_specific = [r for r in filtered_results if r.expected_category]

    avg_naive_cat_prec = (
        sum(r.category_precision for r in naive_cat_specific) / len(naive_cat_specific)
        if naive_cat_specific else 0
    )
    avg_filtered_cat_prec = (
        sum(r.category_precision for r in filtered_cat_specific) / len(filtered_cat_specific)
        if filtered_cat_specific else 0
    )

    avg_naive_rel_prec = (
        sum(r.relevance_precision for r in naive_results) / len(naive_results)
        if naive_results else 0
    )
    avg_filtered_rel_prec = (
        sum(r.relevance_precision for r in filtered_results) / len(filtered_results)
        if filtered_results else 0
    )

    summary = {
        "configuration": {
            "k": k,
            "num_test_cases": len(test_cases),
            "num_category_specific": num_category_specific,
            "relevance_judging": judge_relevance_flag,
        },
        "naive_metrics": {
            "avg_category_precision": avg_naive_cat_prec,
            "avg_relevance_precision": avg_naive_rel_prec,
        },
        "filtered_metrics": {
            "avg_category_precision": avg_filtered_cat_prec,
            "avg_relevance_precision": avg_filtered_rel_prec,
        },
        "improvement": {
            "category_precision_delta": avg_filtered_cat_prec - avg_naive_cat_prec,
            "relevance_precision_delta": avg_filtered_rel_prec - avg_naive_rel_prec,
        },
        "naive_results": [asdict(r) for r in naive_results],
        "filtered_results": [asdict(r) for r in filtered_results],
    }

    # Print summary
    print("\n" + "=" * 70)
    print("PRECISION EVALUATION SUMMARY")
    print("=" * 70)

    print(f"\n{'Metric':<30} | {'Naive':<12} | {'Filtered':<12} | {'Delta':<10}")
    print(f"{'-'*30}-+-{'-'*12}-+-{'-'*12}-+-{'-'*10}")

    print(f"{'Avg Category Precision':<30} | {avg_naive_cat_prec:<12.1%} | {avg_filtered_cat_prec:<12.1%} | {avg_filtered_cat_prec - avg_naive_cat_prec:+.1%}")

    if judge_relevance_flag:
        print(f"{'Avg Relevance Precision':<30} | {avg_naive_rel_prec:<12.1%} | {avg_filtered_rel_prec:<12.1%} | {avg_filtered_rel_prec - avg_naive_rel_prec:+.1%}")

    print(f"\nCategory-specific test cases: {num_category_specific}/{len(test_cases)}")

    # Per-query breakdown
    print(f"\nPer-Query Category Precision:")
    for naive_r, filtered_r in zip(naive_results, filtered_results):
        if naive_r.expected_category:
            delta = filtered_r.category_precision - naive_r.category_precision
            indicator = "+" if delta > 0 else ("-" if delta < 0 else "=")
            print(f"  {indicator} {naive_r.test_id}: Naive {naive_r.category_precision:.0%} -> Filtered {filtered_r.category_precision:.0%}")

    return summary


def main():
    """Run the precision evaluation."""
    if not OPENAI_API_KEY:
        raise ValueError("OPENAI_API_KEY environment variable not set")

    import argparse
    parser = argparse.ArgumentParser(
        description="Evaluate retrieval precision for Metadata-Filtered RAG"
    )
    parser.add_argument(
        "-k", type=int, default=DEFAULT_K,
        help=f"Number of documents to retrieve (default: {DEFAULT_K})"
    )
    parser.add_argument(
        "--no-relevance", action="store_true",
        help="Skip LLM relevance judging (faster)"
    )
    parser.add_argument(
        "--output", type=str,
        help="Save results to JSON file"
    )

    args = parser.parse_args()

    summary = run_precision_comparison(
        k=args.k,
        judge_relevance_flag=not args.no_relevance
    )

    if args.output:
        with open(args.output, "w") as f:
            json.dump(summary, f, indent=2, default=str)
        print(f"\nResults saved to: {args.output}")


if __name__ == "__main__":
    main()
