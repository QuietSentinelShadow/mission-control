import { NextResponse } from 'next/server'
import { subscribe } from '@/lib/events'

export const runtime = 'edge'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const channel = searchParams.get('channel') || 'default'
  
  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder()
      
      // Send initial connection message
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'connected', channel })}\n\n`))
      
      // Subscribe to events
      const unsubscribe = subscribe(channel, (event) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`))
        } catch {
          unsubscribe()
        }
      })
      
      // Keep-alive every 15 seconds
      const keepAlive = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': keepalive\n\n'))
        } catch {
          clearInterval(keepAlive)
          unsubscribe()
        }
      }, 15000)
      
      // Cleanup on disconnect
      request.signal.addEventListener('abort', () => {
        clearInterval(keepAlive)
        unsubscribe()
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
