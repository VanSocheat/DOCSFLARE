/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileImage, ShieldCheck, Download, Loader2, Sparkles, CheckSquare, RefreshCw,
  Shield, Trash2, HelpCircle, Activity, FileText, Check, Clock, ArrowRight, ExternalLink
} from 'lucide-react';
import { PDFPageItem, RenderOptions, PDFFileMeta } from './types';
import { loadPdfJs, parsePageRange } from './lib/pdfUtils';
import PDFUploader from './components/PDFUploader';
import ConversionSettings from './components/ConversionSettings';
import PagePreviewGrid from './components/PagePreviewGrid';
import PageViewerModal from './components/PageViewerModal';

export default function App() {
  const [isPdfJsLoaded, setIsPdfJsLoaded] = useState(false);
  const [pdfJsLoadError, setPdfJsLoadError] = useState<string | null>(null);

  // File metadata and list of pages
  const [fileMeta, setFileMeta] = useState<PDFFileMeta | null>(null);
  const [pages, setPages] = useState<PDFPageItem[]>([]);
  const [options, setOptions] = useState<RenderOptions>({
    scale: 1.5,
    quality: 0.9,
    pageRange: 'all',
    customRange: '',
  });

  // Recent Conversions Session Log
  const [recentConversions, setRecentConversions] = useState<Array<{
    name: string;
    size: number;
    totalPages: number;
    status: 'converted' | 'pending';
    timestamp: string;
  }>>([
    { name: 'Q4_Marketing_Budget.pdf', size: 4404019, totalPages: 12, status: 'converted', timestamp: '2 mins ago' },
    { name: 'Identity_Guidelines_Final.pdf', size: 8808038, totalPages: 8, status: 'converted', timestamp: '1 hour ago' },
  ]);

  // Conversion running states
  const [isConverting, setIsConverting] = useState(false);
  const [currentRenderingPage, setCurrentRenderingPage] = useState<number | null>(null);
  const [isZipPreparing, setIsZipPreparing] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  // Lightbox page viewer state
  const [activePreviewPage, setActivePreviewPage] = useState<PDFPageItem | null>(null);

  // Reference to the loaded PDF Document (so we don't reload it repeatedly)
  const loadedPdfDocumentRef = useRef<any>(null);

  // Load PDF.js from CDN on app mount
  useEffect(() => {
    loadPdfJs()
      .then(() => {
        setIsPdfJsLoaded(true);
      })
      .catch((err) => {
        console.error('Failed to initialize PDF.js', err);
        setPdfJsLoadError('Failed to load document rendering engine. Please refresh and try again.');
      });
  }, []);

  // Set up pages list when PDF file metadata is fetched
  const handleFileSelect = async (file: File) => {
    setFileError(null);
    setFileMeta(null);
    setPages([]);
    loadedPdfDocumentRef.current = null;

    try {
      const pdfjs = await loadPdfJs();
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
      const pdfDoc = await loadingTask.promise;

      loadedPdfDocumentRef.current = pdfDoc;
      const totalPages = pdfDoc.numPages;

      setFileMeta({
        name: file.name,
        size: file.size,
        totalPages,
        file,
      });

      // Add to recent conversions log
      setRecentConversions((prev) => [
        {
          name: file.name,
          size: file.size,
          totalPages,
          status: 'pending',
          timestamp: 'Just now',
        },
        ...prev.filter((item) => item.name !== file.name),
      ].slice(0, 5));

      // Initialize the page array
      const initialPages: PDFPageItem[] = [];
      for (let i = 1; i <= totalPages; i++) {
        initialPages.push({
          pageNumber: i,
          status: 'pending',
          progress: 0,
          selected: true, // Default to select all pages
        });
      }
      setPages(initialPages);

      // Auto-trigger conversion for a delightful, instant-use experience
      setTimeout(() => {
        startBulkConversion(initialPages, totalPages, options);
      }, 300);

    } catch (err: any) {
      console.error('Failed to parse PDF file:', err);
      setFileError(err.message || 'Error occurred while parsing the PDF file. It may be corrupted or password-protected.');
    }
  };

  // Triggers rendering for a list of pages
  const startBulkConversion = async (
    targetPages: PDFPageItem[],
    totalPagesCount: number,
    currentOptions: RenderOptions
  ) => {
    if (!loadedPdfDocumentRef.current || isConverting) return;

    setIsConverting(true);
    setFileError(null);

    // Compute which page numbers we need to convert based on selected range options
    let pageNumbersToConvert: number[] = [];
    if (currentOptions.pageRange === 'all') {
      pageNumbersToConvert = targetPages.map((p) => p.pageNumber);
    } else if (currentOptions.pageRange === 'even') {
      pageNumbersToConvert = targetPages.filter((p) => p.pageNumber % 2 === 0).map((p) => p.pageNumber);
    } else if (currentOptions.pageRange === 'odd') {
      pageNumbersToConvert = targetPages.filter((p) => p.pageNumber % 2 !== 0).map((p) => p.pageNumber);
    } else if (currentOptions.pageRange === 'custom') {
      pageNumbersToConvert = parsePageRange(currentOptions.customRange, totalPagesCount);
    }

    if (pageNumbersToConvert.length === 0) {
      setFileError('No pages match the selected conversion criteria.');
      setIsConverting(false);
      return;
    }

    // Reset status for pages scheduled to convert
    setPages((prev) =>
      prev.map((p) =>
        pageNumbersToConvert.includes(p.pageNumber)
          ? { ...p, status: 'pending', progress: 0, imageUrl: undefined, error: undefined }
          : p
      )
    );

    // Process rendering sequentially (avoids CPU spike and memory limit errors in browser)
    for (const pageNum of pageNumbersToConvert) {
      setCurrentRenderingPage(pageNum);
      await convertPageToJpg(pageNum, currentOptions);
    }

    setCurrentRenderingPage(null);
    setIsConverting(false);

    // Update historical conversion log entry
    setRecentConversions((prev) =>
      prev.map((item) =>
        item.status === 'pending'
          ? { ...item, status: 'converted' }
          : item
      )
    );
  };

  // Renders a single page onto a canvas and extracts a high-quality JPEG
  const convertPageToJpg = async (pageNumber: number, currentOptions: RenderOptions) => {
    // 1. Set page status to rendering
    setPages((prev) =>
      prev.map((p) => (p.pageNumber === pageNumber ? { ...p, status: 'rendering', progress: 15 } : p))
    );

    try {
      const pdfDoc = loadedPdfDocumentRef.current;
      if (!pdfDoc) throw new Error('PDF document reference is lost');

      // 2. Fetch page and configure viewport dimensions
      setPages((prev) =>
        prev.map((p) => (p.pageNumber === pageNumber ? { ...p, progress: 40 } : p))
      );
      const page = await pdfDoc.getPage(pageNumber);
      const viewport = page.getViewport({ scale: currentOptions.scale });

      // 3. Create offscreen canvas
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Failed to create 2D canvas context');

      canvas.width = viewport.width;
      canvas.height = viewport.height;

      setPages((prev) =>
        prev.map((p) => (p.pageNumber === pageNumber ? { ...p, progress: 70 } : p))
      );

      // 4. Draw PDF onto canvas
      const renderContext = {
        canvasContext: context,
        viewport,
      };
      await page.render(renderContext).promise;

      setPages((prev) =>
        prev.map((p) => (p.pageNumber === pageNumber ? { ...p, progress: 90 } : p))
      );

      // 5. Convert canvas contents to JPEG
      const imageUrl = canvas.toDataURL('image/jpeg', currentOptions.quality);

      // 6. Record success
      setPages((prev) =>
        prev.map((p) =>
          p.pageNumber === pageNumber
            ? {
                ...p,
                status: 'success',
                progress: 100,
                imageUrl,
                width: Math.round(viewport.width),
                height: Math.round(viewport.height),
              }
            : p
        )
      );
    } catch (err: any) {
      console.error(`Error rendering page ${pageNumber}:`, err);
      setPages((prev) =>
        prev.map((p) =>
          p.pageNumber === pageNumber
            ? { ...p, status: 'error', error: err.message || 'Render failed' }
            : p
        )
      );
    }
  };

  // Individual page retry handler
  const handleRenderSinglePage = async (pageNumber: number) => {
    if (!loadedPdfDocumentRef.current) return;
    await convertPageToJpg(pageNumber, options);
  };

  // Checkbox toggling handler for individual pages
  const handleToggleSelectPage = (pageNumber: number) => {
    setPages((prev) =>
      prev.map((p) => (p.pageNumber === pageNumber ? { ...p, selected: !p.selected } : p))
    );
  };

  // Checkbox bulk toggle handler
  const handleSelectAllPages = (select: boolean) => {
    setPages((prev) => prev.map((p) => ({ ...p, selected: select })));
  };

  // Triggers immediate download of a single rendered JPEG image
  const handleDownloadSingleJpg = (page: PDFPageItem) => {
    if (!page.imageUrl || !fileMeta) return;

    const link = document.createElement('a');
    link.href = page.imageUrl;
    const pageNumStr = String(page.pageNumber).padStart(3, '0');
    link.download = `${fileMeta.name.replace(/\.pdf$/i, '')}_page_${pageNumStr}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Packages all successfully rendered + selected JPEGs into a single ZIP folder using JSZip
  const handleDownloadSelectedAsZip = async () => {
    const selectedSuccessPages = pages.filter((p) => p.selected && p.status === 'success');
    if (selectedSuccessPages.length === 0 || !fileMeta) return;

    setIsZipPreparing(true);
    try {
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();

      selectedSuccessPages.forEach((page) => {
        if (page.imageUrl) {
          // Slice off the metadata prefix (e.g. "data:image/jpeg;base64,") to extract pure base64 bytes
          const base64Data = page.imageUrl.split(',')[1];
          const pageNumStr = String(page.pageNumber).padStart(3, '0');
          const filename = `${fileMeta.name.replace(/\.pdf$/i, '')}_page_${pageNumStr}.jpg`;
          zip.file(filename, base64Data, { base64: true });
        }
      });

      const blobContent = await zip.generateAsync({ type: 'blob' });
      const downloadName = `${fileMeta.name.replace(/\.pdf$/i, '')}_images.zip`;

      const link = document.createElement('a');
      link.href = URL.createObjectURL(blobContent);
      link.download = downloadName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    } catch (err) {
      console.error('Failed to compile ZIP file:', err);
      setFileError('Failed to pack JPGs into a ZIP package.');
    } finally {
      setIsZipPreparing(false);
    }
  };

  // Triggers immediate download of all selected rendered JPGs as individual files
  const handleDownloadSelectedAsJpgs = () => {
    const selectedSuccessPages = pages.filter((p) => p.selected && p.status === 'success');
    if (selectedSuccessPages.length === 0 || !fileMeta) return;

    selectedSuccessPages.forEach((page, index) => {
      setTimeout(() => {
        handleDownloadSingleJpg(page);
      }, index * 200); // 200ms delay between downloads to prevent browser blocking or overlapping
    });
  };

  // Reset core states to handle a new document
  const handleReset = () => {
    setFileMeta(null);
    setPages([]);
    setFileError(null);
    loadedPdfDocumentRef.current = null;
    setIsConverting(false);
  };

  // Settings modification listener
  const handleSettingsChange = (newOptions: RenderOptions) => {
    setOptions(newOptions);
    // If we have a file already parsed, trigger automatic update conversion with new settings
    if (fileMeta) {
      startBulkConversion(pages, fileMeta.totalPages, newOptions);
    }
  };

  // Handlers for Carousel Navigation in Lightbox Viewer
  const handleNextPreview = () => {
    if (!activePreviewPage) return;
    const currentIndex = pages.findIndex((p) => p.pageNumber === activePreviewPage.pageNumber);
    // Find next page that is successfully rendered
    const nextSuccessPage = pages
      .slice(currentIndex + 1)
      .find((p) => p.status === 'success' && p.imageUrl);

    if (nextSuccessPage) {
      setActivePreviewPage(nextSuccessPage);
    }
  };

  const handlePrevPreview = () => {
    if (!activePreviewPage) return;
    const currentIndex = pages.findIndex((p) => p.pageNumber === activePreviewPage.pageNumber);
    // Find previous page that is successfully rendered
    const prevSuccessPage = pages
      .slice(0, currentIndex)
      .reverse()
      .find((p) => p.status === 'success' && p.imageUrl);

    if (prevSuccessPage) {
      setActivePreviewPage(prevSuccessPage);
    }
  };

  const hasNextSuccessPage = () => {
    if (!activePreviewPage) return false;
    const currentIndex = pages.findIndex((p) => p.pageNumber === activePreviewPage.pageNumber);
    return pages.slice(currentIndex + 1).some((p) => p.status === 'success' && p.imageUrl);
  };

  const hasPrevSuccessPage = () => {
    if (!activePreviewPage) return false;
    const currentIndex = pages.findIndex((p) => p.pageNumber === activePreviewPage.pageNumber);
    return pages.slice(0, currentIndex).some((p) => p.status === 'success' && p.imageUrl);
  };

  const successCount = pages.filter((p) => p.status === 'success').length;
  const selectedSuccessCount = pages.filter((p) => p.selected && p.status === 'success').length;

  return (
    <div id="main-application-shell" className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans selection:bg-indigo-500/20 selection:text-indigo-900">
      
      {/* Dynamic script loading spinner */}
      {!isPdfJsLoaded && !pdfJsLoadError && (
        <div className="fixed inset-0 bg-slate-50 z-50 flex flex-col items-center justify-center p-6 gap-4">
          <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
          <h2 className="text-lg font-bold font-display text-slate-800">
            Initializing PDF engine...
          </h2>
          <p className="text-xs text-slate-500 max-w-xs text-center leading-normal">
            Setting up secure Web-assembly components for high-fidelity client-side rendering.
          </p>
        </div>
      )}

      {/* Script loading failure notice */}
      {pdfJsLoadError && (
        <div className="fixed inset-0 bg-slate-50 z-50 flex flex-col items-center justify-center p-6 gap-3">
          <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mb-2">
            <RefreshCw className="w-6 h-6 animate-spin" />
          </div>
          <h2 className="text-lg font-bold font-display text-slate-800 text-center">
            Failed to load converter libraries
          </h2>
          <p className="text-sm text-slate-500 max-w-xs text-center mb-4">
            {pdfJsLoadError}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition shadow-md"
          >
            Reload Page
          </button>
        </div>
      )}

      {/* Navigation Bar matching requested HTML */}
      <nav className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0 sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold tracking-tight text-slate-800 italic">
            DOCS<span className="text-indigo-600">FLARE</span>
          </span>
          <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-bold tracking-wide">PRO PLAN</span>
        </div>
        <div className="flex items-center gap-6">
          <span className="text-xs font-semibold text-slate-600 cursor-default hover:text-slate-800 transition-colors">Converter Dashboard</span>
          <span className="text-xs font-semibold text-slate-400 cursor-not-allowed">Cloud Storage</span>
          <span className="text-xs font-semibold text-slate-400 cursor-not-allowed">Preferences</span>
          <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600 border border-slate-300">
            DF
          </div>
        </div>
      </nav>

      {/* Main content body */}
      <main className="max-w-6xl w-full mx-auto px-6 mt-8 mb-12 flex-1 flex flex-col gap-8">
        {!fileMeta ? (
          /* Empty / Upload State Split Layout */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-7 flex flex-col gap-6">
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
                <h2 className="text-lg font-bold text-slate-800 mb-1">Convert PDF to JPEG Image</h2>
                <p className="text-xs text-slate-500 leading-normal mb-6">
                  Extract high-quality JPEG photos from your PDF pages. Your files stay on your device, rendered entirely within the browser.
                </p>
                <PDFUploader
                  onFileSelect={handleFileSelect}
                  selectedFileName={fileMeta?.name}
                  selectedFileSize={fileMeta?.size}
                  isLoading={isConverting}
                  error={fileError}
                  onReset={handleReset}
                />
              </div>
            </div>

            <div className="lg:col-span-5 flex flex-col gap-6">
              {/* Storage Usage Widget */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Workspace Storage</h3>
                <div className="flex items-center justify-between text-xs text-slate-600 font-semibold mb-2">
                  <span>Client-side sandbox limit</span>
                  <span>4.8 MB / 100 MB Used</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mb-4">
                  <div className="bg-indigo-600 h-full w-[4.8%]" />
                </div>
                <p className="text-[11px] text-slate-400 leading-normal">
                  Our service converts PDFs without sending files to the cloud. Save bandwidth and enjoy 100% private extraction.
                </p>
              </div>

              {/* Recent Activity Log */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Recent Conversions</h3>
                <div className="flex flex-col gap-4">
                  {recentConversions.map((conv, i) => (
                    <div key={i} className="flex items-center justify-between border-b border-slate-50 pb-3 last:border-0 last:pb-0">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-slate-800 truncate pr-2" title={conv.name}>
                            {conv.name}
                          </h4>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            {conv.totalPages} pages • {conv.timestamp}
                          </p>
                        </div>
                      </div>
                      <div className="shrink-0 flex items-center">
                        {conv.status === 'converted' ? (
                          <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border border-emerald-100">
                            <Check className="w-3 h-3" />
                            <span>Done</span>
                          </span>
                        ) : (
                          <span className="text-[10px] bg-amber-50 text-amber-700 font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border border-amber-100 animate-pulse">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            <span>Extracting</span>
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Active File Management and Page View */
          <div className="flex flex-col gap-8">
            <PDFUploader
              onFileSelect={handleFileSelect}
              selectedFileName={fileMeta?.name}
              selectedFileSize={fileMeta?.size}
              isLoading={isConverting}
              error={fileError}
              onReset={handleReset}
            />

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col gap-8"
            >
              {/* Conversion Settings Section */}
              <ConversionSettings
                options={options}
                onChange={handleSettingsChange}
                totalPages={fileMeta.totalPages}
              />

              {/* Global Progress and Zip Download Bar */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
                
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Conversion Progress
                      </span>
                      {isConverting && (
                        <span className="text-xs text-indigo-600 animate-pulse font-medium">
                          (Rendering P. {currentRenderingPage}...)
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-mono font-bold text-slate-500">
                      {successCount} / {fileMeta.totalPages} Pages Done
                    </span>
                  </div>

                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200/40">
                    <motion.div
                      className="bg-indigo-600 h-full rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${(successCount / fileMeta.totalPages) * 100}%` }}
                      transition={{ type: 'spring', stiffness: 100, damping: 20 }}
                    />
                  </div>
                </div>

                {/* Major Conversion Trigger & Action Panel */}
                <div className="flex items-center gap-3 shrink-0 self-end md:self-auto flex-wrap">
                  {/* Manual Re-run Trigger */}
                  <button
                    type="button"
                    onClick={() => startBulkConversion(pages, fileMeta.totalPages, options)}
                    disabled={isConverting}
                    className="px-5 py-3 border border-slate-200 hover:border-indigo-500 hover:text-indigo-600 rounded-xl text-xs font-bold transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer bg-white"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isConverting ? 'animate-spin' : ''}`} />
                    <span>Reconvert</span>
                  </button>

                  {/* Direct JPGs Download Button */}
                  <button
                    type="button"
                    onClick={handleDownloadSelectedAsJpgs}
                    disabled={selectedSuccessCount === 0}
                    className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-md shadow-indigo-200 transition-all flex items-center gap-2 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </button>
                </div>

              </div>

              {/* Previews and Grid Layout */}
              <PagePreviewGrid
                pages={pages}
                onToggleSelect={handleToggleSelectPage}
                onSelectAll={handleSelectAllPages}
                onPreview={setActivePreviewPage}
                onDownloadSingle={handleDownloadSingleJpg}
                onRenderSingle={handleRenderSinglePage}
              />

            </motion.div>
          </div>
        )}
      </main>

      {/* Footer from design HTML */}
      <footer className="h-12 bg-slate-800 text-slate-400 flex items-center justify-between px-8 text-[11px] shrink-0 mt-auto">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
            All systems operational
          </span>
          <span className="text-slate-600">|</span>
          <span className="flex items-center gap-1 text-slate-400 font-medium">
            <Shield className="w-3.5 h-3.5 text-emerald-500" />
            256-bit AES client-side encryption active
          </span>
        </div>
        <div className="font-mono text-slate-500">DocsFlare v1.0.0</div>
      </footer>

      {/* Zoomable Image Lightbox Viewer Modal */}
      <PageViewerModal
        page={activePreviewPage}
        onClose={() => setActivePreviewPage(null)}
        onNext={handleNextPreview}
        onPrev={handlePrevPreview}
        onDownloadSingle={handleDownloadSingleJpg}
        hasNext={hasNextSuccessPage()}
        hasPrev={hasPrevSuccessPage()}
      />
    </div>
  );
}
