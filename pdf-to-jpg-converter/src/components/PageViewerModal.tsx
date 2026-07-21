/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ZoomIn, ZoomOut, Maximize, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { PDFPageItem } from '../types';

interface PageViewerModalProps {
  page: PDFPageItem | null;
  onClose: () => void;
  onNext?: () => void;
  onPrev?: () => void;
  onDownloadSingle?: (page: PDFPageItem) => void;
  hasPrev?: boolean;
  hasNext?: boolean;
}

export default function PageViewerModal({
  page,
  onClose,
  onNext,
  onPrev,
  onDownloadSingle,
  hasPrev = false,
  hasNext = false,
}: PageViewerModalProps) {
  const [zoom, setZoom] = useState(1);

  // Reset zoom on page change
  useEffect(() => {
    setZoom(1);
  }, [page?.pageNumber]);

  // Keyboard Navigation Support
  useEffect(() => {
    if (!page) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowRight' && hasNext && onNext) {
        onNext();
      } else if (e.key === 'ArrowLeft' && hasPrev && onPrev) {
        onPrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [page, hasNext, hasPrev, onNext, onPrev, onClose]);

  if (!page || !page.imageUrl) return null;

  const handleZoomIn = () => setZoom((z) => Math.min(3, z + 0.25));
  const handleZoomOut = () => setZoom((z) => Math.max(0.5, z - 0.25));
  const handleZoomReset = () => setZoom(1);

  return (
    <AnimatePresence>
      <div id="image-lightbox-modal" className="fixed inset-0 z-50 flex flex-col justify-between bg-slate-950/90 backdrop-blur-md">
        
        {/* Header Toolbar */}
        <div className="flex items-center justify-between p-4 bg-slate-900/40 border-b border-slate-800/50 backdrop-blur-md z-10">
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-white font-display">
              Page Preview (P. {page.pageNumber})
            </span>
            {page.width && page.height && (
              <span className="text-[10px] font-mono text-slate-400 mt-0.5">
                {page.width} &times; {page.height} pixels
              </span>
            )}
          </div>

          {/* Quick Zoom Tools */}
          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-full px-2 py-1">
            <button
              onClick={handleZoomOut}
              disabled={zoom <= 0.5}
              className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-full transition-colors disabled:opacity-30"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono font-semibold text-white px-2 select-none min-w-[50px] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={handleZoomIn}
              disabled={zoom >= 3}
              className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-full transition-colors disabled:opacity-30"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            {zoom !== 1 && (
              <button
                onClick={handleZoomReset}
                className="p-1.5 hover:bg-slate-800 text-indigo-400 hover:text-indigo-300 rounded-full transition-colors text-xs font-medium px-2"
                title="Reset zoom"
              >
                <Maximize className="w-3.5 h-3.5 inline mr-1" /> Fit
              </button>
            )}
          </div>

          {/* Download & Close buttons */}
          <div className="flex items-center gap-2">
            {onDownloadSingle && (
              <button
                onClick={() => onDownloadSingle(page)}
                className="p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full transition-colors"
                title="Download high-resolution image"
              >
                <Download className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-full transition-colors"
              title="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Media Viewing Core */}
        <div className="relative flex-1 flex items-center justify-center p-6 overflow-auto">
          {/* Previous Page Navigation */}
          {hasPrev && onPrev && (
            <button
              onClick={onPrev}
              className="absolute left-4 p-3 bg-slate-900/60 hover:bg-indigo-600 border border-slate-800/60 hover:border-indigo-500 text-white rounded-full transition-all duration-200 z-10"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}

          {/* Interactive Zoomable Image */}
          <div className="max-w-full max-h-full flex items-center justify-center overflow-auto">
            <motion.img
              key={page.pageNumber}
              src={page.imageUrl}
              alt={`Page ${page.pageNumber} High Res Preview`}
              referrerPolicy="no-referrer"
              className="max-w-[90vw] max-h-[75vh] object-contain shadow-2xl rounded-sm pointer-events-none select-none border border-slate-800"
              style={{
                scale: zoom,
                transformOrigin: 'center center',
              }}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: zoom }}
              transition={{ duration: 0.2 }}
            />
          </div>

          {/* Next Page Navigation */}
          {hasNext && onNext && (
            <button
              onClick={onNext}
              className="absolute right-4 p-3 bg-slate-900/60 hover:bg-indigo-600 border border-slate-800/60 hover:border-indigo-500 text-white rounded-full transition-all duration-200 z-10"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}
        </div>

        {/* Footer Navigation Overlay */}
        <div className="p-4 bg-slate-900/40 border-t border-slate-800/50 backdrop-blur-md text-center">
          <span className="text-xs font-medium text-slate-400">
            Use keyboard <kbd className="bg-slate-800 px-1.5 py-0.5 rounded text-white text-[10px]">←</kbd> and <kbd className="bg-slate-800 px-1.5 py-0.5 rounded text-white text-[10px]">→</kbd> keys to cycle pages, and <kbd className="bg-slate-800 px-1.5 py-0.5 rounded text-white text-[10px]">Esc</kbd> to close.
          </span>
        </div>

      </div>
    </AnimatePresence>
  );
}
