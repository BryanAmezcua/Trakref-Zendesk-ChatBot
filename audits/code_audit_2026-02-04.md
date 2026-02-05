# Code Audit: Trakref Zendesk HelpBot

**Audit Date:** February 4, 2026
**Branch:** help-bot
**Last Commit:** bda57e7 - Server Created + Wired Up

---

## Executive Summary

This is a **Retrieval-Augmented Generation (RAG) chatbot** for Trakref's Zendesk Help Center documentation. The system answers natural language questions using official Zendesk articles with citation-backed responses.

**Tech Stack:**
- **Frontend:** Next.js 14, React 18, TypeScript, MUI v5, Framer Motion, Zustand
- **Backend:** Python 3.9+, FastAPI, LangChain 0.3+, OpenAI API, MongoDB Atlas
- **External Services:** OpenAI (embeddings + LLM), MongoDB Atlas (vector DB), Zendesk API, LangSmith (tracing)

---

## 1. Project Structure Overview

```
Trakref-Zendesk-ChatBot/
├── frontend/                          # Next.js 14 application
│   ├── src/
│   │   ├── app/
│   │   │   ├── api/chat/              # Chat API proxy endpoint
│   │   │   ├── api/retrieve/          # Debug retrieval endpoint
│   │   │   ├── api/health/            # Health check endpoint
│   │   │   ├── helpbot/page.tsx       # Main chat interface page
│   │   │   ├── layout.tsx             # Root layout
│   │   │   └── page.tsx               # Home page (redirects to helpbot)
│   │   ├── components/chat/           # Chat UI components
│   │   ├── store/chatStore.ts         # Zustand state management
│   │   ├── types/chat.ts              # TypeScript interfaces
│   │   ├── theme/theme.ts             # MUI theme & design tokens
│   │   └── lib/animations.ts          # Framer Motion definitions
│   └── package.json
│
├── src/                               # Python backend
│   ├── server.py                      # FastAPI application
│   ├── main.py                        # CLI entry point
│   ├── api/zendesk_client.py          # Zendesk API integration
│   ├── config/settings.py             # Data models
│   ├── agent/                         # Agent supervisor module
│   │   ├── __init__.py                # Exports run_agent_pipeline
│   │   └── supervisor.py              # Agent logic with quality evaluation
│   ├── pipeline/
│   │   ├── models.py                  # Article, Category, Section dataclasses
│   │   ├── naive/                     # Naive RAG (vector only)
│   │   ├── metadata/                  # Metadata-filtered RAG
│   │   └── hybrid/generation.py       # Hybrid RAG (vector + BM25 + RRF)
│   ├── retrieval/
│   │   ├── common.py                  # Shared retrieval utilities
│   │   └── strategies/hybrid.py       # Hybrid search implementation
│   ├── text/
│   │   ├── chunk.py                   # Document chunking logic
│   │   └── clean.py                   # HTML text cleaning
│   ├── vectorstore/mongoDB.py         # MongoDB Vector Store setup
│   └── evals/                         # Evaluation modules
│
├── package.json                       # Root package.json (concurrently)
├── requirements.txt                   # Python dependencies
├── .env                               # Environment configuration
├── README.md                          # Project documentation
└── HELPBOT_SPEC.md                    # Feature specification
```

---

## 2. Frontend Components Breakdown

### 2.1 Page Structure

| File | Purpose |
|------|---------|
| `/app/helpbot/page.tsx` | Main chat interface page, renders `ChatLayout` |
| `/app/layout.tsx` | Root layout with ThemeRegistry |
| `/app/page.tsx` | Home page (redirects to /helpbot) |

### 2.2 Chat Components

#### **ChatLayout** (`/components/chat/ChatLayout.tsx`)
- **Purpose:** Main container for entire chat interface
- **Features:**
  - Sticky glass-effect header with Trakref logo
  - Action buttons: "New Chat" and "Clear"
  - Error banner display
  - Message list container
  - Chat input area
- **State:** Uses Zustand store for messages, loading, error states

#### **MessageList** (`/components/chat/MessageList.tsx`)
- **Props:** `messages: Message[]`, `onSuggestionClick?: (prompt: string) => void`
- **Features:**
  - Auto-scrolls to bottom on new messages
  - Empty state with welcome message and suggested prompts
  - Renders messages via `MessageBubble` component
- **Suggested Prompts:**
  - "How do I get started with Trakref?"
  - "How do I add a new asset?"
  - "What are leak rate calculations?"
  - "How do I run a compliance report?"

#### **MessageBubble** (`/components/chat/MessageBubble.tsx`)
- **Props:** `message: Message`, `isLast: boolean`, `onCopy: () => void`
- **Visual States:**
  - User messages: Blue pill-shaped, right-aligned
  - Assistant messages: White/glass bubble, left-aligned with icon
  - Loading: Shows `LoadingIndicator` with animated dots
  - Error: Red border styling
- **Features:**
  - Markdown support (bold, code blocks)
  - Copy-to-clipboard button
  - Insufficient context warning badge
  - Citations accordion (collapsible sources)
  - Timestamp display

#### **ChatInput** (`/components/chat/ChatInput.tsx`)
- **Props:** `onSend: (message: string) => void`, `disabled?: boolean`
- **Features:**
  - Auto-resizing textarea (max 4 rows)
  - Enter to send, Shift+Enter for newline
  - Disabled state with loading spinner
  - **Agent Mode Toggle:** Switch to enable/disable agent mode
    - Purple accent color when active
    - SmartToyOutlined icon indicator
    - Input border changes to purple in agent mode
    - Placeholder text: "Ask the agent..." vs "Ask anything about Trakref..."
    - Helper text changes to "Agent mode: May ask clarifying questions"

#### **LoadingIndicator** (`/components/chat/LoadingIndicator.tsx`)
- **Props:** `stage?: LoadingStage` (idle | searching | reading | writing)
- **Stages:**
  - Searching: SearchIcon, light blue
  - Reading: AutoStoriesIcon, purple
  - Writing: EditNoteIcon, emerald
- **Features:** Animated dots, progress bar, stage indicators

#### **SourcesAccordion** (`/components/chat/SourcesAccordion.tsx`)
- **Props:** `citations: Citation[]`
- **Features:**
  - Collapsed: Chip showing "N sources"
  - Expanded: List of source cards with links

#### **SuggestedPrompts** (`/components/chat/SuggestedPrompts.tsx`)
- **Props:** `prompts: string[]`, `onSelect?: (prompt: string) => void`
- **Features:** Grid layout, glass effect cards, staggered animation

#### **ErrorBanner** (`/components/chat/ErrorBanner.tsx`)
- **Props:** `error: string | null`, `onDismiss: () => void`, `onRetry?: () => void`
- **Features:** Dismissible error alerts with optional retry button

### 2.3 State Management (Zustand)

**File:** `/store/chatStore.ts`

```typescript
interface ChatStore {
  // State
  messages: Message[];
  isLoading: boolean;
  loadingStage: 'idle' | 'searching' | 'reading' | 'writing';
  error: string | null;
  sessionId: string;
  agentMode: boolean;        // NEW: Agent mode toggle state

  // Actions
  addMessage: (message) => string;
  updateMessage: (id, updates) => void;
  setLoading: (loading) => void;
  setLoadingStage: (stage) => void;
  setError: (error) => void;
  clearChat: () => void;
  newChat: () => void;
  sendMessage: (content) => Promise<void>;
  toggleAgentMode: () => void; // NEW: Toggle agent mode
}
```

**sendMessage Flow:**
1. Adds user message to store
2. Creates placeholder assistant message with `isLoading: true`
3. Simulates loading stages (searching → reading → writing)
4. Calls `/api/chat` endpoint with `agent_mode: agentMode` flag
5. Updates assistant message with response (may include clarifying question in agent mode)
6. Handles errors appropriately

### 2.4 Type Definitions

**File:** `/types/chat.ts`

```typescript
interface Citation {
  article_id: string;
  title: string;
  url: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: Citation[];
  timestamp: Date;
  isLoading?: boolean;
  insufficientContext?: boolean;
  missingInfo?: string;
}

interface ChatResponse {
  answer: string;
  sufficient_context: boolean;
  missing_info: string | null;
  citations: Citation[];
  confidence: number;
  clarifying_question?: string;
  agent_action?: 'answer' | 'clarify' | null; // NEW: Agent action indicator
}
```

### 2.5 Design System

**Theme File:** `/theme/theme.ts`

| Token | Value |
|-------|-------|
| Primary Color | #00859b (Trakref teal) |
| Background | rgba(255,255,255, 0.72-0.9) glass effects |
| Font Family | -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI' |
| Blur Effects | sm: 12px, md: 20px, lg: 32px, xl: 48px |

---

## 3. Backend/Server Functionality

### 3.1 FastAPI Application

**File:** `/src/server.py`

**Configuration:**
- Port: 8000
- CORS: Allows localhost:3000
- LLM: OpenAI GPT-4o-mini

### 3.2 API Endpoints

#### **GET /health**
```json
Response: {"status": "ok", "mode": "production", "version": "1.0.0"}
```

#### **POST /chat**
Main chat endpoint - retrieves context and generates answer. Supports agent mode for intelligent clarifying questions.

**Request:**
```json
{
  "message": "string",
  "sessionId": "string (optional)",
  "top_k": 5,
  "agent_mode": false          // NEW: Enable agent-supervised pipeline
}
```

**Response:**
```json
{
  "answer": "string",
  "sufficient_context": true,
  "missing_info": null,
  "citations": [{"article_id", "title", "url"}],
  "confidence": 0.75,
  "clarifying_question": null,
  "agent_action": null         // "answer" | "clarify" | null
}
```

**Pipeline (Standard Mode - agent_mode: false):**
1. Calls `generate_answer()` from hybrid RAG pipeline
2. Checks for "INSUFFICIENT_CONTEXT" marker
3. Builds unique citations list
4. Calculates confidence: `0.6 + (citations_count * 0.07)`, max 0.95

**Pipeline (Agent Mode - agent_mode: true):**
1. Calls `run_agent_pipeline()` from agent supervisor
2. Evaluates retrieval quality (document count, term overlap)
3. If quality POOR: Returns clarifying question (confidence: 0.3)
4. If quality GOOD: Generates answer normally
5. Response includes `agent_action` field indicating decision

#### **POST /retrieve** (Debug)
Test retrieval without generation.

**Request:**
```json
{
  "query": "string",
  "top_k": 6,
  "category_id": null,
  "section_id": null
}
```

### 3.3 Frontend API Routes (Proxy Layer)

| Route | Purpose |
|-------|---------|
| `/api/chat/route.ts` | Proxies to backend `/chat`, logs interactions |
| `/api/retrieve/route.ts` | Proxies to backend `/retrieve` |
| `/api/health/route.ts` | Checks backend health status |

### 3.4 RAG Pipeline Architecture

**File:** `/src/pipeline/hybrid/generation.py`

**Main Function:** `generate_answer()`

**Parameters:**
- `question: str` - User's question
- `top_k: int = 5` - Documents to retrieve
- `vector_weight: float = 1.0` - Semantic search weight
- `fulltext_weight: float = 1.0` - Keyword search weight
- `category_id: Optional[int]` - Filter by category
- `verbose: bool = False` - Include raw documents

**Pipeline Steps:**
1. Resolve metadata filters
2. Hybrid retrieval (vector + BM25 + RRF)
3. Format context for LLM
4. Generate answer (GPT-4o-mini, temperature=0.0)
5. Extract citations from metadata

**Output Structure:**
```python
{
    "answer": "Generated answer...",
    "sources": [{"Category", "Section", "Article", "URL"}],
    "search_config": {"method": "hybrid", "weights": {...}},
    "retrieved_documents": [...]  # if verbose
}
```

### 3.5 Agent Supervisor (Agentic RAG)

**File:** `/src/agent/supervisor.py`

The agent supervisor wraps the RAG pipeline and adds intelligent quality evaluation. When retrieval quality is poor, it generates clarifying questions instead of providing weak answers.

#### Architecture

```
User Query
    │
    ├─> RETRIEVE (Hybrid Search)
    │   └─> Vector + BM25 + RRF
    │
    ├─> EVALUATE QUALITY
    │   ├─> Document count check (min 2)
    │   ├─> Term overlap analysis
    │   └─> Returns: {is_good, reason, score}
    │
    └─> DECIDE ACTION
        ├─> Quality GOOD → Generate Answer (standard RAG)
        └─> Quality POOR → Generate Clarifying Question
```

#### Key Functions

| Function | Purpose |
|----------|---------|
| `run_agent_pipeline()` | Main entry point - orchestrates retrieval, evaluation, and response |
| `evaluate_retrieval_quality()` | Scores retrieval results (document count, term overlap) |
| `generate_clarifying_question()` | Creates natural clarifying questions using GPT-4o-mini |

#### Quality Evaluation Logic

```python
# Thresholds
MIN_DOCS_THRESHOLD = 2    # Minimum documents needed
SCORE_THRESHOLD = 0.65    # Minimum relevance score

# Quality reasons:
# - "no_documents" (score: 0.0)
# - "insufficient_documents" (score: 0.3)
# - "low_term_overlap" (score: <0.3)
# - "sufficient_context" (score: 0.8)
```

**Term Overlap Analysis:**
- Extracts meaningful terms from query (removes stop words)
- Checks how many query terms appear in top 3 documents
- Requires ≥30% match ratio for "good" quality

#### Clarifying Question Generation

When quality is poor, the agent generates conversational clarifying questions:

```python
CLARIFY_PROMPT_TEMPLATE = """
The user asked: {question}
What was found: {context_summary}

Generate a brief, friendly clarifying question to help the user get better results.
Focus on:
- Asking for specific feature names or workflows
- Clarifying if they mean a particular Trakref module
- Asking for more details about what they're trying to accomplish
"""
```

**Parameters:**
- Model: GPT-4o-mini
- Temperature: 0.7 (for natural variation)

#### Agent Response Structure

```python
{
    "answer": str,              # Response or clarifying question
    "sources": list,            # Citation sources (empty if clarifying)
    "search_config": {
        "method": "hybrid",
        "agent_mode": True,
        "retrieval_quality": {...}
    },
    "agent_action": str,        # "answer" | "clarify" | "error"
    "clarifying_question": str, # The question (if clarifying)
    "quality_reason": str       # Why quality was poor (if clarifying)
}
```

### 3.6 Retrieval Strategy: Hybrid Search

**File:** `/src/retrieval/strategies/hybrid.py`

**Architecture:**
```
Query
  │
  ├─ VECTOR SEARCH (Semantic)
  │  └─ MongoDB vector index, cosine similarity
  │
  ├─ BM25 SEARCH (Keyword)
  │  └─ Lucene full-text index
  │
  └─ RECIPROCAL RANK FUSION (RRF)
     └─ RRF_score = Σ(weight / (penalty + rank))
```

**Key Functions:**
- `get_hybrid_retriever()` - Creates MongoDBAtlasHybridSearchRetriever
- `retrieve_hybrid()` - Main retrieval function
- `retrieve_hybrid_with_metadata_filter()` - Filtered retrieval

**Default Configuration:**
- `top_k`: 5 documents
- `oversampling_factor`: 10 (50 candidates)
- `vector_penalty` / `fulltext_penalty`: 60
- Weights: 1.0 for both

### 3.6 MongoDB Vector Store

**File:** `/src/vectorstore/mongoDB.py`

**Configuration:**
- Database: `rag_playbook`
- Collection: `naive_rag`
- Vector Index: `naive` (1536 dims, cosine)
- Full-Text Index: `fulltext` (Lucene standard)

**Embeddings:** OpenAI text-embedding-3-small (1536 dimensions)

### 3.7 Text Processing

**File:** `/src/text/chunk.py`

- Uses `RecursiveCharacterTextSplitter`
- Separators: `["\n\n", "\n", " ", ""]`
- Prepends metadata context to each chunk

### 3.8 Data Models

**File:** `/src/pipeline/models.py`

```python
@dataclass
class Category:
    id: int
    name: str

@dataclass
class Section:
    id: int
    name: str
    category_id: int
    category_name: str | None = None

@dataclass
class Article:
    id: str              # article_id#chunk_n
    text: str            # chunk text
    article_name: str
    category_id: int
    category_name: str
    section_id: int
    section_name: str
    url: str
    title: str
    updated_at: str
```

### 3.9 Zendesk Integration

**File:** `/src/api/zendesk_client.py`

**ZendeskClient Methods:**
- `iterate_categories()` - Fetch all help categories
- `iterate_sections()` - Fetch all sections
- `iterate_articles()` - Fetch all articles
- `iterate_pagination()` - Handle cursor-based pagination

**API Endpoints Used:**
- `GET /api/v2/help_center/categories.json`
- `GET /api/v2/help_center/sections.json`
- `GET /api/v2/help_center/articles.json`

---

## 4. Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│  USER                                                       │
│  └─> Enters message in ChatInput                            │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  ZUSTAND STORE                                              │
│  ├─> addMessage(user message)                               │
│  ├─> createPlaceholder(assistant message, isLoading=true)   │
│  ├─> setLoadingStage('searching' → 'reading' → 'writing')   │
│  └─> fetch('/api/chat')                                     │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  NEXT.JS API ROUTE (/api/chat)                              │
│  └─> Proxy to http://localhost:8000/chat                    │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  FASTAPI BACKEND (/chat)                                    │
│  │                                                          │
│  ├─> [agent_mode: false] generate_answer(question)          │
│  │   │                                                      │
│  │   ├─> RETRIEVAL                                          │
│  │   │   ├─> Vector Search (MongoDB, cosine similarity)     │
│  │   │   ├─> BM25 Search (Lucene full-text)                 │
│  │   │   └─> RRF Fusion → Top 5 documents                   │
│  │   │                                                      │
│  │   ├─> CONTEXT FORMATTING                                 │
│  │   │   └─> Combine docs into LLM context string           │
│  │   │                                                      │
│  │   └─> GENERATION                                         │
│  │       ├─> GPT-4o-mini (temperature=0.0)                  │
│  │       └─> Return answer + sources                        │
│  │                                                          │
│  └─> [agent_mode: true] run_agent_pipeline(question)        │
│      │                                                      │
│      ├─> RETRIEVAL (same as above)                          │
│      │                                                      │
│      ├─> QUALITY EVALUATION                                 │
│      │   ├─> Check document count (min 2)                   │
│      │   ├─> Check term overlap (min 30%)                   │
│      │   └─> Return {is_good, reason, score}                │
│      │                                                      │
│      └─> DECIDE ACTION                                      │
│          ├─> [quality GOOD] → Generate answer normally      │
│          └─> [quality POOR] → Generate clarifying question  │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  RESPONSE                                                   │
│  {                                                          │
│    answer: "...",                                           │
│    sufficient_context: true,                                │
│    citations: [{article_id, title, url}],                   │
│    confidence: 0.81                                         │
│  }                                                          │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  UI UPDATE                                                  │
│  ├─> updateMessage(assistant, {content, citations})         │
│  └─> MessageBubble renders with SourcesAccordion            │
└─────────────────────────────────────────────────────────────┘
```

---

## 5. Dependencies

### 5.1 Frontend (`/frontend/package.json`)

| Package | Version | Purpose |
|---------|---------|---------|
| next | 14.2.35 | React framework |
| react | 18 | UI library |
| @mui/material | 7.3.7 | Component library |
| @mui/icons-material | 7.3.7 | Icons |
| framer-motion | 12.31.0 | Animations |
| zustand | 5.0.11 | State management |
| @emotion/react | 11.14.0 | CSS-in-JS |
| TypeScript | - | Type safety |

### 5.2 Backend (`/requirements.txt`)

| Package | Version | Purpose |
|---------|---------|---------|
| langchain | >=0.3.0 | LLM orchestration |
| langchain-openai | >=0.2.0 | OpenAI integration |
| langchain-mongodb | >=0.2.0 | MongoDB vector store |
| fastapi | >=0.109.0 | API framework |
| uvicorn | >=0.27.0 | ASGI server |
| pymongo[srv] | >=4.6.0 | MongoDB driver |
| rank_bm25 | >=0.2.2 | BM25 ranking |
| neo4j | >=5.0.0 | Graph DB (future) |

---

## 6. External Service Integrations

### 6.1 OpenAI

| Service | Model | Purpose |
|---------|-------|---------|
| Embeddings | text-embedding-3-small | Document & query encoding (1536 dims) |
| LLM | gpt-4o-mini | Answer generation (temp=0.0) |

### 6.2 MongoDB Atlas

- **Database:** `rag_playbook`
- **Collection:** `naive_rag`
- **Indexes:** Vector (cosine) + Full-text (Lucene)

### 6.3 Zendesk API

- Fetches categories, sections, articles
- Cursor-based pagination
- Used during data ingestion

### 6.4 LangSmith (Optional)

- Tracing and observability
- Configured via `LANGCHAIN_TRACING_V2`

---

## 7. Environment Variables Required

| Variable | Purpose |
|----------|---------|
| `OPENAI_API_KEY` | OpenAI API authentication |
| `MONGO_DB_URL` | MongoDB Atlas connection string |
| `TRAKREF_ZENDESK_BASE` | Zendesk subdomain |
| `LANGCHAIN_API_KEY` | LangSmith tracing (optional) |
| `LANGCHAIN_PROJECT` | LangSmith project name (optional) |

---

## 8. Current Status & Limitations

### 8.1 Implemented Features
- [x] Chat UI with glass morphism design
- [x] Hybrid retrieval (vector + BM25 + RRF)
- [x] FastAPI backend with RAG pipeline
- [x] Citations/sources display
- [x] Loading state animations
- [x] Error handling and display
- [x] Insufficient context detection
- [x] **Agent Mode (Agentic RAG)** - NEW
  - [x] Agent supervisor with quality evaluation
  - [x] Clarifying question generation on poor retrieval
  - [x] Agent mode toggle in UI (purple accent)
  - [x] Term overlap analysis for quality scoring

### 8.2 Not Yet Implemented
- [ ] Session persistence (chat history across page reload)
- [ ] Streaming responses (typewriter effect)
- [ ] ~~Clarifying questions~~ ✅ Implemented via Agent Mode
- [ ] Query rewrite on low retrieval quality
- [ ] Graph RAG (Neo4j)
- [ ] Authentication/authorization
- [ ] Rate limiting
- [ ] Admin debug panel
- [ ] Multi-turn agent conversation memory

### 8.3 Technical Debt
- No error recovery mechanisms (circuit breaker, retries)
- Limited logging infrastructure
- No unit/integration tests
- Some config values hardcoded
- Missing JSDoc/docstrings in places

---

## 9. Security Considerations

| Area | Current State | Recommendation |
|------|---------------|----------------|
| Secrets | `.env` file (git-ignored) | Use secret manager in production |
| CORS | localhost:3000 only | Restrict to production domain |
| Authentication | Not implemented | Add JWT/API key auth |
| Rate Limiting | Not implemented | Add middleware or API gateway |
| Input Validation | Basic Pydantic models | Add explicit length limits |

---

## 10. Agent Implementation (Current State)

The agent supervisor has been implemented with the following architecture:

### 10.1 Current Agent Capabilities
- **Quality Evaluation:** Assesses retrieval quality before generating answers
- **Clarifying Questions:** Generates natural follow-up questions when context is poor
- **Transparent Actions:** Reports `agent_action` field for UI awareness

### 10.2 Entry Points
| Location | Purpose |
|----------|---------|
| `/src/agent/supervisor.py` | Agent logic and quality evaluation |
| `/src/server.py` (line 102-125) | Agent mode handling in /chat endpoint |
| `/store/chatStore.ts` | `agentMode` state and `toggleAgentMode` action |
| `/components/chat/ChatInput.tsx` | Agent mode toggle UI |

### 10.3 Future Agent Enhancements
- [ ] Multi-turn conversation context/memory
- [ ] Tool calling (search, retrieve, clarify as distinct tools)
- [ ] Query reformulation on poor retrieval
- [ ] Response validation/fact-checking
- [ ] Streaming support for agent responses
- [ ] WebSocket for real-time agent step updates
- [ ] LangSmith agent step tracing

---

## 11. Quality Assessment

| Category | Score | Notes |
|----------|-------|-------|
| Architecture | 8/10 | Clean separation, appropriate stack |
| Code Quality | 7.5/10 | Readable, some missing tests/docs |
| Scalability | 6/10 | Single-server, no caching |
| Production Readiness | 5/10 | Missing auth, rate limits, monitoring |
| Documentation | 7/10 | Good README/SPEC, inline docs sparse |

---

*Audit completed by Claude Code*
