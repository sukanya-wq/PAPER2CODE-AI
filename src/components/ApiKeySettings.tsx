/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Key, Eye, EyeOff, CheckCircle2, XCircle, RefreshCw, Trash2, Cpu, HelpCircle } from 'lucide-react';
import { testGeminiApiKey } from '../utils/geminiService';

interface ApiKeySettingsProps {
  currentKey: string;
  selectedModel: string;
  onSaveKey: (key: string) => void;
  onDeleteKey: () => void;
  onModelChange: (model: string) => void;
}

export default function ApiKeySettings({
  currentKey,
  selectedModel,
  onSaveKey,
  onDeleteKey,
  onModelChange
}: ApiKeySettingsProps) {
  const [keyInput, setKeyInput] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [feedbackMsg, setFeedbackMsg] = useState('');

  useEffect(() => {
    setKeyInput(currentKey);
  }, [currentKey]);

  const handleTestKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyInput.trim()) {
      setTestStatus('error');
      setFeedbackMsg('API Key cannot be empty. Please enter a valid key from Google AI Studio.');
      return;
    }

    setTesting(true);
    setTestStatus('idle');
    setFeedbackMsg('');

    try {
      const isOk = await testGeminiApiKey(keyInput.trim(), selectedModel);
      if (isOk) {
        setTestStatus('success');
        setFeedbackMsg('Successfully connected to Gemini API! Your key is verified and ready to use.');
        onSaveKey(keyInput.trim());
      } else {
        setTestStatus('error');
        setFeedbackMsg('API key did not respond correctly. Please verify the key has developer permissions.');
      }
    } catch (err: any) {
      setTestStatus('error');
      setFeedbackMsg(err.message || 'Validation failed. Ensure your internet connection is active and the API key is accurate.');
    } finally {
      setTesting(false);
    }
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete your stored API key? This will clear it from your browser cache.')) {
      onDeleteKey();
      setKeyInput('');
      setTestStatus('idle');
      setFeedbackMsg('Stored API Key deleted successfully.');
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="bg-slate-850 border border-slate-700/60 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        {/* Decorative corner accent */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />

        <div className="flex items-start gap-4 mb-6">
          <div className="p-3 bg-violet-500/10 text-violet-400 rounded-xl">
            <Key size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white">Gemini API Configuration</h2>
            <p className="text-slate-400 text-sm mt-1 leading-relaxed">
              Paper2Code AI runs completely in your browser. Enter your Gemini API key to start extracting logic. Your key is stored in local browser cache and never sent to any secondary backend server.
            </p>
          </div>
        </div>

        <form onSubmit={handleTestKey} className="space-y-5">
          {/* Model selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-200 flex items-center gap-2">
              <Cpu size={16} className="text-violet-400" />
              Target Analysis Engine
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => onModelChange('gemini-2.5-flash')}
                className={`py-2 px-3 text-left rounded-xl border text-sm transition-all focus:outline-none flex flex-col cursor-pointer ${
                  selectedModel === 'gemini-2.5-flash'
                    ? 'border-violet-500 bg-violet-500/15 text-white shadow-md shadow-violet-500/10'
                    : 'border-slate-700 bg-slate-900/40 text-slate-300 hover:border-slate-600'
                }`}
              >
                <div className="font-semibold text-xs text-white">Gemini 2.5 Flash</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Recommended (Speed & Economy)</div>
              </button>
              
              <button
                type="button"
                onClick={() => onModelChange('gemini-3.5-flash')}
                className={`py-2 px-3 text-left rounded-xl border text-sm transition-all focus:outline-none flex flex-col cursor-pointer ${
                  selectedModel === 'gemini-3.5-flash'
                    ? 'border-violet-500 bg-violet-500/15 text-white shadow-md shadow-violet-500/10'
                    : 'border-slate-700 bg-slate-900/40 text-slate-300 hover:border-slate-600'
                }`}
              >
                <div className="font-semibold text-xs text-white">Gemini 3.5 Flash</div>
                <div className="text-[10px] text-slate-400 mt-0.5">High Performance Reasoning</div>
              </button>
            </div>
          </div>

          {/* API Key Input */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label htmlFor="api-key-input" className="text-sm font-medium text-slate-200">
                AI Studio API Key
              </label>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                referrerPolicy="no-referrer"
                rel="noreferrer"
                className="text-violet-400 hover:text-violet-300 text-xs transition-colors underline flex items-center gap-1"
              >
                Find key here <HelpCircle size={12} />
              </a>
            </div>
            
            <div className="relative rounded-xl shadow-inner bg-slate-900/80">
              <input
                id="api-key-input"
                type={showKey ? 'text' : 'password'}
                placeholder="AIzaSy..."
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                className="w-full pl-4 pr-11 py-3 bg-transparent border border-slate-700/80 rounded-xl focus:border-violet-500 focus:ring-1 focus:ring-violet-500 text-white placeholder-slate-600 font-mono text-sm leading-relaxed transition-all input-raw"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                id="toggle-visibility-btn"
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 focus:outline-none transition-colors"
                title={showKey ? 'Hide key' : 'Show key'}
              >
                {showKey ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Status feedback alerts */}
          {testStatus === 'success' && (
            <div className="p-4 bg-violet-500/10 border border-violet-500/30 rounded-xl flex items-start gap-3 animate-fade-in animate-duration-300">
              <CheckCircle2 className="text-violet-400 shrink-0 mt-0.5" size={18} />
              <p className="text-violet-300 text-xs leading-relaxed">{feedbackMsg}</p>
            </div>
          )}

          {testStatus === 'error' && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-start gap-3 animate-fade-in animate-duration-300">
              <XCircle className="text-rose-400 shrink-0 mt-0.5" size={18} />
              <p className="text-rose-300 text-xs leading-relaxed">{feedbackMsg}</p>
            </div>
          )}

          {/* Action Row */}
          <div className="flex gap-3 pt-3">
            {currentKey && (
              <button
                type="button"
                onClick={handleDelete}
                id="delete-key-btn"
                className="py-2.5 px-4 rounded-xl border border-rose-500/30 bg-rose-500/5 hover:bg-rose-500/15 active:bg-rose-500/25 text-rose-400 hover:text-rose-200 transition-all font-medium text-sm flex items-center justify-center gap-1.5 cursor-pointer"
                title="Delete stored key"
              >
                <Trash2 size={16} />
                <span>Delete</span>
              </button>
            )}

            <button
              type="submit"
              disabled={testing || !keyInput.trim()}
              id="save-validate-key-btn"
              className="flex-1 py-2.5 px-5 rounded-xl bg-violet-600 hover:bg-violet-500 active:bg-violet-700 text-white font-medium text-sm transition-all shadow-lg shadow-violet-600/15 disabled:bg-slate-800 disabled:text-slate-500 disabled:shadow-none hover:shadow-violet-500/20 active:shadow-none flex items-center justify-center gap-2 cursor-pointer"
            >
              {testing ? (
                <>
                  <RefreshCw className="animate-spin" size={16} />
                  <span>Validating credentials...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} />
                  <span>Validate & Save Key</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-slate-900/50 p-4 border border-slate-800 rounded-xl text-[11px] text-slate-500 leading-relaxed text-center">
        Note: Free-tier accounts on Gemini 2.5/3.5 Flash may be subject to a limit of 15 Requests per Minute. To avoid hitting boundaries, wait a moment between consecutive paper operations.
      </div>
    </div>
  );
}
