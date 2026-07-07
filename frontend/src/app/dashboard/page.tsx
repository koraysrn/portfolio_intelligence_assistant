'use client';

import React, { useState } from 'react';
import { Briefcase, Wallet } from 'lucide-react';
import PortfolioUpload from '../../components/PortfolioUpload';
import ChatSection from '../../components/ChatSection';

export default function DashboardPage() {
  const [activePortfolioId, setActivePortfolioId] = useState<
    string | null
  >(null);
  const [activeFileName, setActiveFileName] = useState<string | null>(
    null
  );

  const handleUploadSuccess = (portfolioId: string, fileName: string) => {
    setActivePortfolioId(portfolioId);
    setActiveFileName(fileName);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* TOP BAR */}
      <header className="w-full bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between shadow-md">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-emerald-600 rounded-lg text-white">
            <Briefcase className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-tight">
              Portfolio Intelligence Terminal
            </h1>
            <p className="text-xs text-slate-500">
              Autonomous AI Agent System v1.0
            </p>
          </div>
        </div>

        {activeFileName && (
          <div className="flex items-center space-x-2 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-lg text-xs">
            <Wallet className="h-3.5 w-3.5 text-emerald-400" />
            <span className="text-slate-400">Active Statement:</span>
            <span className="text-white font-medium max-w-[150px] truncate">
              {activeFileName}
            </span>
          </div>
        )}
      </header>

      {/* DASHBOARD CONTENT AREA */}
      <main className="flex-1 p-6 space-y-6 max-w-7xl w-full mx-auto">
        {/* File Upload Area */}
        <PortfolioUpload onUploadSuccess={handleUploadSuccess} />

        {/* AI Agent Chat and Metrics Area */}
        <ChatSection portfolioId={activePortfolioId} />
      </main>
    </div>
  );
}
