/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Play, Database, FileSpreadsheet, Sparkles, ServerCrash, Cpu, Compass, Activity } from 'lucide-react';
import { User } from '../types';
import Auth from './Auth';

interface HeaderProps {
  user: User | null;
  onLoginSuccess: (user: User, token: string) => void;
  onLogout: () => void;
  activeTab: 'marketplace' | 'recorder' | 'history';
  setActiveTab: (tab: 'marketplace' | 'recorder' | 'history') => void;
  workflowCount: number;
  historyCount: number;
}

export default function Header({
  user,
  onLoginSuccess,
  onLogout,
  activeTab,
  setActiveTab,
  workflowCount,
  historyCount
}: HeaderProps) {
  return (
    <header className="bg-[#050505] border-b border-zinc-800 sticky top-0 z-40 backdrop-blur-md" id="app-header">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and title */}
          <div className="flex items-center space-x-3.5">
            <div className="w-8 h-8 bg-blue-600 rounded-sm flex items-center justify-center relative">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping absolute -top-0.5 -right-0.5"></span>
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full absolute -top-0.5 -right-0.5"></span>
              <Cpu size={16} className="text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white flex items-center space-x-1.5 uppercase tracking-wider font-sans">
                <span>Browser API</span>
              </h1>
              <p className="text-[9px] text-blue-400 font-bold tracking-widest font-mono">REPLAY WORKFLOWS</p>
            </div>
          </div>

          {/* Navigation Tab Switches */}
          <nav className="hidden md:flex items-center space-x-1.5">
            <button
              onClick={() => setActiveTab('marketplace')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-sm text-xs font-semibold border transition ${
                activeTab === 'marketplace'
                  ? 'bg-blue-600 text-white border-blue-500'
                  : 'bg-zinc-900/40 border-transparent text-zinc-400 hover:text-white hover:bg-zinc-900'
              }`}
              id="nav-tab-marketplace"
            >
              <Compass size={14} />
              <span>Marketplace</span>
            </button>

            <button
              onClick={() => setActiveTab('recorder')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-sm text-xs font-semibold border transition relative ${
                activeTab === 'recorder'
                  ? 'bg-blue-600 text-white border-blue-500'
                  : 'bg-zinc-900/40 border-transparent text-zinc-400 hover:text-white hover:bg-zinc-900'
              }`}
              id="nav-tab-recorder"
            >
              <span className="absolute top-1.5 right-2 w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
              <Activity size={14} />
              <span>Browser Recorder</span>
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-sm text-xs font-semibold border transition ${
                activeTab === 'history'
                  ? 'bg-blue-600 text-white border-blue-500'
                  : 'bg-zinc-900/40 border-transparent text-zinc-400 hover:text-white hover:bg-zinc-900'
              }`}
              id="nav-tab-history"
            >
              <Database size={14} />
              <span>Execution Logs</span>
              {historyCount > 0 && (
                <span className="bg-zinc-850 text-zinc-300 px-1.5 py-0.5 text-[9px] rounded-sm font-mono border border-zinc-700">
                  {historyCount}
                </span>
              )}
            </button>
          </nav>

          {/* Auth Integration Profile card */}
          <div className="flex items-center space-x-4">
            <Auth user={user} onLoginSuccess={onLoginSuccess} onLogout={onLogout} />
          </div>
        </div>

        {/* Dynamic Mobile Tab Navigation bar (only shown on small screens) */}
        <div className="md:hidden flex items-center justify-around py-2.5 border-t border-zinc-800">
          <button
            onClick={() => setActiveTab('marketplace')}
            className={`flex flex-col items-center p-1.5 text-[10px] font-bold ${
              activeTab === 'marketplace' ? 'text-blue-400' : 'text-zinc-500 hover:text-zinc-300'
            }`}
            id="mobile-nav-tab-marketplace"
          >
            <Compass size={16} className="mb-1" />
            <span>Marketplace</span>
          </button>
          <button
            onClick={() => setActiveTab('recorder')}
            className={`flex flex-col items-center p-1.5 text-[10px] font-bold relative ${
              activeTab === 'recorder' ? 'text-blue-400' : 'text-zinc-500 hover:text-zinc-300'
            }`}
            id="mobile-nav-tab-recorder"
          >
            <span className="absolute top-1 right-3 w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
            <Activity size={16} className="mb-1" />
            <span>Recorder</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex flex-col items-center p-1.5 text-[10px] font-bold ${
              activeTab === 'history' ? 'text-blue-400' : 'text-zinc-500 hover:text-zinc-300'
            }`}
            id="mobile-nav-tab-history"
          >
            <Database size={16} className="mb-1" />
            <span>Logs</span>
          </button>
        </div>

        {/* Stats strip */}
        <div className="py-2.5 border-t border-zinc-800/85 flex items-center justify-between text-[10px] font-mono text-zinc-500 overflow-x-auto shrink-0 select-none">
          <div className="flex items-center space-x-4">
            <span className="flex items-center space-x-1.5">
              <ServerCrash size={11} className="text-zinc-600 shrink-0" />
              <span>ACTIVE ENDPOINTS: <strong className="text-blue-400">{workflowCount}</strong></span>
            </span>
            <span className="text-zinc-800">|</span>
            <span className="flex items-center space-x-1.5">
              <Activity size={11} className="text-emerald-500 shrink-0" />
              <span>TOTAL PIPELINE RUNS: <strong className="text-emerald-400">{historyCount}</strong></span>
            </span>
            <span className="text-zinc-800">|</span>
            <span className="flex items-center space-x-1.5">
              <Sparkles size={11} className="text-blue-400 shrink-0" />
              <span>AI SCRAPING SUCCESS: <strong className="text-blue-400">100%</strong></span>
            </span>
          </div>
          <div className="hidden sm:block text-zinc-600 uppercase text-[9px] font-bold">
            Cloud Sandbox Virtual Environment
          </div>
        </div>
      </div>
    </header>
  );
}
