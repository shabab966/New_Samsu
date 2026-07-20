/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Play, Calendar, ShieldCheck, ShieldAlert, Sparkles, Clock, Trash2, ListChecks, CheckCircle2, Search, ArrowRight, Compass, History, Edit3 } from 'lucide-react';
import { Workflow, User } from '../types';

interface MarketplaceProps {
  workflows: Workflow[];
  user: User | null;
  onRunWorkflow: (id: string) => Promise<void>;
  onDeleteWorkflow: (id: string) => Promise<void>;
  onUpdateSchedule: (id: string, schedule: string) => Promise<void>;
  onEditWorkflow: (workflow: Workflow) => void;
  runningWorkflowId: string | null;
  runningLogLines: string[];
}

export default function Marketplace({
  workflows,
  user,
  onRunWorkflow,
  onDeleteWorkflow,
  onUpdateSchedule,
  onEditWorkflow,
  runningWorkflowId,
  runningLogLines
}: MarketplaceProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'system' | 'custom'>('all');
  const [expandedWorkflowId, setExpandedWorkflowId] = useState<string | null>(null);
  const [cardTabs, setCardTabs] = useState<Record<string, 'steps' | 'history'>>({});
  const [expandedHistoryVersion, setExpandedHistoryVersion] = useState<Record<string, number | null>>({});

  const filteredWorkflows = workflows.filter(w => {
    const matchesSearch = ((w.name || '').toLowerCase().includes((searchQuery || '').toLowerCase())) || 
                          ((w.description || '').toLowerCase().includes((searchQuery || '').toLowerCase()));
    
    if (filterType === 'all') return matchesSearch;
    if (filterType === 'system') return matchesSearch && w.createdBy === 'system';
    if (filterType === 'custom') return matchesSearch && w.createdBy !== 'system';
    return matchesSearch;
  });

  const getScheduleLabel = (sched?: string) => {
    if (!sched || sched === 'none') return 'No Schedule';
    if (sched === '1m') return 'Every 1 min';
    if (sched === '5m') return 'Every 5 min';
    if (sched === '1h') return 'Every 1 hour';
    if (sched === '24h') return 'Every 24 hours';
    return sched;
  };

  return (
    <div className="space-y-6" id="marketplace-panel">
      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-950 p-4 border border-zinc-800 rounded-sm">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Search API workflows (e.g. Price tracker, job portal)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-sm pl-10 pr-4 py-2 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-700 transition"
            id="input-search-marketplace"
          />
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-sm text-xs font-semibold border transition ${
              filterType === 'all'
                ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                : 'bg-zinc-900/40 border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
            id="btn-filter-all"
          >
            All Workflows
          </button>
          <button
            onClick={() => setFilterType('system')}
            className={`px-3 py-1.5 rounded-sm text-xs font-semibold border transition ${
              filterType === 'system'
                ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                : 'bg-zinc-900/40 border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
            id="btn-filter-system"
          >
            Marketplace Built-ins
          </button>
          <button
            onClick={() => setFilterType('custom')}
            className={`px-3 py-1.5 rounded-sm text-xs font-semibold border transition relative ${
              filterType === 'custom'
                ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                : 'bg-zinc-900/40 border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
            id="btn-filter-custom"
          >
            My Custom APIs
            {!user && <span className="absolute -top-1.5 -right-1.5 w-2 h-2 bg-blue-500 rounded-full animate-ping"></span>}
          </button>
        </div>
      </div>

      {/* Grid of Workflows */}
      {filteredWorkflows.length === 0 ? (
        <div className="p-16 text-center bg-zinc-950 border border-zinc-800 rounded-sm">
          <Compass size={36} className="mx-auto text-zinc-700 mb-2" />
          <h4 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">No scraping APIs found</h4>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto mt-1 leading-relaxed">Try adjusting your filters or use the "Built-in Browser Recorder" tab to record your own custom headless browser scrape in under 60 seconds!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredWorkflows.map((workflow) => {
            const isExpanded = expandedWorkflowId === workflow.id;
            const canDelete = workflow.createdBy === user?.id && workflow.createdBy !== 'system';
            const isRunning = runningWorkflowId === workflow.id;

            return (
              <div
                key={workflow.id}
                className={`bg-[#0c0c0c] border rounded-sm overflow-hidden hover:border-zinc-700 transition-all duration-300 relative ${
                  isExpanded ? 'border-blue-600/60 shadow-lg' : 'border-zinc-800'
                }`}
                id={`workflow-card-${workflow.id}`}
              >
                {/* Accent indicator line */}
                <div className={`h-1 w-full ${workflow.createdBy === 'system' ? 'bg-blue-600' : 'bg-emerald-500'}`}></div>

                <div className="p-5">
                  <div className="flex justify-between items-start gap-3">
                    <div>
                      <span className={`text-[9px] font-bold tracking-widest uppercase px-1.5 py-0.5 rounded-sm ${
                        workflow.createdBy === 'system' 
                          ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' 
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      }`}>
                        {workflow.createdBy === 'system' ? 'SHARED ENDPOINT' : 'MY CUSTOM'}
                      </span>
                      <span className="text-[9px] font-bold tracking-widest uppercase px-1.5 py-0.5 rounded-sm bg-zinc-900 text-zinc-400 border border-zinc-800 ml-1.5 font-mono" title="Workflow revision version">
                        v{workflow.version || 1}
                      </span>
                      <h4 className="text-sm font-bold text-white mt-2 flex items-center space-x-1.5 tracking-tight">
                        <span>{workflow.name}</span>
                      </h4>
                    </div>

                    <div className="flex items-center space-x-1 shrink-0">
                      {/* Trash Button */}
                      {canDelete && (
                        <button
                          onClick={() => onDeleteWorkflow(workflow.id)}
                          className="p-1.5 text-zinc-500 hover:text-rose-400 rounded-sm hover:bg-zinc-900 transition"
                          title="Delete API"
                          id={`btn-delete-workflow-${workflow.id}`}
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-zinc-400 mt-2 leading-relaxed min-h-[40px]">{workflow.description}</p>

                  <div className="flex flex-wrap items-center gap-3 text-[10px] text-zinc-500 mt-4 border-t border-zinc-800/80 pt-4">
                    <span className="flex items-center space-x-1">
                      <Clock size={11} className="text-zinc-600" />
                      <span className="font-mono">Start: {workflow.startUrl}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <ListChecks size={11} className="text-zinc-600" />
                      <span className="font-mono">{workflow.steps.length} Replay Steps</span>
                    </span>
                  </div>

                  {/* Actions Section */}
                  <div className="flex items-center justify-between mt-5 pt-4 border-t border-zinc-800/80 gap-4">
                    {/* Schedule Selector */}
                    <div className="flex items-center space-x-1.5">
                      <Clock size={12} className="text-blue-400" />
                      <select
                        value={workflow.schedule || 'none'}
                        onChange={(e) => onUpdateSchedule(workflow.id, e.target.value)}
                        disabled={!user && workflow.createdBy !== 'system'}
                        className="bg-zinc-900 border border-zinc-800 rounded-sm text-[10px] text-zinc-300 px-2 py-1 font-mono focus:outline-none focus:border-zinc-700 transition"
                        title={user ? 'Configure timer' : 'Sign in to configure scheduling'}
                        id={`select-schedule-${workflow.id}`}
                      >
                        <option value="none">No Timer</option>
                        <option value="1m">Every 1 min</option>
                        <option value="5m">Every 5 min</option>
                        <option value="1h">Every 1 hour</option>
                        <option value="24h">Every 24 hours</option>
                      </select>
                    </div>

                    {/* Trigger Button */}
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setExpandedWorkflowId(isExpanded ? null : workflow.id)}
                        className="px-2.5 py-1.5 bg-zinc-900 hover:bg-zinc-850 text-zinc-300 rounded-sm text-[10px] font-semibold border border-zinc-800 transition"
                        id={`btn-expand-steps-${workflow.id}`}
                      >
                        {isExpanded ? 'Hide Steps' : 'View Steps'}
                      </button>

                      {(workflow.createdBy !== 'system' || user) && (
                        <button
                          onClick={() => onEditWorkflow(workflow)}
                          className="px-2.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-emerald-400 hover:text-emerald-300 border border-zinc-800 hover:border-zinc-700 rounded-sm text-[10px] font-semibold transition flex items-center space-x-1"
                          id={`btn-edit-workflow-${workflow.id}`}
                          title="Modify workflow steps, prompt or settings and save as a new version"
                        >
                          <Edit3 size={11} />
                          <span>Edit Steps</span>
                        </button>
                      )}

                      <button
                        onClick={() => onRunWorkflow(workflow.id)}
                        disabled={isRunning}
                        className="flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-900 text-white disabled:text-zinc-500 font-bold text-[10px] px-3.5 py-1.5 rounded-sm active:scale-95 transition"
                        id={`btn-run-workflow-${workflow.id}`}
                      >
                        {isRunning ? (
                          <div className="w-3 h-3 border border-slate-200 border-t-transparent rounded-sm animate-spin"></div>
                        ) : (
                          <Play size={10} fill="currentColor" />
                        )}
                        <span>{isRunning ? 'Executing...' : 'Run API Inside Website'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Expanded Steps Checklist */}
                  {isExpanded && (
                    <div className="mt-5 bg-black border border-zinc-850 rounded-sm p-4 space-y-3 font-mono text-[10px] leading-relaxed text-zinc-300 animate-fade-in">
                      {/* Sub Tabs */}
                      <div className="flex space-x-2 border-b border-zinc-900 pb-2 mb-3 shrink-0">
                        <button
                          onClick={() => setCardTabs(prev => ({ ...prev, [workflow.id]: 'steps' }))}
                          className={`px-3 py-1.5 rounded-sm text-[10px] font-bold tracking-wider uppercase transition flex items-center space-x-1.5 ${
                            (cardTabs[workflow.id] || 'steps') === 'steps'
                              ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20'
                              : 'bg-zinc-950 border border-transparent text-zinc-500 hover:text-zinc-400'
                          }`}
                        >
                          <ListChecks size={11} />
                          <span>Active Steps</span>
                        </button>

                        <button
                          onClick={() => setCardTabs(prev => ({ ...prev, [workflow.id]: 'history' }))}
                          className={`px-3 py-1.5 rounded-sm text-[10px] font-bold tracking-wider uppercase transition flex items-center space-x-1.5 relative ${
                            cardTabs[workflow.id] === 'history'
                              ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20'
                              : 'bg-zinc-950 border border-transparent text-zinc-500 hover:text-zinc-400'
                          }`}
                        >
                          <History size={11} />
                          <span>Version History</span>
                          <span className="bg-zinc-900 border border-zinc-800 text-zinc-400 px-1 py-0.2 rounded-sm text-[8px] font-mono ml-1">
                            {workflow.versionHistory?.length || 1}
                          </span>
                        </button>
                      </div>

                      {/* Content rendering based on selected Tab */}
                      {(cardTabs[workflow.id] || 'steps') === 'steps' ? (
                        <>
                          <div className="flex justify-between items-center text-zinc-500 border-b border-zinc-900 pb-1.5 mb-2">
                            <span>SEQUENTIAL REPLAY INSTRUCTIONS</span>
                            <span>{workflow.steps.length} COMMANDS</span>
                          </div>
                          
                          <div className="space-y-2">
                            {workflow.steps.map((step, idx) => (
                              <div key={step.id} className="flex items-start space-x-2">
                                <span className="text-blue-400 font-bold shrink-0">{idx + 1}.</span>
                                <div>
                                  <span className="text-zinc-400 font-semibold uppercase shrink-0">[{step.type}]</span>
                                  <span className="text-zinc-300 ml-1.5">{step.description || `Replay action on "${step.selector || step.url || ''}"`}</span>
                                  {step.value && <div className="text-amber-400/95 ml-6 mt-0.5">&gt; value: "{step.value}"</div>}
                                </div>
                              </div>
                            ))}
                          </div>

                          <div className="border-t border-zinc-900 pt-3 mt-3">
                            <span className="text-zinc-500 block uppercase mb-1 font-bold">Gemini AI Structured Schema:</span>
                            <p className="text-blue-200 bg-zinc-950/80 p-2.5 rounded-sm border border-zinc-900 leading-normal font-mono select-all text-[9.5px]">
                              {workflow.extractionPrompt}
                            </p>
                          </div>
                        </>
                      ) : (
                        <div className="space-y-4">
                          <div className="flex justify-between items-center text-zinc-500 border-b border-zinc-900 pb-1.5 mb-2">
                            <span>REVISION RECORD HISTORY (SAVED TO CONTAINER)</span>
                            <span>v{workflow.version || 1} CURRENT</span>
                          </div>

                          <div className="space-y-3">
                            {(workflow.versionHistory || [
                              {
                                version: 1,
                                updatedAt: workflow.createdAt || new Date().toISOString(),
                                steps: workflow.steps,
                                extractionPrompt: workflow.extractionPrompt,
                                changeSummary: 'Initial creation'
                              }
                            ]).slice().reverse().map((historyItem) => {
                              const isVerExpanded = expandedHistoryVersion[`${workflow.id}-${historyItem.version}`];
                              return (
                                <div key={historyItem.version} className="bg-zinc-950/60 border border-zinc-900/60 rounded-sm p-3 space-y-2 font-mono">
                                  <div className="flex justify-between items-start gap-2">
                                    <div>
                                      <div className="flex items-center space-x-1.5">
                                        <span className="px-1.5 py-0.5 bg-zinc-900 border border-zinc-800 text-blue-400 text-[9px] rounded-sm font-bold font-mono">
                                          v{historyItem.version}
                                        </span>
                                        <span className="text-[9px] text-zinc-500">
                                          {new Date(historyItem.updatedAt).toLocaleString()}
                                        </span>
                                      </div>
                                      <p className="text-[10px] text-zinc-300 mt-1.5 font-sans leading-normal">
                                        {historyItem.changeSummary || 'No summary comments.'}
                                      </p>
                                    </div>

                                    <div className="flex items-center space-x-2 shrink-0">
                                      <button
                                        onClick={() => setExpandedHistoryVersion(prev => ({
                                          ...prev,
                                          [`${workflow.id}-${historyItem.version}`]: !isVerExpanded
                                        }))}
                                        className="px-2 py-1 bg-zinc-900 hover:bg-zinc-850 text-zinc-400 hover:text-white border border-zinc-800 rounded-sm text-[9px] transition"
                                      >
                                        {isVerExpanded ? 'Hide Steps' : 'View Steps'}
                                      </button>
                                      
                                      <button
                                        onClick={() => onEditWorkflow({
                                          ...workflow,
                                          steps: historyItem.steps,
                                          extractionPrompt: historyItem.extractionPrompt
                                        })}
                                        className="px-2 py-1 bg-blue-950/40 hover:bg-blue-900/40 text-blue-400 hover:text-blue-300 border border-blue-900/30 rounded-sm text-[9px] transition"
                                        title="Load this specific revision's steps and schema into the Browser Recorder tab to modify or restore it"
                                      >
                                        Load
                                      </button>
                                    </div>
                                  </div>

                                  {isVerExpanded && (
                                    <div className="mt-2.5 pt-2.5 border-t border-zinc-900/60 pl-2 space-y-2.5 bg-black/40 p-2 rounded-sm border border-zinc-900 font-mono text-[9.5px]">
                                      <div className="space-y-1.5">
                                        <span className="text-[9px] text-zinc-500 uppercase font-bold tracking-wider block">Recorded Commands:</span>
                                        {historyItem.steps.map((hStep, hIdx) => (
                                          <div key={hStep.id || hIdx} className="flex items-start space-x-2">
                                            <span className="text-blue-400/80 font-bold">{hIdx + 1}.</span>
                                            <div>
                                              <span className="text-zinc-500 uppercase">[{hStep.type}]</span>
                                              <span className="text-zinc-400 ml-1.5">{hStep.description || `Action step`}</span>
                                              {hStep.value && <span className="text-amber-500 ml-1 font-mono">&gt; "{hStep.value}"</span>}
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                      <div className="pt-2 border-t border-zinc-900/60">
                                        <span className="text-[9px] text-zinc-500 uppercase font-bold tracking-wider block mb-1">Extraction Schema:</span>
                                        <p className="text-blue-300 bg-zinc-950/40 p-2 rounded-sm border border-zinc-900 leading-normal">
                                          {historyItem.extractionPrompt}
                                        </p>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* REASSURING PROGRESS MODAL (Visual Stepper during Headless Browser Execution) */}
      {runningWorkflowId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
          <div className="w-full max-w-lg bg-zinc-950 border border-zinc-850 rounded-sm p-6 overflow-hidden relative shadow-2xl">
            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-sm bg-blue-950/40 border border-blue-900/30 flex items-center justify-center mx-auto mb-3">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-sm animate-spin"></div>
              </div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-sans">Running API Automation</h3>
              <p className="text-[10px] text-zinc-500 mt-1 max-w-xs mx-auto">Perfectly replaying browser clicks and keystrokes inside a headless Chromium node, followed by Gemini AI scraping extraction.</p>
            </div>

            {/* Stepper Progress */}
            <div className="bg-black rounded-sm border border-zinc-850 p-4 font-mono text-[10px] text-blue-200 h-48 overflow-y-auto shadow-inner space-y-1.5 leading-relaxed">
              <div className="text-zinc-500 border-b border-zinc-900 pb-1.5 mb-2 flex justify-between">
                <span>CHROMIUM EMULATION TERMINAL</span>
                <span className="text-blue-400 animate-pulse">● REPLAYING STEPS</span>
              </div>
              {runningLogLines.map((line, idx) => {
                let color = 'text-zinc-300';
                if (line.includes('FAILED') || line.includes('error')) color = 'text-rose-400';
                if (line.includes('SUCCESS') || line.includes('completed')) color = 'text-emerald-400';
                return (
                  <div key={idx} className={color}>
                    {line}
                  </div>
                );
              })}
            </div>

            <div className="mt-4 flex items-center justify-center space-x-2 text-[10px] text-zinc-500 bg-zinc-900/30 py-2 rounded-sm border border-zinc-850">
              <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-ping"></span>
              <span>Replay pipelines usually take 4-8 seconds. Please wait...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
