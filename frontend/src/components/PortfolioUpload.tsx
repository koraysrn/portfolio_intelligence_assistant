'use client';

import React, { useState, useRef } from 'react';
import {
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { PortfolioApiService } from '../services/api';

interface PortfolioUploadProps {
  onUploadSuccess: (portfolioId: string, fileName: string) => void;
}

export default function PortfolioUpload({
  onUploadSuccess,
}: PortfolioUploadProps) {
  const [isDragActive, setIsDragActive] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successFile, setSuccessFile] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const allowedExtensions = ['.pdf', '.csv', '.xlsx', '.xls'];

  const validateAndUploadFile = async (file: File) => {
    setError(null);
    setSuccessFile(null);

    const fileExtension = file.name
      .substring(file.name.lastIndexOf('.'))
      .toLowerCase();

    if (!allowedExtensions.includes(fileExtension)) {
      setError(
        `Invalid file format. Please upload only ${allowedExtensions.join(', ')} files.`
      );
      return;
    }

    setIsLoading(true);
    try {
      const response = await PortfolioApiService.uploadPortfolio(file);
      if (response && response.portfolio_id) {
        setSuccessFile(file.name);
        onUploadSuccess(response.portfolio_id, file.name);
      } else {
        throw new Error('Backend did not return a valid portfolio ID.');
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'An error occurred while parsing the file. Please check your document.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndUploadFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndUploadFile(e.target.files[0]);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-white tracking-tight">
          Upload Portfolio Document
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          Upload your investment statement (PDF, CSV or Excel) for AI
          analysis.
        </p>
      </div>

      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={triggerFileInput}
        className={`w-full h-52 border-2 border-dashed rounded-lg flex flex-col items-center justify-center p-4 cursor-pointer transition-all duration-200 ${
          isDragActive
            ? 'border-emerald-500 bg-emerald-950/10'
            : 'border-slate-700 bg-slate-950/40 hover:border-slate-600 hover:bg-slate-950/60'
        } ${isLoading ? 'pointer-events-none opacity-50' : ''}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".pdf,.csv,.xlsx,.xls"
          onChange={handleFileChange}
          disabled={isLoading}
        />

        {isLoading ? (
          <div className="flex flex-col items-center space-y-3">
            <Loader2 className="h-10 w-10 text-emerald-500 animate-spin" />
            <p className="text-sm text-slate-300 font-medium animate-pulse">
              AI is parsing your portfolio data...
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center text-center space-y-2">
            <div className="p-3 bg-slate-900 border border-slate-800 rounded-full text-slate-400">
              <Upload className="h-6 w-6" />
            </div>
            <p className="text-sm text-slate-200 font-medium">
              Drag & drop your file here or{' '}
              <span className="text-emerald-400 underline">browse</span>
            </p>
            <p className="text-xs text-slate-500">
              Supported Formats: PDF, CSV, XLSX, XLS (Max: 10MB)
            </p>
          </div>
        )}
      </div>

      {/* Error Panel */}
      {error && (
        <div className="mt-4 p-3 bg-red-950/20 border border-red-900/50 rounded-lg flex items-start space-x-3 text-red-400">
          <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
          <div className="text-sm font-medium">{error}</div>
        </div>
      )}

      {/* Success Panel */}
      {successFile && (
        <div className="mt-4 p-3 bg-emerald-950/20 border border-emerald-900/50 rounded-lg flex items-center space-x-3 text-emerald-400">
          <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
          <div className="text-sm font-medium flex-1 truncate">
            {successFile} has been successfully processed into smart
            memory!
          </div>
          <div className="flex items-center space-x-1 bg-emerald-500/10 text-emerald-400 text-xs px-2 py-0.5 rounded border border-emerald-500/20 font-mono">
            <FileText className="h-3 w-3 mr-1" /> READY
          </div>
        </div>
      )}
    </div>
  );
}
