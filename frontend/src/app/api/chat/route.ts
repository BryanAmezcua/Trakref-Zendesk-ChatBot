import { NextRequest, NextResponse } from 'next/server';
import { ChatResponse } from '@/types/chat';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, sessionId } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Call the Python backend
    const response = await fetch(`${BACKEND_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        sessionId,
        top_k: 5,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Backend error: ${response.status}`);
    }

    const chatResponse: ChatResponse = await response.json();

    // Log for debugging
    console.log('[Chat API]', {
      sessionId,
      query: message,
      response: {
        sufficient_context: chatResponse.sufficient_context,
        citations_count: chatResponse.citations.length,
        confidence: chatResponse.confidence,
      },
    });

    return NextResponse.json(chatResponse);
  } catch (error) {
    console.error('[Chat API Error]', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
