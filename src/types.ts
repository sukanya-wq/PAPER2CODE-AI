/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface PaperMetadata {
  title: string;
  authors: string;
  abstract: string;
  fileName: string;
  fileSize: string;
  extractedTextLength: number;
}

export interface AnalysisResult {
  summary: string;
  contributions: string;
  methodology: string;
  architecture: string;
  roadmap: string;
  pythonSkeleton: string;
  folderStructure: string;
  requirements: string;
  readme: string;
  setupInstructions: string;
  codeFileName?: string;
  configFileName?: string;
}

export interface SavedAnalysis {
  id: string;
  date: string;
  metadata: PaperMetadata;
  analysis: AnalysisResult;
  rating?: number;
}

export interface AppSettings {
  geminiApiKey: string;
  theme: 'dark' | 'light';
}
