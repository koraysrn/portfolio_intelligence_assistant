'use client';

import React from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  TrendingUp,
  Cpu,
  ShieldCheck,
  Database,
} from 'lucide-react';

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-slate-900 to-slate-950 px-4">
      <div className="max-w-4xl w-full text-center space-y-6">
        {/* Project Title and Badge */}
        <div className="inline-flex items-center space-x-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-3 py-1 text-xs text-emerald-400 font-mono mx-auto">
          <Cpu className="h-3.5 w-3.5" />{' '}
          <span>Dual LLM Architecture Active</span>
        </div>

        <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
          AI Portfolio{' '}
          <span className="text-emerald-400">Intelligence</span> Assistant
        </h1>

        <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Upload your investment statements (PDF, CSV, Excel) to smart RAG
          memory, analyze your risk with Twelve Data live financial
          integration and autonomous agents.
        </p>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left pt-6">
          <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl space-y-1.5">
            <Database className="h-5 w-5 text-emerald-400" />
            <h3 className="text-sm font-semibold text-white">
              Local RAG & Embedding
            </h3>
            <p className="text-xs text-slate-400">
              Your texts are encrypted locally with bge-large-en-v1.5 and
              stored on ChromaDB.
            </p>
          </div>
          <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl space-y-1.5">
            <TrendingUp className="h-5 w-5 text-cyan-400" />
            <h3 className="text-sm font-semibold text-white">
              Twelve Data Live MCP
            </h3>
            <p className="text-xs text-slate-400">
              The agent triggers external market tools to value assets with
              live market prices.
            </p>
          </div>
          <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl space-y-1.5">
            <ShieldCheck className="h-5 w-5 text-indigo-400" />
            <h3 className="text-sm font-semibold text-white">
              Guardrails & Security
            </h3>
            <p className="text-xs text-slate-400">
              Backend filtering protection and sandbox structure against
              malicious prompt leaks.
            </p>
          </div>
        </div>

        {/* CTA Button */}
        <div className="pt-6">
          <Link
            href="/dashboard"
            className="inline-flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm px-6 py-3 rounded-lg shadow-lg hover:shadow-emerald-600/10 transition-all duration-150 group"
          >
            <span>Enter Analysis Panel</span>
            <ArrowRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </main>
  );
}
