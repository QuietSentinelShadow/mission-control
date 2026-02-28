import { NextResponse } from 'next/server'
import { broadcast } from '@/lib/events'

// In-memory status store (resets on deploy, but fine for now)
const botStatuses: Map<string, {
  name: string
  role: string
  model: string
  status: 'online' | 'offline' | 'busy'
  lastSeen: string
  currentTask?: string
  metrics?: Record<string, string | number>
}> = new Map()

// Initialize with known bots
botStatuses.set('amtoc01bot', {
  name: 'amtoc01bot',
  role: 'Executor',
  model: 'zai/glm-5',
  status: 'online',
  lastSeen: new Date().toISOString(),
})

botStatuses.set('amtoc02bot', {
  name: 'amtoc02bot',
  role: 'Orchestrator',
  model: 'zai/glm-5',
  status: 'online',
  lastSeen: new Date().toISOString(),
})

export async function GET() {
  const statuses = Array.from(botStatuses.values()).map(bot => ({
    ...bot,
    isStale: isStale(bot.lastSeen),
  }))
  
  return NextResponse.json({
    bots: statuses,
    total: statuses.length,
    online: statuses.filter(b => b.status === 'online' && !b.isStale).length,
    updatedAt: new Date().toISOString(),
  })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, role, model, status, currentTask, metrics } = body
    
    if (!name) {
      return NextResponse.json({ error: 'Bot name required' }, { status: 400 })
    }
    
    const existing = botStatuses.get(name)
    const previousStatus = existing?.status
    
    botStatuses.set(name, {
      name,
      role: role || existing?.role || 'Unknown',
      model: model || existing?.model || 'Unknown',
      status: status || 'online',
      lastSeen: new Date().toISOString(),
      currentTask: currentTask,
      metrics: metrics,
    })
    
    const updatedBot = botStatuses.get(name)
    
    // Broadcast status change
    if (previousStatus !== updatedBot?.status || currentTask !== existing?.currentTask) {
      broadcast('mission-control', {
        type: 'status_update',
        data: {
          bot: { ...updatedBot, isStale: false },
          previousStatus,
          timestamp: new Date().toISOString(),
        }
      })
    }
    
    return NextResponse.json({ 
      success: true, 
      bot: updatedBot 
    })
  } catch (error) {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
}

function isStale(lastSeen: string): boolean {
  const fiveMinutesAgo = Date.now() - 5 * 60 * 1000
  return new Date(lastSeen).getTime() < fiveMinutesAgo
}
