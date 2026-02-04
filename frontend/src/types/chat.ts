export interface Citation {
  article_id: string;
  title: string;
  url: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: Citation[];
  timestamp: Date;
  isLoading?: boolean;
  insufficientContext?: boolean;
  missingInfo?: string;
}

export interface ChatSession {
  id: string;
  messages: Message[];
  createdAt: Date;
}

export interface ChatResponse {
  answer: string;
  sufficient_context: boolean;
  missing_info: string | null;
  citations: Citation[];
  confidence: number;
  clarifying_question?: string;
}

export interface RetrievedDocument {
  article_id: string;
  title: string;
  url: string;
  chunk_text: string;
  score: number;
  metadata?: Record<string, unknown>;
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  sessionId: string;
  pendingClarification: boolean;
}
