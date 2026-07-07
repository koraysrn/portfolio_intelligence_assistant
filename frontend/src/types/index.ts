export interface Asset {
  ticker: string;
  amount: number;
  live_price_usd: number;
  total_value_usd: number;
  category: string;
}

export interface UploadResponse {
  status: string;
  portfolio_id: string;
  file_name: string;
  message: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatRequest {
  message: string;
  portfolio_id: string;
  provider: string;
  model: string;
  temperature: number;
  history: { role: string; content: string }[];
}

export interface ChatResponse {
  answer: string;
  metrics: {
    response_time_sec: number;
    provider_used: string;
    model_used: string;
  };
  context_used: string;
}
