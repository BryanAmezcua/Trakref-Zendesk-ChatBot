import { NextRequest, NextResponse } from 'next/server';
import { mockArticles, simulateDelay } from '@/lib/mock/mockResponses';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, top_k = 6 } = body;

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    // Simulate retrieval delay
    await simulateDelay(500);

    // Simple keyword matching to filter mock articles
    const lowerQuery = query.toLowerCase();
    const matchedArticles = mockArticles
      .filter((article) => {
        const searchText = `${article.title} ${article.chunk_text}`.toLowerCase();
        const queryWords = lowerQuery.split(' ').filter((w) => w.length > 2);
        return queryWords.some((word) => searchText.includes(word));
      })
      .slice(0, top_k);

    // If no matches, return top articles anyway
    const results = matchedArticles.length > 0
      ? matchedArticles
      : mockArticles.slice(0, Math.min(top_k, 3));

    return NextResponse.json({
      query,
      top_k,
      documents: results,
    });
  } catch (error) {
    console.error('[Retrieve API Error]', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
