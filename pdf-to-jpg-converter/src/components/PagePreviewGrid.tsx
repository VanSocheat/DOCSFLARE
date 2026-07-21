/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion, AnimatePresence } from 'motion/react';
import { Download, Eye, Check, AlertCircle, RefreshCw } from 'lucide-react';
import { PDFPageItem } from '../types';

interface PagePreviewGridProps {
  pages: PDFPageItem[];
  onToggleSelect: (pageNumber: number) => void;
  onSelectAll: (select: boolean) => void;
  onPreview: (page: PDFPageItem) => void;
  onDownloadSingle: (page: PDFPageItem) => void;
  onRenderSingle: (pageNumber: number) => void;
}

export default function PagePreviewGrid({
  pages,
  onToggleSelect,
  onSelectAll,
  onPreview,
  onDownloadSingle,
  onRenderSingle,
}: PagePreviewGridProps) {
  const selectedCount = pages.filter((p) => p.selected).length;
  const isAllSelected = selectedCount === pages.length && pages.length > 0;

  return (
    <div id="page-preview-grid-section" className="flex flex-col gap-6">
      {/* Grid Headers and Select All Control */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-xl px-5 py-3.5">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 font-display">
            Page Layout Grid ({pages.length} Pages)
          </span>
          <span className="text-xs bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-bold px-2.5 py-0.5 rounded-full">
            {selectedCount} Selected
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onSelectAll(true)}
            className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-semibold"
          >
            Select All
          </button>
          <span className="text-slate-300 dark:text-slate-700">|</span>
          <button
            type="button"
            onClick={() => onSelectAll(false)}
            className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 font-semibold"
          >
            Deselect All
          </button>
        </div>
      </div>

      {/* Pages Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
        <AnimatePresence>
          {pages.map((page) => {
            const isSuccess = page.status === 'success';
            const isPending = page.status === 'pending';
            const isRendering = page.status === 'rendering';
            const isError = page.status === 'error';

            return (
              <motion.div
                key={page.pageNumber}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`relative group bg-white dark:bg-slate-900 border rounded-xl overflow-hidden shadow-xs transition-all duration-300 ${
                  page.selected
                    ? 'border-indigo-500 dark:border-indigo-500/80 ring-1 ring-indigo-500/25 shadow-md shadow-indigo-500/5'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-xs'
                }`}
              >
                {/* Checkbox Overlay Indicator */}
                <button
                  type="button"
                  onClick={() => onToggleSelect(page.pageNumber)}
                  className={`absolute top-2.5 left-2.5 z-10 w-6 h-6 rounded-lg flex items-center justify-center border transition-all duration-200 ${
                    page.selected
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs'
                      : 'bg-white/80 dark:bg-slate-950/80 border-slate-300 dark:border-slate-700 text-transparent hover:border-indigo-400 group-hover:text-slate-300'
                  }`}
                >
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </button>

                {/* Page Number Label */}
                <div className="absolute top-2.5 right-2.5 z-10 bg-slate-900/80 dark:bg-slate-950/90 text-white font-mono text-[10px] font-bold px-2 py-0.5 rounded-md shadow-xs">
                  P. {page.pageNumber}
                </div>

                {/* Main Card Media Area */}
                <div className="relative aspect-[3/4] w-full bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center overflow-hidden border-b border-slate-100 dark:border-slate-800/60">
                  {isSuccess && page.imageUrl ? (
                    <>
                      <img
                        src={page.imageUrl}
                        alt={`Page ${page.pageNumber}`}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-contain select-none pointer-events-none transition-transform duration-500 group-hover:scale-102"
                      />
                      {/* Hover action menu */}
                      <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2.5 p-3">
                        <button
                          type="button"
                          onClick={() => onPreview(page)}
                          className="p-2 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 rounded-full hover:bg-indigo-600 hover:text-white transition-all duration-150 shadow-md"
                          title="Preview full image"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDownloadSingle(page)}
                          className="p-2 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 rounded-full hover:bg-indigo-600 hover:text-white transition-all duration-150 shadow-md"
                          title="Download high-quality JPG"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    </>
                  ) : isPending ? (
                    <div className="text-center p-4">
                      <div className="w-3 h-3 rounded-full bg-slate-300 dark:bg-slate-700 mx-auto animate-pulse" />
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-2 block font-mono">
                        Awaiting run
                      </span>
                    </div>
                  ) : isRendering ? (
                    <div className="text-center p-4 w-full px-6 flex flex-col items-center">
                      <svg className="animate-spin h-6 w-6 text-indigo-500 mb-3" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 font-mono">
                        Rendering {page.progress}%
                      </span>
                      {/* Miniature progress bar */}
                      <div className="w-full bg-slate-200 dark:bg-slate-800 h-1 rounded-full mt-2 overflow-hidden">
                        <div
                          className="bg-indigo-600 h-full transition-all duration-150"
                          style={{ width: `${page.progress}%` }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="text-center p-4 flex flex-col items-center">
                      <AlertCircle className="w-6 h-6 text-rose-500 mb-2 shrink-0" />
                      <span className="text-[10px] font-semibold text-rose-600 dark:text-rose-400 block px-2 line-clamp-2">
                        {page.error || 'Failed to render'}
                      </span>
                      <button
                        type="button"
                        onClick={() => onRenderSingle(page.pageNumber)}
                        className="mt-3 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-[10px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1 transition-colors"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Retry</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Footer Meta Details */}
                <div className="p-3 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between min-h-[42px]">
                  <div>
                    {isSuccess && page.width && page.height ? (
                      <span className="text-[9px] font-mono font-medium text-slate-400 dark:text-slate-500">
                        {page.width} &times; {page.height} px
                      </span>
                    ) : (
                      <span className="text-[9px] font-mono text-slate-400 dark:text-slate-500">
                        Pending compile
                      </span>
                    )}
                  </div>

                  {isSuccess && (
                    <button
                      type="button"
                      onClick={() => onDownloadSingle(page)}
                      className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                      title="Download JPG"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
