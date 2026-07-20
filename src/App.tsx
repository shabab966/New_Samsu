/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import Header from './components/Header';
import Marketplace from './components/Marketplace';
import Recorder from './components/Recorder';
import HistoryLogs from './components/HistoryLogs';
import { Workflow, ExecutionLog, User } from './types';
import { Compass, Activity, Database, Sparkles, AlertCircle } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'marketplace' | 'recorder' | 'history'>('marketplace');
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [history, setHistory] = useState<ExecutionLog[]>([]);
  const [editingWorkflow, setEditingWorkflow] = useState<Workflow | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [runningWorkflowId, setRunningWorkflowId] = useState<string | null>(null);
  const [runningLogLines, setRunningLogLines] = useState<string[]>([]);

  // Fetch initial profile
  useEffect(() => {
    const fetchProfile = async () => {
      if (!token) return;
      try {
        const res = await fetch('/api/auth/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        } else {
          // Token expired
          localStorage.removeItem('token');
          setToken(null);
        }
      } catch (err) {
        console.error('Error fetching auth state', err);
      }
    };

    fetchProfile();
  }, [token]);

  // Fetch workflows and run logs
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const headers: any = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      try {
        const [wfRes, histRes] = await Promise.all([
          fetch('/api/workflows', { headers }),
          fetch('/api/history', { headers })
        ]);

        if (wfRes.ok) {
          const wfs = await wfRes.json();
          setWorkflows(wfs);
        }
        if (histRes.ok) {
          const hist = await histRes.json();
          setHistory(hist);
        }
      } catch (err) {
        console.error('Error fetching dashboard datasets', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token, user]);

  const handleLoginSuccess = (newUser: User, newToken: string) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setUser(newUser);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  // Run a workflow (Perfect replay stepper simulator)
  const handleRunWorkflow = async (id: string) => {
    setRunningWorkflowId(id);
    setRunningLogLines(['[Initializing] Spinning up headless container...']);

    const workflow = workflows.find(w => w.id === id);
    if (!workflow) return;

    // Simulate real logs dynamically to show an incredible high-fidelity stepper in the UI!
    const mockLogs = [
      `[Headless chromium-node-01] Booting context...`,
      `[Navigate] Loading initial URL: "${workflow.startUrl}"...`,
      `[Navigate] Successfully loaded HTML. HTTP 200 OK.`,
    ];

    // Add each step to mock logs
    workflow.steps.forEach((step, idx) => {
      mockLogs.push(`[Step ${idx + 1}/${workflow.steps.length}] Replaying type: ${step.type.toUpperCase()}`);
      if (step.selector) mockLogs.push(`[Step ${idx + 1}/${workflow.steps.length}] Found selector "${step.selector}". Simulating user interaction.`);
      if (step.value) mockLogs.push(`[Step ${idx + 1}/${workflow.steps.length}] Dispatched keypress value: "${step.value}".`);
    });

    mockLogs.push(`[Snapshot] HTML DOM snapshot taken. Layout parsing active.`);
    mockLogs.push(`[Scrape] Initializing Google Gemini AI Semantic extraction pipeline...`);
    mockLogs.push(`[Gemini API] Querying gemini-3.5-flash with structured guidelines...`);

    let progressIndex = 0;
    const logInterval = setInterval(() => {
      if (progressIndex < mockLogs.length) {
        setRunningLogLines(prev => [...prev, mockLogs[progressIndex]]);
        progressIndex++;
      } else {
        clearInterval(logInterval);
      }
    }, 400);

    const headers: any = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const res = await fetch(`/api/workflows/${id}/run`, {
        method: 'POST',
        headers
      });

      const data = await res.json();
      
      // Stop logging interval and set final actual logs from server
      clearInterval(logInterval);

      if (res.ok) {
        setRunningLogLines(data.logs || ['Execution completed successfully.']);
        // Add a slight delay so they see the success output before closing
        setTimeout(() => {
          setRunningWorkflowId(null);
          // Refetch history logs
          const fetchLatestHistory = async () => {
            const histRes = await fetch('/api/history', { headers });
            if (histRes.ok) {
              const hist = await histRes.json();
              setHistory(hist);
              setActiveTab('history'); // Switch to history so they see the result!
            }
          };
          fetchLatestHistory();
        }, 1000);
      } else {
        throw new Error(data.error || 'Automation failed');
      }
    } catch (err: any) {
      clearInterval(logInterval);
      setRunningLogLines(prev => [...prev, `[CRITICAL ERROR] Execution failed: ${err.message}`]);
      setTimeout(() => {
        setRunningWorkflowId(null);
      }, 3000);
    }
  };

  // Create/Save custom workflow
  const handleSaveWorkflow = async (newWorkflow: Omit<Workflow, 'id' | 'createdBy' | 'createdAt' | 'lastRunStatus'>) => {
    setSaving(true);
    const headers: any = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const res = await fetch('/api/workflows', {
        method: 'POST',
        headers,
        body: JSON.stringify(newWorkflow)
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to save workflow');
      }

      const created = await res.json();
      setWorkflows(prev => [created, ...prev]);
    } catch (err) {
      console.error(err);
      throw err;
    } finally {
      setSaving(false);
    }
  };

  // Update custom workflow (creates new version)
  const handleUpdateWorkflow = async (id: string, updatedWorkflow: Partial<Workflow> & { changeSummary?: string }) => {
    setSaving(true);
    const headers: any = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const res = await fetch(`/api/workflows/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(updatedWorkflow)
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to update workflow');
      }

      const updated = await res.json();
      setWorkflows(prev => prev.map(w => w.id === id ? updated : w));
      setEditingWorkflow(null);
      setActiveTab('marketplace');
    } catch (err) {
      console.error(err);
      throw err;
    } finally {
      setSaving(false);
    }
  };

  // Delete a workflow
  const handleDeleteWorkflow = async (id: string) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this custom API workflow? This will also remove all associated run history.');
    if (!confirmDelete) return;

    const headers: any = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const res = await fetch(`/api/workflows/${id}`, {
        method: 'DELETE',
        headers
      });

      if (res.ok) {
        setWorkflows(workflows.filter(w => w.id !== id));
        setHistory(history.filter(h => h.workflowId !== id));
      } else {
        const errData = await res.json();
        alert(errData.error || 'Failed to delete workflow');
      }
    } catch (err) {
      console.error('Error deleting workflow', err);
    }
  };

  // Update schedule
  const handleUpdateSchedule = async (id: string, newSchedule: string) => {
    const headers: any = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const res = await fetch(`/api/workflows/${id}/schedule`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ schedule: newSchedule })
      });

      if (res.ok) {
        setWorkflows(workflows.map(w => w.id === id ? { ...w, schedule: newSchedule } : w));
      } else {
        const errData = await res.json();
        alert(errData.error || 'Failed to update schedule');
      }
    } catch (err) {
      console.error('Error updating schedule', err);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-400 flex flex-col font-sans selection:bg-blue-500/30 selection:text-blue-200">
      {/* Sharp grid background pattern or clean look */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#141414_1px,transparent_1px),linear-gradient(to_bottom,#141414_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none"></div>

      {/* Shared Header Component */}
      <Header
        user={user}
        onLoginSuccess={handleLoginSuccess}
        onLogout={handleLogout}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        workflowCount={workflows.length}
        historyCount={history.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {/* Banner Announcement */}
        <div className="mb-6 bg-zinc-900/40 border border-zinc-800 rounded-md p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm relative overflow-hidden">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 rounded-sm bg-blue-900/20 border border-blue-800/40 flex items-center justify-center shrink-0 mt-0.5">
              <Sparkles size={15} className="text-blue-400" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Welcome to AI Browser Automation</h3>
              <p className="text-[10.5px] text-zinc-400 mt-1 leading-normal max-w-2xl">
                This sandbox simulates replaying browser clicks inside a hidden Chrome viewport, using <strong>Google Gemini AI</strong> to parse the raw HTML into structured JSON. No brittle CSS selectors are required!
              </p>
            </div>
          </div>
          {!user && (
            <div className="text-[10px] text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-sm flex items-center space-x-1.5 shrink-0 self-start sm:self-center font-semibold">
              <AlertCircle size={12} />
              <span>Login to save custom APIs with timers!</span>
            </div>
          )}
        </div>

        {/* Tab switcher renderer */}
        {activeTab === 'marketplace' && (
          <Marketplace
            workflows={workflows}
            user={user}
            onRunWorkflow={handleRunWorkflow}
            onDeleteWorkflow={handleDeleteWorkflow}
            onUpdateSchedule={handleUpdateSchedule}
            onEditWorkflow={(workflow) => {
              setEditingWorkflow(workflow);
              setActiveTab('recorder');
            }}
            runningWorkflowId={runningWorkflowId}
            runningLogLines={runningLogLines}
          />
        )}

        {activeTab === 'recorder' && (
          <Recorder
            user={user}
            onSaveWorkflow={handleSaveWorkflow}
            saving={saving}
            editingWorkflow={editingWorkflow}
            onUpdateWorkflow={handleUpdateWorkflow}
            onCancelEdit={() => {
              setEditingWorkflow(null);
              setActiveTab('marketplace');
            }}
          />
        )}

        {activeTab === 'history' && (
          <HistoryLogs
            logs={history}
            onRefresh={async () => {
              setLoading(true);
              const headers: any = {};
              if (token) headers['Authorization'] = `Bearer ${token}`;
              try {
                const histRes = await fetch('/api/history', { headers });
                if (histRes.ok) {
                  const hist = await histRes.json();
                  setHistory(hist);
                }
              } catch (err) {
                console.error(err);
              } finally {
                setLoading(false);
              }
            }}
            loading={loading}
          />
        )}
      </main>

      {/* Footer credits */}
      <footer className="bg-slate-950 border-t border-slate-900 py-6 text-center text-[10px] font-mono text-slate-600 select-none shrink-0">
        <div className="max-w-7xl mx-auto px-4">
          <p>© 2026 Browser API Recorder & Marketplace • Powered by Gemini-3.5-Flash & Puppeteer Emulation Engine</p>
        </div>
      </footer>
    </div>
  );
}
