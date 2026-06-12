/**
 * Client-side file text extraction using pdfjs-dist and jszip.
 * Runs entirely in the browser — no server dependency.
 * Works on Cloudflare Workers edge, Vercel, or any host.
 */

import * as pdfjsLib from 'pdfjs-dist';

// Configure the PDF.js worker from CDN for browser usage
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
}

/**
 * Extract text from a PDF file using pdfjs-dist.
 * Handles all standard PDF formats: compressed, encrypted (non-password), multi-page.
 */
export async function extractTextFromPDF(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const typedArray = new Uint8Array(arrayBuffer);

  const pdf = await pdfjsLib.getDocument({ data: typedArray }).promise;
  const totalPages = pdf.numPages;
  const pageTexts: string[] = [];

  for (let i = 1; i <= totalPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .filter((item: any) => item.str !== undefined)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((item: any) => item.str)
      .join(' ');
    if (pageText.trim()) {
      pageTexts.push(pageText.trim());
    }
  }

  const result = pageTexts.join('\n').trim();

  if (!result || result.length < 10) {
    throw new Error(
      'Could not extract text from this PDF. The file may be scanned, image-only, or encrypted. Please try pasting text directly.'
    );
  }

  return result;
}

function decodeXmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

/**
 * Extract text from a DOCX file using jszip.
 * DOCX = ZIP archive containing XML files.
 */
export async function extractTextFromDOCX(file: File): Promise<string> {
  const JSZip = (await import('jszip')).default;
  const arrayBuffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(arrayBuffer);

  // Get word/document.xml
  const docXml = zip.file('word/document.xml');
  if (!docXml) {
    throw new Error('Could not read DOCX content. Please try pasting text directly.');
  }

  const xmlContent = await docXml.async('string');

  // Parse XML to extract text content from <w:t> tags
  const textParts: string[] = [];
  const paragraphs = xmlContent.split(/<\/w:p>/);

  for (const para of paragraphs) {
    const runs: string[] = [];
    const wtRegex = /<w:t[^>]*>([^<]*)<\/w:t>/g;
    let m: RegExpExecArray | null;
    while ((m = wtRegex.exec(para)) !== null) {
      runs.push(decodeXmlEntities(m[1]));
    }
    if (runs.length > 0) {
      textParts.push(runs.join(''));
    }
  }

  const result = textParts.join('\n').trim();

  if (!result || result.length < 5) {
    throw new Error('Could not extract text from DOCX. Please try pasting text directly.');
  }

  return result;
}
