import os
import logging
from typing import List, Dict, Any

import pandas as pd
from pypdf import PdfReader
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)


class PortfolioAsset(BaseModel):
    """Standard data model for each parsed asset."""
    ticker: str = Field(
        ..., description="Asset symbol or name (e.g. AAPL, BTC, Cash)"
    )
    amount: float = Field(0.0, description="Asset quantity or count")
    value_usd: float = Field(
        0.0, description="Total USD equivalent value of the asset"
    )
    category: str = Field(
        "Unknown", description="Asset class or sector"
    )


class ParsedPortfolio(BaseModel):
    """Standard output model produced by the parsing operation."""
    assets: List[PortfolioAsset] = Field(default_factory=list)
    raw_text: str = Field(
        "",
        description="Raw text to be chunked and embedded in the RAG layer"
    )
    metadata: Dict[str, Any] = Field(default_factory=dict)


class PortfolioParserService:
    """Service class for processing PDF, CSV, and Excel portfolio documents."""

    @staticmethod
    def parse_pdf(file_path: str) -> ParsedPortfolio:
        """Reads a PDF portfolio statement page by page and converts to text."""
        logger.info("PDF Parsing Started: %s", file_path)
        raw_text_chunks = []
        try:
            reader = PdfReader(file_path)
            for page_num, page in enumerate(reader.pages):
                text = page.extract_text()
                if text:
                    raw_text_chunks.append(
                        f"--- Page {page_num + 1} ---\n{text}"
                    )

            full_text = "\n".join(raw_text_chunks)
            return ParsedPortfolio(
                raw_text=full_text,
                metadata={
                    "file_type": "pdf",
                    "file_name": os.path.basename(file_path)
                }
            )
        except Exception as e:
            logger.error("Error parsing PDF: %s", str(e))
            raise ValueError(f"PDF read error: {str(e)}")

    @staticmethod
    def parse_csv(file_path: str) -> ParsedPortfolio:
        """Reads CSV portfolio data using pandas."""
        logger.info("CSV Parsing Started: %s", file_path)
        try:
            df = pd.read_csv(file_path)
            raw_text = df.to_string()
            return ParsedPortfolio(
                raw_text=raw_text,
                metadata={
                    "file_type": "csv",
                    "file_name": os.path.basename(file_path)
                }
            )
        except Exception as e:
            logger.error("Error parsing CSV: %s", str(e))
            raise ValueError(f"CSV read error: {str(e)}")

    @staticmethod
    def parse_excel(file_path: str) -> ParsedPortfolio:
        """Reads Excel (xlsx, xls) portfolio data using pandas."""
        logger.info("Excel Parsing Started: %s", file_path)
        try:
            df = pd.read_excel(file_path)
            raw_text = df.to_string()
            return ParsedPortfolio(
                raw_text=raw_text,
                metadata={
                    "file_type": "excel",
                    "file_name": os.path.basename(file_path)
                }
            )
        except Exception as e:
            logger.error("Error parsing Excel: %s", str(e))
            raise ValueError(f"Excel read error: {str(e)}")

    @classmethod
    def parse_file(cls, file_path: str) -> ParsedPortfolio:
        """
        Automatically triggers the appropriate parser based on file extension.
        """
        ext = os.path.splitext(file_path)[1].lower()
        if ext == ".pdf":
            return cls.parse_pdf(file_path)
        elif ext == ".csv":
            return cls.parse_csv(file_path)
        elif ext in [".xlsx", ".xls"]:
            return cls.parse_excel(file_path)
        else:
            raise ValueError(
                f"Unsupported file format: {ext}. "
                f"Only PDF, CSV, or Excel files are allowed."
            )
