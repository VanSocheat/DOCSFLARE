/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { Settings, Sliders, Layers, FileCode } from 'lucide-react';
import { RenderOptions } from '../types';
import { parsePageRange } from '../lib/pdfUtils';

interface ConversionSettingsProps {
  options: RenderOptions;
  onChange: (options: RenderOptions) => void;
  totalPages: number;
}

export default function ConversionSettings({
  options,
  onChange,
  totalPages,
}: ConversionSettingsProps) {
  const handleScaleChange = (scale: number) => {
    onChange({ ...options, scale });
  };

  const handleQualityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...options, quality: parseFloat(e.target.value) });
  };

  const handlePageRangeTypeChange = (pageRange: RenderOptions['pageRange']) => {
    onChange({ ...options, pageRange });
  };

  const handleCustomRangeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...options, customRange: e.target.value });
  };

  // Compute number of pages to be rendered
  let pagesToRenderCount = totalPages;
  if (options.pageRange === 'odd') {
    pagesToRenderCount = Math.ceil(totalPages / 2);
  } else if (options.pageRange === 'even') {
    pagesToRenderCount = Math.floor(totalPages / 2);
  } else if (options.pageRange === 'custom') {
    const parsed = parsePageRange(options.customRange, totalPages);
    pagesToRenderCount = parsed.length;
  }

  const scalePresets = [
    { value: 1.0, label: '1.0x', desc: 'Standard (Compact)' },
    { value: 1.5, label: '1.5x', desc: 'Balanced' },
    { value: 2.0, label: '2.0x', desc: 'Crisp (Web)' },
    { value: 3.0, label: '3.0x', desc: 'Ultra (Print)' },
  ];

  return (
    <div id="conversion-settings-section" className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
      <div className="pb-4 border-b border-slate-100 mb-6">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Conversion Settings
        </h3>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Render Resolution/Scale Option */}
        <div className="flex flex-col gap-2.5">
          <label className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-slate-400" />
            Image Resolution / Scale
          </label>
          <div className="grid grid-cols-2 gap-2">
            {scalePresets.map((preset) => (
              <button
                key={preset.value}
                type="button"
                onClick={() => handleScaleChange(preset.value)}
                className={`p-3 rounded-xl border text-left transition-all duration-200 ${
                  options.scale === preset.value
                    ? 'border-indigo-600 bg-indigo-50/40 text-indigo-900 ring-2 ring-indigo-500/10'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-600'
                }`}
              >
                <div className="text-xs font-bold">{preset.label}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">{preset.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* JPEG Quality Option */}
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-slate-400" />
              JPEG Image Quality
            </label>
            <span className="text-[10px] font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
              {Math.round(options.quality * 100)}%
            </span>
          </div>
          <div className="flex-1 flex flex-col justify-center bg-slate-50 p-4 rounded-xl border border-slate-200">
            <input
              type="range"
              min="0.5"
              max="1.0"
              step="0.05"
              value={options.quality}
              onChange={handleQualityChange}
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 focus:outline-hidden"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-3">
              <span>Balanced (50%)</span>
              <span>Default (90%)</span>
              <span>Lossless (100%)</span>
            </div>
          </div>
        </div>

        {/* Page Range Option */}
        <div className="flex flex-col gap-2.5">
          <label className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
            <FileCode className="w-3.5 h-3.5 text-slate-400" />
            Page Range selection
          </label>
          <div className="flex-1 flex flex-col gap-3">
            <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200/50">
              {(['all', 'even', 'odd', 'custom'] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => handlePageRangeTypeChange(type)}
                  className={`py-1.5 px-2 rounded-lg text-xs font-medium capitalize transition-all duration-150 ${
                    options.pageRange === type
                      ? 'bg-white text-slate-900 shadow-xs border border-slate-200/40'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>

            {options.pageRange === 'custom' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="flex flex-col gap-1.5"
              >
                <input
                  type="text"
                  value={options.customRange}
                  onChange={handleCustomRangeChange}
                  placeholder={`e.g. 1, 3-5, 7-${totalPages}`}
                  className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-800 focus:outline-hidden focus:border-indigo-500 placeholder:text-slate-400"
                />
                <span className="text-[10px] text-slate-400 leading-normal">
                  Enter specific page numbers separated by commas, or page ranges (e.g., &ldquo;1, 3-5&rdquo;). Max pages: {totalPages}.
                </span>
              </motion.div>
            )}

            <div className="text-xs text-slate-500 flex items-center justify-between mt-auto bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              <span>Pages scheduled for conversion:</span>
              <span className="font-bold text-slate-800">
                {pagesToRenderCount} / {totalPages}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
