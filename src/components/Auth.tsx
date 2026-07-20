/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { LogIn, UserPlus, X, LogOut, ShieldAlert } from 'lucide-react';
import { User } from '../types';

interface AuthProps {
  user: User | null;
  onLoginSuccess: (user: User, token: string) => void;
  onLogout: () => void;
}

export default function Auth({ user, onLoginSuccess, onLogout }: AuthProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const url = isRegister ? '/api/auth/register' : '/api/auth/login';
    const payload = isRegister ? { username, email, password } : { username, password };

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      onLoginSuccess(data.user, data.token);
      setIsOpen(false);
      setUsername('');
      setEmail('');
      setPassword('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (user) {
    return (
      <div className="flex items-center space-x-3 bg-zinc-900/80 border border-zinc-800 rounded-sm px-4 py-1.5 shadow-inner">
        <div className="w-2.5 h-2.5 bg-emerald-500 rounded-sm animate-pulse"></div>
        <span className="text-xs text-zinc-300 font-medium font-mono">{user.username}</span>
        <button
          onClick={onLogout}
          className="text-zinc-400 hover:text-rose-400 transition"
          title="Sign Out"
          id="btn-logout"
        >
          <LogOut size={14} />
        </button>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => { setIsOpen(true); setError(''); }}
        className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-4 py-2 rounded-sm active:scale-95 transition-all duration-150"
        id="btn-open-login"
      >
        <LogIn size={14} />
        <span>Login / Sign Up</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in p-4">
          <div className="relative w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-sm p-6 overflow-hidden shadow-2xl">
            <div className="flex justify-between items-center mb-6 border-b border-zinc-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center space-x-2 uppercase tracking-wider">
                  {isRegister ? <UserPlus size={18} className="text-blue-400" /> : <LogIn size={18} className="text-blue-400" />}
                  <span>{isRegister ? 'Create Platform Account' : 'Welcome back'}</span>
                </h3>
                <p className="text-[11px] text-zinc-500 mt-1">
                  {isRegister ? 'Get full access to save workflows and trigger timers.' : 'Sign in to access your custom browser workflows.'}
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-zinc-400 hover:text-white transition"
                id="btn-close-auth"
              >
                <X size={18} />
              </button>
            </div>

            {error && (
              <div className="mb-4 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs p-3 rounded-sm flex items-start space-x-2">
                <ShieldAlert size={16} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {isRegister && (
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5">Email Address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@domain.com"
                    className="w-full bg-zinc-900 border border-zinc-850 rounded-sm px-3 py-2 text-white placeholder-zinc-600 text-xs focus:outline-none focus:border-zinc-700 transition font-mono"
                    id="input-auth-email"
                  />
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5">Username</label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. scrapemaster"
                  className="w-full bg-zinc-900 border border-zinc-850 rounded-sm px-3 py-2 text-white placeholder-zinc-600 text-xs focus:outline-none focus:border-zinc-700 transition font-mono"
                  id="input-auth-username"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-zinc-900 border border-zinc-850 rounded-sm px-3 py-2 text-white placeholder-zinc-600 text-xs focus:outline-none focus:border-zinc-700 transition font-mono"
                  id="input-auth-password"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2.5 rounded-sm transition duration-150 flex justify-center items-center space-x-2 disabled:opacity-50"
                id="btn-auth-submit"
              >
                {loading ? (
                  <span className="w-4 h-4 border-2 border-slate-200 border-t-transparent rounded-sm animate-spin"></span>
                ) : (
                  <span>{isRegister ? 'Register and Connect' : 'Secure Login'}</span>
                )}
              </button>
            </form>

            <div className="mt-6 text-center border-t border-zinc-800 pt-4">
              <button
                onClick={() => { setIsRegister(!isRegister); setError(''); }}
                className="text-blue-400 hover:text-blue-300 text-xs font-semibold transition font-mono"
                id="btn-toggle-auth"
              >
                {isRegister ? 'Already have an account? Log In' : "Don't have an account? Sign Up"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
