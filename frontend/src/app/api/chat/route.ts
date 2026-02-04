import { NextRequest, NextResponse } from 'next/server';
import { simulateAgentLoop } from '@/lib/mock/mockResponses';

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

    // Simulate the agent control loop with mock responses
    const response = await simulateAgentLoop(message);

    // Log for debugging (would be LangSmith in production)
    console.log('[Chat API]', {
      sessionId,
      query: message,
      response: {
        sufficient_context: response.sufficient_context,
        citations_count: response.citations.length,
        confidence: response.confidence,
      },
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error('[Chat API Error]', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
