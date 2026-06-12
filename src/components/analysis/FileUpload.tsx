'use client';

import { useCallback, useState, useRef } from 'react';
import { Upload, FileText, File, X, AlertCircle, CheckCircle2 } from 'lucide-react';
import { MAX_FILE_SIZE, SUPPORTED_FILE_TYPES, MAX_TEXT_LENGTH } from '@/lib/constants';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

interface FileUploadProps {
  onTextExtracted: (text: string, fileName: string) => void;
  onClear?: () => void;
  disabled?: boolean;
}

export function FileUpload({ onTextExtracted, onClear, disabled = false }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploadComplete, setIsUploadComplete] = useState(false);

  const extractedTextRef = useRef('');
  const selectedFileNameRef = useRef('');

  const prefersReducedMotion = useReducedMotion();
  const springTransition = prefersReducedMotion 
    ? { type: 'tween' as const, duration: 0 } 
    : { type: 'spring' as const, stiffness: 300, damping: 25 };

  const startProgress = useCallback(() => {
    setUploadProgress(0);
    setIsUploadComplete(false);
    
    const duration = 1200; // 1.2 seconds
    const start = performance.now();
    
    const animate = (time: number) => {
      const elapsed = time - start;
      const progress = Math.min(100, (elapsed / duration) * 100);
      setUploadProgress(progress);
      
      if (progress < 100) {
        requestAnimationFrame(animate);
      } else {
        setIsUploadComplete(true);
        // Delay sending back the text until progress completes!
        if (extractedTextRef.current) {
          onTextExtracted(extractedTextRef.current, selectedFileNameRef.current);
        }
      }
    };
    
    requestAnimationFrame(animate);
  }, [onTextExtracted]);

  const uploadToServer = async (fileToUpload: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', fileToUpload);
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Server extraction failed.');
    }
    const data = await response.json();
    return data.text;
  };

  const processFile = useCallback(async (selectedFile: File) => {
    setError(null);
    setFile(selectedFile);
    setUploadProgress(0);
    setIsUploadComplete(false);

    try {
      if (selectedFile.size > MAX_FILE_SIZE) {
        throw new Error('File size exceeds the 1GB limit.');
      }

      const ext = '.' + selectedFile.name.split('.').pop()?.toLowerCase();
      if (!SUPPORTED_FILE_TYPES.includes(ext)) {
        throw new Error('Unsupported file type. Please use PDF, DOCX, or TXT.');
      }

      let text = '';

      if (ext === '.txt') {
        text = await selectedFile.text();
      } else if (ext === '.pdf') {
        try {
          const { extractTextFromPDF } = await import('@/lib/client-file-parser');
          text = await extractTextFromPDF(selectedFile);
        } catch (clientErr) {
          console.warn('Client PDF parser failed, falling back to server-side parser:', clientErr);
          text = await uploadToServer(selectedFile);
        }
      } else if (ext === '.docx') {
        try {
          const { extractTextFromDOCX } = await import('@/lib/client-file-parser');
          text = await extractTextFromDOCX(selectedFile);
        } catch (clientErr) {
          console.warn('Client DOCX parser failed, falling back to server-side parser:', clientErr);
          text = await uploadToServer(selectedFile);
        }
      }

      if (!text || text.trim().length === 0) {
        throw new Error('No text content found in the file.');
      }

      if (text.length > MAX_TEXT_LENGTH) {
        throw new Error(`Extracted text exceeds the maximum limit of ${MAX_TEXT_LENGTH.toLocaleString()} characters. Please upload a shorter document.`);
      }

      // Store in refs and launch visual progress bar
      extractedTextRef.current = text;
      selectedFileNameRef.current = selectedFile.name;
      startProgress();
    } catch (err) {
      console.error('File processing error:', err);
      const message = err instanceof Error ? err.message : 'Unknown error processing file.';
      setError(message);
      setFile(null);
    }
  }, [startProgress]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) processFile(droppedFile);
  }, [processFile]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) processFile(selectedFile);
  }, [processFile]);

  const clearFile = () => {
    setFile(null);
    setError(null);
    setUploadProgress(0);
    setIsUploadComplete(false);
    extractedTextRef.current = '';
    selectedFileNameRef.current = '';
    if (onClear) onClear();
  };

  const getFileIcon = (name: string) => {
    if (name.endsWith('.pdf')) return <FileText className="w-5 h-5 text-red-500" />;
    if (name.endsWith('.docx')) return <FileText className="w-5 h-5 text-blue-500" />;
    return <File className="w-5 h-5 text-zinc-500" />;
  };

  return (
    <div>
      <AnimatePresence mode="wait">
        {!file ? (
          <motion.div
            key="upload-zone"
            initial={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.2, ease: 'easeOut' }}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            whileHover={prefersReducedMotion ? {} : { scale: 1.01 }}
            animate={isDragging ? 'dragOver' : 'default'}
            variants={{
              default: {
                borderColor: 'rgba(124, 92, 252, 0.4)', // muted purple
                backgroundColor: 'rgba(0, 0, 0, 0)',
                scale: 1,
                transition: springTransition
              },
              dragOver: {
                borderColor: '#7c5cfc',
                backgroundColor: 'rgba(124, 92, 252, 0.06)',
                scale: 1.02,
                transition: springTransition
              }
            }}
            className={`relative flex flex-col items-center justify-center p-10 border border-dashed rounded-xl cursor-pointer ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
          >
            <input
              type="file"
              accept=".pdf,.docx,.txt"
              onChange={handleFileSelect}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={disabled}
            />
            <motion.div
              variants={{
                default: { y: 0 },
                dragOver: { y: -6 }
              }}
              transition={springTransition}
            >
              <Upload className="w-8 h-8 mb-3 text-accent-purple" />
            </motion.div>
            
            <p className="text-sm font-medium text-text-primary mb-1">
              {isDragging ? 'Release to upload' : 'Drop your file here or click to browse'}
            </p>
            <p className="text-xs text-text-muted">
              Supports PDF, DOCX, TXT
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="file-card"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.3, ease: 'easeOut' }}
            className="group relative p-5 bg-bg-card rounded-xl border border-border-custom shadow-premium-glow flex flex-col gap-4 overflow-hidden"
          >
            <div className="flex items-center gap-3.5">
              <div className="p-2 rounded-lg bg-accent-purple/10 text-accent-purple">
                {getFileIcon(file.name)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-text-primary truncate">{file.name}</p>
                <p className="text-xs text-text-muted">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
              
              <div className="flex items-center justify-end w-8 h-8">
                <AnimatePresence mode="wait">
                  {isUploadComplete ? (
                    <motion.div
                      key="checkmark"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ 
                        type: 'spring',
                        stiffness: 300,
                        damping: 15,
                        duration: prefersReducedMotion ? 0 : 0.4
                      }}
                      className="text-accent-green"
                    >
                      <CheckCircle2 className="w-5.5 h-5.5 text-accent-green" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="spinner"
                      exit={{ scale: 0 }}
                      className="w-5 h-5 border-2 border-accent-purple border-t-transparent rounded-full animate-spin"
                    />
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-full h-1.5 bg-bg-input rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-accent-purple to-accent-pink rounded-full"
                initial={{ width: '0%' }}
                animate={{ width: `${uploadProgress}%` }}
                transition={{ duration: prefersReducedMotion ? 0 : 0.1, ease: 'linear' }}
              />
            </div>

            {/* Remove button (appears top-right on hover) */}
            <button
              onClick={clearFile}
              className="absolute top-2.5 right-2.5 p-1.5 bg-bg-primary hover:bg-accent-pink/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:text-accent-pink text-text-muted"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <div className="mt-3 flex items-start gap-2.5 p-3.5 bg-red-50 dark:bg-red-950/20 rounded-xl border border-red-100 dark:border-red-900/30">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm font-medium text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}
    </div>
  );
}
