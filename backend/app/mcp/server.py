import logging
import requests
from typing import Dict, Any, List

from app.core.config import settings

logger = logging.getLogger(__name__)


class PortfolioMCPServer:
    """
    Twelve Data API-integrated external tool server following MCP
    (Model Context Protocol) standards.

    Collects financial calculation and live data tools in an isolated layer.
    The agent never accesses the database or spaghetti functions directly;
    all external operations go through this clean API.
    """

    @staticmethod
    def get_live_price(ticker: str) -> float:
        """
        Fetches the live USD price of an asset from the Twelve Data API.

        Args:
            ticker: Asset symbol (e.g. AAPL, BTC/USD, TSLA)

        Returns:
            float: Live price in USD. Returns 0.0 on error.
        """
        logger.info("Fetching price from Twelve Data API: %s", ticker)
        try:
            url = f"{settings.TWELVEDATA_BASE_URL}/price"
            params = {
                "symbol": ticker,
                "apikey": settings.TWELVEDATA_API_KEY
            }
            response = requests.get(url, params=params, timeout=10)
            data = response.json()

            if "price" in data:
                price = float(data["price"])
                logger.info("%s live price: $%.2f", ticker, price)
                return price
            else:
                logger.warning(
                    "Could not get live price for %s, API response: %s",
                    ticker, data
                )
                return 0.0
        except Exception as e:
            logger.error(
                "Twelve Data API connection error (%s): %s",
                ticker, str(e)
            )
            return 0.0

    @classmethod
    def calculate_portfolio_risk(
        cls, assets: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Takes a list of assets (with amounts), fetches live prices from
        Twelve Data, and dynamically calculates total portfolio value
        and risk score.

        Args:
            assets: List of assets, each with ticker, amount, category

        Returns:
            Dict: total_value_usd, risk_level, risk_score,
                  diversification_score, assets_analyzed
        """
        logger.info(
            "MCP Tool Triggered: calculate_portfolio_risk (Live Data)"
        )
        if not assets:
            return {
                "risk_level": "Low",
                "risk_score": 0,
                "message": "Portfolio is empty."
            }

        updated_assets = []
        total_value = 0.0
        crypto_value = 0.0
        stock_value = 0.0

        for asset in assets:
            ticker = asset.get("ticker", "").upper()
            amount = asset.get("amount", 0.0)
            category = asset.get("category", "stock").lower()

            # Fetch live price from the internet
            live_price = cls.get_live_price(ticker)

            # If API returned no price, preserve the user-provided default
            if live_price == 0.0:
                live_price = (
                    asset.get("value_usd", 0.0) / amount
                    if amount > 0 else 0.0
                )

            asset_total_usd = live_price * amount
            total_value += asset_total_usd

            if category == "crypto":
                crypto_value += asset_total_usd
            elif category == "stock":
                stock_value += asset_total_usd

            updated_assets.append({
                "ticker": ticker,
                "amount": amount,
                "live_price_usd": live_price,
                "total_value_usd": round(asset_total_usd, 2),
                "category": category
            })

        crypto_ratio = crypto_value / total_value if total_value > 0 else 0
        stock_ratio = stock_value / total_value if total_value > 0 else 0

        risk_score = (crypto_ratio * 100) + (stock_ratio * 50)
        risk_score = min(100, max(0, int(risk_score)))

        if risk_score > 70:
            level = "High Risk"
        elif risk_score > 40:
            level = "Medium Risk"
        else:
            level = "Low Risk"

        return {
            "total_value_usd": round(total_value, 2),
            "risk_level": level,
            "risk_score": risk_score,
            "diversification_score": (
                int((1 - max(crypto_ratio, stock_ratio)) * 100)
                if total_value > 0 else 100
            ),
            "assets_analyzed": updated_assets
        }

    @classmethod
    def get_available_tools(cls) -> List[Dict[str, Any]]:
        """
        Returns the Function Calling manifest with JSON Schema definitions
        so the LLM knows which tools are available and what parameters
        they expect.
        """
        return [
            {
                "name": "calculate_portfolio_risk",
                "description": (
                    "Takes a list of portfolio assets with symbols and "
                    "amounts, fetches live prices from Twelve Data API, "
                    "and performs risk analysis."
                ),
                "parameters": {
                    "type": "object",
                    "properties": {
                        "assets": {
                            "type": "array",
                            "items": {
                                "type": "object",
                                "properties": {
                                    "ticker": {"type": "string"},
                                    "amount": {"type": "number"},
                                    "category": {"type": "string"}
                                }
                            }
                        }
                    },
                    "required": ["assets"]
                }
            }
        ]
