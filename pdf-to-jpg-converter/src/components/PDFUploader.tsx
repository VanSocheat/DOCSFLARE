/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { FileUp, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { formatBytes } from '../lib/pdfUtils';

interface PDFUploaderProps {
  onFileSelect: (file: File) => void;
  selectedFileName?: string;
  selectedFileSize?: number;
  isLoading: boolean;
  error?: string | null;
  onReset: () => void;
}

export default function PDFUploader({
  onFileSelect,
  selectedFileName,
  selectedFileSize,
  isLoading,
  error,
  onReset,
}: PDFUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        onFileSelect(file);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelect(e.target.files[0]);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  return (
    <div id="pdf-uploader-section" className="w-full">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".pdf,application/pdf"
        className="hidden"
      />

      {!selectedFileName ? (
        <motion.div
          id="drop-zone"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={triggerFileSelect}
          whileHover={{ scale: 1.005 }}
          whileTap={{ scale: 0.99 }}
          className={`relative group cursor-pointer rounded-2xl border-2 border-dashed transition-all duration-300 p-12 text-center flex flex-col items-center justify-center min-h-[320px] bg-white bg-opacity-60 ${
            isDragging
              ? 'border-indigo-500 bg-indigo-50/50 shadow-lg shadow-indigo-500/10'
              : 'border-slate-300 hover:border-indigo-400 hover:shadow-md'
          }`}
        >
          {/* Decorative ambient background blur */}
          <div className="absolute inset-0 bg-radial from-indigo-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl pointer-events-none" />

          <motion.div
            animate={isDragging ? { y: -8, scale: 1.1 } : { y: 0, scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 15 }}
            className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 transition-colors duration-300 ${
              isDragging
                ? 'bg-indigo-600 text-white'
                : 'bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100'
            }`}
          >
            <FileUp className="w-10 h-10" />
          </motion.div>

          <h2 className="text-2xl font-bold font-display text-slate-800 mb-2">
            Select PDF file
          </h2>
          <p className="text-slate-500 max-w-sm mx-auto mb-8 text-sm">
            Drag and drop your PDF here or click to browse. Fully client-side secure conversion.
          </p>
          <button
            type="button"
            className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all duration-200"
          >
            Select File
          </button>
        </motion.div>
      ) : (
        <motion.div
          id="file-details-card"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6"
        >
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
              <FileText className="w-6 h-6" />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-base font-semibold text-slate-800 dark:text-slate-100 truncate pr-4">
                {selectedFileName}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {selectedFileSize ? formatBytes(selectedFileSize) : 'Unknown size'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto shrink-0 justify-end">
            {isLoading ? (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 rounded-lg text-sm font-medium">
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Loading pages...</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 rounded-lg text-sm font-medium">
                <CheckCircle2 className="w-4 h-4" />
                <span>Ready</span>
              </div>
            )}
            <button
              onClick={onReset}
              className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl transition-colors duration-200"
            >
              Reset
            </button>
          </div>
        </motion.div>
      )}

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-400 rounded-xl flex items-start gap-3"
        >
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="text-sm font-medium">{error}</div>
        </motion.div>
      )}
    </div>
  );
}
