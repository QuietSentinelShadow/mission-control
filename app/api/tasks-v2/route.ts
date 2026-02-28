import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

interface Task {
  id: string
  title: string
  description?: string
  status: 'backlog' | 'in-progress' | 'done'
  assignee?: string
  priority: 'low' | 'medium' | 'high'
  createdAt: string
  updatedAt: string
  tags?: string[]
}

const TASKS_FILE = path.join(process.env.HOME || process.env.USERPROFILE || '/tmp', '.openclaw', 'workspace', 'TASKS.json')

// Ensure tasks file exists
function ensureTasksFile() {
  const dir = path.dirname(TASKS_FILE)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  if (!fs.existsSync(TASKS_FILE)) {
    fs.writeFileSync(TASKS_FILE, JSON.stringify({ tasks: [] }, null, 2))
  }
}

function readTasks(): Task[] {
  try {
    ensureTasksFile()
    const content = fs.readFileSync(TASKS_FILE, 'utf-8')
    const data = JSON.parse(content)
    return data.tasks || []
  } catch {
    return []
  }
}

function writeTasks(tasks: Task[]) {
  ensureTasksFile()
  fs.writeFileSync(TASKS_FILE, JSON.stringify({ tasks }, null, 2))
}

export async function GET() {
  const tasks = readTasks()
  
  const grouped = {
    backlog: tasks.filter(t => t.status === 'backlog').map(t => t.title),
    inProgress: tasks.filter(t => t.status === 'in-progress').map(t => t.title),
    done: tasks.filter(t => t.status === 'done').map(t => t.title),
    full: tasks,
  }
  
  return NextResponse.json(grouped)
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { title, description, status, assignee, priority, tags } = body
    
    if (!title) {
      return NextResponse.json({ error: 'Title required' }, { status: 400 })
    }
    
    const tasks = readTasks()
    
    const newTask: Task = {
      id: `task_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      title,
      description,
      status: status || 'backlog',
      assignee,
      priority: priority || 'medium',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags,
    }
    
    tasks.push(newTask)
    writeTasks(tasks)
    
    return NextResponse.json({ success: true, task: newTask })
  } catch (error) {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { id, title, description, status, assignee, priority, tags } = body
    
    if (!id) {
      return NextResponse.json({ error: 'Task ID required' }, { status: 400 })
    }
    
    const tasks = readTasks()
    const index = tasks.findIndex(t => t.id === id)
    
    if (index === -1) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }
    
    tasks[index] = {
      ...tasks[index],
      title: title ?? tasks[index].title,
      description: description ?? tasks[index].description,
      status: status ?? tasks[index].status,
      assignee: assignee ?? tasks[index].assignee,
      priority: priority ?? tasks[index].priority,
      tags: tags ?? tasks[index].tags,
      updatedAt: new Date().toISOString(),
    }
    
    writeTasks(tasks)
    
    return NextResponse.json({ success: true, task: tasks[index] })
  } catch (error) {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'Task ID required' }, { status: 400 })
    }
    
    const tasks = readTasks()
    const filtered = tasks.filter(t => t.id !== id)
    
    if (filtered.length === tasks.length) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }
    
    writeTasks(filtered)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 })
  }
}
