import logging
from typing import List, Dict, Any

logger = logging.getLogger(__name__)


class PortfolioMemoryService:
    """
    Session-based chat history management service.
    Keeps conversation history isolated per session ID without spaghetti code.
    """

    def __init__(self):
        # Session-based storage: {session_id: [messages]}
        self._storage: Dict[str, List[Dict[str, Any]]] = {}

    def get_session_history(
        self, session_id: str
    ) -> List[Dict[str, Any]]:
        """
        Returns the previous chat message list for the specified session.
        """
        if session_id not in self._storage:
            self._storage[session_id] = []
        return self._storage[session_id]

    def add_message_to_session(
        self, session_id: str, role: str, content: str
    ):
        """
        Adds a new user or assistant message to the session history.
        """
        if session_id not in self._storage:
            self._storage[session_id] = []

        # Limit to last 20 messages to prevent memory leaks (cost optimization)
        if len(self._storage[session_id]) >= 20:
            self._storage[session_id].pop(0)

        self._storage[session_id].append({
            "role": role,
            "content": content
        })
        logger.info(
            "Message added to memory. Session: %s | Role: %s",
            session_id, role
        )

    def clear_session(self, session_id: str):
        """
        Clears all memory for a specific session.
        """
        if session_id in self._storage:
            self._storage[session_id] = []
            logger.info("Session memory cleared: %s", session_id)


# Central singleton memory instance
agent_memory = PortfolioMemoryService()
