import { NextRequest, NextResponse } from 'next/server';
import { MAX_FILE_SIZE } from '@/lib/constants';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided.' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File size exceeds the 1GB limit.' }, { status: 400 });
    }

    const fileName = file.name.toLowerCase();
    let text = '';

    if (fileName.endsWith('.txt')) {
      text = await file.text();
    } else if (fileName.endsWith('.pdf') || fileName.endsWith('.docx')) {
      // For PDF and DOCX, we extract text server-side
      // In MVP, we'll do basic extraction. For production, use pdf-parse and mammoth.
      const buffer = Buffer.from(await file.arrayBuffer());
      
      if (fileName.endsWith('.pdf')) {
        // Try to extract text from PDF using pdf-parse (handles both function and class versions)
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const pdfParseModule = await import('pdf-parse') as any;
          if (typeof pdfParseModule.PDFParse === 'function') {
            const parser = new pdfParseModule.PDFParse({ data: buffer });
            const parsed = await parser.getText();
            text = parsed.text || '';
          } else {
            const pdfParse = pdfParseModule.default || pdfParseModule;
            const data = await pdfParse(buffer);
            text = data.text || '';
          }
        } catch (err) {
          console.error('pdf-parse library extraction failed, attempting raw text extraction:', err);
          // Fallback: try to extract readable text from buffer (ignoring raw binary segments)
          const rawStr = buffer.toString('utf-8');
          // If it contains PDF binary header, do not return raw PDF structures
          if (rawStr.includes('%PDF-')) {
            throw new Error('PDF parsing failed. The document may be scanned, image-only, or encrypted.');
          }
          text = rawStr.replace(/[^\x20-\x7E\n\r\t]/g, ' ').replace(/\s+/g, ' ').trim();
        }

        if (!text || text.trim().length < 10) {
          return NextResponse.json(
            { error: 'Could not extract text from PDF. Please try pasting text directly.' },
            { status: 422 }
          );
        }
      } else if (fileName.endsWith('.docx')) {
        try {
          const mammoth = await import('mammoth');
          const result = await mammoth.extractRawText({ buffer });
          text = result.value;
        } catch {
          return NextResponse.json(
            { error: 'Could not extract text from DOCX. Please try pasting text directly.' },
            { status: 422 }
          );
        }
      }
    } else {
      return NextResponse.json({ error: 'Unsupported file type.' }, { status: 400 });
    }

    if (!text || text.trim().length === 0) {
      return NextResponse.json({ error: 'No text content found in the file.' }, { status: 422 });
    }

    return NextResponse.json({ text: text.trim(), fileName: file.name });
  } catch (error) {
    console.error('Upload error:', error);
    const message = error instanceof Error ? error.message : 'Failed to process file.';
    return NextResponse.json({ error: message }, { status: 422 });
  }
}
