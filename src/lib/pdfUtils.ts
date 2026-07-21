/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// CDN URLs for the highly stable and secure PDF.js library
const PDFJS_SRC = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
const PDFJS_WORKER_SRC = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

let loadingPromise: Promise<any> | null = null;

/**
 * Dynamically loads PDF.js and its worker from CDN
 */
export function loadPdfJs(): Promise<any> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Window object is not defined'));
  }

  // If already loaded globally, resolve immediately
  if ((window as any).pdfjsLib) {
    return Promise.resolve((window as any).pdfjsLib);
  }

  if (loadingPromise) {
    return loadingPromise;
  }

  loadingPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = PDFJS_SRC;
    script.async = true;
    script.onload = () => {
      const pdfjsLib = (window as any).pdfjsLib;
      if (pdfjsLib) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_SRC;
        resolve(pdfjsLib);
      } else {
        reject(new Error('PDF.js loaded but pdfjsLib is not defined on window'));
      }
    };
    script.onerror = (err) => {
      loadingPromise = null; // allow retry
      reject(new Error('Failed to load PDF.js from CDN: ' + String(err)));
    };
    document.head.appendChild(script);
  });

  return loadingPromise;
}

/**
 * Formats bytes to a human-readable size
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Parses user input ranges (e.g. "1, 3-5, 7, 10-12") into a unique set of page numbers.
 * Supports handling of duplicate numbers, invalid strings, and boundary limits.
 */
export function parsePageRange(rangeStr: string, maxPages: number): number[] {
  if (!rangeStr || !rangeStr.trim()) return [];

  const pages = new Set<number>();
  const parts = rangeStr.split(',');

  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;

    if (trimmed.includes('-')) {
      const bounds = trimmed.split('-');
      if (bounds.length === 2) {
        const start = parseInt(bounds[0].trim(), 10);
        const end = parseInt(bounds[1].trim(), 10);

        if (!isNaN(start) && !isNaN(end)) {
          const min = Math.max(1, Math.min(start, end));
          const max = Math.min(maxPages, Math.max(start, end));
          for (let p = min; p <= max; p++) {
            pages.add(p);
          }
        }
      }
    } else {
      const p = parseInt(trimmed, 10);
      if (!isNaN(p) && p >= 1 && p <= maxPages) {
        pages.add(p);
      }
    }
  }

  return Array.from(pages).sort((a, b) => a - b);
}
