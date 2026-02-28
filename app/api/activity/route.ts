import { NextResponse } from 'next/server'

// In-memory activity log (last 100 events)
const activityLog: Array<{
  id: string
  type: 'status_change' | 'task_update' | 'system' | 'error'
  timestamp: string
  title: string
  description?: string
  source?: string
  metadata?: Record<string, any>
}> = []

const MAX_LOG_SIZE = 100

export async function GET() {
  return NextResponse.json({
    activities: activityLog.slice(-50).reverse(),
    total: activityLog.length,
  })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { type, title, description, source, metadata } = body
    
    if (!type || !title) {
      return NextResponse.json({ error: 'Type and title required' }, { status: 400 })
    }
    
    const activity = {
      id: `act_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      type,
      timestamp: new Date().toISOString(),
      title,
      description,
      source,
      metadata,
    }
    
    activityLog.push(activity)
    
    // Trim old entries
    if (activityLog.length > MAX_LOG_SIZE) {
      activityLog.splice(0, activityLog.length - MAX_LOG_SIZE)
    }
    
    return NextResponse.json({ success: true, activity })
  } catch (error) {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
}
