# Trakref Zendesk ChatBot - Project Analysis

> This document provides a comprehensive overview of the project architecture, purpose, and implementation details for future reference.

## Overview

This project implements a **Retrieval-Augmented Generation (RAG) system** for Trakref's Zendesk Help Center documentation. It enables users to ask natural language questions and receive accurate answers backed by official help articles.

## Core Purpose

Build an intelligent Q&A chatbot that:

1. Ingests Zendesk Help Center articles (Categories → Sections → Articles)
2. Converts and chunks HTML content into searchable documents
3. Stores document embeddings in a vector database
4. Retrieves relevant context based on user queries
5. Generates accurate answers using an LLM

## Technology Stack

| Component | Technology |
|-----------|------------|
| LLM | OpenAI gpt-4o-mini |
| Embeddings | text-embedding-3-small (1536 dimensions) |
| Vector DB | MongoDB Atlas with vector search |
| Framework | LangChain 0.3+ |
| Text Processing | BeautifulSoup4, RecursiveCharacterTextSplitter |
| Language | Python 3.9+ |

## Architecture

The project follows a staged pipeline approach:

```
┌─────────────────────────────────────────────────────────────┐
│  INGESTION PIPELINE                                         │
│  Zendesk API → HTML Cleanup → Chunking → Embedding → Store  │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  RETRIEVAL PIPELINE                                         │
│  Query → Vector Search (+ Metadata Filter) → Top-K Docs     │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  GENERATION PIPELINE                                        │
│  Context Formatting → LLM Prompt → Answer + Sources         │
└─────────────────────────────────────────────────────────────┘
```

## Project Structure

```
Trakref-Zendesk-ChatBot/
├── src/
│   ├── api/
│   │   └── zendesk_client.py          # Zendesk Help API integration
│   ├── config/
│   │   └── settings.py                # Data models (Category, Section, Article)
│   ├── pipeline/
│   │   ├── naive/
│   │   │   ├── ingest.py              # Basic ingestion pipeline
│   │   │   └── generation.py          # Query → retrieve → generate
│   │   ├── metadata/
│   │   │   ├── ingest.py              # Metadata-filtered ingestion (placeholder)
│   │   │   └── generation.py          # Generation with metadata filters
│   │   └── hybrid/
│   │       └── generation.py          # Hybrid search generation (vector + BM25)
│   ├── retrieval/
│   │   ├── common.py                  # Core retrieval & pre-filtering
│   │   └── strategies/
│   │       ├── naive.py               # Simple vector similarity
│   │       ├── metadata-filtered.py   # Enhanced filtering strategies
│   │       └── hybrid.py              # Hybrid retrieval (vector + BM25 + RRF)
│   ├── text/
│   │   ├── chunk.py                   # Document chunking with metadata
│   │   └── clean.py                   # HTML → text conversion
│   ├── vectorstore/
│   │   └── mongoDB.py                 # Vector store setup & management
│   ├── evals/
│   │   ├── naive/
│   │   │   ├── precision.py           # Retrieval precision metrics
│   │   │   └── groundedness.py        # Answer faithfulness evaluation
│   │   └── metadata/
│   │       ├── comparison.py          # Naive vs Filtered comparison
│   │       └── precision.py           # Category & relevance precision
│   └── main.py                        # CLI entry point
├── README.md
├── requirements.txt
└── .env                               # API keys (git-ignored)
```

## Implementation Stages

| Stage | Status | Description |
|-------|--------|-------------|
| **01-naive-rag** | ✅ Complete | Basic vector similarity search |
| **02-metadata-filtered** | ✅ Complete | Pre-filtered retrieval using Zendesk taxonomy |
| **03-hybrid-search** | ✅ Complete | BM25 + vector with RRF ranking |
| **04-graph-rag** | 📋 Planned | Neo4j knowledge graphs |
| **05-agentic-rag** | 📋 Planned | ReAct pattern with tool selection |

## Key Components

### 1. ZendeskClient (`src/api/zendesk_client.py`)

Handles Zendesk Help Center API with pagination:

- `iterate_categories()` - Fetch all help categories
- `iterate_sections()` - Fetch sections within categories
- `iterate_articles()` - Fetch articles with HTML body

### 2. Data Models (`src/config/settings.py`)

```python
Category: id, name
Section: id, name, category_id, category_name
Article: id, text, article_name, category_id/name, section_id/name, url, title, updated_at
```

### 3. Text Processing

- **Cleaning** (`clean.py`): BeautifulSoup HTML parsing, removes scripts/styles, preserves alt text
- **Chunking** (`chunk.py`): RecursiveCharacterTextSplitter
  - Chunk size: 1000 tokens
  - Overlap: 200 tokens
  - Separators: `["\n\n", "\n", " ", ""]`

### 4. Metadata Enrichment

Each chunk is prefixed with context:

```
Title: {article_title}
Category: {category_name}
Section: {section_name}

{chunk_content}
```

### 5. Vector Store (`src/vectorstore/mongoDB.py`)

- Uses `langchain_mongodb.MongoDBAtlasVectorSearch`
- Database: `rag_playbook`
- Collections: `naive_rag`, `metadata_filtered_rag`
- Index config: 1536 dimensions, cosine similarity

### 6. Retrieval Strategies

**Naive RAG**: Simple vector similarity search, returns top-k (default: 5)

**Metadata-Filtered RAG**: Pre-filter before vector search on:
- `category_id` - Filter by help category
- `section_id` - Filter by section
- `updated_at` - Filter by article recency

**Hybrid RAG**: Combines vector search with BM25 full-text search using Reciprocal Rank Fusion (RRF):
- Vector search captures semantic similarity
- BM25 captures exact keyword matches (acronyms, rare terms, exact phrases)
- RRF merges results with configurable weights
- Excels at queries mixing concepts with specific terminology

### 7. Generation Pipeline

- Temperature: 0.0 (deterministic)
- System prompt: Use ONLY provided context
- Returns: `{ answer, sources, retrieved_documents (optional) }`

### 8. Evaluation Framework

**Naive RAG Evals** (`src/evals/naive/`):
- **precision.py**: Measures relevance of retrieved documents
- **groundedness.py**: LLM-as-judge verification that answers are supported by context

**Metadata-Filtered RAG Evals** (`src/evals/metadata/`):
- **comparison.py**: Side-by-side comparison of naive vs filtered RAG
  - Category precision (% docs from expected category)
  - Groundedness comparison
  - Win/loss tracking per test case
- **precision.py**: Focused retrieval precision metrics
  - Category precision
  - LLM-judged relevance precision
  - Per-document relevance scoring

## Configuration

### Environment Variables (`.env`)

```
OPENAI_API_KEY=your_key
MONGO_DB_URL=mongodb+srv://user:pass@cluster.mongodb.net/
TRAKREF_ZENDESK_BASE=subdomain
```

### MongoDB Index Setup

Requires manual index creation in MongoDB Atlas:

**Vector Search Index** (required for all modes):
```json
{
  "name": "naive",
  "definition": {
    "fields": [
      {
        "type": "vector",
        "path": "embedding",
        "numDimensions": 1536,
        "similarity": "cosine"
      }
    ]
  }
}
```

**Full-Text Search Index** (required for hybrid search):
```json
{
  "name": "fulltext",
  "definition": {
    "analyzer": "lucene.standard",
    "searchAnalyzer": "lucene.standard",
    "mappings": {
      "dynamic": false,
      "fields": {
        "text": {
          "type": "string",
          "analyzer": "lucene.standard"
        }
      }
    }
  }
}
```

To create indexes:
1. Go to MongoDB Atlas → Your Cluster → Atlas Search tab
2. Click "Create Search Index" → Select "JSON Editor"
3. Paste the configuration and set the name
4. Wait for index status to become "Active"

## Usage

### Interactive Mode

```python
# Naive RAG (no filtering)
from src.pipeline.naive.generation import interactive_mode
interactive_mode()

# Metadata-Filtered RAG (with category/section filtering)
from src.pipeline.metadata.generation import interactive_mode
interactive_mode()
```

### Programmatic Usage

```python
# Naive RAG
from src.pipeline.naive.generation import generate_answer
result = generate_answer("What is a work order?")
print(result["answer"])
print(result["sources"])

# Metadata-Filtered RAG
from src.pipeline.metadata.generation import generate_answer

# Filter by category name
result = generate_answer(
    "What new features were added?",
    category_name="Release Notes"
)

# Filter by category ID directly
result = generate_answer(
    "What new features were added?",
    category_id=23789686430605
)

# Filter by section ID
result = generate_answer(
    "How do I create a work order?",
    section_id=12345
)

# Response includes filters applied
print(result["answer"])
print(result["sources"])
print(result["filters_applied"])  # Shows which filters were used
```

### Hybrid RAG

```python
from src.pipeline.hybrid.generation import generate_answer, interactive_mode

# Basic hybrid search
result = generate_answer("What is a work order?")

# Adjust weights: favor keywords over semantics
result = generate_answer(
    "TR4 installation guide",
    vector_weight=0.5,
    fulltext_weight=1.5
)

# Combine with metadata filtering
result = generate_answer(
    "What's new in the latest release?",
    category_name="Release Notes",
    vector_weight=1.0,
    fulltext_weight=1.0
)

# Response includes search configuration
print(result["answer"])
print(result["search_config"])  # Shows method, weights, filters
```

### CLI Entry Point

```bash
python -m src.main
# Select mode:
#   1 - Naive RAG (vector only)
#   2 - Metadata-Filtered RAG (vector + pre-filtering)
#   3 - Hybrid RAG (vector + BM25 keyword search)
```

## Building on This Project

### Adding a New Retrieval Strategy

1. Create new file in `src/retrieval/strategies/`
2. Implement retrieval function following existing patterns
3. Add corresponding pipeline in `src/pipeline/`
4. Create evaluation suite in `src/evals/`

### Adding New Data Sources

1. Create new client in `src/api/`
2. Define data models in `src/config/`
3. Update chunking logic in `src/text/chunk.py` if needed
4. Create ingestion pipeline

### Running Evaluations

```bash
# Compare naive vs metadata-filtered RAG (full evaluation)
python -m src.evals.metadata.comparison -k 5 --output results.json

# Precision-only evaluation (faster)
python -m src.evals.metadata.precision -k 5 --no-relevance

# Naive RAG groundedness evaluation
python -m src.evals.naive.groundedness -k 5
```

### Evaluation Best Practices

- Use predefined test cases for consistency
- Run both precision and groundedness evals
- Compare metrics across retrieval strategies
- Use `--output` to save results for tracking over time

## Current Branch

`metadata-filtered-rag` - Implements pre-filtering on category_id, section_id, and updated_at fields before vector search for more targeted retrieval.

## Key Design Decisions

1. **Metadata-First Approach**: Leverages Zendesk's existing taxonomy rather than auto-extraction
2. **Chunk Enrichment**: Prepends metadata to chunks for better context awareness
3. **MongoDB Atlas**: Managed vector database with built-in filtering capabilities
4. **Temperature=0.0**: Deterministic generation for consistent, fact-based answers
5. **LLM-as-Judge**: Uses same LLM for evaluation to maintain consistency
