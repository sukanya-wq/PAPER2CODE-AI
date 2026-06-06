/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, AlertTriangle, RefreshCw, AlertCircle, X, HelpCircle } from 'lucide-react';
import { extractTextFromPdf } from '../utils/pdfParser';

interface PdfUploaderProps {
  apiKeyExists: boolean;
  onExtractionCompleted: (pdfText: string, metadata: { fileName: string; fileSize: string; pageCount: number }) => void;
  onNavigateToSettings: () => void;
}

export default function PdfUploader({
  apiKeyExists,
  onExtractionCompleted,
  onNavigateToSettings
}: PdfUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [loadingStep, setLoadingStep] = useState<'idle' | 'uploading' | 'parsing' | 'completed' | 'error'>('idle');
  const [progressPercent, setProgressPercent] = useState(0);
  const [progressMsg, setProgressMsg] = useState('');
  const [errorHeader, setErrorHeader] = useState('');
  const [errorDetail, setErrorDetail] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (apiKeyExists) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (!apiKeyExists) return;

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const triggerFileSelect = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const processFile = async (file: File) => {
    // 1. Validate extension
    if (file.type !== 'application/pdf' && !file.name.endsWith('.pdf')) {
      setErrorHeader('Unsupported File Type');
      setErrorDetail('Paper2Code AI accepts PDF files only. Please upload a scholastic research paper (.pdf).');
      setLoadingStep('error');
      return;
    }

    // 2. Validate Size (Max 25MB to prevent memory crashes on client side)
    const MAX_SIZE = 25 * 1024 * 1024; // 25 MB
    if (file.size > MAX_SIZE) {
      setErrorHeader('File Size Exceeded');
      setErrorDetail(`The uploaded file is ${formatBytes(file.size)}. Paper2Code AI has a client side size threshold of 25MB to prevent tab freezing. If your paper features heavy embedded assets, try compressing it.`);
      setLoadingStep('error');
      return;
    }

    // Reset status
    setLoadingStep('uploading');
    setProgressPercent(10);
    setProgressMsg('Reading local file buffer...');
    setErrorHeader('');
    setErrorDetail('');

    try {
      // Small simulated delay for local smooth transitions
      await new Promise(resolve => setTimeout(resolve, 300));

      const reader = new FileReader();
      
      reader.onload = async (e) => {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        if (!arrayBuffer) {
          setErrorHeader('Buffer Error');
          setErrorDetail('Failed to decode file into array buffer. Please ensure this file is not locked or corrupted.');
          setLoadingStep('error');
          return;
        }

        try {
          setLoadingStep('parsing');
          const extractedText = await extractTextFromPdf(arrayBuffer, (prog) => {
            setProgressPercent(prog.percent);
            setProgressMsg(
              prog.stage === 'loading'
                ? 'Downloading PDF decompression engine...'
                : `Extracting paper content: Page ${prog.pageCurrent} / ${prog.pageTotal}`
            );
          });
          
          setLoadingStep('completed');
          onExtractionCompleted(extractedText, {
            fileName: file.name,
            fileSize: formatBytes(file.size),
            pageCount: progressPercent, // approximate reference
          });

        } catch (err: any) {
          console.error('PDF extract error:', err);
          setErrorHeader('Text Extraction Failed');
          setErrorDetail(err.message || 'The PDF structure is too dense or consists solely of images. Please make sure the PDF has select-copyable text layout.');
          setLoadingStep('error');
        }
      };

      reader.onerror = () => {
        setErrorHeader('File Access Failed');
        setErrorDetail('The browser cannot access this file. Try copying it to your desktop and uploading again.');
        setLoadingStep('error');
      };

      reader.readAsArrayBuffer(file);

    } catch (err: any) {
      setErrorHeader('Parsing Engine Failed');
      setErrorDetail(err.message || 'An unexpected failure happened during initialization. Try refreshing your webpage.');
      setLoadingStep('error');
    }
  };

  const handleReset = () => {
    setLoadingStep('idle');
    setProgressPercent(0);
    setProgressMsg('');
    setErrorHeader('');
    setErrorDetail('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* 1. Missing Key Notice Banner */}
      {!apiKeyExists && (
        <div className="mb-6 p-5 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fade-in">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl shrink-0">
              <AlertTriangle size={24} />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-sm">Gemini API Key Required</h3>
              <p className="text-slate-400 text-xs mt-1 leading-relaxed max-w-md">
                You must hook up a verified Gemini API key before parsing papers. Click settings to introduce your key safely.
              </p>
            </div>
          </div>
          <button
            onClick={onNavigateToSettings}
            id="redirect-settings-btn"
            className="w-full sm:w-auto px-4 py-2 bg-amber-600 hover:bg-amber-500 font-semibold text-xs text-white rounded-xl transition-all shadow-md shadow-amber-600/15 cursor-pointer text-center"
          >
            Configure Settings
          </button>
        </div>
      )}

      {/* 2. File drop box / progress interface */}
      <div className="bg-slate-850 border border-slate-700/60 rounded-2xl p-6 shadow-xl relative min-h-[340px] flex flex-col justify-center">
        {loadingStep === 'idle' && (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={apiKeyExists ? triggerFileSelect : undefined}
            id="drag-drop-zone"
            className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center transition-all duration-300 relative group select-none ${
              !apiKeyExists
                ? 'border-slate-800 opacity-60 cursor-not-allowed'
                : isDragging
                ? 'border-violet-500 bg-violet-500/5'
                : 'border-slate-700/80 hover:border-slate-600 bg-slate-900/10 hover:bg-slate-900/30 cursor-pointer'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              className="hidden"
              disabled={!apiKeyExists}
            />

            <div className={`p-4 rounded-full mb-4 transition-all duration-300 ${
              isDragging ? 'bg-violet-500/15 text-violet-400 scale-110 shadow-[0_0_15px_rgba(139,92,246,0.2)]' : 'bg-slate-800 text-slate-400 group-hover:scale-105 group-hover:bg-slate-700 group-hover:text-slate-300 group-hover:shadow-[0_0_12px_rgba(139,92,246,0.1)]'
            }`}>
              <UploadCloud size={32} />
            </div>

            <div className="space-y-2">
              <h3 className="font-bold text-slate-200 text-base leading-tight">
                {isDragging ? 'Drop research paper here' : 'Select Research PDF'}
              </h3>
              <p className="text-slate-400 text-xs leading-relaxed max-w-xs mx-auto">
                Drag and drop your scholastic PDF here or <span className="text-violet-400 font-medium group-hover:underline">browse files</span>. Limit 25MB.
              </p>
            </div>

            {/* Hint tag */}
            <div className="mt-6 flex items-center gap-1.5 text-[10px] text-slate-500">
              <FileText size={12} />
              <span>Parsed locally in-browser safely. Data never leaves your box.</span>
            </div>
          </div>
        )}

        {/* Uploading & Extraction Engine Loader Screen */}
        {(loadingStep === 'uploading' || loadingStep === 'parsing') && (
          <div className="flex flex-col items-center justify-center text-center p-6 space-y-6 animate-fade-in">
            <div className="relative w-16 h-16 flex items-center justify-center">
              <span className="absolute animate-ping inline-flex h-full w-full rounded-full bg-violet-500/10 opacity-75"></span>
              <div className="p-4 bg-violet-500/10 text-violet-400 rounded-2xl animate-spin animate-duration-3000 border border-violet-500/20 shadow-[0_0_15px_rgba(139,92,246,0.15)]">
                <RefreshCw size={28} />
              </div>
            </div>

            <div className="space-y-2 w-full max-w-sm">
              <h4 className="font-bold text-slate-200 text-sm leading-tight">
                {loadingStep === 'uploading' ? 'Reading scholastic index...' : 'Dissecting paper structure...'}
              </h4>
              <p className="text-slate-400 text-xs truncate">{progressMsg}</p>
            </div>

            {/* Custom progress rail */}
            <div className="w-full max-w-sm">
              <div className="flex justify-between items-center text-[10px] text-slate-400 mb-1.5 font-medium font-mono">
                <span>PROGRESS</span>
                <span>{progressPercent}%</span>
              </div>
              <div className="w-full bg-slate-900 border border-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-violet-600 to-fuchsia-500 h-full rounded-full transition-all duration-300 shadow-[0_0_8px_rgba(139,92,246,0.5)]"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Error screen */}
        {loadingStep === 'error' && (
          <div className="p-6 flex flex-col items-center text-center space-y-5 animate-fade-in relative">
            <button
              onClick={handleReset}
              id="close-error-btn"
              className="absolute top-2 right-2 p-1.5 text-slate-500 hover:text-slate-300 rounded-full hover:bg-slate-800 transition-colors cursor-pointer"
              title="Clear error"
            >
              <X size={16} />
            </button>

            <div className="p-3 bg-rose-500/10 text-rose-400 rounded-2xl">
              <AlertCircle size={32} />
            </div>

            <div className="space-y-1.5 max-w-md">
              <h4 className="font-bold text-rose-400 text-base leading-tight">{errorHeader}</h4>
              <p className="text-slate-300 text-xs leading-relaxed">{errorDetail}</p>
            </div>

            <button
              onClick={handleReset}
              id="retry-upload-btn"
              className="mt-2 text-xs py-2 px-4 bg-slate-800 hover:bg-slate-700 active:bg-slate-900 border border-slate-700/60 rounded-xl font-medium text-slate-300 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
            >
              <RefreshCw size={12} />
              Try Another PDF
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
