import os
import logging
from typing import List, Dict, Any

import chromadb
from chromadb.utils import embedding_functions

from app.core.config import settings

logger = logging.getLogger(__name__)


class VectorStoreService:
    """
    ChromaDB-based RAG (Retrieval-Augmented Generation) pipeline service.
    Handles chunking, embedding, persistent storage, and semantic search
    for portfolio documents.
    """

    def __init__(self):
        # Ensure the persistent ChromaDB data directory exists
        os.makedirs(settings.CHROMA_DB_DIR, exist_ok=True)

        # Initialize the persistent client
        self.client = chromadb.PersistentClient(
            path=settings.CHROMA_DB_DIR
        )

        # HuggingFace-based local embedding function (bge-large-en-v1.5)
        # No API key required — runs entirely locally with high accuracy
        self.embedding_fn = (
            embedding_functions.SentenceTransformerEmbeddingFunction(
                model_name=settings.EMBEDDING_MODEL
            )
        )

        logger.info(
            "ChromaDB Persistent Client initialized. Dir: %s",
            settings.CHROMA_DB_DIR
        )

    def _get_or_create_collection(self, collection_name: str):
        """Safely retrieves or creates a collection."""
        return self.client.get_or_create_collection(
            name=collection_name,
            embedding_function=self.embedding_fn
        )

    def chunk_text(
        self,
        text: str,
        chunk_size: int = 500,
        chunk_overlap: int = 50
    ) -> List[str]:
        """
        Splits raw portfolio text into chunks of specified size
        with overlap using a sliding window algorithm.
        """
        if not text:
            return []

        chunks = []
        words = text.split()

        # Controlled sliding window chunking — no spaghetti code
        for i in range(0, len(words), chunk_size - chunk_overlap):
            chunk_words = words[i:i + chunk_size]
            chunk_text = " ".join(chunk_words)
            if chunk_text.strip():
                chunks.append(chunk_text)

        return chunks

    def add_portfolio_document(
        self,
        portfolio_id: str,
        raw_text: str,
        metadata: Dict[str, Any] = None
    ) -> bool:
        """
        Chunks the portfolio text, generates embeddings, and stores
        them in ChromaDB.
        """
        logger.info(
            "Adding portfolio document to ChromaDB. Portfolio ID: %s",
            portfolio_id
        )
        try:
            collection = self._get_or_create_collection(
                f"portfolio_{portfolio_id}"
            )
            chunks = self.chunk_text(raw_text)

            if not chunks:
                logger.warning("No meaningful text chunks found to add.")
                return False

            ids = [f"chunk_{i}" for i in range(len(chunks))]
            metadatas = [metadata or {} for _ in range(len(chunks))]

            # ChromaDB bulk insert
            collection.add(
                documents=chunks,
                ids=ids,
                metadatas=metadatas
            )
            logger.info(
                "Successfully saved %d chunks to ChromaDB.", len(chunks)
            )
            return True
        except Exception as e:
            logger.error(
                "Error adding document to ChromaDB: %s", str(e)
            )
            return False

    def retrieve_relevant_chunks(
        self,
        portfolio_id: str,
        query: str,
        top_k: int = 4
    ) -> List[Dict[str, Any]]:
        """
        Performs semantic search in the portfolio collection and returns
        the most relevant chunks.
        """
        logger.info(
            "Retriever triggered. Query: '%s' | Portfolio ID: %s",
            query, portfolio_id
        )
        try:
            collection_name = f"portfolio_{portfolio_id}"
            # Check if collection exists
            try:
                collection = self.client.get_collection(
                    name=collection_name,
                    embedding_function=self.embedding_fn
                )
            except Exception:
                logger.warning(
                    "Collection not found: %s", collection_name
                )
                return []

            results = collection.query(
                query_texts=[query],
                n_results=top_k
            )

            formatted_results = []
            if (
                results
                and 'documents' in results
                and results['documents']
            ):
                for doc, meta, score in zip(
                    results['documents'][0],
                    results['metadatas'][0],
                    results['distances'][0]
                ):
                    formatted_results.append({
                        "content": doc,
                        "metadata": meta,
                        "distance": score
                    })

            return formatted_results
        except Exception as e:
            logger.error("Retriever error: %s", str(e))
            return []
