/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Terminal, Code, Database, Calendar, Clock, RefreshCw, Layers, ShieldCheck, ShieldAlert, Sparkles, AlertCircle } from 'lucide-react';
import { ExecutionLog } from '../types';

interface HistoryLogsProps {
  logs: ExecutionLog[];
  onRefresh: () => void;
  loading: boolean;
}

export default function HistoryLogs({ logs, onRefresh, loading }: HistoryLogsProps) {
  const [selectedLogId, setSelectedLogId] = useState<string | null>(logs[0]?.id || null);
  const [activeTab, setActiveTab] = useState<'data' | 'terminal'>('data');

  const selectedLog = logs.find(l => l.id === selectedLogId) || logs[0];

  const formatTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleString();
    } catch {
      return isoString;
    }
  };

  const getRelativeTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      const diffMs = Date.now() - d.getTime();
      const diffMin = Math.round(diffMs / 60000);
      if (diffMin < 1) return 'Just now';
      if (diffMin < 60) return `${diffMin}m ago`;
      const diffHrs = Math.round(diffMin / 60);
      if (diffHrs < 24) return `${diffHrs}h ago`;
      return d.toLocaleDateString();
    } catch {
      return isoString;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[580px]" id="history-logs-panel">
      {/* Sidebar List of Runs */}
      <div className="lg:col-span-4 bg-zinc-950 border border-zinc-800 rounded-sm flex flex-col overflow-hidden">
        <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/50">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center space-x-2 uppercase tracking-wider">
              <Database size={16} className="text-blue-400" />
              <span>API Execution logs</span>
            </h3>
            <p className="text-[10px] text-zinc-500 mt-0.5 font-mono">HISTORICAL SNAPSHOT PAYLOADS</p>
          </div>
          <button
            onClick={onRefresh}
            disabled={loading}
            className="p-1.5 bg-zinc-900 hover:bg-zinc-850 text-zinc-400 hover:text-white rounded-sm border border-zinc-800 transition active:scale-95 disabled:opacity-50"
            id="btn-refresh-history"
            title="Refresh logs"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto max-h-[500px] divide-y divide-zinc-850/50">
          {logs.length === 0 ? (
            <div className="p-8 text-center text-zinc-500 text-xs font-mono">
              <Database size={24} className="mx-auto mb-2 text-zinc-700" />
              <span>No execution logs found yet. Run an API workflow from the marketplace to generate historical logs!</span>
            </div>
          ) : (
            logs.map((log) => {
              const isSelected = selectedLog?.id === log.id;
              const isSuccess = log.status === 'success';

              return (
                <button
                  key={log.id}
                  onClick={() => { setSelectedLogId(log.id); }}
                  className={`w-full p-3.5 text-left transition flex items-start space-x-3 ${
                    isSelected ? 'bg-blue-600/10 border-l-4 border-blue-600' : 'hover:bg-zinc-900/40 border-l-4 border-transparent'
                  }`}
                  id={`btn-log-item-${log.id}`}
                >
                  <div className="mt-0.5">
                    {isSuccess ? (
                      <div className="w-5 h-5 bg-emerald-500/10 border border-emerald-500/30 rounded-sm flex items-center justify-center text-emerald-400">
                        <ShieldCheck size={12} />
                      </div>
                    ) : (
                      <div className="w-5 h-5 bg-rose-500/10 border border-rose-500/30 rounded-sm flex items-center justify-center text-rose-400">
                        <ShieldAlert size={12} />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-1">
                      <span className="text-xs font-bold text-white truncate pr-2 tracking-tight">{log.workflowName}</span>
                      <span className="text-[9px] font-semibold text-zinc-500 shrink-0 font-mono">{getRelativeTime(log.runTime)}</span>
                    </div>

                    <div className="flex items-center space-x-2 text-[10px]">
                      <span className={`px-1.5 py-0.5 rounded-sm font-bold font-mono text-[9px] ${
                        log.trigger === 'schedule' 
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' 
                          : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                      }`}>
                        {log.trigger.toUpperCase()}
                      </span>
                      <span className="text-zinc-500 font-mono text-[9px]">{log.stepsExecuted}/{log.totalSteps} steps</span>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Main Terminal and Output Details Viewer */}
      <div className="lg:col-span-8 bg-zinc-950 border border-zinc-800 rounded-sm flex flex-col overflow-hidden">
        {selectedLog ? (
          <>
            {/* Header */}
            <div className="p-4 border-b border-zinc-800 bg-zinc-950/50 flex flex-wrap justify-between items-center gap-4">
              <div>
                <span className="text-[9px] font-bold tracking-widest text-zinc-500 uppercase font-mono">EXECUTION ID: {selectedLog.id}</span>
                <h4 className="text-sm font-bold text-white mt-0.5 tracking-tight">{selectedLog.workflowName}</h4>
                <div className="flex items-center space-x-3 text-[10px] text-zinc-500 mt-1">
                  <span className="flex items-center space-x-1">
                    <Calendar size={11} className="text-zinc-600" />
                    <span className="font-mono">{formatTime(selectedLog.runTime)}</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <Clock size={11} className="text-zinc-600" />
                    <span className="font-mono">{selectedLog.trigger === 'schedule' ? 'Cron Trigger' : 'Manual Trigger'}</span>
                  </span>
                </div>
              </div>

              {/* Badges and tabs */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setActiveTab('data')}
                  className={`flex items-center space-x-1 px-3 py-1.5 rounded-sm text-xs font-semibold border transition ${
                    activeTab === 'data'
                      ? 'bg-blue-600 text-white border-blue-500'
                      : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                  id="tab-history-data"
                >
                  <Code size={12} />
                  <span>AI Structured Data</span>
                </button>
                <button
                  onClick={() => setActiveTab('terminal')}
                  className={`flex items-center space-x-1 px-3 py-1.5 rounded-sm text-xs font-semibold border transition ${
                    activeTab === 'terminal'
                      ? 'bg-black text-emerald-400 border-zinc-800 font-mono shadow-inner shadow-black/80'
                      : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                  id="tab-history-terminal"
                >
                  <Terminal size={12} />
                  <span>Emulation Log</span>
                </button>
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 p-5 min-h-[380px] flex flex-col bg-zinc-950/20 overflow-y-auto max-h-[500px]">
              {activeTab === 'data' ? (
                <div className="flex flex-col flex-1 h-full">
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center space-x-2 text-[10px] text-zinc-400">
                      <Sparkles size={12} className="text-blue-400" />
                      <span>Gemini AI Parse Result</span>
                    </div>
                    {selectedLog.extractedData?._info && (
                      <span className="text-[9px] font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-sm flex items-center space-x-1">
                        <AlertCircle size={9} />
                        <span>Mock fallback demo mode (No Gemini API Key)</span>
                      </span>
                    )}
                  </div>

                  {selectedLog.status === 'failed' && !selectedLog.extractedData ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 border border-rose-500/20 bg-rose-500/5 rounded-sm text-center">
                      <AlertCircle size={32} className="text-rose-400 mb-2" />
                      <h4 className="text-xs font-bold text-rose-300">Headless Pipeline Execution Failure</h4>
                      <p className="text-[10px] text-zinc-500 max-w-sm mt-1 leading-relaxed">The automation failed to replay the steps accurately. View the "Emulation Log" terminal tab for detailed debugging details and visual errors.</p>
                    </div>
                  ) : (
                    <pre className="flex-1 bg-black border border-zinc-850 p-4 rounded-sm font-mono text-xs text-blue-200 overflow-x-auto shadow-inner leading-relaxed">
                      <code>{JSON.stringify(selectedLog.extractedData || {}, null, 2)}</code>
                    </pre>
                  )}
                </div>
              ) : (
                <div className="flex flex-col flex-1 h-full bg-black rounded-sm border border-zinc-850 shadow-inner p-4 font-mono text-xs text-zinc-300 select-all overflow-x-auto">
                  <div className="flex justify-between items-center text-zinc-500 text-[10px] border-b border-zinc-900 pb-2 mb-3">
                    <span>SHELL PIPELINE OUTPUT</span>
                    <span className="text-emerald-500/80">● RUNNING IN CHROMIUM CONTAINER</span>
                  </div>
                  <div className="space-y-1.5">
                    {selectedLog.logs.map((logLine, idx) => {
                      let color = 'text-zinc-300';
                      const safeLine = logLine || '';
                      if (safeLine.includes('[CLICK]')) color = 'text-blue-400 font-semibold';
                      else if (safeLine.includes('[TYPE]')) color = 'text-amber-400 font-semibold';
                      else if (safeLine.includes('[NAVIGATE]')) color = 'text-sky-400 font-semibold';
                      else if (safeLine.includes('CRITICAL ERROR') || safeLine.includes('FAILED')) color = 'text-rose-400 font-bold';
                      else if (safeLine.includes('SUCCESS') || safeLine.includes('completed')) color = 'text-emerald-400 font-semibold';

                      return (
                        <div key={idx} className={color}>
                          {logLine}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col justify-center items-center p-8 text-zinc-500">
            <Layers size={36} className="text-zinc-700 mb-2 animate-pulse" />
            <span className="text-xs">Select an execution log from the sidebar list to inspect results.</span>
          </div>
        )}
      </div>
    </div>
  );
}
