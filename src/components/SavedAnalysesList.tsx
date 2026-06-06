/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { SavedAnalysis } from '../types';
import { Search, Trash2, Calendar, FileText, Star, Cpu, BookOpen, ChevronRight, BarChart3, HelpCircle } from 'lucide-react';

interface SavedAnalysesListProps {
  items: SavedAnalysis[];
  onSelectItem: (id: string) => void;
  onDeleteItem: (id: string) => void;
  onRateItem: (id: string, rating: number) => void;
}

export default function SavedAnalysesList({
  items,
  onSelectItem,
  onDeleteItem,
  onRateItem
}: SavedAnalysesListProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Apply visual rating stars
  const renderRatingStars = (itemId: string, currentRating = 0) => {
    return (
      <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
        {[1, 2, 3, 4, 5].map((starValue) => (
          <button
            key={starValue}
            onClick={() => onRateItem(itemId, starValue)}
            className={`p-0.5 hover:scale-110 active:scale-95 transition-all focus:outline-none cursor-pointer ${
              starValue <= currentRating ? 'text-amber-400' : 'text-slate-600 hover:text-amber-500/50'
            }`}
            title={`Rate ${starValue} stars`}
          >
            <Star size={13} fill={starValue <= currentRating ? 'currentColor' : 'none'} />
          </button>
        ))}
      </div>
    );
  };

  const filteredItems = items.filter(
    (item) =>
      item.metadata.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.metadata.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Compute stats helper
  const totalAnalyzed = items.length;
  const averageRating =
    items.reduce((acc, item) => acc + (item.rating || 0), 0) /
    (items.filter((item) => item.rating).length || 1);

  return (
    <div className="space-y-6">
      {/* 1. Statistics bento grid layout */}
      {items.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-850 border border-slate-700/50 rounded-xl p-4 flex items-center gap-3.5 shadow-md relative overflow-hidden select-none">
            <div className="p-2.5 bg-violet-500/10 text-violet-400 rounded-lg">
              <BookOpen size={20} />
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">TOTAL PAPERS</div>
              <div className="text-xl font-extrabold text-white mt-1 leading-none">{totalAnalyzed}</div>
            </div>
            <div className="absolute top-0 right-0 w-20 h-20 bg-violet-500/5 shadow-[inset_0_0_12px_rgba(139,92,246,0.1)] rounded-full blur-xl -mr-6 -mt-6 pointer-events-none" />
          </div>

          <div className="bg-slate-850 border border-slate-700/50 rounded-xl p-4 flex items-center gap-3.5 shadow-md relative overflow-hidden select-none">
            <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-lg">
              <Star size={20} fill="currentColor" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">AVG WORKSPACE RATING</div>
              <div className="text-xl font-extrabold text-white mt-1 leading-none">
                {items.some((i) => i.rating) ? `${averageRating.toFixed(1)} / 5.0` : 'N/A'}
              </div>
            </div>
            <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/5 rounded-full blur-xl -mr-6 -mt-6 pointer-events-none" />
          </div>

          <div className="bg-slate-850 border border-slate-700/50 rounded-xl p-4 flex items-center gap-3.5 shadow-md relative overflow-hidden select-none">
            <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-lg">
              <BarChart3 size={20} />
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">LARGEST EXTRACTION</div>
              <div className="text-sm font-bold text-white mt-1 leading-none truncate max-w-[120px]" title={items.reduce((max, i) => i.metadata.fileName.length > max.length ? i.metadata.fileName : max, '').substring(0, 30)}>
                {items.reduce((max, i) => i.metadata.extractedTextLength > max.metadata.extractedTextLength ? i : max, items[0]).metadata.fileName}
              </div>
            </div>
            <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-500/5 rounded-full blur-xl -mr-6 -mt-6 pointer-events-none" />
          </div>
        </div>
      )}

      {/* 2. Text Search Input */}
      {items.length > 0 ? (
        <div className="relative rounded-xl shadow-inner bg-slate-900/40">
          <input
            type="text"
            placeholder="Search scholastic papers or summaries by keywords..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-transparent border border-slate-700/80 rounded-xl focus:border-violet-500 focus:ring-1 focus:ring-violet-500 text-slate-200 placeholder-slate-500 text-xs md:text-sm leading-relaxed transition-all input-raw animate-fade-in"
          />
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
        </div>
      ) : (
        /* Empty layout placeholder */
        <div className="bg-slate-850 border border-slate-700/60 rounded-2xl p-10 text-center space-y-4 shadow-md select-none">
          <div className="mx-auto w-12 h-12 bg-slate-800 border border-slate-700 rounded-xl flex items-center justify-center text-slate-500">
            <Search size={20} />
          </div>
          <div className="space-y-1 max-w-sm mx-auto">
            <h4 className="font-bold text-slate-300 text-sm">No Papers Dissected Yet</h4>
            <p className="text-slate-500 text-xs leading-normal">
              You haven't uploaded any research publications. Parse your first article, and it will be indexed in your workspace history for immediate access!
            </p>
          </div>
        </div>
      )}

      {/* 3. Filtered workspace list cards */}
      {filteredItems.length > 0 && (
        <div className="space-y-3.5">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              onClick={() => onSelectItem(item.id)}
              className="group bg-slate-850 border border-slate-700/60 hover:border-violet-500/50 rounded-xl p-4.5 shadow-md flex items-center justify-between gap-4 cursor-pointer hover:shadow-lg hover:shadow-violet-500/5 transition-all"
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="p-2.5 bg-slate-800 border border-slate-700/60 text-violet-400 group-hover:text-white rounded-lg group-hover:bg-violet-600 group-hover:shadow-[0_0_10px_rgba(139,92,246,0.3)] transition-colors shrink-0">
                  <FileText size={18} />
                </div>
                
                <div className="space-y-1 min-w-0">
                  <h4 className="font-bold text-white text-xs md:text-sm truncate pr-2 group-hover:text-violet-300 transition-colors">
                    {item.metadata.fileName}
                  </h4>
                  
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-slate-400 leading-normal">
                    <span className="flex items-center gap-1 font-medium">
                      <Calendar size={11} />
                      {new Date(item.date).toLocaleDateString()}
                    </span>
                    <span className="bg-slate-800 px-1.5 py-0.5 rounded text-[9px] font-semibold text-slate-400 border border-slate-700/20">
                      {(item.metadata.extractedTextLength / 1000).toFixed(1)}k Chars
                    </span>
                    <span className="text-slate-500 hidden sm:inline">|</span>
                    <span className="text-slate-400 italic truncate max-w-[200px] hidden sm:inline">
                      {item.metadata.title ? item.metadata.title.substring(0, 45) + '...' : 'Untitled Analysis'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action buttons (Rating + Deletion) */}
              <div className="flex items-center gap-3 shrink-0">
                <div className="hidden md:block">
                  {renderRatingStars(item.id, item.rating)}
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteItem(item.id);
                    }}
                    className="p-1.5 bg-slate-800 hover:bg-rose-500/10 hover:border-rose-500/30 text-slate-400 hover:text-rose-400 rounded-lg transition-all cursor-pointer"
                    title="Delete record from workspace"
                  >
                    <Trash2 size={13} />
                  </button>

                  <div className="p-1 bg-slate-800/40 text-slate-500 group-hover:text-white group-hover:bg-violet-600/10 rounded-lg transition-all hidden sm:block">
                    <ChevronRight size={14} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Query matching fallback */}
      {searchQuery && filteredItems.length === 0 && (
        <div className="text-center p-6 text-slate-500 text-xs leading-normal">
          No records in your history match "{searchQuery}".
        </div>
      )}
    </div>
  );
}
