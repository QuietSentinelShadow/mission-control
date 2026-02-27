import { NextResponse } from 'next/server';

const OLLAMA_API = 'http://127.0.0.1:11434';

interface OllamaModel {
  name: string;
  model: string;
  size: number;
  digest: string;
  details: {
    parameter_size: string;
    quantization_level: string;
    family: string;
  };
}

interface RunningModel {
  name: string;
  size: number;
  size_vram: number;
  context_length: number;
  expires_at: string;
}

async function fetchWithTimeout(url: string, timeout = 2000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

export async function GET() {
  try {
    // Check if Ollama is running
    const [modelsRes, runningRes] = await Promise.all([
      fetchWithTimeout(`${OLLAMA_API}/api/tags`),
      fetchWithTimeout(`${OLLAMA_API}/api/ps`)
    ]);

    if (!modelsRes.ok) {
      throw new Error('Ollama API not responding');
    }

    const modelsData = await modelsRes.json();
    const runningData = await runningRes.json();

    const models: OllamaModel[] = modelsData.models || [];
    const running: RunningModel[] = runningData.models || [];

    // Calculate stats
    const totalModels = models.length;
    const activeModel = running[0]?.name || 'None';
    const vramUsage = running[0]?.size_vram ? (running[0].size_vram / 1024 / 1024 / 1024).toFixed(1) : '0';
    const contextLength = running[0]?.context_length || 0;

    const stats = {
      status: 'online',
      totalModels,
      activeModel,
      vramUsage: `${vramUsage} GB`,
      contextLength: contextLength > 0 ? `${Math.round(contextLength / 1000)}k` : 'N/A',
      queueDepth: running.length,
      apiEndpoint: OLLAMA_API
    };

    // Format models for display
    const formattedModels = models.map((m, i) => ({
      id: String(i + 1),
      name: m.name,
      size: `${(m.size / 1024 / 1024 / 1024).toFixed(1)} GB`,
      params: m.details?.parameter_size || 'Unknown',
      quant: m.details?.quantization_level || 'Unknown',
      active: running.some(r => r.name === m.name)
    }));

    return NextResponse.json({ stats, models: formattedModels, running });
  } catch (error) {
    // Ollama not running
    return NextResponse.json({
      stats: {
        status: 'offline',
        totalModels: 0,
        activeModel: 'None',
        vramUsage: '0 GB',
        contextLength: 'N/A',
        queueDepth: 0,
        apiEndpoint: OLLAMA_API
      },
      models: [],
      running: { models: [] },
      error: 'Ollama not responding'
    });
  }
}
