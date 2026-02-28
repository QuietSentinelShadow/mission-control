import { NextResponse } from 'next/server'

export const runtime = 'edge'

// Simple in-memory event store (resets on deploy, fine for now)
const eventChannels: Map<string, ReadableStreamDefaultController> = new Map()

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const channel = searchParams.get('channel') || 'default'
  
  const stream = new ReadableStream({
    start(controller) {
      eventChannels.set(channel, controller)
      
      // Send initial connection message
      const encoder = new TextEncoder()
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'connected', channel })}\n\n`))
      
      // Keep-alive every 15 seconds
      const keepAlive = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': keepalive\n\n'))
        } catch {
          clearInterval(keepAlive)
          eventChannels.delete(channel)
        }
      }, 15000)
      
      // Cleanup on disconnect
      request.signal.addEventListener('abort', () => {
        clearInterval(keepAlive)
        eventChannels.delete(channel)
      })
    },
  })
  
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}

// Export for other routes to broadcast
export function broadcast(channel: string, event: { type: string; data: any }) {
  const controller = eventChannels.get(channel)
  if (controller) {
    const encoder = new TextEncoder()
    controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`))
  }
}
