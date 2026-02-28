import { NextResponse } from 'next/server';

const OLLAMA_API = 'http://127.0.0.1:11434';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { model, contextWindow } = body;

    if (!model) {
      return NextResponse.json({ error: 'Model name required' }, { status: 400 });
    }

    const res = await fetch(`${OLLAMA_API}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        keep_alive: '10m',
        options: {
          num_ctx: contextWindow || 4096
        }
      }),
      signal: AbortSignal.timeout(30000)
    });

    if (!res.ok) {
      throw new Error(`Ollama API error: ${res.status}`);
    }

    return NextResponse.json({ 
      success: true, 
      message: `Model ${model} loaded with context window ${contextWindow || 4096}` 
    });
  } catch (error) {
    console.error('Failed to load model:', error);
    return NextResponse.json({ error: 'Failed to load model. Is Ollama running?' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const { model } = body;

    if (!model) {
      return NextResponse.json({ error: 'Model name required' }, { status: 400 });
    }

    const res = await fetch(`${OLLAMA_API}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, keep_alive: 0 }),
      signal: AbortSignal.timeout(10000)
    });

    if (!res.ok) {
      throw new Error(`Ollama API error: ${res.status}`);
    }

    return NextResponse.json({ success: true, message: `Model ${model} unloaded` });
  } catch (error) {
    console.error('Failed to unload model:', error);
    return NextResponse.json({ error: 'Failed to unload model' }, { status: 500 });
  }
}
