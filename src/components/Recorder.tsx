/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Play, Plus, Clock, HelpCircle, Save, RotateCcw, Monitor, FileSpreadsheet, Globe, Smartphone, CheckCircle, ExternalLink, RefreshCw } from 'lucide-react';
import { Step, Workflow, User } from '../types';

interface RecorderProps {
  user: User | null;
  onSaveWorkflow: (workflow: Omit<Workflow, 'id' | 'createdBy' | 'createdAt' | 'lastRunStatus'>) => Promise<void>;
  saving: boolean;
  editingWorkflow?: Workflow | null;
  onUpdateWorkflow?: (id: string, workflow: Partial<Workflow> & { changeSummary?: string }) => Promise<void>;
  onCancelEdit?: () => void;
}

export default function Recorder({
  user,
  onSaveWorkflow,
  saving,
  editingWorkflow,
  onUpdateWorkflow,
  onCancelEdit
}: RecorderProps) {
  const [urlInput, setUrlInput] = useState('/demo/techjobs');
  const [iframeUrl, setIframeUrl] = useState('/demo/techjobs');
  const [steps, setSteps] = useState<Step[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [extractionPrompt, setExtractionPrompt] = useState('Extract all active listings. For each item, extract: title, company, salary, and location.');
  const [schedule, setSchedule] = useState('none');
  const [changeSummary, setChangeSummary] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [proxyLoading, setProxyLoading] = useState(false);

  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Load editing workflow if provided
  useEffect(() => {
    if (editingWorkflow) {
      setName(editingWorkflow.name || '');
      setDescription(editingWorkflow.description || '');
      setExtractionPrompt(editingWorkflow.extractionPrompt || '');
      setSchedule(editingWorkflow.schedule || 'none');
      setUrlInput(editingWorkflow.startUrl || '/demo/techjobs');
      setIframeUrl(editingWorkflow.startUrl || '/demo/techjobs');
      
      // Load steps without the final extract step if it's there
      const filteredSteps = (editingWorkflow.steps || []).filter(s => s.type !== 'extract');
      setSteps(filteredSteps);
      setChangeSummary('');
      setIsSaved(false);
    } else {
      // Set back to default if no workflow is being edited
      setName('');
      setDescription('');
      setExtractionPrompt('Extract all active listings. For each item, extract: title, company, salary, and location.');
      setSchedule('none');
      setUrlInput('/demo/techjobs');
      setIframeUrl('/demo/techjobs');
      setSteps([]);
      setChangeSummary('');
      setIsSaved(false);
    }
  }, [editingWorkflow]);

  // Monitor posted messages from the iframe sandbox viewport
  useEffect(() => {
    const handleSandboxMessage = (event: MessageEvent) => {
      if (!event.data) return;

      if (event.data.type === 'RECORDER_STEP') {
        const recordedStep = event.data.step;
        const newStep: Step = {
          ...recordedStep,
          id: 'step-' + Math.random().toString(36).substring(2, 8)
        };

        // If navigating, we can update our address bar input
        if (newStep.type === 'navigate' && newStep.url) {
          setUrlInput(newStep.url);
        }

        // Prevent duplicate duplicate clicks or types within 100ms
        setSteps(prev => {
          if (prev.length > 0) {
            const last = prev[prev.length - 1];
            if (last.type === newStep.type && last.selector === newStep.selector && last.value === newStep.value) {
              return prev;
            }
          }
          return [...prev, newStep];
        });
      } else if (event.data.type === 'LOAD_SANDBOX_URL') {
        loadUrl(event.data.url);
      }
    };

    window.addEventListener('message', handleSandboxMessage);
    return () => window.removeEventListener('message', handleSandboxMessage);
  }, []);

  const loadUrl = (targetUrl: string) => {
    setProxyLoading(true);
    let resolvedUrl = targetUrl;

    // Check if it's an external URL and needs proxying
    if (targetUrl.startsWith('http://') || targetUrl.startsWith('https://')) {
      resolvedUrl = `/api/proxy?url=${encodeURIComponent(targetUrl)}`;
    }

    setIframeUrl(resolvedUrl);
    setUrlInput(targetUrl);

    // Give iframe some time to trigger load
    setTimeout(() => {
      setProxyLoading(false);
    }, 1500);
  };

  const addWaitStep = () => {
    const waitStep: Step = {
      id: 'step-' + Math.random().toString(36).substring(2, 8),
      type: 'wait',
      duration: 1000,
      description: 'Wait 1000ms for animations and DOM stabilization'
    };
    setSteps([...steps, waitStep]);
  };

  const removeStep = (id: string) => {
    setSteps(steps.filter(s => s.id !== id));
  };

  const handleReset = () => {
    setSteps([]);
    setIsSaved(false);
    // Reload active iframe URL to reset its internal state
    if (iframeRef.current) {
      iframeRef.current.src = iframeUrl;
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || steps.length === 0 || !extractionPrompt) return;

    // Append extraction step if not already there
    let finalSteps = [...steps];
    if (finalSteps[finalSteps.length - 1]?.type !== 'extract') {
      finalSteps.push({
        id: 'step-extract-final',
        type: 'extract',
        description: 'Take final DOM snapshot and run Google Gemini AI parse'
      });
    }

    try {
      if (editingWorkflow && onUpdateWorkflow) {
        await onUpdateWorkflow(editingWorkflow.id, {
          name,
          description,
          startUrl: urlInput,
          steps: finalSteps,
          extractionPrompt,
          schedule,
          changeSummary: changeSummary.trim() || undefined
        });
      } else {
        await onSaveWorkflow({
          name,
          description,
          startUrl: urlInput,
          steps: finalSteps,
          extractionPrompt,
          schedule,
          isPublic: true
        });
      }
      setIsSaved(true);
      // Reset form if not editing
      if (!editingWorkflow) {
        setName('');
        setDescription('');
        setSteps([]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 min-h-[600px]" id="browser-recorder-panel">
      {/* Visual Browser Viewport Container */}
      <div className="xl:col-span-7 bg-zinc-950 border border-zinc-800 rounded-sm flex flex-col overflow-hidden h-[620px] shadow-lg">
        {/* Browser Top Navigation Bar */}
        <div className="p-3 bg-zinc-950 border-b border-zinc-800 flex items-center space-x-3 shrink-0">
          <div className="flex space-x-1.5 shrink-0">
            <span className="w-3 h-3 rounded-full bg-zinc-800"></span>
            <span className="w-3 h-3 rounded-full bg-zinc-700"></span>
            <span className="w-3 h-3 rounded-full bg-zinc-600"></span>
          </div>

          {/* Quick flawless sandboxes */}
          <div className="flex items-center space-x-2 shrink-0 border-r border-zinc-800 pr-3">
            <button
              onClick={() => { setExtractionPrompt('Extract all active listings. For each listing, extract: jobTitle, companyName, salaryRange, location, remoteEligible (boolean), and a list of keySkillsRequired.'); loadUrl('/demo/techjobs'); }}
              className={`px-2 py-1 rounded-sm text-[10px] font-semibold transition ${
                urlInput === '/demo/techjobs' ? 'bg-blue-600 text-white' : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-850'
              }`}
              title="TechJobs Board Sandbox"
            >
              💻 JobBoard
            </button>
            <button
              onClick={() => { setExtractionPrompt('List all headphones. For each headphones, extract: productName, price, rating, reviewsCount (integer), and availabilityStatus (boolean).'); loadUrl('/demo/ecommerce'); }}
              className={`px-2 py-1 rounded-sm text-[10px] font-semibold transition ${
                urlInput === '/demo/ecommerce' ? 'bg-blue-600 text-white' : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-850'
              }`}
              title="ItemShop E-commerce Sandbox"
            >
              🛒 Store
            </button>
            <button
              onClick={() => { setExtractionPrompt('Extract article details: articleTitle, authorName, publishedTime, and bulletPointsSummary (array of key takeaways).'); loadUrl('/demo/news'); }}
              className={`px-2 py-1 rounded-sm text-[10px] font-semibold transition ${
                urlInput === '/demo/news' || (urlInput && urlInput.includes('news')) ? 'bg-blue-600 text-white' : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-850'
              }`}
              title="DailyNews Technology Blog Sandbox"
            >
              📰 Blog
            </button>
            <button
              onClick={() => { setExtractionPrompt('Extract all hotel search results. For each hotel, extract: propertyName, cityLocation, pricePerNight, ratingScore (number), ratingText, and keyAmenities (e.g. Free cancellation).'); loadUrl('/demo/booking'); }}
              className={`px-2 py-1 rounded-sm text-[10px] font-semibold transition ${
                urlInput === '/demo/booking' ? 'bg-blue-600 text-white' : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-850'
              }`}
              title="Booking.com Accommodation Search Sandbox"
            >
              🏨 Booking.com
            </button>
          </div>

          {/* Address Input */}
          <div className="flex-1 flex items-center space-x-2">
            <div className="relative flex-1">
              <Globe size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500 font-mono" />
              <input
                type="text"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadUrl(urlInput)}
                className="w-full bg-zinc-900 border border-zinc-850 rounded-sm pl-8 pr-12 py-1.5 text-xs text-zinc-200 font-mono focus:outline-none focus:border-zinc-750 transition"
                id="input-browser-address"
                placeholder="Enter URL to record..."
              />
              <button
                onClick={() => loadUrl(urlInput)}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2 py-0.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700 rounded-sm text-[9px] font-bold font-mono transition"
                title="Navigate URL"
              >
                GO
              </button>
            </div>
          </div>
        </div>

        {/* Viewport Frame */}
        <div className="flex-1 bg-white relative">
          {proxyLoading && (
            <div className="absolute inset-0 bg-zinc-950/60 backdrop-blur-sm flex flex-col items-center justify-center text-zinc-100 z-10">
              <RefreshCw size={24} className="animate-spin text-blue-500 mb-2" />
              <span className="text-xs font-mono">Loading sandbox environment...</span>
            </div>
          )}
          <iframe
            ref={iframeRef}
            src={iframeUrl}
            className="w-full h-full border-0 bg-white"
            title="Browser Sandboxed Recording Viewport"
            sandbox="allow-same-origin allow-scripts allow-forms"
          />
        </div>

        {/* Browser Footer Info */}
        <div className="p-2.5 bg-zinc-950 border-t border-zinc-800 flex items-center justify-between text-[10px] text-zinc-500 shrink-0">
          <span className="flex items-center space-x-1">
            <span className="w-2 h-2 bg-rose-500 rounded-full animate-pulse shrink-0"></span>
            <span className="font-bold tracking-wider uppercase text-[9px] text-rose-400 shrink-0">RECORDER ACTIVE</span>
            <span className="text-zinc-800 font-bold">|</span>
            <span>Click and type inside the webpage. Clicks and form inputs are auto-recorded below.</span>
          </span>
          <span className="font-mono text-zinc-600">sandbox node #01</span>
        </div>
      </div>

      {/* Recording Steps and API Builder Panel */}
      <div className="xl:col-span-5 bg-zinc-950 border border-zinc-800 rounded-sm flex flex-col overflow-hidden h-[620px] shadow-lg">
        <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/50 shrink-0">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center space-x-2 uppercase tracking-wider">
              <FileSpreadsheet size={16} className="text-blue-400" />
              <span>Recorded Action Steps</span>
            </h3>
            <p className="text-[10px] text-zinc-500 mt-0.5 font-mono">AUTOMATED WORKFLOW PAYLOAD</p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={addWaitStep}
              disabled={steps.length === 0}
              className="flex items-center space-x-1 px-2.5 py-1 bg-zinc-900 hover:bg-zinc-850 disabled:opacity-40 text-zinc-300 hover:text-white border border-zinc-800 rounded-sm text-[10px] font-semibold transition"
              id="btn-add-wait"
              title="Add wait step"
            >
              <Plus size={11} />
              <span>Add Sleep</span>
            </button>
            <button
              onClick={handleReset}
              disabled={steps.length === 0}
              className="flex items-center space-x-1 px-2.5 py-1 bg-zinc-900 hover:bg-zinc-850 disabled:opacity-40 text-zinc-400 hover:text-rose-400 border border-zinc-800 rounded-sm text-[10px] font-semibold transition"
              id="btn-reset-steps"
              title="Clear all steps"
            >
              <RotateCcw size={11} />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Action list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-black/20">
          {steps.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 text-zinc-500 border border-dashed border-zinc-850 rounded-sm">
              <Monitor size={32} className="text-zinc-800 mb-2" />
              <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Recording list is empty</h4>
              <p className="text-[10px] text-zinc-500 max-w-xs mt-1 leading-relaxed">No actions captured. Click on buttons/links or search inside the browser preview to start recording steps automatically!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {steps.map((step, index) => (
                <div
                  key={step.id}
                  className="p-3 bg-zinc-950 border border-zinc-850 rounded-sm flex justify-between items-start group hover:border-zinc-700 transition"
                >
                  <div className="flex items-start space-x-2.5">
                    <span className="text-blue-400 font-mono text-[10px] font-bold mt-0.5">{index + 1}.</span>
                    <div>
                      <div className="flex items-center space-x-2 text-[10px]">
                        <span className="font-bold text-zinc-300 uppercase font-mono tracking-wider bg-zinc-900 px-1.5 py-0.5 rounded-sm border border-zinc-800">[{step.type}]</span>
                        {step.selector && <span className="text-blue-400 font-mono text-[9px] truncate max-w-[120px]">{step.selector}</span>}
                      </div>
                      <p className="text-xs text-zinc-300 mt-1.5 font-medium leading-relaxed">{step.description}</p>
                      {step.value && <div className="text-[10px] text-amber-400 font-mono mt-1 bg-black px-2 py-0.5 rounded-sm border border-zinc-900">value: "{step.value}"</div>}
                    </div>
                  </div>

                  <button
                    onClick={() => removeStep(step.id)}
                    className="text-zinc-500 hover:text-rose-400 transition opacity-0 group-hover:opacity-100 p-1 rounded-sm hover:bg-zinc-900"
                    title="Remove step"
                  >
                    <RotateCcw size={11} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* API Builder Form */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-950/60 shrink-0">
          {editingWorkflow && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-sm p-2.5 flex items-center justify-between mb-3 text-emerald-300 text-[10px] animate-fade-in font-mono">
              <div className="flex items-center space-x-1.5">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping"></span>
                <span>Editing: <strong>{editingWorkflow.name}</strong> (Active: v{editingWorkflow.version || 1})</span>
              </div>
              <button
                type="button"
                onClick={onCancelEdit}
                className="px-2 py-0.5 bg-zinc-900 border border-zinc-800 hover:bg-zinc-850 hover:border-zinc-700 text-zinc-300 rounded-sm text-[9px] font-bold transition uppercase"
              >
                Cancel Edit
              </button>
            </div>
          )}
          {isSaved ? (
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-sm p-4 text-center animate-fade-in">
              <CheckCircle size={24} className="text-emerald-400 mx-auto mb-2" />
              <h4 className="text-xs font-bold text-emerald-300">{editingWorkflow ? 'API Updated and Built Successfully!' : 'Scraping API Saved Successfully!'}</h4>
              <p className="text-[10px] text-zinc-300 mt-1 max-w-sm mx-auto font-mono">{editingWorkflow ? `DEPLOYED REVISION v${(editingWorkflow.version || 1) + 1}` : 'PROCESSED AND DEPLOYED'}</p>
              <button
                onClick={() => {
                  setIsSaved(false);
                  if (editingWorkflow && onCancelEdit) onCancelEdit();
                }}
                className="mt-3 px-3 py-1 bg-zinc-900 hover:bg-zinc-850 text-zinc-200 rounded-sm text-[10px] font-semibold transition"
                id="btn-record-another"
              >
                {editingWorkflow ? 'Back to Marketplace' : 'Record Another API'}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1 font-mono">API Name</label>
                  <input
                    type="text"
                    required
                    disabled={steps.length === 0}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Amazon Headphone Scraper"
                    className="w-full bg-zinc-900 border border-zinc-850 rounded-sm px-3 py-1.5 text-zinc-100 placeholder-zinc-600 text-[11px] focus:outline-none focus:border-zinc-700 transition disabled:opacity-50"
                    id="input-recorder-name"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1 font-mono">Cron Trigger Interval</label>
                  <select
                    value={schedule}
                    onChange={(e) => setSchedule(e.target.value)}
                    disabled={steps.length === 0}
                    className="w-full bg-zinc-900 border border-zinc-850 rounded-sm px-2 py-1.5 text-zinc-100 text-[11px] focus:outline-none focus:border-zinc-700 transition disabled:opacity-50"
                    id="select-recorder-schedule"
                  >
                    <option value="none">Manual Trigger Only</option>
                    <option value="1m">Run Every 1 minute</option>
                    <option value="5m">Run Every 5 minutes</option>
                    <option value="1h">Run Every 1 hour</option>
                    <option value="24h">Run Every 24 hours</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1 font-mono">Brief Description</label>
                <input
                  type="text"
                  disabled={steps.length === 0}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Automates store queries and tracks listing price changes."
                  className="w-full bg-zinc-900 border border-zinc-850 rounded-sm px-3 py-1.5 text-zinc-100 placeholder-zinc-600 text-[11px] focus:outline-none focus:border-zinc-700 transition disabled:opacity-50"
                  id="input-recorder-desc"
                />
              </div>

              {editingWorkflow && (
                <div className="animate-fade-in">
                  <label className="block text-[9px] font-bold text-emerald-500 uppercase tracking-widest mb-1 font-mono">Revision Change Log Comment (Version {editingWorkflow.version ? editingWorkflow.version + 1 : 2})</label>
                  <input
                    type="text"
                    required
                    disabled={steps.length === 0}
                    value={changeSummary}
                    onChange={(e) => setChangeSummary(e.target.value)}
                    placeholder="e.g. Updated search selector to match new page layout or added wait step"
                    className="w-full bg-zinc-900 border border-emerald-950/40 rounded-sm px-3 py-1.5 text-zinc-100 placeholder-zinc-600 text-[11px] focus:outline-none focus:border-emerald-800 transition disabled:opacity-50"
                    id="input-recorder-change-summary"
                  />
                </div>
              )}

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-[9px] font-bold text-zinc-500 uppercase tracking-widest font-mono">Gemini AI Structured Extraction Schema</label>
                  <span className="text-[8px] text-blue-400 flex items-center space-x-1 font-mono" title="Gemini uses this instructions layout to build structured JSON output.">
                    <HelpCircle size={9} />
                    <span>AI Schema</span>
                  </span>
                </div>
                <textarea
                  rows={2}
                  required
                  disabled={steps.length === 0}
                  value={extractionPrompt}
                  onChange={(e) => setExtractionPrompt(e.target.value)}
                  placeholder="Tell Gemini what structured fields to scrape..."
                  className="w-full bg-zinc-900 border border-zinc-850 rounded-sm px-3 py-1.5 text-zinc-100 placeholder-zinc-600 text-[11px] focus:outline-none focus:border-zinc-700 transition font-mono disabled:opacity-50 leading-relaxed"
                  id="input-recorder-prompt"
                />
              </div>

              <div className="flex items-center space-x-3 pt-1">
                <button
                  type="submit"
                  disabled={steps.length === 0 || saving}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-900 text-white disabled:text-zinc-600 font-bold text-xs py-2.5 rounded-sm active:scale-95 transition flex justify-center items-center space-x-2"
                  id="btn-recorder-save"
                >
                  {saving ? (
                    <span className="w-4 h-4 border-2 border-slate-200 border-t-transparent rounded-sm animate-spin"></span>
                  ) : (
                    <>
                      <Save size={14} />
                      <span>
                        {editingWorkflow 
                          ? `Save Changes & Build Version ${(editingWorkflow.version || 1) + 1}`
                          : (user ? 'Save & Build Scraping API' : 'Save as Public API (Guest)')
                        }
                      </span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
