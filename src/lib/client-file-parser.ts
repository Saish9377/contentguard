/**
 * Client-side file text extraction.
 * Extracts text from PDF, DOCX, and TXT files directly in the browser.
 * This avoids relying on Node.js-only packages (pdf-parse, mammoth)
 * which don't work on Cloudflare Workers edge runtime.
 */

/**
 * Extract text from a PDF file.
 * Uses multiple strategies: pdfjs-dist if available, then manual binary parsing.
 */
export async function extractTextFromPDF(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();

  // Strategy 1: Try the upload API (works on Node.js servers, fails on edge)
  try {
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });
    if (response.ok) {
      const result = await response.json();
      if (result.text && result.text.trim().length >= 10) {
        return result.text;
      }
    }
  } catch {
    // Server-side parsing failed (expected on Cloudflare), fall through to client-side
  }

  // Strategy 2: Manual binary parsing
  const text = extractTextFromPDFBinary(arrayBuffer);

  if (!text || text.trim().length < 10) {
    throw new Error(
      'Could not extract text from this PDF. The file may be scanned, image-only, or encrypted. Please try pasting text directly.'
    );
  }

  return text;
}

/**
 * Extract text from PDF binary using stream decompression and text operator parsing.
 */
function extractTextFromPDFBinary(arrayBuffer: ArrayBuffer): string {
  const bytes = new Uint8Array(arrayBuffer);
  const textChunks: string[] = [];

  // Convert to binary string in chunks to avoid stack overflow
  let binaryStr = '';
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
    binaryStr += String.fromCharCode.apply(null, Array.from(chunk));
  }

  // Method 1: Extract from BT/ET text blocks (uncompressed PDFs)
  const btEtRegex = /BT\s([\s\S]*?)ET/g;
  let btMatch: RegExpExecArray | null;
  while ((btMatch = btEtRegex.exec(binaryStr)) !== null) {
    const extracted = extractTextOperators(btMatch[1]);
    if (extracted.trim()) {
      textChunks.push(extracted.trim());
    }
  }

  // Method 2: Look for plain text strings between parentheses in content streams
  if (textChunks.length === 0) {
    // Try to find readable text directly
    const readableRegex = /\(([A-Za-z0-9 .,;:!?'"()\-\n\r\t]{5,})\)/g;
    let m: RegExpExecArray | null;
    while ((m = readableRegex.exec(binaryStr)) !== null) {
      const decoded = decodePDFString(m[1]);
      if (decoded.trim().length >= 5 && /[a-zA-Z]{2,}/.test(decoded)) {
        textChunks.push(decoded.trim());
      }
    }
  }

  return textChunks.join(' ').replace(/\s+/g, ' ').trim();
}

/**
 * Extract text from PDF text operators (Tj, TJ, ', ").
 */
function extractTextOperators(content: string): string {
  const parts: string[] = [];

  // Match (text) Tj operators
  const tjRegex = /\(([^)]*)\)\s*Tj/g;
  let m: RegExpExecArray | null;
  while ((m = tjRegex.exec(content)) !== null) {
    parts.push(decodePDFString(m[1]));
  }

  // Match TJ arrays: [(text) 123 (text)] TJ
  const tjArrayRegex = /\[((?:[^[\]]*|\([^)]*\))*)\]\s*TJ/gi;
  while ((m = tjArrayRegex.exec(content)) !== null) {
    const inner = m[1];
    const innerParts = /\(([^)]*)\)/g;
    let im: RegExpExecArray | null;
    while ((im = innerParts.exec(inner)) !== null) {
      parts.push(decodePDFString(im[1]));
    }
  }

  // Match ' and " operators
  const quoteRegex = /\(([^)]*)\)\s*['"]/g;
  while ((m = quoteRegex.exec(content)) !== null) {
    parts.push(decodePDFString(m[1]));
  }

  return parts.join(' ');
}

/**
 * Decode common PDF string escape sequences.
 */
function decodePDFString(s: string): string {
  return s
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .replace(/\\t/g, '\t')
    .replace(/\\\(/g, '(')
    .replace(/\\\)/g, ')')
    .replace(/\\\\/g, '\\');
}

/**
 * Extract text from a DOCX file.
 * DOCX = ZIP of XML files. We extract text from word/document.xml.
 */
export async function extractTextFromDOCX(file: File): Promise<string> {
  // Strategy 1: Try the upload API first (works on Node.js servers)
  try {
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });
    if (response.ok) {
      const result = await response.json();
      if (result.text && result.text.trim().length >= 5) {
        return result.text;
      }
    }
  } catch {
    // Server-side parsing failed, fall through to client-side
  }

  // Strategy 2: Client-side ZIP + XML parsing
  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);

  const xmlContent = await extractFileFromZip(bytes, 'word/document.xml');
  if (!xmlContent) {
    throw new Error('Could not read DOCX content. Please try pasting text directly.');
  }

  // Parse XML to extract text content from <w:t> tags
  const textParts: string[] = [];
  const paragraphs = xmlContent.split(/<\/w:p>/);

  for (const para of paragraphs) {
    const runs: string[] = [];
    const wtRegex = /<w:t[^>]*>([^<]*)<\/w:t>/g;
    let m: RegExpExecArray | null;
    while ((m = wtRegex.exec(para)) !== null) {
      runs.push(m[1]);
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

/**
 * Extract a file from a ZIP archive (minimal implementation).
 * DOCX files are ZIP archives containing XML.
 */
async function extractFileFromZip(data: Uint8Array, targetPath: string): Promise<string | null> {
  // Find the Central Directory End record
  let eocdOffset = -1;
  for (let i = data.length - 22; i >= 0; i--) {
    if (data[i] === 0x50 && data[i + 1] === 0x4B && data[i + 2] === 0x05 && data[i + 3] === 0x06) {
      eocdOffset = i;
      break;
    }
  }

  if (eocdOffset === -1) return null;

  const cdOffset = readUint32(data, eocdOffset + 16);
  const cdSize = readUint32(data, eocdOffset + 12);
  let pos = cdOffset;
  const cdEnd = cdOffset + cdSize;

  while (pos < cdEnd && pos + 46 <= data.length) {
    if (data[pos] !== 0x50 || data[pos + 1] !== 0x4B || data[pos + 2] !== 0x01 || data[pos + 3] !== 0x02) {
      break;
    }

    const compressionMethod = readUint16(data, pos + 10);
    const compressedSize = readUint32(data, pos + 20);
    const nameLength = readUint16(data, pos + 28);
    const extraLength = readUint16(data, pos + 30);
    const commentLength = readUint16(data, pos + 32);
    const localHeaderOffset = readUint32(data, pos + 42);

    const name = new TextDecoder().decode(data.slice(pos + 46, pos + 46 + nameLength));

    if (name === targetPath) {
      const localPos = localHeaderOffset;
      if (data[localPos] !== 0x50 || data[localPos + 1] !== 0x4B ||
        data[localPos + 2] !== 0x03 || data[localPos + 3] !== 0x04) {
        return null;
      }

      const localNameLen = readUint16(data, localPos + 26);
      const localExtraLen = readUint16(data, localPos + 28);
      const dataStart = localPos + 30 + localNameLen + localExtraLen;
      const fileData = data.slice(dataStart, dataStart + compressedSize);

      if (compressionMethod === 0) {
        return new TextDecoder().decode(fileData);
      } else if (compressionMethod === 8) {
        // Deflate - use DecompressionStream API
        try {
          const ds = new DecompressionStream('deflate-raw');
          const writer = ds.writable.getWriter();
          const reader = ds.readable.getReader();

          writer.write(fileData);
          writer.close();

          const chunks: Uint8Array[] = [];
          // eslint-disable-next-line no-constant-condition
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            chunks.push(value);
          }

          const totalLength = chunks.reduce((sum, c) => sum + c.length, 0);
          const merged = new Uint8Array(totalLength);
          let offset = 0;
          for (const chunk of chunks) {
            merged.set(chunk, offset);
            offset += chunk.length;
          }

          return new TextDecoder().decode(merged);
        } catch {
          return null;
        }
      }

      return null;
    }

    pos += 46 + nameLength + extraLength + commentLength;
  }

  return null;
}

function readUint16(data: Uint8Array, offset: number): number {
  return data[offset] | (data[offset + 1] << 8);
}

function readUint32(data: Uint8Array, offset: number): number {
  return (data[offset] | (data[offset + 1] << 8) | (data[offset + 2] << 16) | (data[offset + 3] << 24)) >>> 0;
}
