import { create } from 'zustand';
import { Message, ChatResponse } from '@/types/chat';

export type LoadingStage = 'idle' | 'searching' | 'reading' | 'writing';

interface ChatStore {
  messages: Message[];
  isLoading: boolean;
  loadingStage: LoadingStage;
  error: string | null;
  sessionId: string;
  agentMode: boolean;

  // Actions
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => string;
  updateMessage: (id: string, updates: Partial<Message>) => void;
  setLoading: (loading: boolean) => void;
  setLoadingStage: (stage: LoadingStage) => void;
  setError: (error: string | null) => void;
  clearChat: () => void;
  newChat: () => void;
  sendMessage: (content: string) => Promise<void>;
  toggleAgentMode: () => void;
}

const generateId = () => Math.random().toString(36).substring(2, 15);

// Simulate loading stages with delays
const simulateStages = async (
  setStage: (stage: LoadingStage) => void
): Promise<void> => {
  setStage('searching');
  await new Promise((r) => setTimeout(r, 600));
  setStage('reading');
  await new Promise((r) => setTimeout(r, 500));
  setStage('writing');
};

export const useChatStore = create<ChatStore>((set, get) => ({
  messages: [],
  isLoading: false,
  loadingStage: 'idle',
  error: null,
  sessionId: generateId(),
  agentMode: false,

  addMessage: (message) => {
    const newMessage: Message = {
      ...message,
      id: generateId(),
      timestamp: new Date(),
    };
    set((state) => ({
      messages: [...state.messages, newMessage],
    }));
    return newMessage.id;
  },

  updateMessage: (id, updates) => {
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.id === id ? { ...msg, ...updates } : msg
      ),
    }));
  },

  setLoading: (loading) => set({ isLoading: loading }),

  setLoadingStage: (stage) => set({ loadingStage: stage }),

  setError: (error) => set({ error }),

  clearChat: () => set({ messages: [], error: null, loadingStage: 'idle' }),

  newChat: () =>
    set({
      messages: [],
      error: null,
      sessionId: generateId(),
      loadingStage: 'idle',
    }),

  toggleAgentMode: () => set((state) => ({ agentMode: !state.agentMode })),

  sendMessage: async (content: string) => {
    const { addMessage, updateMessage, setLoading, setLoadingStage, setError } = get();

    // Add user message
    addMessage({ role: 'user', content });

    // Add placeholder for assistant response
    const assistantId = generateId();
    set((state) => ({
      messages: [
        ...state.messages,
        {
          id: assistantId,
          role: 'assistant' as const,
          content: '',
          timestamp: new Date(),
          isLoading: true,
        },
      ],
    }));

    setLoading(true);
    setError(null);

    try {
      // Simulate loading stages while fetching
      const stagePromise = simulateStages(setLoadingStage);

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content,
          sessionId: get().sessionId,
          agent_mode: get().agentMode,
        }),
      });

      // Wait for stages to complete for smooth UX
      await stagePromise;

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data: ChatResponse = await response.json();

      updateMessage(assistantId, {
        content: data.answer,
        citations: data.citations,
        isLoading: false,
        insufficientContext: !data.sufficient_context,
        missingInfo: data.missing_info || undefined,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      updateMessage(assistantId, {
        content: 'Sorry, something went wrong. Please try again.',
        isLoading: false,
      });
    } finally {
      setLoading(false);
      setLoadingStage('idle');
    }
  },
}));
