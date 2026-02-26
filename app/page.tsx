'use client';

import { useState, useEffect } from 'react';
import { 
  Activity, Server, Brain, Wifi, ChevronLeft, ChevronRight, 
  Settings, Terminal, StickyNote, Plus, Trash2, Cpu, Clock,
  AlertTriangle, Zap
} from 'lucide-react';

// Types
interface LMRequest {
  id: string;
  timestamp: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  responseTime: number;
  status: 'success' | 'error';
}

interface LMStats {
  queueDepth: number;
  avgResponseTime: number;
  totalRequests: number;
  alertActive: boolean;
  throttleActive: boolean;
}

interface SystemStatus {
  name: string;
  status: 'online' | 'offline';
  icon: any;
  metrics: { label: string; value: string }[];
}

export default function MissionControl() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showLeftPanel, setShowLeftPanel] = useState(true);
  const [activeLeftTab, setActiveLeftTab] = useState<'settings' | 'notes' | 'logs'>('logs');
  const [showLogPanel, setShowLogPanel] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30);
  
  // LM Studio state
  const [lmRequests, setLmRequests] = useState<LMRequest[]>([]);
  const [lmStats, setLmStats] = useState<LMStats>({
    queueDepth: 0,
    avgResponseTime: 0,
    totalRequests: 0,
    alertActive: false,
    throttleActive: false
  });
  
  // Sticky notes
  const [stickyNotes, setStickyNotes] = useState([
    { id: 1, content: 'https://github.com/openclaw/openclaw/discussions/26283', timestamp: new Date().toISOString() }
  ]);
  const [newNote, setNewNote] = useState('');

  // Systems to monitor
  const systems: SystemStatus[] = [
    { name: 'EyeZen', status: 'online', icon: Server, metrics: [{ label: 'Status', value: 'Running' }, { label: 'Port', value: '3000' }] },
    { name: 'EyeZen Prod', status: 'online', icon: Server, metrics: [{ label: 'Status', value: 'Deployed' }, { label: 'URL', value: 'Vercel' }] },
    { name: 'amtoc01bot', status: 'online', icon: Brain, metrics: [{ label: 'Model', value: 'zai/glm-5' }, { label: 'Status', value: 'Active' }] },
    { name: 'LM Studio', status: 'online', icon: Cpu, metrics: [{ label: 'Model', value: 'qwen3.5-35b' }, { label: 'Port', value: '1234' }] },
    { name: 'GitHub', status: 'online', icon: Server, metrics: [{ label: 'Repos', value: '2 active' }, { label: 'Org', value: 'QuietSentinelShadow' }] },
    { name: 'Cron Jobs', status: 'online', icon: Clock, metrics: [{ label: 'Active', value: '4 jobs' }, { label: 'Next', value: '7:00 AM' }] },
  ];

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch LM Studio stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/lm-studio/stats');
        const data = await res.json();
        setLmStats(data.stats);
        setLmRequests(data.requests);
      } catch (e) {
        console.error('Failed to fetch LM stats');
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, refreshInterval * 1000);
    return () => clearInterval(interval);
  }, [refreshInterval]);

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
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto">
            {activeLeftTab === 'logs' && (
              <div className="p-3 font-mono text-xs space-y-1">
                <div className="text-gray-400 mb-2">OpenClaw Logs</div>
                {lmRequests.slice(0, 20).map((req, i) => (
                  <div key={i} className="flex gap-2">
                    <span className="text-gray-500">[{req.timestamp.split('T')[1]?.slice(0, 8)}]</span>
                    <span className={req.status === 'success' ? 'text-green-400' : 'text-red-400'}>[{req.status}]</span>
                    <span className="text-gray-300">{req.model}</span>
                  </div>
                ))}
              </div>
            )}

            {activeLeftTab === 'settings' && (
              <div className="p-4 space-y-6">
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-300">Refresh Interval</label>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setRefreshInterval(Math.max(5, refreshInterval - 5))} className="p-2 bg-gray-700 hover:bg-gray-600 rounded text-xl">-</button>
                    <div className="flex-1 bg-gray-900 rounded px-3 py-2 text-center font-mono">{refreshInterval}s</div>
                    <button onClick={() => setRefreshInterval(Math.min(300, refreshInterval + 5))} className="p-2 bg-gray-700 hover:bg-gray-600 rounded text-xl">+</button>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[10, 30, 60].map(p => (
                    <button key={p} onClick={() => setRefreshInterval(p)} className={`px-2 py-1.5 rounded text-xs ${refreshInterval === p ? 'bg-blue-600' : 'bg-gray-700'}`}>{p}s</button>
                  ))}
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
                <div className="text-xl font-mono">{currentTime.toLocaleTimeString()}</div>
                <div className="text-xs text-gray-400">{currentTime.toLocaleDateString()}</div>
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

        {/* LM Studio Panel */}
        <div className="bg-gray-800 rounded-lg p-4 mb-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Cpu className="text-blue-400" /> LM Studio Queue Monitor
            </h2>
            <div className="flex gap-2">
              {lmStats.alertActive && <span className="px-2 py-1 bg-yellow-600 rounded text-xs">⚠️ ALERT</span>}
              {lmStats.throttleActive && <span className="px-2 py-1 bg-red-600 rounded text-xs">🛑 THROTTLED</span>}
            </div>
          </div>
          
          <div className="grid grid-cols-4 gap-4 mb-4">
            <div className="bg-gray-900 rounded p-3">
              <div className="text-xs text-gray-400">Queue Depth</div>
              <div className="text-2xl font-bold">{lmStats.queueDepth}</div>
            </div>
            <div className="bg-gray-900 rounded p-3">
              <div className="text-xs text-gray-400">Avg Response</div>
              <div className="text-2xl font-bold">{lmStats.avgResponseTime.toFixed(1)}s</div>
            </div>
            <div className="bg-gray-900 rounded p-3">
              <div className="text-xs text-gray-400">Total Requests</div>
              <div className="text-2xl font-bold">{lmStats.totalRequests}</div>
            </div>
            <div className="bg-gray-900 rounded p-3">
              <div className="text-xs text-gray-400">Status</div>
              <div className="text-2xl font-bold text-green-400">OK</div>
            </div>
          </div>

          <div className="text-xs text-gray-500">
            Thresholds: Alert @ depth &gt; 10 or response &gt; 3s | Throttle @ depth &gt; 20 or response &gt; 5s
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

      {/* RIGHT PANEL - Detailed Logs */}
      {showLogPanel && (
        <div className="fixed right-0 top-0 h-full w-80 bg-gray-950 border-l border-gray-700 flex flex-col">
          <div className="flex items-center justify-between p-3 border-b border-gray-700">
            <span className="font-bold text-sm">LM Studio Requests</span>
            <button onClick={() => setShowLogPanel(false)} className="text-gray-400 hover:text-white">✕</button>
          </div>
          <div className="flex-1 overflow-y-auto p-3 font-mono text-xs space-y-2">
            {lmRequests.slice(0, 50).map((req, i) => (
              <div key={i} className="bg-gray-900 rounded p-2">
                <div className="flex justify-between text-gray-400">
                  <span>{req.timestamp.split('T')[1]?.slice(0, 8)}</span>
                  <span className={req.status === 'success' ? 'text-green-400' : 'text-red-400'}>{req.status}</span>
                </div>
                <div className="text-gray-300 truncate">{req.model}</div>
                <div className="text-gray-500">{req.promptTokens}→{req.completionTokens} tokens | {req.responseTime.toFixed(2)}s</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
