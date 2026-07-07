import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field


class Settings(BaseSettings):
    """
    Central configuration class that reads all environment variables
    with Pydantic validation.

    The .env file is read from the backend/ directory. Default values
    are provided via Field(default=...) for all fields, so the app
    works even without a .env file.
    """

    model_config = SettingsConfigDict(
        env_file=os.path.join(
            os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
            ".env"
        ),
        env_file_encoding="utf-8",
        extra="ignore"
    )

    # --- API & LLM Keys ---
    DEEPSEEK_API_KEY: str = Field(
        default="mock_key",
        description="DeepSeek API key"
    )
    DEEPSEEK_BASE_URL: str = Field(
        default="https://api.deepseek.com/v1",
        description="DeepSeek API base URL (OpenAI compatible)"
    )
    OLLAMA_BASE_URL: str = Field(
        default="http://localhost:11434",
        description="Local Ollama server address"
    )

    # --- Vector DB & RAG Settings ---
    CHROMA_DB_DIR: str = Field(
        default="./chroma_db",
        description="ChromaDB vector database directory"
    )
    EMBEDDING_MODEL: str = Field(
        default="BAAI/bge-large-en-v1.5",
        description="HuggingFace embedding model name"
    )

    # --- Monitoring & Observability ---
    LANGSMITH_TRACING: bool = Field(
        default=True,
        description="Enable/disable LangSmith tracing"
    )
    LANGSMITH_ENDPOINT: str = Field(
        default="https://api.smith.langchain.com",
        description="LangSmith API endpoint"
    )
    LANGSMITH_API_KEY: str = Field(
        default="",
        description="LangSmith API key"
    )
    LANGSMITH_PROJECT: str = Field(
        default="portfolio-intelligence-assistant",
        description="LangSmith project name"
    )

    # --- Twelve Data API ---
    TWELVEDATA_API_KEY: str = Field(
        default="mock_key",
        description="Twelve Data API key"
    )
    TWELVEDATA_BASE_URL: str = Field(
        default="https://api.twelvedata.com",
        description="Twelve Data API base URL"
    )

    # --- Server Settings ---
    PORT: int = Field(
        default=8000,
        ge=1024,
        le=65535,
        description="FastAPI server port"
    )
    HOST: str = Field(
        default="0.0.0.0",
        description="FastAPI server host address"
    )


# Application-wide singleton settings instance
settings = Settings()
