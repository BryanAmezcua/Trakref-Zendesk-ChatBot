import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, top_k = 6, category_id, section_id } = body;

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    // Call the Python backend
    const response = await fetch(`${BACKEND_URL}/retrieve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        top_k,
        category_id,
        section_id,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Backend error: ${response.status}`);
    }

    const retrieveResponse = await response.json();

    return NextResponse.json({
      query,
      top_k,
      documents: retrieveResponse.documents,
    });
  } catch (error) {
    console.error('[Retrieve API Error]', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
