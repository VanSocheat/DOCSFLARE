/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface PDFPageItem {
  pageNumber: number;
  status: 'pending' | 'rendering' | 'success' | 'error';
  progress: number; // 0 to 100%
  imageUrl?: string; // High-quality JPEG data URL
  width?: number;
  height?: number;
  selected: boolean;
  error?: string;
}

export interface RenderOptions {
  scale: number;       // DPI multiplier (e.g., 1.0, 1.5, 2.0, 3.0)
  quality: number;     // JPEG compression quality (0.1 to 1.0)
  pageRange: 'all' | 'custom' | 'even' | 'odd';
  customRange: string; // Range string, e.g., "1, 3-5, 8"
}

export interface PDFFileMeta {
  name: string;
  size: number;
  totalPages: number;
  file: File;
}
