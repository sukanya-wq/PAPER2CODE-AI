/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import SavedAnalysesList from './components/SavedAnalysesList';
import PdfUploader from './components/PdfUploader';
import SummaryView from './components/SummaryView';
import CodeGeneratorView from './components/CodeGeneratorView';
import ApiKeySettings from './components/ApiKeySettings';
import { ErrorBoundary } from './components/ErrorBoundary';
import { SavedAnalysis, AnalysisResult } from './types';
import { analyzeResearchPaper } from './utils/geminiService';
import { Sparkles, RefreshCw, XCircle, ChevronRight, FileText, CheckCircle2, History, AlertTriangle, Lightbulb, Code, Sliders, Archive } from 'lucide-react';
import JSZip from 'jszip';

const STORAGE_KEY_PREFIX = 'paper2code_';

// Informative messages that cycle to keep users engaged during long scientific papers processing
const REASSURING_MESSAGES = [
  'Reading scholastic publication layout & abstract...',
  'Dissecting academic methodology and theorem parameters...',
  'Synthesizing architectural data flows & system nodes...',
  'Drafting Python software implementation modules...',
  'Configuring pip requirements and library benchmarks...',
  'Refining detailed step-by-step researcher manual instructions...',
  'Double-checking code integrity and structural formats...'
];

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'upload' | 'summary' | 'code' | 'settings'>('dashboard');
  
  // App settings & persistence
  const [apiKey, setApiKey] = useState(() => localStorage.getItem(`${STORAGE_KEY_PREFIX}key`) || '');
  const [selectedModel, setSelectedModel] = useState(() => localStorage.getItem(`${STORAGE_KEY_PREFIX}model`) || 'gemini-2.5-flash');

  // Custom codebase target settings
  const [targetLanguage, setTargetLanguage] = useState(() => localStorage.getItem(`${STORAGE_KEY_PREFIX}lang`) || 'python-pytorch');
  const [archStyle, setArchStyle] = useState(() => localStorage.getItem(`${STORAGE_KEY_PREFIX}arch`) || 'modular');
  const [customDirectives, setCustomDirectives] = useState(() => localStorage.getItem(`${STORAGE_KEY_PREFIX}directives`) || '');
  
  // Historical data persistence
  const [savedAnalyses, setSavedAnalyses] = useState<SavedAnalysis[]>(() => {
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY_PREFIX}analyses`);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Currently viewing paper state
  const [selectedAnalysisId, setSelectedAnalysisId] = useState<string | null>(() => {
    const historical = localStorage.getItem(`${STORAGE_KEY_PREFIX}analyses`);
    if (historical) {
      try {
        const parsed: SavedAnalysis[] = JSON.parse(historical);
        return parsed.length > 0 ? parsed[0].id : null;
      } catch {
        return null;
      }
    }
    return null;
  });

  // Current upload processing states
  const [extractedPdfText, setExtractedPdfText] = useState('');
  const [uploadedMeta, setUploadedMeta] = useState<{ fileName: string; fileSize: string; pageCount: number } | null>(null);

  // Gemini network activity indicators
  const [analyzingState, setAnalyzingState] = useState<'idle' | 'generating' | 'error'>('idle');
  const [analysisError, setAnalysisError] = useState('');
  const [loadingMsgIndex, setLoadingMsgIndex] = useState(0);
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  // Simple feedback notification ribbon
  const [toast, setToast] = useState<{ show: boolean; msg: string; type: 'success' | 'error' | 'info' }>({
    show: false,
    msg: '',
    type: 'success'
  });

  const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ show: true, msg, type });
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
    }, 4000);
  };

  const [isZipping, setIsZipping] = useState(false);

  const handleDownloadAllAsZip = async () => {
    if (!activeAnalysis) return;
    setIsZipping(true);
    try {
      const zip = new JSZip();
      const codeName = activeAnalysis.analysis.codeFileName || 'main.py';
      const configName = activeAnalysis.analysis.configFileName || 'requirements.txt';
      
      zip.file(codeName, activeAnalysis.analysis.pythonSkeleton);
      zip.file(configName, activeAnalysis.analysis.requirements);
      zip.file('README.md', activeAnalysis.analysis.readme);
      zip.file('setup_workspace.sh', activeAnalysis.analysis.setupInstructions);
      zip.file('workspace_tree.txt', activeAnalysis.analysis.folderStructure);
      
      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = `workspace_project_${codeName.split('.')[0] || 'code'}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showToast('Project ZIP created and downloaded successfully!', 'success');
    } catch (err) {
      console.error('Failed to package project file collection:', err);
      showToast('Failed to build project standard archive.', 'error');
    } finally {
      setIsZipping(false);
    }
  };

  // Re-evaluating local storage whenever lists alter
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}analyses`, JSON.stringify(savedAnalyses));
  }, [savedAnalyses]);

  // Sync code customization preferences
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}lang`, targetLanguage);
    localStorage.setItem(`${STORAGE_KEY_PREFIX}arch`, archStyle);
    localStorage.setItem(`${STORAGE_KEY_PREFIX}directives`, customDirectives);
  }, [targetLanguage, archStyle, customDirectives]);

  // Sync settings when key changes
  const handleSaveApiKey = (key: string) => {
    setApiKey(key);
    localStorage.setItem(`${STORAGE_KEY_PREFIX}key`, key);
    showToast('Gemini API key saved and validated successfully!', 'success');
  };

  const handleDeleteApiKey = () => {
    setApiKey('');
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}key`);
    showToast('Your stored API Key has been wiped.', 'info');
  };

  const handleModelChange = (model: string) => {
    setSelectedModel(model);
    localStorage.setItem(`${STORAGE_KEY_PREFIX}model`, model);
    showToast(`Switched preferred engine to ${model === 'gemini-3.5-flash' ? 'Gemini 3.5' : 'Gemini 2.5'} Flash.`, 'info');
  };

  // Triggers reassuring cycle intervals on loader screens
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (analyzingState === 'generating') {
      timer = setInterval(() => {
        setLoadingMsgIndex((prev) => (prev + 1) % REASSURING_MESSAGES.length);
      }, 5000);
    }
    return () => clearInterval(timer);
  }, [analyzingState]);

  // Triggers clean client-side PDF text extraction
  const handlePdfExtractionCompleted = (
    text: string,
    meta: { fileName: string; fileSize: string; pageCount: number }
  ) => {
    setExtractedPdfText(text);
    setUploadedMeta(meta);
    
    // Automatically boot Gemini analyzer pipeline
    triggerGeminiAnalysis(text, meta);
  };

  // Core Gemini API Execution routine
  const triggerGeminiAnalysis = async (
    text: string,
    meta: { fileName: string; fileSize: string; pageCount: number }
  ) => {
    if (!apiKey) {
      showToast('Action Failed: Missing Gemini credentials keys.', 'error');
      setAnalyzingState('error');
      setAnalysisError('No Gemini API Key found. Navigate to settings first.');
      return;
    }

    setAnalyzingState('generating');
    setAnalysisError('');
    setLoadingMsgIndex(0);

    // Initializing request canceller abort controller
    const controller = new AbortController();
    setAbortController(controller);

    try {
      const analysisReport: AnalysisResult = await analyzeResearchPaper(
        text,
        apiKey,
        selectedModel,
        targetLanguage,
        archStyle,
        customDirectives,
        controller.signal
      );

      // Successfully processed! Build record payload
      const payload: SavedAnalysis = {
        id: `paper_${Date.now()}`,
        date: new Date().toISOString(),
        metadata: {
          title: analysisReport.summary.split('\n')[0].replace(/[#*`_]+/g, '').trim() || 'Research paper report',
          authors: 'Identified via AI summary module',
          abstract: 'Dissected paper abstraction sequence',
          fileName: meta.fileName,
          fileSize: meta.fileSize,
          extractedTextLength: text.length
        },
        analysis: analysisReport
      };

      setSavedAnalyses((prev) => [payload, ...prev]);
      setSelectedAnalysisId(payload.id);
      
      showToast('Scholastic paper processed successfully!', 'success');
      setAnalyzingState('idle');
      
      // Navigate user automatically to the reports review
      setActiveTab('summary');

    } catch (err: any) {
      if (err.name !== 'AbortError' && err.message !== 'Analysis was cancelled by the user.') {
        console.error('Gemini extraction runtime crash:', err);
        setAnalyzingState('error');
        setAnalysisError(err.message || 'An error triggered during paper analysis. Verify your network or key boundary conditions.');
        showToast(err.message || 'Report packaging error.', 'error');
      }
    } finally {
      setAbortController(null);
    }
  };

  // Stop analysis trigger (AbortController cancel)
  const handleCancelAnalysis = () => {
    if (abortController) {
      abortController.abort();
      setAnalyzingState('idle');
      showToast('Paper analysis process aborted by user.', 'info');
    }
  };

  // Historic Workspace CRUD operations
  const handleDeleteAnalysis = (id: string) => {
    if (window.confirm('Delete this analysed paper record from history?')) {
      const updated = savedAnalyses.filter((item) => item.id !== id);
      setSavedAnalyses(updated);
      
      if (selectedAnalysisId === id) {
        setSelectedAnalysisId(updated.length > 0 ? updated[0].id : null);
      }
      showToast('Record deleted relative to local cache index.', 'info');
    }
  };

  const handleRateAnalysis = (id: string, rating: number) => {
    setSavedAnalyses((prev) =>
      prev.map((item) => (item.id === id ? { ...item, rating } : item))
    );
    showToast(`Rated report ${rating} stars!`, 'success');
  };

  // Select a past paper report
  const handleSelectAnalysis = (id: string) => {
    setSelectedAnalysisId(id);
    setActiveTab('summary');
  };

  // Resolve current active viewing analysis object references
  const activeAnalysis = savedAnalyses.find((item) => item.id === selectedAnalysisId);

  return (
    <ErrorBoundary>
      <Layout
        activeTab={activeTab}
        onTabChange={setActiveTab}
        apiKeyExists={!!apiKey}
        selectedModel={selectedModel}
      >
        {/* Dynamic Toast banner notification ribbon */}
        {toast.show && (
          <div className="fixed bottom-5 right-5 z-50 p-4 rounded-xl border flex items-center gap-3 animate-slide-up shadow-2xl select-none max-w-sm bg-slate-950 border-violet-500/20 text-violet-400">
            <CheckCircle2 size={18} className="text-violet-400 shrink-0" />
            <div className="text-xs font-semibold leading-relaxed text-slate-200">{toast.msg}</div>
          </div>
        )}

        {/* --- MAIN TAB CONTENT ROUTER GRID --- */}

        {/* A. VIEWING GENERATION ACTIVE PROGRESS */}
        {analyzingState === 'generating' && (
          <div className="max-w-xl mx-auto py-12 text-center space-y-8 select-none">
            <div className="relative inline-flex items-center justify-center">
              <span className="absolute animate-ping inline-flex h-16 w-16 rounded-full bg-violet-500/10 opacity-75"></span>
              <div className="p-5 bg-gradient-to-tr from-violet-600/20 to-fuchsia-500/20 text-violet-400 rounded-3xl animate-spin animate-duration-3000 border border-violet-500/10 shadow-lg shadow-violet-500/5">
                <RefreshCw size={36} />
              </div>
            </div>

            <div className="space-y-3">
              <h2 className="text-xl font-extrabold tracking-tight text-white flex items-center justify-center gap-2">
                <Sparkles className="text-amber-400 animate-pulse" size={20} />
                <span>Gemini is Dissecting Paper</span>
              </h2>
              
              <div className="bg-slate-850 p-4 border border-slate-800/80 rounded-2xl min-h-[64px] flex items-center justify-center transition-all">
                <p className="text-slate-300 text-sm font-semibold italic">
                  "{REASSURING_MESSAGES[loadingMsgIndex]}"
                </p>
              </div>
              
              <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                Analyzing advanced methodologies, formulating functional schemas, and compiling executable code modules usually completes within 30 to 60 seconds.
              </p>
            </div>

            <button
              onClick={handleCancelAnalysis}
              id="cancel-generation-btn"
              className="px-5 py-2.5 bg-slate-800 hover:bg-rose-500/10 hover:border-rose-500/30 font-bold text-xs text-slate-400 hover:text-rose-400 border border-slate-700/60 rounded-xl transition-all flex items-center gap-2 mx-auto cursor-pointer"
            >
              <XCircle size={14} />
              Abort Operation
            </button>
          </div>
        )}

        {/* B. REPORT FAILURE STATE */}
        {analyzingState === 'error' && (
          <div className="max-w-md mx-auto py-12 text-center space-y-6 select-none">
            <div className="p-4 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-2xl inline-block">
              <AlertTriangle size={36} />
            </div>

            <div className="space-y-2">
              <h3 className="font-extrabold text-white text-base">Scientific Analysis Failed</h3>
              <p className="text-rose-300 text-xs leading-relaxed bg-slate-950/40 p-3 rounded-xl border border-rose-500/10 font-mono">
                {analysisError}
              </p>
            </div>

            <div className="flex gap-3 justify-center pt-2">
              <button
                onClick={() => { setAnalyzingState('idle'); setActiveTab('settings'); }}
                id="edit-keys-fail-btn"
                className="py-2 px-4 rounded-xl border border-slate-700 bg-slate-880 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Configure Settings Key
              </button>
              
              <button
                onClick={() => { setAnalyzingState('idle'); setActiveTab('upload'); }}
                id="retry-upload-fail-btn"
                className="py-2 px-4 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold cursor-pointer"
              >
                Re-upload Paper
              </button>
            </div>
          </div>
        )}

        {/* C. THE CORE ROUTED TAB PANELS */}
        {analyzingState === 'idle' && (
          <>
            {/* 1. PAPER DASHBOARD PANEL */}
            {activeTab === 'dashboard' && (
              <div className="space-y-8 select-none">
                <div className="flex justify-between items-center bg-slate-900 border-b border-slate-800 pb-5">
                  <div>
                    <h1 className="text-2xl font-black text-white tracking-tight">Paper2Code Workspace</h1>
                    <p className="text-slate-400 text-xs md:text-sm mt-1">
                      Upload papers to instantly translate intricate AI research pipelines into executable files and roadmaps.
                    </p>
                  </div>
                  
                  <button
                    onClick={() => setActiveTab('upload')}
                    id="new-parsing-dash-btn"
                    className="py-2.5 px-4 bg-violet-600 hover:bg-violet-500 active:bg-violet-700 text-white font-semibold text-xs rounded-xl transition-all shadow-md shadow-violet-600/10 hover:shadow-violet-500/25 active:shadow-none flex items-center gap-1.5 cursor-pointer leading-none"
                  >
                    <Sparkles size={14} />
                    <span>Transcribe Paper</span>
                  </button>
                </div>

                <SavedAnalysesList
                  items={savedAnalyses}
                  onSelectItem={handleSelectAnalysis}
                  onDeleteItem={handleDeleteAnalysis}
                  onRateItem={handleRateAnalysis}
                />
              </div>
            )}

            {/* 2. UPLOAD PAPER PANEL */}
            {activeTab === 'upload' && (
              <div className="space-y-6">
                <div className="text-center space-y-2 select-none">
                  <h1 className="text-xl md:text-2xl font-black text-white tracking-tight">Analyze Research Publication</h1>
                  <p className="text-slate-400 text-xs md:text-sm max-w-lg mx-auto leading-relaxed">
                    Upload your publication in PDF. Gemini is leveraged to dissect math methodologies and structure a tailored implementation skeleton.
                  </p>
                </div>

                {/* Visual Settings control card */}
                <div className="bg-slate-850 border border-slate-700/60 rounded-2xl p-5 shadow-lg max-w-2xl mx-auto space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-800 pb-3 select-none">
                    <Sliders className="text-violet-400 shrink-0" size={16} />
                    <h3 className="text-[10px] font-black text-white uppercase tracking-wider block">Configure Destination Code Structure</h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5 text-left">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block select-none">Target Framework / Language</label>
                      <select
                        value={targetLanguage}
                        onChange={(e) => setTargetLanguage(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500 cursor-pointer"
                      >
                        <option value="python-pytorch">Python + PyTorch Ecosystem</option>
                        <option value="python-tensorflow">Python + TensorFlow Suite</option>
                        <option value="typescript-node">TypeScript + Node.js (Fullstack / Scripts)</option>
                        <option value="rust-burn">Rust + Burn Framework / Candle</option>
                        <option value="cpp-eigen">C++ + Eigen Library / LibTorch</option>
                        <option value="python-jax">Python + JAX / Flax Optimizations</option>
                      </select>
                    </div>

                    <div className="space-y-1.5 text-left">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block select-none">Architectural Design Style</label>
                      <select
                        value={archStyle}
                        onChange={(e) => setArchStyle(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500 cursor-pointer"
                      >
                        <option value="modular">Modular Multi-File Packaging</option>
                        <option value="monolithic">Single Autonomous Compiled Script</option>
                        <option value="microservices">REST Microservices & Container Configs</option>
                        <option value="notebook">Interactive Jupyter Notebook Workspace</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-left">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block select-none">Custom Programming Guidelines (Optional)</label>
                    <textarea
                      value={customDirectives}
                      onChange={(e) => setCustomDirectives(e.target.value)}
                      placeholder="e.g., Optimize performance speed with CUDA support, write comprehensive math details, leverage Hugging Face APIs..."
                      className="w-full h-18 bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-violet-500 resize-none placeholder:text-slate-500 text-left"
                    />
                  </div>
                </div>

                <PdfUploader
                  apiKeyExists={!!apiKey}
                  onExtractionCompleted={handlePdfExtractionCompleted}
                  onNavigateToSettings={() => setActiveTab('settings')}
                />
              </div>
            )}

            {/* 3. EXECUTIVE SUMMARY REPORT VIEW */}
            {activeTab === 'summary' && (
              <div className="space-y-6">
                {activeAnalysis ? (
                  <div className="space-y-6">
                    {/* Header item displaying file info */}
                    <div className="bg-slate-850 p-5 border border-slate-700/60 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-md select-none">
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="p-3 bg-slate-800 rounded-xl text-violet-400 shrink-0 border border-slate-700/60">
                          <FileText size={24} />
                        </div>
                        <div className="space-y-1 min-w-0">
                          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block leading-none">CURRENT REPOSITORY</span>
                          <h2 className="text-sm md:text-base font-black text-white leading-tight truncate pr-4">
                            {activeAnalysis.metadata.fileName}
                          </h2>
                          <p className="text-[10px] text-slate-400 font-medium">
                            Dissected on {new Date(activeAnalysis.date).toLocaleDateString()} &bull; Size: {activeAnalysis.metadata.fileSize}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-2.5 w-full md:w-auto">
                        <button
                          onClick={handleDownloadAllAsZip}
                          disabled={isZipping}
                          id="summary-download-zip-btn"
                          className="w-full md:w-auto py-2.5 px-4 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-800 text-slate-300 hover:text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                        >
                          {isZipping ? <Archive className="animate-pulse text-violet-400" size={14} /> : <Archive size={14} />}
                          <span>{isZipping ? 'Creating ZIP...' : 'Download ZIP Package'}</span>
                        </button>

                        <button
                          onClick={() => setActiveTab('code')}
                          id="code-generator-report-btn"
                          className="w-full md:w-auto py-2.5 px-4.5 bg-violet-600 hover:bg-violet-500 active:bg-violet-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-violet-600/10 leading-none"
                        >
                          <span>View Source Skeletons</span>
                          <ChevronRight size={14} />
                        </button>
                      </div>
                    </div>

                    <SummaryView
                      summary={activeAnalysis.analysis.summary}
                      contributions={activeAnalysis.analysis.contributions}
                      methodology={activeAnalysis.analysis.methodology}
                      architecture={activeAnalysis.analysis.architecture}
                      roadmap={activeAnalysis.analysis.roadmap}
                    />
                  </div>
                ) : (
                  <div className="bg-slate-850 border border-slate-700/60 rounded-2xl p-12 text-center space-y-4 shadow-md select-none">
                    <div className="mx-auto w-12 h-12 bg-slate-800 border border-slate-700 rounded-xl flex items-center justify-center text-slate-400">
                      <FileText size={20} />
                    </div>
                    <div className="space-y-1 max-w-sm mx-auto">
                      <h4 className="font-bold text-slate-300 text-sm">No Paper Selected</h4>
                      <p className="text-slate-500 text-xs leading-normal">
                        Select a previously analyzed publication from the index or upload a new PDF to compile active analytics!
                      </p>
                    </div>
                    <button
                      onClick={() => setActiveTab('dashboard')}
                      id="view-publications-report-btn"
                      className="mt-4 px-4 py-2 bg-slate-800 border border-slate-700 hover:bg-slate-700 rounded-xl font-bold text-xs text-slate-350 hover:text-white transition-all cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <History size={12} />
                      Browse Catalog History
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* 4. CODE WORKSPACE VIEW */}
            {activeTab === 'code' && (
              <div className="space-y-6">
                {activeAnalysis ? (
                  <div className="space-y-6">
                    {/* Header item displaying file info */}
                    <div className="bg-slate-850 p-5 border border-slate-700/60 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-md select-none">
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="p-3 bg-slate-800 rounded-xl text-violet-400 shrink-0 border border-slate-700/60">
                          <Code size={24} />
                        </div>
                        <div className="space-y-1 min-w-0">
                          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block leading-none">CODE MODULE BUILDER</span>
                          <h2 className="text-sm md:text-base font-black text-white leading-tight truncate pr-4">
                            Generated logic for {activeAnalysis.metadata.fileName}
                          </h2>
                          <p className="text-[10px] text-slate-400 font-medium">
                            Synthesized template code ready for download
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => setActiveTab('summary')}
                        id="return-report-btn"
                        className="w-full md:w-auto py-2.5 px-4 bg-slate-800 hover:bg-slate-700/80 hover:text-white border border-slate-750 text-slate-400 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1 cursor-pointer leading-none"
                      >
                        <span>Return to Report</span>
                      </button>
                    </div>

                    <CodeGeneratorView
                      pythonSkeleton={activeAnalysis.analysis.pythonSkeleton}
                      folderStructure={activeAnalysis.analysis.folderStructure}
                      requirements={activeAnalysis.analysis.requirements}
                      readme={activeAnalysis.analysis.readme}
                      setupInstructions={activeAnalysis.analysis.setupInstructions}
                      codeFileName={activeAnalysis.analysis.codeFileName}
                      configFileName={activeAnalysis.analysis.configFileName}
                    />
                  </div>
                ) : (
                  <div className="bg-slate-850 border border-slate-700/60 rounded-2xl p-12 text-center space-y-4 shadow-md select-none">
                    <div className="mx-auto w-12 h-12 bg-slate-800 border border-slate-700 rounded-xl flex items-center justify-center text-slate-400">
                      <Code size={20} />
                    </div>
                    <div className="space-y-1 max-w-sm mx-auto">
                      <h4 className="font-bold text-slate-300 text-sm">No Compiled Code Skeletons</h4>
                      <p className="text-slate-500 text-xs leading-normal">
                        Upload or select a scientific paper report to see and download custom Python code skeletons, folder trees, and manuals!
                      </p>
                    </div>
                    <button
                      onClick={() => setActiveTab('upload')}
                      id="upload-paper-code-btn"
                      className="mt-4 px-4 py-2 bg-violet-600 hover:bg-violet-500 rounded-xl font-bold text-xs text-white transition-all cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <Sparkles size={12} />
                      Analyze New Publication
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* 5. CONFIGURATION SETTINGS PANEL */}
            {activeTab === 'settings' && (
              <ApiKeySettings
                currentKey={apiKey}
                selectedModel={selectedModel}
                onSaveKey={handleSaveApiKey}
                onDeleteKey={handleDeleteApiKey}
                onModelChange={handleModelChange}
              />
            )}
          </>
        )}
      </Layout>
    </ErrorBoundary>
  );
}
