/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Dynamically loads PDF.js from CDN and configures the GlobalWorker.
 */
export const loadPdfJS = (): Promise<any> => {
  return new Promise((resolve, reject) => {
    // If already loaded in window
    if ((window as any).pdfjsLib) {
      resolve((window as any).pdfjsLib);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    script.async = true;
    
    script.onload = () => {
      const pdfjsLib = (window as any).pdfjsLib;
      if (pdfjsLib) {
        // Set worker src dynamically from same version CDN
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        resolve(pdfjsLib);
      } else {
        reject(new Error('PDF.js library was loaded but is not available in the global scope.'));
      }
    };

    script.onerror = () => {
      reject(new Error('Failed to load PDF.js engine from CDN. Please check your network connection.'));
    };

    document.head.appendChild(script);
  });
};

interface ExtractionProgress {
  stage: 'loading' | 'processing' | 'completed';
  pageCurrent: number;
  pageTotal: number;
  percent: number;
}

/**
 * Extracts raw text from an ArrayBuffer of a PDF file.
 */
export async function extractTextFromPdf(
  arrayBuffer: ArrayBuffer,
  onProgress: (progress: ExtractionProgress) => void
): Promise<string> {
  onProgress({ stage: 'loading', pageCurrent: 0, pageTotal: 0, percent: 10 });

  const pdfjsLib = await loadPdfJS();
  
  // Load PDF document from binary
  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
  
  loadingTask.onProgress = (data: { loaded: number; total: number }) => {
    if (data.total > 0) {
      const percent = Math.min(50, Math.round((data.loaded / data.total) * 50));
      onProgress({ stage: 'loading', pageCurrent: 0, pageTotal: 0, percent });
    }
  };

  let pdfDoc;
  try {
    pdfDoc = await loadingTask.promise;
  } catch (err: any) {
    if (err.name === 'PasswordException') {
      throw new Error('This PDF is encrypted or password-protected. Please upload an unlocked PDF.');
    }
    throw new Error('Invalid or corrupted PDF file. Please ensure this is a valid PDF document.');
  }

  const numPages = pdfDoc.numPages;
  if (numPages === 0) {
    throw new Error('The uploaded PDF has no pages.');
  }

  let extractedText = '';
  
  for (let i = 1; i <= numPages; i++) {
    onProgress({
      stage: 'processing',
      pageCurrent: i,
      pageTotal: numPages,
      percent: 50 + Math.round((i / numPages) * 50),
    });

    const page = await pdfDoc.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item: any) => item.str || '')
      .join(' ');
    
    extractedText += `\n--- PAGE ${i} ---\n` + pageText;
  }

  if (!extractedText.trim()) {
    throw new Error(
      'No text could be extracted from this PDF. It might consist purely of scanned images. Please upload an OCR-processed research paper.'
    );
  }

  onProgress({ stage: 'completed', pageCurrent: numPages, pageTotal: numPages, percent: 100 });
  return extractedText;
}
