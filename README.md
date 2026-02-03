# Trakref Zendesk ChatBot

A RAG (Retrieval-Augmented Generation) system for Trakref's Zendesk Help Center documentation. Ask natural language questions and receive accurate answers backed by official help articles.

## Overview

This project implements multiple RAG patterns of increasing sophistication:

| Stage | Status | Description |
|-------|--------|-------------|
| **Naive RAG** | ✅ Complete | Basic vector similarity search |
| **Metadata-Filtered RAG** | ✅ Complete | Pre-filtered retrieval using Zendesk taxonomy |
| **Hybrid Search** | ✅ Complete | BM25 + vector with RRF ranking |
| **Graph RAG** | 📋 Planned | Neo4j knowledge graphs |
| **Agentic RAG** | 📋 Planned | ReAct pattern with tool selection |

## Tech Stack

| Component | Technology |
|-----------|------------|
| LLM | OpenAI gpt-4o-mini |
| Embeddings | text-embedding-3-small (1536 dimensions) |
| Vector DB | MongoDB Atlas with vector search |
| Framework | LangChain 0.3+ |
| Text Processing | BeautifulSoup4, RecursiveCharacterTextSplitter |
| Language | Python 3.9+ |

## Quick Start

### 1. Setup Environment

```bash
python -m venv venv
source venv/bin/activate  # or `venv\Scripts\activate` on Windows
pip install -r requirements.txt
```

### 2. Configure Environment Variables

Create a `.env` file:

```env
OPENAI_API_KEY=your_key
MONGO_DB_URL=mongodb+srv://user:pass@cluster.mongodb.net/
TRAKREF_ZENDESK_BASE=subdomain
```

### 3. Run the Application

```bash
python -m src.main
# Select mode:
#   1 - Naive RAG (vector only)
#   2 - Metadata-Filtered RAG (vector + pre-filtering)
#   3 - Hybrid RAG (vector + BM25 keyword search)
```

## Architecture

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
│   │   │   ├── ingest.py              # Metadata-filtered ingestion
│   │   │   └── generation.py          # Generation with metadata filters
│   │   └── hybrid/
│   │       └── generation.py          # Hybrid search (vector + BM25)
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

## Retrieval Strategies

### Naive RAG
Simple vector similarity search, returns top-k documents (default: 5).

### Metadata-Filtered RAG
Pre-filter before vector search using Zendesk's taxonomy:
- `category_id` - Filter by help category
- `section_id` - Filter by section
- `updated_at` - Filter by article recency

### Hybrid RAG
Combines vector search with BM25 full-text search using Reciprocal Rank Fusion (RRF):
- Vector search captures semantic similarity
- BM25 captures exact keyword matches (acronyms, rare terms, exact phrases)
- RRF merges results with configurable weights

## Usage Examples

### Programmatic Usage

```python
# Naive RAG
from src.pipeline.naive.generation import generate_answer
result = generate_answer("What is a work order?")
print(result["answer"])

# Metadata-Filtered RAG
from src.pipeline.metadata.generation import generate_answer
result = generate_answer(
    "What new features were added?",
    category_name="Release Notes"
)

# Hybrid RAG
from src.pipeline.hybrid.generation import generate_answer
result = generate_answer(
    "TR4 installation guide",
    vector_weight=0.5,
    fulltext_weight=1.5
)
```

### Running Evaluations

```bash
# Compare naive vs metadata-filtered RAG
python -m src.evals.metadata.comparison -k 5 --output results.json

# Precision-only evaluation (faster)
python -m src.evals.metadata.precision -k 5 --no-relevance

# Naive RAG groundedness evaluation
python -m src.evals.naive.groundedness -k 5
```

## MongoDB Index Setup

### Vector Search Index (required for all modes)

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

### Full-Text Search Index (required for hybrid search)

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

## Key Design Decisions

1. **Metadata-First Approach**: Leverages Zendesk's existing taxonomy (Categories > Sections > Articles) rather than auto-extraction
2. **Chunk Enrichment**: Prepends metadata to chunks for better context awareness
3. **MongoDB Atlas**: Managed vector database with built-in filtering capabilities
4. **Temperature=0.0**: Deterministic generation for consistent, fact-based answers
5. **LLM-as-Judge**: Uses same LLM for evaluation to maintain consistency

## License

MIT License
