import logging
from typing import Union

from langchain_openai import ChatOpenAI
from langchain_ollama import ChatOllama

from app.core.config import settings

logger = logging.getLogger(__name__)


def get_llm(
    provider: str,
    model: str,
    temperature: float = 0.2
) -> Union[ChatOpenAI, ChatOllama]:
    """
    Factory function that returns the appropriate LangChain LLM instance
    based on the selected provider and model.

    This is the core of the Dual LLM Architecture. LangGraph, RAG, and MCP
    modules access the LLM through this function, so provider changes
    never affect any other module.

    Args:
        provider: LLM provider name. Supported values:
                  "deepseek" → DeepSeek API (OpenAI compatible)
                  "ollama"   → Local Ollama server
        model:    Model name to use.
                  DeepSeek: "deepseek-chat", "deepseek-reasoner"
                  Ollama:   "llama3.2", "qwen2.5", "gemma3"
        temperature: Generation temperature (0.0-1.0). Default: 0.2

    Returns:
        Union[ChatOpenAI, ChatOllama]: LangChain-compatible chat model

    Raises:
        ValueError: If an unsupported provider is given

    Example:
        >>> llm = get_llm("deepseek", "deepseek-chat", 0.0)
        >>> llm = get_llm("ollama", "llama3.2", 0.3)
    """
    provider = provider.lower().strip()

    if provider == "deepseek":
        logger.info(
            "Starting DeepSeek API. Model: %s, Temperature: %.2f",
            model, temperature
        )
        return ChatOpenAI(
            model=model,
            temperature=temperature,
            openai_api_key=settings.DEEPSEEK_API_KEY,
            openai_api_base=settings.DEEPSEEK_BASE_URL,
        )

    elif provider == "ollama":
        logger.info(
            "Starting local Ollama. Model: %s, Temperature: %.2f",
            model, temperature
        )
        return ChatOllama(
            model=model,
            temperature=temperature,
            base_url=settings.OLLAMA_BASE_URL,
        )

    else:
        error_msg = (
            f"Unsupported LLM provider: '{provider}'. "
            f"Only 'deepseek' or 'ollama' are allowed."
        )
        logger.error(error_msg)
        raise ValueError(error_msg)
