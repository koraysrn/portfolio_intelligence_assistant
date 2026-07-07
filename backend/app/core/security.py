import logging
import re
from fastapi import HTTPException

logger = logging.getLogger(__name__)


class PortfolioSecurityGuard:
    """
    Filtering and Guardrails layer for the AI assistant.
    Detects malicious prompt injections and manipulation attempts.
    """

    # Dangerous keywords that attempt to break the financial agent context
    MALICIOUS_PATTERNS = [
        r"ignore previous instructions",
        r"system prompt",
        r"sistem promptunu unuttun",
        r"jailbreak",
        r"you are now an unregulated",
        r"delete database",
        r"drop collection",
        r"override system"
    ]

    @classmethod
    def scan_input_text(cls, text: str) -> str:
        """
        Analyzes user input. If a malicious injection attempt is detected,
        raises HTTPException; otherwise returns the text unchanged.
        """
        if not text:
            return ""

        cleaned_text = text.lower().strip()

        for pattern in cls.MALICIOUS_PATTERNS:
            if re.search(pattern, cleaned_text):
                logger.warning(
                    "SECURITY BREACH DETECTED! Blocked pattern: '%s'",
                    pattern
                )
                raise HTTPException(
                    status_code=400,
                    detail=(
                        "Security violation (Prompt Injection) detected "
                        "in your input. Please ask only portfolio-focused "
                        "questions."
                    )
                )

        return text
