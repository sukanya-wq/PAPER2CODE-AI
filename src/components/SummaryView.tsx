/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { FileText, Award, Layers, Milestone, Copy, Check, Sliders } from 'lucide-react';
import Markdown from 'react-markdown';

interface SummaryViewProps {
  summary: string;
  contributions: string;
  methodology: string;
  architecture: string;
  roadmap: string;
}

// Custom Premium Styled Markdown Parser to assure elegant visuals
const CustomMarkdown = ({ text }: { text: string }) => {
  return (
    <div className="text-slate-300 text-sm leading-relaxed space-y-3 prose prose-invert max-w-none">
      <Markdown
        components={{
          h1: (props) => <h1 className="text-lg font-bold text-white tracking-tight mt-6 mb-3" {...props} />,
          h2: (props) => <h2 className="text-base font-semibold text-white tracking-tight mt-5 mb-2.5 border-b border-slate-800/80 pb-1" {...props} />,
          h3: (props) => <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider mt-4 mb-1.5" {...props} />,
          p: (props) => <p className="mb-3 text-slate-300 antialiased" {...props} />,
          ul: (props) => <ul className="list-disc pl-5 space-y-1.5 mb-4 text-slate-300" {...props} />,
          ol: (props) => <ol className="list-decimal pl-5 space-y-1.5 mb-4 text-slate-300" {...props} />,
          li: (props) => <li className="pl-0.5 text-slate-350" {...props} />,
          code: (props) => (
            <code className="bg-slate-950/70 px-1.5 py-0.5 rounded text-[11px] font-mono text-violet-300 border border-slate-800" {...props} />
          ),
          pre: (props) => (
            <pre className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/80 text-[11px] font-mono text-slate-200 overflow-x-auto max-w-full my-4 shadow-inner" {...props} />
          ),
          blockquote: (props) => (
            <blockquote className="border-l-3 border-violet-500 bg-slate-900/40 pl-4 py-2 my-2 text-slate-400 rounded-r-lg italic" {...props} />
          ),
        }}
      >
        {text}
      </Markdown>
    </div>
  );
};

export default function SummaryView({
  summary,
  contributions,
  methodology,
  architecture,
  roadmap
}: SummaryViewProps) {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const copySectionToClipboard = (sectionName: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionName);
    setTimeout(() => setCopiedSection(null), 1800);
  };

  const sections = [
    {
      id: 'summary',
      name: 'Executive Summary',
      icon: <FileText size={18} className="text-violet-400" />,
      content: summary,
      bg: 'bg-violet-500/5'
    },
    {
      id: 'contributions',
      name: 'Key Breakthroughs & Contributions',
      icon: <Award size={18} className="text-violet-400" />,
      content: contributions,
      bg: 'bg-indigo-500/5'
    },
    {
      id: 'methodology',
      name: 'Mathematical & Algorithmic Methodology',
      icon: <Sliders size={18} className="text-violet-400" />,
      content: methodology,
      bg: 'bg-teal-500/5'
    },
    {
      id: 'architecture',
      name: 'Module Architecture Flow',
      icon: <Layers size={18} className="text-violet-400" />,
      content: architecture,
      bg: 'bg-blue-500/5'
    },
    {
      id: 'roadmap',
      name: 'Phased Implementation Roadmap',
      icon: <Milestone size={18} className="text-violet-400" />,
      content: roadmap,
      bg: 'bg-purple-500/5'
    }
  ];

  return (
    <div className="space-y-8">
      {sections.map((sec) => (
        <div
          key={sec.id}
          id={`section-${sec.id}`}
          className="bg-slate-850 border border-slate-705/60 rounded-2xl shadow-lg relative overflow-hidden transition-all duration-300 hover:border-slate-700 hover:shadow-violet-500/5"
        >
          {/* Header row */}
          <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/40 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-slate-800 rounded-lg shrink-0 border border-slate-700/50">
                {sec.icon}
              </div>
              <h3 className="font-bold text-white text-sm md:text-base tracking-tight">{sec.name}</h3>
            </div>

            <button
              onClick={() => copySectionToClipboard(sec.id, sec.content)}
              id={`copy-btn-${sec.id}`}
              className="p-1.5 md:py-1.5 md:px-3 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-all text-xs flex items-center gap-1 cursor-pointer"
              title="Copy to clipboard"
            >
              {copiedSection === sec.id ? (
                <>
                  <Check size={13} className="text-violet-400 animate-pulse" />
                  <span className="hidden md:inline text-violet-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy size={13} />
                  <span className="hidden md:inline">Copy</span>
                </>
              )}
            </button>
          </div>

          {/* Block body content */}
          <div className={`p-6 ${sec.bg}`}>
            <CustomMarkdown text={sec.content} />
          </div>
        </div>
      ))}
    </div>
  );
}
