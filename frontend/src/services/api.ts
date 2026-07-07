import { ChatRequest, ChatResponse, UploadResponse } from '../types';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8001/api';

export const PortfolioApiService = {
  /** POSTs the uploaded portfolio file to the backend and returns a portfolio_id */
  async uploadPortfolio(file: File): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'File upload error.');
    }

    return response.json();
  },

  /** Sends user message, model settings, and history to the autonomous agent */
  async sendMessageToAgent(payload: ChatRequest): Promise<ChatResponse> {
    const response = await fetch(`${API_BASE_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Agent did not respond.');
    }

    return response.json();
  },
};
