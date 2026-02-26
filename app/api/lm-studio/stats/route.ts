import { NextResponse } from 'next/server';

// Mock data for now - will integrate with actual LM Studio API
export async function GET() {
  // In production, this would query:
  // 1. LM Studio API for current queue depth
  // 2. SQLite database for request history
  // 3. Calculate averages from recent requests

  const stats = {
    queueDepth: Math.floor(Math.random() * 5),
    avgResponseTime: 1.2 + Math.random() * 0.5,
    totalRequests: 147,
    alertActive: false,
    throttleActive: false
  };

  const requests = [
    { id: '1', timestamp: new Date().toISOString(), model: 'qwen3.5-35b', promptTokens: 234, completionTokens: 156, responseTime: 1.34, status: 'success' },
    { id: '2', timestamp: new Date(Date.now() - 60000).toISOString(), model: 'qwen3.5-35b', promptTokens: 512, completionTokens: 89, responseTime: 0.98, status: 'success' },
    { id: '3', timestamp: new Date(Date.now() - 120000).toISOString(), model: 'qwen3.5-35b', promptTokens: 1024, completionTokens: 423, responseTime: 2.15, status: 'success' },
    { id: '4', timestamp: new Date(Date.now() - 180000).toISOString(), model: 'qwen3.5-35b', promptTokens: 67, completionTokens: 234, responseTime: 1.67, status: 'success' },
    { id: '5', timestamp: new Date(Date.now() - 240000).toISOString(), model: 'qwen3.5-35b', promptTokens: 890, completionTokens: 312, responseTime: 1.89, status: 'success' },
  ];

  return NextResponse.json({ stats, requests });
}
