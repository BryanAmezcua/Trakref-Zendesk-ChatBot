import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

export async function GET() {
  try {
    // Check backend health
    const response = await fetch(`${BACKEND_URL}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return NextResponse.json({
        status: 'degraded',
        mode: 'backend_unavailable',
        version: '1.0.0',
        backend: 'offline',
      });
    }

    const backendHealth = await response.json();

    return NextResponse.json({
      status: 'ok',
      mode: backendHealth.mode || 'production',
      version: '1.0.0',
      backend: 'online',
    });
  } catch {
    return NextResponse.json({
      status: 'degraded',
      mode: 'backend_unavailable',
      version: '1.0.0',
      backend: 'offline',
    });
  }
}
