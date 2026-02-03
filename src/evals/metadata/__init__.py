"""
Metadata-Filtered RAG Evaluation Suite

Modules:
- comparison.py: Compare naive vs filtered RAG (groundedness + precision)
- precision.py: Focused retrieval precision metrics
"""

from .comparison import run_full_evaluation, run_comparison
from .precision import run_precision_comparison, evaluate_precision
