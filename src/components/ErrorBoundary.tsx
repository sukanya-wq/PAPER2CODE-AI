/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertOctagon, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught rendering crash:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 text-slate-100">
          <div id="error-boundary-card" className="max-w-md w-full bg-slate-850 border border-red-500/30 rounded-2xl p-6 shadow-2xl text-center">
            <div className="mx-auto w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center text-red-400 mb-4 animate-pulse">
              <AlertOctagon size={24} />
            </div>
            
            <h1 className="text-xl font-bold tracking-tight mb-2">Unexpected Render Failure</h1>
            <p className="text-slate-400 text-sm mb-4 leading-relaxed">
              An error occurred while loading this view component. This could be due to a malformed data payload.
            </p>

            {this.state.error && (
              <div className="bg-slate-950 rounded-lg p-3 text-left font-mono text-xs text-red-300 max-h-36 overflow-y-auto mb-6 border border-slate-800">
                {this.state.error.stack || this.state.error.message}
              </div>
            )}

            <button
              onClick={this.handleReset}
              id="reset-app-btn"
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-xl font-medium transition-all shadow-lg hover:shadow-emerald-500/20 cursor-pointer"
            >
              <RotateCcw size={16} />
              Re-initialize Workspace
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
