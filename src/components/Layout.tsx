/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { LayoutDashboard, UploadCloud, FileSpreadsheet, Code, Settings, Menu, X, Cpu, Key, AlertCircle } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: 'dashboard' | 'upload' | 'summary' | 'code' | 'settings';
  onTabChange: (tab: 'dashboard' | 'upload' | 'summary' | 'code' | 'settings') => void;
  apiKeyExists: boolean;
  selectedModel: string;
}

export default function Layout({
  children,
  activeTab,
  onTabChange,
  apiKeyExists,
  selectedModel
}: LayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Quick navigation elements
  const navItems = [
    {
      id: 'dashboard',
      name: 'Paper Index',
      icon: <LayoutDashboard size={16} />
    },
    {
      id: 'upload',
      name: 'Analyze Publication',
      icon: <UploadCloud size={16} />
    },
    {
      id: 'summary',
      name: 'Executive Report',
      icon: <FileSpreadsheet size={16} />
    },
    {
      id: 'code',
      name: 'Generated Skeletons',
      icon: <Code size={16} />
    },
    {
      id: 'settings',
      name: 'Settings',
      icon: <Settings size={16} />
    }
  ] as const;

  return (
    <div id="applet-layout" className="min-h-screen bg-slate-900 text-slate-100 flex flex-col md:flex-row font-sans">
      
      {/* 1. Mobile top header bar */}
      <header className="md:hidden bg-slate-950 px-5 py-4 border-b border-slate-850 flex items-center justify-between sticky top-0 z-50 select-none">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-violet-500/10 text-violet-400 rounded-lg">
            <Cpu size={16} />
          </div>
          <span className="font-extrabold text-sm tracking-tight bg-gradient-to-r from-violet-400 to-fuchsia-200 bg-clip-text text-transparent">
            Paper2Code AI
          </span>
        </div>
        
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          id="toggle-mobile-menu-btn"
          className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          title={mobileMenuOpen ? 'Close menu' : 'Open menu'}
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>

      {/* 2. Left side drawer navigation (Desktop) */}
      <aside className="hidden md:flex md:w-60 bg-slate-950 border-r border-slate-850 flex-col py-6 px-4 shrink-0 justify-between select-none">
        <div className="space-y-6">
          {/* Main Logo header */}
          <div className="flex items-center gap-2.5 px-3">
            <div className="p-2 bg-violet-500/10 text-violet-400 rounded-xl border border-violet-500/20 shadow-[0_0_15px_rgba(139,92,246,0.15)]">
              <Cpu size={20} />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-[15px] tracking-tight text-white leading-tight">
                Paper2Code <span className="text-violet-400 font-black">AI</span>
              </span>
              <span className="text-[9px] text-violet-400/70 font-bold tracking-wide">RESEARCH ENGINE</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                id={`nav-${item.id}`}
                className={`w-full py-2.5 px-3 rounded-xl text-xs font-semibold text-left flex items-center gap-3.5 transition-all focus:outline-none cursor-pointer ${
                  activeTab === item.id
                    ? 'bg-violet-500/10 text-white shadow-[0_0_10px_rgba(139,92,246,0.1)] border border-violet-500/30 font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent'
                }`}
              >
                <span className={activeTab === item.id ? 'text-violet-400' : 'text-slate-500 group-hover:text-slate-300'}>
                  {item.icon}
                </span>
                <span>{item.name}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Status telemetry foot area */}
        <div className="space-y-3 pt-6 border-t border-slate-900 px-3">
          <div className="flex items-center justify-between text-[10px] text-slate-500 font-semibold">
            <span>ENGINE STATUS</span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse" />
              <span className="text-violet-400 leading-none font-bold">ACTIVE</span>
            </span>
          </div>

          <div className="flex items-center gap-2 bg-slate-900/60 p-2.5 rounded-xl border border-slate-850">
            {apiKeyExists ? (
              <>
                <Key size={12} className="text-violet-400 shrink-0" />
                <div className="text-[10px] text-slate-400 font-semibold truncate leading-none">
                  {selectedModel === 'gemini-3.5-flash' ? '3.5' : '2.5'} Flash Verified
                </div>
              </>
            ) : (
              <>
                <AlertCircle size={12} className="text-amber-400 shrink-0" />
                <div className="text-[10px] text-slate-400 font-semibold leading-none">
                  Key Unconfigured
                </div>
              </>
            )}
          </div>
        </div>
      </aside>

      {/* 3. Mobile Navigation Slider Panel */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-slate-950/95 backdrop-blur-md pt-[62px] p-5 select-none animate-fade-in">
          <nav className="space-y-2.5">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  onTabChange(item.id);
                  setMobileMenuOpen(false);
                }}
                id={`mobile-nav-${item.id}`}
                className={`w-full py-3 px-4 rounded-xl text-sm font-semibold text-left flex items-center gap-3 cursor-pointer ${
                  activeTab === item.id
                    ? 'bg-violet-500/10 text-white border border-violet-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent'
                }`}
              >
                <span className={activeTab === item.id ? 'text-violet-400' : 'text-slate-500'}>
                  {item.icon}
                </span>
                <span>{item.name}</span>
              </button>
            ))}
          </nav>

          {/* Quick status on mobile drawer */}
          <div className="mt-8 border-t border-slate-900 pt-6 px-4 space-y-3">
            <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold">
              <span>MODEL BOUNDARY</span>
              <span className="text-slate-350">{selectedModel}</span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold">
              <span>API CREDENTIALS</span>
              <span className={apiKeyExists ? 'text-violet-400' : 'text-amber-400'}>
                {apiKeyExists ? 'SAVED' : 'UNCONFIGURED'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 4. Core workspace contents area */}
      <main className="flex-1 p-5 md:p-8 overflow-y-auto max-w-5xl mx-auto w-full">
        <div className="animate-fade-in animate-duration-300">
          {children}
        </div>
      </main>

    </div>
  );
}
