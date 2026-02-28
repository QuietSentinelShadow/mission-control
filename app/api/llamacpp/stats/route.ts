import { NextResponse } from 'next/server';

interface LlamaCPPModel {
  name: string;
  size: string;
  params: string;
  quant: string;
  active: boolean;
}

interface LlamaCPPStats {
  status: 'online' | 'offline';
  totalModels: number;
  activeModel: string;
  vramUsage: string;
  contextLength: string;
  queueDepth: number;
  apiEndpoint: string;
}

export async function GET() {
  try {
    const res = await fetch('http://127.0.0.1:8080/health', {
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const healthData = await res.json();

    // Parse model info from health endpoint
    const modelInfo = {
      name: healthData.model || 'Unknown',
      size: 'Loading...',
      params: '14B',
      quant: 'Q5_K_M',
      active: true,
    };

    // Try to get more detailed model info
    let vramUsage = 'Unknown';
    let contextLength = '4096';

    try {
      const propsRes = await fetch('http://127.0.0.1:8080/props', {
        signal: AbortSignal.timeout(3000),
      });
      if (propsRes.ok) {
        const propsData = await propsRes.json();
        contextLength = propsData.n_ctx || contextLength;
      }
    } catch (e) {
      // Use defaults if props endpoint fails
    }

    const stats: LlamaCPPStats = {
      status: 'online',
      totalModels: 1,
      activeModel: modelInfo.name,
      vramUsage: vramUsage,
      contextLength: contextLength,
      queueDepth: 0,
      apiEndpoint: 'http://127.0.0.1:8080',
    };

    const models: LlamaCPPModel[] = [modelInfo];

    return NextResponse.json({ stats, models });
  } catch (error) {
    console.error('Llama.cpp health check failed:', error);
    const offlineStats: LlamaCPPStats = {
      status: 'offline',
      totalModels: 0,
      activeModel: 'None',
      vramUsage: '0 GB',
      contextLength: 'N/A',
      queueDepth: 0,
      apiEndpoint: 'http://127.0.0.1:8080',
    };
    return NextResponse.json({ stats: offlineStats, models: [] }, { status: 503 });
  }
}
