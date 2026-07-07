'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Cpu,
  Zap,
  Clock,
  ShieldAlert,
  Layers,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import { ChatMessage, ChatRequest } from '../types';
import { PortfolioApiService } from '../services/api';

interface ChatSectionProps {
  portfolioId: string | null;
}

interface MetricEntry {
  responseTimeSec: number;
  providerUsed: string;
  modelUsed: string;
}

const MAX_MESSAGES = 16; // memory limit (16 messages)

export default function ChatSection({ portfolioId }: ChatSectionProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // AI Configuration States (Dual LLM Setup)
  const [provider, setProvider] = useState<string>('ollama');
  const [model, setModel] = useState<string>('llama3.2');
  const [temperature, setTemperature] = useState<number>(0.2);

  // Performance Metrics — accumulated as array (for comparison)
  const [metricsHistory, setMetricsHistory] = useState<MetricEntry[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-update model list when provider changes
  useEffect(() => {
    if (provider === 'deepseek') {
      setModel('deepseek-chat');
    } else {
      setModel('llama3.2');
    }
  }, [provider]);

  // Auto-scroll when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !portfolioId || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setError(null);

    // Add user message to the screen
    const updatedHistory: ChatMessage[] = [
      ...messages,
      { role: 'user' as const, content: userMessage },
    ];
    setMessages(updatedHistory);
    setIsLoading(true);

    try {
      const payload: ChatRequest = {
        message: userMessage,
        portfolio_id: portfolioId,
        provider,
        model,
        temperature,
        history: updatedHistory.slice(0, -1),
      };

      // Trigger Backend API / LangGraph Agent
      const response =
        await PortfolioApiService.sendMessageToAgent(payload);

      // Add assistant response
      setMessages((prev) => {
        const newMessages: ChatMessage[] = [
          ...prev,
          { role: 'assistant', content: response.answer },
        ];

        // If memory limit exceeded, summarize old messages
        if (newMessages.length > MAX_MESSAGES) {
          const excess = newMessages.length - MAX_MESSAGES;
          const summarized: ChatMessage = {
            role: 'assistant',
            content: `[Previous ${excess * 2} messages summarized]`,
          };
          return [summarized, ...newMessages.slice(excess * 2)];
        }
        return newMessages;
      });

      // Accumulate performance metrics (add on every query)
      if (response.metrics) {
        setMetricsHistory((prev) => [
          ...prev,
          {
            responseTimeSec: response.metrics.response_time_sec,
            providerUsed: response.metrics.provider_used,
            modelUsed: response.metrics.model_used,
          },
        ]);
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'Could not get a response from the AI agent.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([]);
    setError(null);
    setMetricsHistory([]);
  };

  return (
    <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
      {/* LEFT SIDE: AI Settings & Performance Metrics */}
      <div className="flex flex-col space-y-6 lg:col-span-1">
        {/* AI Configuration Box */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl">
          <div className="flex items-center space-x-2 mb-4 border-b border-slate-800 pb-2">
            <Cpu className="h-5 w-5 text-emerald-400" />
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
              AI Configuration
            </h3>
          </div>

          <div className="space-y-4">
            {/* Provider Selection */}
            <div>
              <label className="text-xs font-medium text-slate-400 block mb-1.5">
                LLM Provider
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setProvider('deepseek')}
                  className={`py-2 px-3 text-xs font-medium rounded-lg border transition-all duration-200 ${
                    provider === 'deepseek'
                      ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  DeepSeek API (Cloud)
                </button>
                <button
                  type="button"
                  onClick={() => setProvider('ollama')}
                  className={`py-2 px-3 text-xs font-medium rounded-lg border transition-all duration-200 ${
                    provider === 'ollama'
                      ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  Ollama (Local)
                </button>
              </div>
            </div>

            {/* Model Selection */}
            <div>
              <label className="text-xs font-medium text-slate-400 block mb-1.5">
                Model
              </label>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-xs font-medium text-slate-200 focus:outline-none focus:border-slate-700"
              >
                {provider === 'deepseek' ? (
                  <option value="deepseek-chat">
                    deepseek-chat (V3 / R1)
                  </option>
                ) : (
                  <>
                    <option value="llama3.2">
                      Llama 3.2 (3B - Meta)
                    </option>
                    <option value="qwen2.5">
                      Qwen 2.5 (Alibaba)
                    </option>
                    <option value="gemma3">Gemma 3 (Google)</option>
                  </>
                )}
              </select>
            </div>

            {/* Temperature Slider */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-medium text-slate-400">
                  Temperature
                </label>
                <span className="text-xs font-mono font-medium text-emerald-400">
                  {temperature}
                </span>
              </div>
              <input
                type="range"
                min="0.0"
                max="1.0"
                step="0.1"
                value={temperature}
                onChange={(e) =>
                  setTemperature(parseFloat(e.target.value))
                }
                className="w-full accent-emerald-500 bg-slate-950 rounded-lg appearance-none h-1.5"
              />
            </div>
          </div>
        </div>

        {/* Performance Monitor — Accumulated Comparison Panel */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl">
          <div className="flex items-center space-x-2 mb-4 border-b border-slate-800 pb-2">
            <Zap className="h-5 w-5 text-cyan-400" />
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
              Performance Monitor
            </h3>
          </div>

          {metricsHistory.length > 0 ? (
            <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
              {metricsHistory.map((m, i) => (
                <div
                  key={i}
                  className="p-2.5 bg-slate-950 border border-slate-800 rounded-lg space-y-1.5"
                >
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">
                      #{i + 1}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded font-mono bg-slate-800 text-slate-300">
                      {m.providerUsed} / {m.modelUsed}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-slate-400">
                    <Clock className="h-3.5 w-3.5 text-cyan-400 flex-shrink-0" />
                    <span>{m.responseTimeSec}s</span>
                    <span className="text-slate-600">|</span>
                    <span className="capitalize">{m.providerUsed}</span>
                  </div>
                </div>
              ))}
              {metricsHistory.length >= 2 && (
                <div className="pt-2 text-[10px] text-slate-500 text-center border-t border-slate-800 mt-2">
                  Fastest:{' '}
                  {Math.min(
                    ...metricsHistory.map((m) => m.responseTimeSec)
                  )}
                  s | Total {metricsHistory.length} measurements
                </div>
              )}
            </div>
          ) : (
            <div className="text-xs text-slate-500 text-center py-6">
              Ask a question to see live model comparison metrics.
            </div>
          )}
        </div>
      </div>

      {/* RIGHT SIDE: Real-Time Chat Area */}
      <div className="flex flex-col lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl shadow-xl h-[450px]">
        {/* Chat Header with Clear Button */}
        <div className="flex items-center justify-between px-4 py-2 bg-slate-950 border-b border-slate-800 rounded-t-xl">
          <span className="text-xs text-slate-400 font-mono">
            {messages.length > 0
              ? `${messages.length} messages (max ${MAX_MESSAGES})`
              : 'Chat'}
          </span>
          {messages.length > 0 && (
            <button
              onClick={handleClearChat}
              className="flex items-center space-x-1 text-xs text-red-400 hover:text-red-300 transition-colors px-2 py-1 rounded hover:bg-red-950/30"
            >
              <Trash2 className="h-3 w-3" />
              <span>Clear</span>
            </button>
          )}
        </div>

        {/* Chat History Container */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {!portfolioId ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2">
              <Layers className="h-8 w-8 text-slate-700 animate-bounce" />
              <p className="text-sm text-slate-400 font-medium">
                Chat Cannot Be Started
              </p>
              <p className="text-xs text-slate-600 max-w-xs">
                You must upload a document above so the assistant can read
                your portfolio context.
              </p>
            </div>
          ) : messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-xs text-slate-500">
              Your portfolio has been successfully stored in memory! You can
              now ask questions about your assets, risk status, or currency
              rates.
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${
                  msg.role === 'user'
                    ? 'justify-end'
                    : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[85%] rounded-xl p-3 text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'bg-emerald-600 text-white rounded-br-none'
                      : 'bg-slate-950 border border-slate-800 text-slate-200 rounded-bl-none'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))
          )}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-slate-950 border border-slate-800 rounded-xl rounded-bl-none p-3 flex items-center space-x-2 text-xs text-slate-400 font-mono">
                <RefreshCw className="h-3 w-3 animate-spin text-emerald-400" />
                <span>Agent reasoning (MCP & CoT)...</span>
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-950/20 border border-red-900/50 rounded-lg flex items-start space-x-2 text-red-400 text-xs">
              <ShieldAlert className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input Form */}
        <form
          onSubmit={handleSendMessage}
          className="p-3 bg-slate-950 border-t border-slate-800 rounded-b-xl flex items-center space-x-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              portfolioId
                ? 'Ask the assistant about your portfolio...'
                : 'Please upload a portfolio first...'
            }
            disabled={!portfolioId || isLoading}
            className="flex-1 bg-slate-900 border border-slate-800 rounded-lg py-2 px-3 text-sm text-slate-200 focus:outline-none focus:border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
          />
          <button
            type="submit"
            disabled={!input.trim() || !portfolioId || isLoading}
            className="p-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
