# Trakref HelpBot Specification

> **Version:** 0.2
> **Status:** In Development
> **Last Updated:** 2/3/2026

---

## 1. Overview

### 1.1 Project Summary

| Field | Value |
|-------|-------|
| Name | Trakref Zendesk HelpBot |
| Codename | HelpBot |
| Type | LLM-assisted support chat |
| Owner | Trakref |

### 1.2 Purpose

A sleek, minimally animated chat interface that answers user questions using **only** Trakref's Zendesk Help Center articles via RAG. The system prioritizes grounded, citation-backed answers and explicitly acknowledges missing information.

### 1.3 Goals

- [ ] Provide accurate, grounded answers using Zendesk article context
- [ ] Reduce hallucinations via strict context-only generation
- [ ] Improve success rate via bounded retry logic
- [ ] Make behavior observable via LangSmith traces

### 1.4 Non-Goals

- ❌ General-purpose chatbot
- ❌ Autonomous multi-agent system
- ❌ Actions that modify external systems (read-only)
- ❌ Hallucinated answers outside retrieved context

---

## 2. Design System

### 2.1 Design Tokens

```typescript
const tokens = {
  colors: {
    primary: {
      main: '#00859b',
      light: '#33a0b2',
      dark: '#005d6c',
      gradient: 'linear-gradient(135deg, #00859b 0%, #006d7f 100%)',
    },
    background: {
      app: '#f8f9fa',
      chat: '#ffffff',
      input: '#f5f7f9',
      glass: 'rgba(255, 255, 255, 0.8)',
    },
    text: {
      primary: '#1a1a2e',
      secondary: '#6b7280',
      muted: '#9ca3af',
    },
    semantic: {
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#3b82f6',
    },
    message: {
      user: '#00859b',
      userText: '#ffffff',
      assistant: '#ffffff',
      assistantText: '#1a1a2e',
      assistantBorder: '#e5e7eb',
    },
  },

  typography: {
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    fontSize: {
      xs: '0.75rem',    // 12px
      sm: '0.875rem',   // 14px
      base: '1rem',     // 16px
      lg: '1.125rem',   // 18px
      xl: '1.25rem',    // 20px
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
    },
    lineHeight: {
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.75,
    },
  },

  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    xxl: '48px',
  },

  borderRadius: {
    sm: '6px',
    md: '12px',
    lg: '16px',
    xl: '24px',
    full: '9999px',
  },

  shadows: {
    sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px rgba(0, 0, 0, 0.07)',
    lg: '0 10px 15px rgba(0, 0, 0, 0.1)',
    glow: '0 0 20px rgba(0, 133, 155, 0.15)',
  },

  animation: {
    duration: {
      fast: '150ms',
      normal: '200ms',
      slow: '300ms',
      slower: '500ms',
    },
    easing: {
      default: 'cubic-bezier(0.4, 0, 0.2, 1)',
      easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      spring: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
    },
  },

  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
  },
};
```

### 2.2 Animation Specifications

| Animation | Duration | Easing | Description |
|-----------|----------|--------|-------------|
| `messageEnter` | 300ms | easeOut | Fade in + slide up 12px |
| `messageFade` | 200ms | default | Opacity 0 → 1 |
| `buttonHover` | 150ms | default | Scale 1 → 1.02 |
| `buttonPress` | 100ms | easeIn | Scale 1 → 0.98 |
| `typingPulse` | 1.4s | ease-in-out | Opacity pulse, infinite |
| `shimmer` | 1.5s | linear | Background position shift, infinite |
| `slideUp` | 300ms | spring | Transform Y 20px → 0 |
| `fadeSlide` | 250ms | easeOut | Combined fade + slide |

```css
/* Message Entry Animation */
@keyframes messageEnter {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Typing Indicator Pulse */
@keyframes typingPulse {
  0%, 100% { opacity: 0.4; transform: scale(0.85); }
  50% { opacity: 1; transform: scale(1); }
}

/* Shimmer Loading Effect */
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

/* Button Press Feedback */
@keyframes buttonPress {
  0% { transform: scale(1); }
  50% { transform: scale(0.96); }
  100% { transform: scale(1); }
}
```

---

## 3. Frontend Architecture

### 3.1 Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14 (App Router) |
| UI Library | MUI v5 |
| Styling | MUI Theme + Tailwind utilities |
| State | Zustand |
| Animations | Framer Motion (optional) / CSS |

### 3.2 Route Structure

```
/helpbot          → Main chat interface
/helpbot/history  → Chat history (future)
/api/chat         → Chat endpoint
/api/retrieve     → Debug retrieval endpoint
/api/health       → Health check
```

### 3.3 Component Specifications

#### ChatLayout

```typescript
interface ChatLayoutProps {
  // No props - uses global store
}

interface ChatLayoutState {
  sidebarOpen: boolean;
}

// Structure
// ┌─────────────────────────────────────┐
// │ Header (glass effect, sticky)       │
// ├─────────────────────────────────────┤
// │                                     │
// │ MessageList (scrollable)            │
// │                                     │
// ├─────────────────────────────────────┤
// │ ChatInput (fixed, glass effect)     │
// └─────────────────────────────────────┘
```

#### MessageBubble

```typescript
interface MessageBubbleProps {
  message: Message;
  isLast: boolean;
  onCopy: () => void;
}

// Visual States
// - default: Normal display
// - loading: Show typing indicator
// - streaming: Typewriter text effect
// - error: Red border, error icon

// Animation: messageEnter on mount
// Hover: Show timestamp + copy button
```

#### TypingIndicator

```typescript
interface TypingIndicatorProps {
  stage?: 'searching' | 'reading' | 'writing';
}

// Stages with messages:
// - searching: "Searching help articles..."
// - reading: "Reading relevant sections..."
// - writing: "Writing response..."

// Animation: 3 dots with staggered typingPulse
// Progress: Optional stage indicator
```

#### SourcesPanel

```typescript
interface SourcesPanelProps {
  citations: Citation[];
  expanded: boolean;
  onToggle: () => void;
}

// Collapsed: Chip showing "N sources"
// Expanded: Card list with hover preview
// Animation: Height transition + fade
```

#### ChatInput

```typescript
interface ChatInputProps {
  onSend: (message: string) => void;
  disabled: boolean;
  placeholder?: string;
}

// Features:
// - Auto-resize textarea (max 4 rows)
// - Character count (optional)
// - Send on Enter, Shift+Enter for newline
// - Disabled state with loading spinner
// - Glass effect background
```

#### SuggestedPrompts

```typescript
interface SuggestedPromptsProps {
  prompts: string[];
  onSelect: (prompt: string) => void;
}

// Display: Horizontal scroll on mobile, wrap on desktop
// Animation: Staggered fadeSlide on mount
// Hover: Lift effect with shadow
```

### 3.4 State Management

```typescript
interface ChatStore {
  // State
  messages: Message[];
  isLoading: boolean;
  loadingStage: 'idle' | 'searching' | 'reading' | 'writing';
  error: string | null;
  sessionId: string;

  // Actions
  sendMessage: (content: string) => Promise<void>;
  clearChat: () => void;
  newChat: () => void;
  setError: (error: string | null) => void;

  // Streaming (future)
  appendToLastMessage: (chunk: string) => void;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: Citation[];
  timestamp: Date;
  status: 'sending' | 'sent' | 'error';
  insufficientContext?: boolean;
  missingInfo?: string;
}

interface Citation {
  article_id: string;
  title: string;
  url: string;
  snippet?: string;  // Preview text
}
```

---

## 4. Backend Architecture

### 4.1 API Endpoints

#### POST /api/chat

```typescript
// Request
interface ChatRequest {
  message: string;
  sessionId: string;
  history?: Array<{ role: string; content: string }>;
}

// Response
interface ChatResponse {
  answer: string;
  sufficient_context: boolean;
  missing_info: string | null;
  citations: Citation[];
  confidence: number;
  clarifying_question?: string;
  metadata?: {
    retrieval_count: number;
    model: string;
    latency_ms: number;
  };
}

// Errors
// 400: Invalid request body
// 429: Rate limit exceeded
// 500: Internal server error
// 503: Service unavailable (LLM/DB down)
```

#### POST /api/retrieve (Debug)

```typescript
// Request
interface RetrieveRequest {
  query: string;
  top_k?: number;  // default: 6
  filters?: {
    category_id?: string;
    section_id?: string;
  };
}

// Response
interface RetrieveResponse {
  query: string;
  documents: RetrievedDocument[];
  metadata: {
    search_time_ms: number;
    index_used: string;
  };
}
```

#### GET /api/health

```typescript
// Response
interface HealthResponse {
  status: 'ok' | 'degraded' | 'down';
  timestamp: string;
  version: string;
  checks: {
    database: boolean;
    llm: boolean;
    vectorIndex: boolean;
  };
}
```

### 4.2 Data Models

#### MongoDB Collections

```typescript
// zendesk_articles
interface ZendeskArticle {
  _id: ObjectId;
  article_id: string;
  title: string;
  url: string;
  body_text: string;
  category_id: string;
  section_id: string;
  updated_at: Date;
  embedding: number[];  // 1536 dimensions
  metadata: {
    tags: string[];
    locale: string;
    author_id?: string;
  };
}

// chat_sessions
interface ChatSession {
  _id: ObjectId;
  session_id: string;
  created_at: Date;
  updated_at: Date;
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    citations?: Citation[];
  }>;
  metadata: {
    version: string;
    model: string;
    total_tokens?: number;
  };
}
```

---

## 5. Agent Design

### 5.1 Philosophy

> "Keep it bounded and boring."

The agent exists solely to manage failure cases through controlled retries and at most one clarification question. It is **not** an autonomous system.

### 5.2 Control Flow

```
┌─────────────────────────────────────────────────────────┐
│                    User Question                        │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│  1. RETRIEVE                                            │
│     vector_search(query, top_k=6)                       │
│     → documents[]                                       │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│  2. GENERATE                                            │
│     LLM(context + grounding_prompt)                     │
│     → { answer, sufficient_context, citations }         │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│  3. EVALUATE                                            │
│     - Check sufficient_context flag                     │
│     - Verify citations present                          │
│     - Assess retrieval quality signals                  │
└─────────────────────────────────────────────────────────┘
                           │
              ┌────────────┴────────────┐
              │                         │
         sufficient              insufficient
              │                         │
              ▼                         ▼
┌─────────────────────┐   ┌─────────────────────────────┐
│  5. RETURN          │   │  4. RETRY OR CLARIFY        │
│     answer +        │   │     - Rewrite query OR      │
│     citations       │   │     - Ask clarifying Q      │
└─────────────────────┘   │     (max 1 retry, 1 Q)      │
                          └─────────────────────────────┘
                                        │
                                        ▼
                               [Back to RETRIEVE]
                               [or RETURN with partial]
```

### 5.3 Termination Rules

| Rule | Limit |
|------|-------|
| Max steps | 4 |
| Max retrieval calls | 2 |
| Max clarifying questions | 1 |

**Stop when:**
- ✅ Answer is grounded with citations
- ✅ Model returns `INSUFFICIENT_CONTEXT` after retries
- ✅ No progress (same query attempted twice)

### 5.4 Evaluation Heuristics

**Sufficient Context Detection:**
```typescript
const hasSufficientContext = (response: LLMResponse): boolean => {
  // Primary: explicit flag from structured output
  if (response.sufficient_context === false) return false;

  // Fallback: check for marker phrase
  if (response.answer.includes('INSUFFICIENT_CONTEXT')) return false;

  // Must have citations for non-trivial answers
  if (response.answer.length > 50 && response.citations.length === 0) {
    return false;
  }

  return true;
};
```

**Retrieval Quality Signals:**
```typescript
const assessRetrievalQuality = (docs: Document[]): 'good' | 'weak' | 'poor' => {
  const avgScore = docs.reduce((a, d) => a + d.score, 0) / docs.length;
  const topScore = docs[0]?.score ?? 0;

  if (topScore < 0.5) return 'poor';
  if (avgScore < 0.6) return 'weak';
  return 'good';
};
```

### 5.5 Query Rewrite Strategy

**When:** Retrieval quality is weak/poor

**Methods:**
1. LLM rewrite to keyword-style query
2. Entity extraction (feature name, error code, workflow step)

```typescript
const rewriteQuery = async (
  originalQuery: string,
  context: string
): Promise<string> => {
  const prompt = `
    The following query returned weak search results.
    Rewrite it as a shorter, keyword-focused query.

    Original: "${originalQuery}"

    Return ONLY the rewritten query, nothing else.
  `;

  return await llm.complete(prompt);
};
```

### 5.6 Clarifying Question Strategy

**When:** Question is ambiguous AND retrieval is weak

**Constraints:**
- Ask only ONE question
- Prefer multiple-choice format
- Re-run retrieval once after user answers

```typescript
interface ClarifyingQuestion {
  question: string;
  options?: string[];  // If multiple choice
  context: string;     // Why we're asking
}
```

---

## 6. Prompts

### 6.1 System Prompt

```
You are a helpful assistant that answers questions based on the provided context from Trakref's Zendesk Help Center articles.

RULES:
1. Use ONLY information from the provided context
2. Always cite your sources using the article titles provided
3. If the context doesn't contain enough information, respond with:
   INSUFFICIENT_CONTEXT
   Then briefly state what you CAN answer and what information is MISSING
4. Be concise and direct
5. Format responses with markdown for readability

RESPONSE FORMAT (JSON):
{
  "answer": "Your response here with **markdown** formatting",
  "sufficient_context": true,
  "missing_info": null,
  "citations": [
    {"article_id": "...", "title": "...", "url": "..."}
  ],
  "confidence": 0.85
}
```

### 6.2 Citations Policy

- ✅ Citations must come from retrieved articles only
- ✅ Include title + URL (or article_id if URL unavailable)
- ✅ If insufficient context, still cite what was used
- ❌ Never fabricate or assume article content

---

## 7. Observability

### 7.1 LangSmith Tracing

**Required trace data:**
- Retrieval query, top_k, document scores
- Prompt size, context size, model settings
- Final answer + citations
- Run tags: version, environment

**Redaction:**
- User PII (if detected)
- Full article bodies (store IDs only)

### 7.2 Metrics

| Metric | Description |
|--------|-------------|
| `success_rate` | % with sufficient_context = true |
| `insufficient_context_rate` | % with insufficient context |
| `avg_tool_calls` | Average retrieval calls per query |
| `avg_latency_ms` | End-to-end response time |
| `avg_tokens` | Tokens used per request |
| `top_k_hit_rate` | Did top docs match eval expectations |

---

## 8. Security

- [ ] Rate limit: 20 requests/minute per IP
- [ ] Input validation: Max 2000 chars, sanitize HTML
- [ ] Prompt injection defense: Input/output guards
- [ ] No raw article bodies in client responses
- [ ] Secrets redacted from logs/traces
- [ ] HTTPS only in production

---

## 9. Deployment

### 9.1 Environments

| Environment | Purpose |
|-------------|---------|
| local | Development |
| qa | Testing |
| production | Live users |

### 9.2 Configuration

**Secrets (env vars):**
- `OPENAI_API_KEY` or `ANTHROPIC_API_KEY`
- `MONGODB_URI`
- `LANGSMITH_API_KEY`

**Feature Flags:**
- `AGENT_RETRIES_ENABLED` (default: true)
- `CLARIFYING_QUESTION_ENABLED` (default: true)
- `STREAMING_ENABLED` (default: false)

### 9.3 Reliability

- Timeouts: LLM (30s), DB (10s)
- Circuit breaker: 5 failures → open for 60s
- Fallback: Return INSUFFICIENT_CONTEXT on repeated failure

---

## 10. Milestones

### MVP (Current)

- [x] Chat UI at /helpbot
- [x] Mock API responses
- [ ] Real RAG retrieval
- [ ] Grounded answers with citations
- [ ] Bounded agent retries
- [ ] LangSmith traces

### V1

- [ ] Session memory (conversation context)
- [ ] Admin debug panel
- [ ] Evaluation dataset
- [ ] Regression test suite

### Future

- [ ] Reranker model
- [ ] Hybrid retrieval (BM25 + dense)
- [ ] Role-based access
- [ ] Chat history persistence

---

## 11. Acceptance Criteria

- [ ] Assistant never claims knowledge outside Zendesk context
- [ ] Insufficient context triggers explicit INSUFFICIENT_CONTEXT response
- [ ] Agent performs ≤2 retrieval calls, ≤1 clarifying question
- [ ] All non-trivial answers include citations
- [ ] LangSmith traces show full retrieval → generation pipeline

---

## 12. UI Enhancement Checklist

### Animations
- [ ] Message entry: fade + slide up (300ms)
- [ ] Typing indicator: smooth pulse animation
- [ ] Button hover: scale 1.02x
- [ ] Button press: scale 0.98x feedback
- [ ] Send button: icon animation on send
- [ ] Copy success: checkmark transition
- [ ] Scroll to bottom: smooth with FAB button

### Visual Polish
- [ ] Header: glassmorphism with backdrop blur
- [ ] Primary gradient: subtle on buttons/accents
- [ ] Message shadows: soft depth
- [ ] Avatar: animated ring when assistant typing
- [ ] Skeleton loaders: shimmer effect
- [ ] Citation cards: hover preview

### UX Improvements
- [ ] Streaming text: typewriter effect
- [ ] Loading stages: "Searching..." → "Reading..." → "Writing..."
- [ ] Suggested prompts: animated chips
- [ ] Input: auto-resize textarea
- [ ] Mobile: responsive layout, touch-friendly
- [ ] Keyboard: full navigation support

### Layout
- [ ] Floating input with glass effect
- [ ] Max-width content container
- [ ] Proper scroll containment
- [ ] Empty state with illustration
