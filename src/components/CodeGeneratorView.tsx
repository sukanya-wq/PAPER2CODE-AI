/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Terminal, FolderTree, FileCode, CheckCircle2, Copy, Download, Info, Settings, Clipboard, Bookmark, Archive } from 'lucide-react';
import JSZip from 'jszip';

interface CodeGeneratorViewProps {
  pythonSkeleton: string;
  folderStructure: string;
  requirements: string;
  readme: string;
  setupInstructions: string;
  codeFileName?: string;
  configFileName?: string;
}

export default function CodeGeneratorView({
  pythonSkeleton,
  folderStructure,
  requirements,
  readme,
  setupInstructions,
  codeFileName,
  configFileName
}: CodeGeneratorViewProps) {
  const [activeTab, setActiveTab] = useState<'python' | 'structure' | 'requirements' | 'readme' | 'setup'>('python');
  const [copied, setCopied] = useState(false);
  const [zipping, setZipping] = useState(false);

  const codeName = codeFileName || 'main.py';
  const configName = configFileName || 'requirements.txt';

  // Helper helper to generate direct client-side text file downloads
  const handleDownloadFile = (fileName: string, fileContent: string) => {
    const blob = new Blob([fileContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadAllAsZip = async () => {
    setZipping(true);
    try {
      const zip = new JSZip();
      
      // Keep filenames neat matching target
      zip.file(codeName, pythonSkeleton);
      zip.file(configName, requirements);
      zip.file('README.md', readme);
      zip.file('setup_workspace.sh', setupInstructions);
      zip.file('workspace_tree.txt', folderStructure);
      
      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = `workspace_project_${codeName.split('.')[0] || 'code'}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to package project file collection:', err);
    } finally {
      setZipping(false);
    }
  };

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  // Resolve current active file configs
  const getActiveFileParams = () => {
    switch (activeTab) {
      case 'python':
        return {
          title: codeName,
          description: `Ready-to-run implementation logic of the paper structured dynamically under ${codeName}`,
          content: pythonSkeleton,
          ext: codeName.split('.').pop() || 'py',
          icon: <FileCode className="text-violet-400" size={16} />
        };
      case 'structure':
        return {
          title: 'Project Tree Layout',
          description: 'Comprehensive workspace folder design map',
          content: folderStructure,
          ext: 'txt',
          icon: <FolderTree className="text-indigo-400" size={16} />
        };
      case 'requirements':
        return {
          title: configName,
          description: `Configuration and installation details tailored under ${configName}`,
          content: requirements,
          ext: configName.split('.').pop() || 'txt',
          icon: <Settings className="text-teal-400" size={16} />
        };
      case 'readme':
        return {
          title: 'README.md',
          description: 'In-depth guide for repository documentation',
          content: readme,
          ext: 'md',
          icon: <Bookmark className="text-fuchsia-400" size={16} />
        };
      case 'setup':
        return {
          title: 'setup_workspace.sh',
          description: 'Shell commands sequence to boot the virtual environment',
          content: setupInstructions,
          ext: 'sh',
          icon: <Terminal className="text-blue-400" size={16} />
        };
    }
  };

  const currentFile = getActiveFileParams();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Sidebar files selector navigation */}
      <div className="lg:col-span-3 space-y-4">
        <div className="bg-slate-850 border border-slate-700/60 rounded-2xl p-4 shadow-md">
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-2 mb-3">Project Files Workspace</h4>
          
          <div className="space-y-1.5">
            <button
              onClick={() => { setActiveTab('python'); setCopied(false); }}
              className={`w-full py-2.5 px-3 rounded-lg text-xs font-semibold text-left flex items-center justify-between transition-all focus:outline-none cursor-pointer ${
                activeTab === 'python'
                  ? 'bg-violet-500/10 text-white border-l-3 border-violet-500 shadow-[0_0_10px_rgba(139,92,246,0.15)] font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <span className="flex items-center gap-2">
                <FileCode size={14} className={activeTab === 'python' ? 'text-violet-400' : 'text-slate-500'} />
                <span className="truncate max-w-[120px]">{codeName}</span>
              </span>
              <span className="text-[9px] font-mono text-slate-500 select-none uppercase">{codeName.split('.').pop()}</span>
            </button>

            <button
              onClick={() => { setActiveTab('structure'); setCopied(false); }}
              className={`w-full py-2.5 px-3 rounded-lg text-xs font-semibold text-left flex items-center justify-between transition-all focus:outline-none cursor-pointer ${
                activeTab === 'structure'
                  ? 'bg-violet-500/10 text-white border-l-3 border-violet-500 shadow-[0_0_10px_rgba(139,92,246,0.15)] font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <span className="flex items-center gap-2">
                <FolderTree size={14} className={activeTab === 'structure' ? 'text-indigo-400' : 'text-slate-500'} />
                <span>workspace_tree</span>
              </span>
              <span className="text-[9px] font-mono text-slate-500 select-none">Mapping</span>
            </button>

            <button
              onClick={() => { setActiveTab('requirements'); setCopied(false); }}
              className={`w-full py-2.5 px-3 rounded-lg text-xs font-semibold text-left flex items-center justify-between transition-all focus:outline-none cursor-pointer ${
                activeTab === 'requirements'
                  ? 'bg-violet-500/10 text-white border-l-3 border-violet-500 shadow-[0_0_10px_rgba(139,92,246,0.15)] font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <span className="flex items-center gap-2">
                <Settings size={14} className={activeTab === 'requirements' ? 'text-teal-400' : 'text-slate-500'} />
                <span className="truncate max-w-[120px]">{configName}</span>
              </span>
              <span className="text-[9px] font-mono text-slate-500 select-none uppercase">{configName.includes('.') ? configName.split('.').pop() : 'config'}</span>
            </button>

            <button
              onClick={() => { setActiveTab('readme'); setCopied(false); }}
              className={`w-full py-2.5 px-3 rounded-lg text-xs font-semibold text-left flex items-center justify-between transition-all focus:outline-none cursor-pointer ${
                activeTab === 'readme'
                  ? 'bg-violet-500/10 text-white border-l-3 border-violet-500 shadow-[0_0_10px_rgba(139,92,246,0.15)] font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <span className="flex items-center gap-2">
                <Bookmark size={14} className={activeTab === 'readme' ? 'text-fuchsia-400' : 'text-slate-500'} />
                <span>README.md</span>
              </span>
              <span className="text-[9px] font-mono text-slate-500 select-none">Docs</span>
            </button>

            <button
              onClick={() => { setActiveTab('setup'); setCopied(false); }}
              className={`w-full py-2.5 px-3 rounded-lg text-xs font-semibold text-left flex items-center justify-between transition-all focus:outline-none cursor-pointer ${
                activeTab === 'setup'
                  ? 'bg-violet-500/10 text-white border-l-3 border-violet-500 shadow-[0_0_10px_rgba(139,92,246,0.15)] font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <span className="flex items-center gap-2">
                <Terminal size={14} className={activeTab === 'setup' ? 'text-blue-400' : 'text-slate-500'} />
                <span>setup_sh</span>
              </span>
              <span className="text-[9px] font-mono text-slate-500 select-none">Shell</span>
            </button>
          </div>

          {/* Quick ZIP Exporter Card action */}
          <div className="mt-4 pt-4 border-t border-slate-800">
            <button
              onClick={handleDownloadAllAsZip}
              disabled={zipping}
              className="w-full py-2 px-3 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md transition-colors selection:bg-none"
            >
              {zipping ? (
                <>
                  <Archive className="animate-pulse" size={13} />
                  <span>Zipping files...</span>
                </>
              ) : (
                <>
                  <Archive size={13} />
                  <span>Download Whole ZIP</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Tip panel */}
        <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-4 flex gap-2.5 text-[10px] text-slate-400 leading-normal select-none">
          <Info className="text-violet-400 shrink-0" size={14} />
          <span>
            These files provide a localized, complete architecture structure. Export them now to assemble your local repo in seconds!
          </span>
        </div>
      </div>

      {/* Code window block detail */}
      <div className="lg:col-span-9">
        <div className="bg-slate-850 border border-slate-700/60 rounded-2xl shadow-xl overflow-hidden flex flex-col min-h-[500px]">
          {/* Header row details */}
          <div className="px-5 py-4.5 border-b border-slate-800 bg-slate-900/50 flex flex-col md:flex-row md:items-center justify-between gap-3 select-none">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                {currentFile.icon}
                <span className="font-bold text-white text-sm md:text-base leading-tight">{currentFile.title}</span>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed pr-2">{currentFile.description}</p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleCopy(currentFile.content)}
                id="copy-code-workspace-btn"
                className="py-1.5 px-3 rounded-lg border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white transition-all text-xs flex items-center justify-center gap-1.5 cursor-pointer font-medium"
              >
                {copied ? <CheckCircle2 size={13} className="text-violet-400" /> : <Clipboard size={13} />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>

              <button
                onClick={() => handleDownloadFile(currentFile.title, currentFile.content)}
                id="download-code-workspace-btn"
                className="py-1.5 px-3 rounded-lg border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white transition-all text-xs flex items-center justify-center gap-1.5 cursor-pointer font-medium"
              >
                <Download size={13} />
                <span>Export This File</span>
              </button>

              <button
                onClick={handleDownloadAllAsZip}
                disabled={zipping}
                id="download-all-zip-hdr-btn"
                className="py-1.5 px-3 rounded-lg bg-violet-600 hover:bg-violet-500 hover:shadow-violet-500/10 active:bg-violet-700 text-white font-semibold transition-all text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
              >
                {zipping ? <Archive className="animate-pulse" size={13} /> : <Archive size={13} />}
                <span>{zipping ? 'Zipping...' : 'Download Whole ZIP'}</span>
              </button>
            </div>
          </div>

          {/* Core code displays */}
          <div className="flex-1 bg-slate-950 p-4 font-mono text-xs text-slate-300 focus:outline-none leading-relaxed overflow-x-auto selection:bg-violet-500/20 max-h-[600px]">
            <pre className="whitespace-pre">{currentFile.content}</pre>
          </div>
        </div>
      </div>
    </div>
  );
}
