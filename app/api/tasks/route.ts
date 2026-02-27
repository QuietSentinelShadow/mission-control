import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const fs = require('fs');
    const path = require('path');

    const tasksPath = path.join(process.env.HOME || process.env.USERPROFILE, '.openclaw', 'workspace', 'TASKS.md');

    // Check if file exists
    if (!fs.existsSync(tasksPath)) {
      return NextResponse.json({ error: 'TASKS.md not found' }, { status: 404 });
    }

    // Read file content
    const content = fs.readFileSync(tasksPath, 'utf-8');

    // Parse markdown into columns
    const lines = content.split('\n');
    const tasks = {
      backlog: [] as string[],
      inProgress: [] as string[],
      done: [] as string[]
    };

    let currentColumn: 'backlog' | 'inProgress' | 'done' | null = null;

    for (const line of lines) {
      // Check for section headers
      if (line.trim().match(/^##\s+(Backlog|In Progress|Done)/i)) {
        currentColumn = line.trim().toLowerCase().replace(/\s+/g, '') as any;
        continue;
      }

      // Skip empty lines and non-task lines
      if (!line.trim() || !line.trim().match(/^- \[[ x]\]/)) {
        continue;
      }

      // Extract task text (remove the checkbox prefix)
      const taskText = line.replace(/^- \[[ x]\]\s*/, '').trim();

      if (currentColumn) {
        tasks[currentColumn].push(taskText);
      }
    }

    return NextResponse.json(tasks);
  } catch (error: any) {
    console.error('Error reading TASKS.md:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
