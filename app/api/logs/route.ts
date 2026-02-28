import { NextResponse } from 'next/server';
import { readFileSync, existsSync } from 'fs';
import { homedir } from 'os';
import path from 'path';

interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
}

export async function GET() {
  try {
    const logPath = path.join(homedir(), '.openclaw', 'logs', 'gateway.log');
    
    if (!existsSync(logPath)) {
      return NextResponse.json({ logs: [], error: 'Log file not found' });
    }

    const content = readFileSync(logPath, 'utf-8');
    const lines = content.trim().split('\n').slice(-100);
    
    const logs: LogEntry[] = lines.map(line => {
      const timestampMatch = line.match(/\[([^\]]+)\]\s*\[([^\]]+)\]\s*(.*)/);
      
      if (timestampMatch) {
        return {
          timestamp: timestampMatch[1],
          level: timestampMatch[2].toLowerCase(),
          message: timestampMatch[3]
        };
      }
      
      return {
        timestamp: new Date().toISOString(),
        level: 'info',
        message: line
      };
    });

    return NextResponse.json({ logs });
  } catch (error) {
    console.error('Failed to read logs:', error);
    return NextResponse.json({ logs: [], error: 'Failed to read log file' });
  }
}
