'use client';

import { useState, useEffect } from 'react';
import { 
  Activity, Server, Brain, Wifi, ChevronLeft, ChevronRight, 
  Settings, Terminal, StickyNote, Plus, Trash2, Cpu, Clock,
  AlertTriangle, Zap, Box, CheckSquare
} from 'lucide-react';

// Types
interface OllamaModel {
  id: string;
  name: string;
  size: string;
  params: string;
  quant: string;
  active: boolean;
}

interface OllamaStats {
  status: 'online' | 'offline';
  totalModels: number;
  activeModel: string;
  vramUsage: string;
  contextLength: string;
  queueDepth: number;
  apiEndpoint: string;
}

interface SystemStatus {
  name: string;
  status: 'online' | 'offline';
  icon: any;
  metrics: { label: string; value: string }[];
}

interface BotStatus {
  name: string
  role: string
  model: string
  status: 'online' | 'offline' | 'busy'
  lastSeen: string
  currentTask?: string
  metrics?: Record<string, string | number>
  isStale?: boolean
}

export default function MissionControl() {
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [mounted, setMounted] = useState(false);
  const [showLeftPanel, setShowLeftPanel] = useState(true);
  const [activeLeftTab, setActiveLeftTab] = useState<'settings' | 'notes' | 'logs' | 'tasks'>('logs');
  const [showLogPanel, setShowLogPanel] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30);
  
  // Bot status state
  const [botStatuses, setBotStatuses] = useState<BotStatus[]>([]);
  
  // Ollama state
  const [ollamaModels, setOllamaModels] = useState<OllamaModel[]>([]);
  const [ollamaStats, setOllamaStats] = useState<OllamaStats>({
    status: 'offline',
    totalModels: 0,
    activeModel: 'None',
    vramUsage: '0 GB',
    contextLength: 'N/A',
    queueDepth: 0,
    apiEndpoint: 'http://127.0.0.1:11434'
  });
  

  
  // Logs state
  const [logs, setLogs] = useState<{ timestamp: string; level: string; message: string }[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  // LLM Settings state
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [contextWindow, setContextWindow] = useState<number>(4096);
  const [modelLoading, setModelLoading] = useState(false);
  
  // Sticky notes
  const [stickyNotes, setStickyNotes] = useState([
    { id: 1, content: 'https://github.com/openclaw/openclaw/discussions/26283', timestamp: new Date().toISOString() }
  ]);
  const [newNote, setNewNote] = useState('');

  // Tasks state
  const [tasks, setTasks] = useState<any>(null);
  const [tasksLoading, setTasksLoading] = useState(false);

  // Systems to monitor (dynamic based on bot status)
  const getBotStatus = (name: string): 'online' | 'offline' => {
    const bot = botStatuses.find(b => b.name === name)
    if (!bot) return 'online'
    if (bot.isStale) return 'offline'
    return bot.status === 'busy' ? 'online' : bot.status
  }
  
  const getBotMetric = (name: string, key: string): string => {
    const bot = botStatuses.find(b => b.name === name)
    if (!bot) return '—'
    if (key === 'model') return bot.model
    if (key === 'role') return bot.role
    if (key === 'task') return bot.currentTask || 'Idle'
    if (bot.metrics && bot.metrics[key]) return String(bot.metrics[key])
    return '—'
  }

  const systems: SystemStatus[] = [
    { name: 'EyeZen', status: 'online', icon: Server, metrics: [{ label: 'Status', value: 'Running' }, { label: 'Port', value: '3000' }] },
    { name: 'EyeZen Prod', status: 'online', icon: Server, metrics: [{ label: 'Status', value: 'Deployed' }, { label: 'URL', value: 'Vercel' }] },
    { name: 'amtoc01bot', status: getBotStatus('amtoc01bot'), icon: Brain, metrics: [{ label: 'Model', value: getBotMetric('amtoc01bot', 'model') }, { label: 'Role', value: getBotMetric('amtoc01bot', 'role') }] },
    { name: 'amtoc02bot', status: getBotStatus('amtoc02bot'), icon: Brain, metrics: [{ label: 'Model', value: getBotMetric('amtoc02bot', 'model') }, { label: 'Role', value: getBotMetric('amtoc02bot', 'role') }] },
    { name: 'Ollama', status: ollamaStats.status, icon: Box, metrics: [{ label: 'Model', value: ollamaStats.activeModel }, { label: 'VRAM', value: ollamaStats.vramUsage }] },
    { name: 'GitHub', status: 'online', icon: Server, metrics: [{ label: 'Repos', value: '68 tracked' }, { label: 'Orgs', value: '3 active' }] },
    { name: 'Cron Jobs', status: 'online', icon: Clock, metrics: [{ label: 'Active', value: '3 jobs' }, { label: 'Next', value: '07:00' }] },
  ];

  // Set mounted and initial time
  useEffect(() => {
    setMounted(true);
    setCurrentTime(new Date());
  }, []);

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch bot statuses
  useEffect(() => {
    const fetchBotStatuses = async () => {
      try {
        const res = await fetch('/api/status');
        const data = await res.json();
        setBotStatuses(data.bots || []);
      } catch (e) {
        console.error('Failed to fetch bot statuses');
      }
    };
    fetchBotStatuses();
    const interval = setInterval(fetchBotStatuses, refreshInterval * 1000);
    return () => clearInterval(interval);
  }, [refreshInterval]);

  // Fetch Ollama stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/ollama/stats');
        const data = await res.json();
        setOllamaStats(data.stats);
        setOllamaModels(data.models);
      } catch (e) {
        console.error('Failed to fetch Ollama stats');
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, refreshInterval * 1000);
    return () => clearInterval(interval);
  }, [refreshInterval]);

  // Fetch tasks
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setTasksLoading(true);
        const res = await fetch('/api/tasks');
        const data = await res.json();
        setTasks(data);
      } catch (e) {
        console.error('Failed to fetch tasks');
      } finally {
        setTasksLoading(false);
      }
    };

    fetchTasks();
  }, []);


  // Fetch logs
  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setLogsLoading(true);
        const res = await fetch('/api/logs');
        const data = await res.json();
        setLogs(data.logs || []);
      } catch (e) {
        console.error('Failed to fetch logs');
      } finally {
        setLogsLoading(false);
      }
    };
    fetchLogs();
    const interval = setInterval(fetchLogs, 30000);
    return () => clearInterval(interval);
  }, []);

  // Load model function
  const loadModel = async (model: string, ctx: number) => {
    setModelLoading(true);
    try {
      const res = await fetch('/api/ollama/load', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, contextWindow: ctx })
      });
      if (res.ok) {
        const data = await res.json();
        alert(data.message);
        window.location.reload();
      } else {
        alert('Failed to load model');
      }
    } catch (e) {
      alert('Failed to load model. Is Ollama running?');
    } finally {
      setModelLoading(false);
    }
  };

  // Add sticky note
  const addNote = () => {
    if (!newNote.trim()) return;
    setStickyNotes([{ id: Date.now(), content: newNote, timestamp: new Date().toISOString() }, ...stickyNotes]);
    setNewNote('');
  };

  // Delete sticky note
  const deleteNote = (id: number) => {
    setStickyNotes(stickyNotes.filter(n => n.id !== id));
  };

  // Check if URL
  const isUrl = (text: string) => {
    try { new URL(text); return true; } catch { return false; }
  };

  // Kanban column rendering
  const renderKanbanColumn = (title: string, tasksList: string[], color: string) => (
    <div className={`${color} rounded-lg p-3 min-h-[200px]`}>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-2 h-2 rounded-full bg-white/50" />
        <span className="font-bold text-sm">{title}</span>
        <span className="text-xs text-white/70 ml-auto">{tasksList.length}</span>
      </div>
      <div className="space-y-2">
        {tasksList.map((task, i) => (
          <div key={i} className="bg-white/10 rounded p-2 text-xs text-white/90">
            {task}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-900 text-white flex">
      {/* LEFT PANEL */}
      {showLeftPanel && (
        <div className="w-80 bg-gray-800 border-r border-gray-700 flex flex-col flex-shrink-0">
          {/* Tab Buttons */}
          <div className="flex border-b border-gray-700">
            <button onClick={() => setActiveLeftTab('logs')} className={`flex-1 p-3 flex items-center justify-center gap-2 ${activeLeftTab === 'logs' ? 'bg-gray-700' : 'text-gray-400'}`}>
              <Terminal size={18} /> <span className="text-sm">Logs</span>
            </button>
            <button onClick={() => setActiveLeftTab('settings')} className={`flex-1 p-3 flex items-center justify-center gap-2 ${activeLeftTab === 'settings' ? 'bg-blue-600' : 'text-gray-400'}`}>
              <Settings size={18} /> <span className="text-sm">Settings</span>
            </button>
            <button onClick={() => setActiveLeftTab('notes')} className={`flex-1 p-3 flex items-center justify-center gap-2 ${activeLeftTab === 'notes' ? 'bg-yellow-600' : 'text-gray-400'}`}>
              <StickyNote size={18} /> <span className="text-sm">Notes</span>
            </button>
            <button onClick={() => setActiveLeftTab('tasks')} className={`flex-1 p-3 flex items-center justify-center gap-2 ${activeLeftTab === 'tasks' ? 'bg-purple-600' : 'text-gray-400'}`}>
              <CheckSquare size={18} /> <span className="text-sm">Tasks</span>
            </button>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto">
            {activeLeftTab === 'logs' && (
              <div className="p-3 font-mono text-xs space-y-1 overflow-y-auto" style={{maxHeight: 'calc(100vh - 200px)'}}>
                <div className="text-gray-400 mb-2">Gateway Logs</div>
                {logsLoading ? (
                  <div className="text-gray-500">Loading...</div>
                ) : logs.length === 0 ? (
                  <div className="text-gray-500">No logs available</div>
                ) : (
                  logs.slice().reverse().map((log, i) => (
                    <div key={i} className="py-0.5">
                      <span className="text-gray-500">[{log.timestamp}]</span>{' '}
                      <span className={
                        log.level === 'error' ? 'text-red-400' : 
                        log.level === 'warn' ? 'text-yellow-400' : 
                        log.level === 'debug' ? 'text-gray-500' : 'text-green-400'
                      }>[{log.level.toUpperCase()}]</span>{' '}
                      <span className="text-gray-300">{log.message}</span>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeLeftTab === 'settings' && (
              <div className="p-4 space-y-6">
                {/* Local LLM Settings */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold">Local LLM Settings</h3>
                    <span className={`text-xs px-2 py-0.5 rounded ${ollamaStats.status === 'online' ? 'bg-green-600' : 'bg-red-600'}`}>
                      Ollama: {ollamaStats.status}
                    </span>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Select Model</label>
                      <select
                        value={selectedModel}
                        onChange={(e) => setSelectedModel(e.target.value)}
                        disabled={modelLoading || ollamaStats.status !== 'online'}
                        className="w-full px-2 py-2 bg-gray-900 rounded text-xs border border-gray-700"
                      >
                        <option value="">Choose a model...</option>
                        {ollamaModels.map((model) => (
                          <option key={model.name} value={model.name}>
                            {model.name} ({model.size})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Context Window</label>
                      <div className="grid grid-cols-5 gap-1">
                        {[2048, 4096, 8192, 16384, 32768].map((ctx) => (
                          <button
                            key={ctx}
                            onClick={() => setContextWindow(ctx)}
                            className={`px-1 py-1 rounded text-xs ${
                              contextWindow === ctx ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'
                            }`}
                          >
                            {ctx >= 1024 ? `${ctx/1024}k` : ctx}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => loadModel(selectedModel, contextWindow)}
                        disabled={!selectedModel || modelLoading || ollamaStats.status !== 'online'}
                        className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded text-xs font-bold disabled:opacity-50"
                      >
                        {modelLoading ? 'Loading...' : 'Load Model'}
                      </button>
                      <button
                        onClick={async () => {
                          if (!selectedModel) return;
                          setModelLoading(true);
                          try {
                            const res = await fetch('/api/ollama/load', {
                              method: 'DELETE',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ model: selectedModel })
                            });
                            if (res.ok) {
                              alert('Model unloaded');
                              setSelectedModel('');
                              window.location.reload();
                            }
                          } finally {
                            setModelLoading(false);
                          }
                        }}
                        disabled={!selectedModel || modelLoading}
                        className="px-3 py-2 bg-red-600 hover:bg-red-700 rounded text-xs font-bold disabled:opacity-50"
                      >
                        Unload
                      </button>
                    </div>
                  </div>
                </div>

                <hr className="border-gray-700" />

                {/* Refresh Interval */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-300">Refresh Interval</label>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setRefreshInterval(Math.max(5, refreshInterval - 5))} className="p-2 bg-gray-700 hover:bg-gray-600 rounded text-xl">-</button>
                    <div className="flex-1 bg-gray-900 rounded px-3 py-2 text-center font-mono">{refreshInterval}s</div>
                    <button onClick={() => setRefreshInterval(Math.min(300, refreshInterval + 5))} className="p-2 bg-gray-700 hover:bg-gray-600 rounded text-xl">+</button>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[10, 30, 60].map(p => (
                      <button key={p} onClick={() => setRefreshInterval(p)} className={`px-2 py-1.5 rounded text-xs ${refreshInterval === p ? 'bg-blue-600' : 'bg-gray-700'}`}>{p}s</button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeLeftTab === 'notes' && (
              <div className="flex flex-col h-full">
                <div className="p-3 border-b border-gray-700">
                  <div className="flex gap-2">
                    <input value={newNote} onChange={(e) => setNewNote(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addNote()} placeholder="Add note..." className="flex-1 px-2 py-1.5 bg-gray-700 rounded text-xs" />
                    <button onClick={addNote} className="px-2 py-1.5 bg-yellow-600 hover:bg-yellow-700 rounded text-xs"><Plus size={14} /></button>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                  {stickyNotes.map(note => (
                    <div key={note.id} className="bg-yellow-50 border border-yellow-300 rounded p-2 text-xs text-gray-700 group">
                      <div className="flex justify-between">
                        {isUrl(note.content) ? <a href={note.content} target="_blank" className="text-blue-600 underline break-all">{note.content}</a> : <span>{note.content}</span>}
                        <button onClick={() => deleteNote(note.id)} className="opacity-0 group-hover:opacity-100 text-red-500"><Trash2 size={12} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeLeftTab === 'tasks' && (
              <div className="p-4">
                <div className="text-sm text-gray-400 mb-4">Project Tasks</div>
                {tasksLoading ? (
                  <div className="text-gray-500 text-center py-8">Loading...</div>
                ) : tasks ? (
                  <div className="space-y-4">
                    {renderKanbanColumn('Backlog', tasks.backlog || [], 'bg-gray-700')}
                    {renderKanbanColumn('In Progress', tasks.inProgress || [], 'bg-blue-600')}
                    {renderKanbanColumn('Done', tasks.done || [], 'bg-green-600')}
                  </div>
                ) : (
                  <div className="text-gray-500 text-center py-8">No tasks loaded</div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* COLLAPSE BUTTON */}
      <button onClick={() => setShowLeftPanel(!showLeftPanel)} className="absolute top-1/2 z-10 bg-gray-800 p-1 rounded-r border border-gray-700" style={{ left: showLeftPanel ? '320px' : '0' }}>
        {showLeftPanel ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
      </button>

      {/* MAIN CONTENT */}
      <div className={`flex-1 p-4 md:p-6 transition-all ${showLogPanel ? 'mr-80' : ''}`}>
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
                <Activity className="text-blue-400" /> Mission Control
              </h1>
              <p className="text-gray-400 text-sm">AMTOC01BOT Dashboard</p>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => setShowLogPanel(!showLogPanel)} className={`p-2 rounded ${showLogPanel ? 'bg-blue-600' : 'bg-gray-800'}`}>
                <Terminal size={18} />
              </button>
              <div className="text-right">
                <div className="text-xl font-mono">{currentTime?.toLocaleTimeString() || '...'}</div>
                <div className="text-xs text-gray-400">{currentTime?.toLocaleDateString() || '...'}</div>
              </div>
            </div>
          </div>

          {/* Status Bar */}
          <div className="bg-gray-800 rounded-lg p-3 flex items-center gap-3">
            <Wifi className="text-green-400" size={20} />
            <span>Connected to 192.168.1.160</span>
            <span className="ml-auto text-green-400">{systems.filter(s => s.status === 'online').length}/{systems.length} online</span>
          </div>
        </div>

        {/* Ollama Panel */}
        <div className="bg-gray-800 rounded-lg p-4 mb-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Box className="text-blue-400" /> Ollama Status
            </h2>
            <div className={`px-3 py-1 rounded text-xs font-bold ${ollamaStats.status === 'online' ? 'bg-green-600' : 'bg-red-600'}`}>
              {ollamaStats.status.toUpperCase()}
            </div>
          </div>
          
          <div className="grid grid-cols-5 gap-4 mb-4">
            <div className="bg-gray-900 rounded p-3">
              <div className="text-xs text-gray-400">Active Model</div>
              <div className="text-lg font-bold truncate" title={ollamaStats.activeModel}>{ollamaStats.activeModel || 'None'}</div>
            </div>
            <div className="bg-gray-900 rounded p-3">
              <div className="text-xs text-gray-400">VRAM</div>
              <div className="text-lg font-bold">{ollamaStats.vramUsage}</div>
            </div>
            <div className="bg-gray-900 rounded p-3">
              <div className="text-xs text-gray-400">Context</div>
              <div className="text-lg font-bold">{ollamaStats.contextLength}</div>
            </div>
            <div className="bg-gray-900 rounded p-3">
              <div className="text-xs text-gray-400">Models</div>
              <div className="text-lg font-bold">{ollamaStats.totalModels}</div>
            </div>
            <div className="bg-gray-900 rounded p-3">
              <div className="text-xs text-gray-400">API</div>
              <div className="text-sm font-mono text-gray-400">:11434</div>
            </div>
          </div>

          <div className="text-xs text-gray-500">
            Endpoint: {ollamaStats.apiEndpoint} | Refresh: {refreshInterval}s
          </div>
        </div>

        {/* Systems Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {systems.map((system, i) => (
            <div key={i} className="bg-gray-800 rounded-lg p-3 border border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <system.icon size={16} className="text-blue-400" />
                  <span className={`w-2 h-2 rounded-full ${system.status === 'online' ? 'bg-green-500' : 'bg-gray-400'}`} />
                  <span className="font-bold text-xs">{system.name}</span>
                </div>
              </div>
              {system.metrics.map((m, j) => (
                <div key={j} className="flex justify-between text-xs py-0.5">
                  <span className="text-gray-500">{m.label}</span>
                  <span className="font-mono">{m.value}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT PANEL - Model Details */}
      {showLogPanel && (
        <div className="fixed right-0 top-0 h-full w-80 bg-gray-950 border-l border-gray-700 flex flex-col">
          <div className="flex items-center justify-between p-3 border-b border-gray-700">
            <span className="font-bold text-sm">Ollama Models</span>
            <button onClick={() => setShowLogPanel(false)} className="text-gray-400 hover:text-white">✕</button>
          </div>
          <div className="flex-1 overflow-y-auto p-3 font-mono text-xs space-y-2">
            {ollamaModels.map((model, i) => (
              <div key={i} className={`rounded p-3 ${model.active ? 'bg-green-900/30 border border-green-700' : 'bg-gray-900'}`}>
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-gray-200">{model.name}</span>
                  {model.active && <span className="text-green-400 text-xs">● ACTIVE</span>}
                </div>
                <div className="grid grid-cols-2 gap-1 text-gray-400">
                  <div>Size: <span className="text-gray-300">{model.size}</span></div>
                  <div>Params: <span className="text-gray-300">{model.params}</span></div>
                  <div>Quant: <span className="text-gray-300">{model.quant}</span></div>
                </div>
              </div>
            ))}
            {ollamaModels.length === 0 && (
              <div className="text-gray-500 text-center py-8">No models available</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
