#  AI Portfolio Intelligence Assistant

**Dual LLM Architecture** — Autonomous portfolio analysis engine powered by LangGraph, RAG (ChromaDB), and MCP with live Twelve Data integration.

[![Python](https://img.shields.io/badge/Python-3.14-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.139-green.svg)](https://fastapi.tiangolo.com/)
[![Next.js](https://img.shields.io/badge/Next.js-14.2-black.svg)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue.svg)](https://www.typescriptlang.org/)
[![LangGraph](https://img.shields.io/badge/LangGraph-1.2.7-orange.svg)](https://langchain-ai.github.io/langgraph/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

##  Overview

AI Portfolio Intelligence Assistant is a full-stack application that lets users upload portfolio documents (PDF, CSV, Excel), indexes them using **RAG (Retrieval-Augmented Generation)** with ChromaDB and BAAI/bge-large-en-v1.5 embeddings, and analyzes them through an autonomous **LangGraph agent** that can fetch **live market prices** from the Twelve Data API via **MCP (Model Context Protocol)** tools.

Users can dynamically switch between **DeepSeek API (Cloud)** and **Ollama (Local)** — choosing between speed/cost and privacy.

---

##  Architecture

```
Browser (:3000) → Next.js → FastAPI (:8001) → LangGraph Agent
                                                  ├── RAG (ChromaDB + BAAI/bge-large-en-v1.5)
                                                  ├── MCP Tools (Twelve Data live prices)
                                                  ├── Security Guard (Prompt Injection)
                                                  └── Session Memory (16 msg FIFO)
```

### Key Design Patterns

| Pattern | Where | Why |
|---------|-------|-----|
| **Factory** | [`llm.py`](backend/app/core/llm.py) | `get_llm(provider, model, temp)` — provider-agnostic LLM creation |
| **Strategy** | [`parser.py`](backend/app/services/parser.py) | `parse_file()` routes to PDF/CSV/Excel parser by extension |
| **Singleton** | [`config.py`](backend/app/core/config.py), [`memory.py`](backend/app/agent/memory.py) | Single shared settings & memory instances |
| **StateGraph** | [`graph.py`](backend/app/agent/graph.py) | LangGraph ReAct loop: `call_model → should_continue → execute_tools` |

---

##  Quick Start

### Prerequisites

- **Python 3.11+**
- **Node.js 18+**
- **Ollama** (optional, for local LLM): [ollama.com](https://ollama.com)
- **Twelve Data API key** (free tier available): [twelvedata.com](https://twelvedata.com)

### 1. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv .venv

# Activate (Windows)
.venv\Scripts\activate
# Activate (macOS/Linux)
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy environment template
copy .env.example .env   # Windows
cp .env.example .env     # macOS/Linux

# Edit .env with your API keys
# TWELVEDATA_API_KEY=your_key_here
# DEEPSEEK_API_KEY=your_key_here

# Start backend
python app/main.py
# → http://localhost:8001/docs
```

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
# → http://localhost:3000
```

### 3. Pull Local Models (Optional)

```bash
ollama pull llama3.2
ollama pull qwen2.5
ollama pull gemma3
```

---

##  Project Structure

```
portfolio-intelligence-assistant/
├── backend/
│   ├── app/
│   │   ├── core/           # config.py, llm.py (Factory), security.py (Guardrails)
│   │   ├── services/       # parser.py, vector_store.py (ChromaDB RAG)
│   │   ├── agent/          # graph.py (LangGraph), prompts.py, memory.py
│   │   ├── mcp/            # server.py (Twelve Data MCP tools)
│   │   └── api/            # main.py (FastAPI), endpoints.py (/chat, /upload)
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── app/            # layout.tsx, page.tsx (landing), dashboard/
│   │   ├── components/     # PortfolioUpload, ChatSection, PerformanceBox, AssetCharts
│   │   ├── types/          # TypeScript interfaces
│   │   └── services/       # API service (PortfolioApiService)
│   ├── package.json
│   └── tailwind.config.ts
├── plans/                  # Documentation & reports (Turkish)
└── README.md
```

---

##  API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | Health check |
| `POST` | `/api/upload` | Upload portfolio document (PDF/CSV/Excel) → ChromaDB |
| `POST` | `/api/chat` | Send message to LangGraph agent → AI response + metrics |

### Chat Request

```json
{
  "message": "What is my portfolio risk level?",
  "portfolio_id": "abc-123",
  "provider": "ollama",
  "model": "llama3.2",
  "temperature": 0.2,
  "history": []
}
```

### Chat Response

```json
{
  "answer": "Your portfolio shows High Risk (85/100)...",
  "metrics": {
    "response_time_sec": 77.87,
    "provider_used": "ollama",
    "model_used": "llama3.2"
  },
  "context_used": "Customer Portfolio Summary..."
}
```

---

##  Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Backend** | Python 3.14, FastAPI, LangChain, LangGraph, ChromaDB, Pydantic |
| **AI/ML** | BAAI/bge-large-en-v1.5, SentenceTransformers, Ollama, DeepSeek |
| **Data** | Twelve Data API, pandas, pypdf, openpyxl |
| **Frontend** | Next.js 14, React 18, TypeScript 5, TailwindCSS 3, Recharts, Lucide |
| **Monitoring** | LangSmith (tracing & observability) |

---

##  Testing

```bash
cd backend
python test_pipeline.py
```

Runs a 3-stage E2E test:
1. **RAG & ChromaDB** — Embed + semantic search
2. **Twelve Data MCP** — Live price fetch + risk analysis
3. **Ollama LLM** — Local model connection test

---

##  Security Features

- **Prompt Injection Guard** — 8 regex patterns block malicious inputs ([`security.py`](backend/app/core/security.py))
- **System Prompt Rules** — LLM constrained to RAG context, no investment advice ([`prompts.py`](backend/app/agent/prompts.py))
- **Temporary File Cleanup** — Uploaded files deleted after processing
- **API Timeout** — Twelve Data requests capped at 10s ([`server.py`](backend/app/mcp/server.py))
- **Memory Limit** — Chat history capped at 16 messages with auto-summarization

---

##  Features

-  **Dual LLM**: Switch between DeepSeek API and Ollama Local in real-time
-  **RAG Pipeline**: ChromaDB + BAAI/bge-large-en-v1.5 embeddings
-  **Live Prices**: Twelve Data API integration via MCP tools
-  **Autonomous Agent**: LangGraph ReAct loop with function calling
-  **Session Memory**: Per-session chat history with auto-summarization
-  **Performance Monitor**: Live response time comparison (Cloud vs Local)
-  **Guardrails**: Prompt injection protection + system prompt hardening
-  **Modern UI**: Next.js + TailwindCSS dark theme dashboard

---

*Built with ❤️ as a comprehensive AI/LLM portfolio project demonstrating Dual LLM Architecture, RAG, Agent, and MCP patterns.*
