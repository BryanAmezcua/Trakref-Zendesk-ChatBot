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
│   │   └── metadata/
│   │       └── ingest.py              # Metadata-filtered ingestion
│   ├── retrieval/
│   │   ├── common.py                  # Core retrieval & pre-filtering
│   │   └── strategies/
│   │       ├── naive.py               # Simple vector similarity
│   │       └── metadata-filtered.py   # Enhanced filtering strategies
│   ├── text/
│   │   ├── chunk.py                   # Document chunking with metadata
│   │   └── clean.py                   # HTML → text conversion
│   ├── vectorstore/
│   │   └── mongoDB.py                 # Vector store setup & management
│   ├── evals/
│   │   └── naive/
│   │       ├── precision.py           # Retrieval precision metrics
│   │       └── groundedness.py        # Answer faithfulness evaluation
│   └── main.py                        # CLI entry point
├── README.md
├── requirements.txt
└── .env                               # API keys (git-ignored)
```

## Implementation Stages

| Stage | Status | Description |
|-------|--------|-------------|
| **01-naive-rag** | ✅ Complete | Basic vector similarity search |
| **02-metadata-filtered** | 🔄 In Progress | Pre-filtered retrieval using Zendesk taxonomy |
| **03-hybrid-search** | 📋 Planned | BM25 + vector with RRF ranking |
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

### 7. Generation Pipeline

- Temperature: 0.0 (deterministic)
- System prompt: Use ONLY provided context
- Returns: `{ answer, sources, retrieved_documents (optional) }`

### 8. Evaluation Framework

- **Precision** (`precision.py`): Measures relevance of retrieved documents
- **Groundedness** (`groundedness.py`): LLM-as-judge verification that answers are supported by context

## Configuration

### Environment Variables (`.env`)

```
OPENAI_API_KEY=your_key
MONGO_DB_URL=mongodb+srv://user:pass@cluster.mongodb.net/
TRAKREF_ZENDESK_BASE=subdomain
```

### MongoDB Index Setup

Requires manual index creation in MongoDB Atlas:

```json
{
  "fields": [
    {
      "type": "vector",
      "path": "embedding",
      "numDimensions": 1536,
      "similarity": "cosine"
    }
  ]
}
```

## Usage

### Interactive Mode

```python
from src.pipeline.naive.generation import interactive_mode
interactive_mode()
```

### Programmatic Usage

```python
from src.pipeline.naive.generation import generate_answer

result = generate_answer("What is a work order?")
print(result["answer"])
print(result["sources"])
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

### Evaluation Best Practices

- Use predefined test cases for consistency
- Run both precision and groundedness evals
- Compare metrics across retrieval strategies

## Current Branch

`metadata-filtered-rag` - Implements pre-filtering on category_id, section_id, and updated_at fields before vector search for more targeted retrieval.

## Key Design Decisions

1. **Metadata-First Approach**: Leverages Zendesk's existing taxonomy rather than auto-extraction
2. **Chunk Enrichment**: Prepends metadata to chunks for better context awareness
3. **MongoDB Atlas**: Managed vector database with built-in filtering capabilities
4. **Temperature=0.0**: Deterministic generation for consistent, fact-based answers
5. **LLM-as-Judge**: Uses same LLM for evaluation to maintain consistency
