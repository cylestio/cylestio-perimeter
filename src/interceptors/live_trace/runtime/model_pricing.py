"""
Model pricing data for cost calculations.

Pricing last updated: November 20, 2025
Source: https://raw.githubusercontent.com/cylestio/ai-model-pricing/main/latest.json

USAGE:
  from model_pricing import get_model_pricing, get_last_updated

  # Get pricing for a model (returns input and output price per 1M tokens)
  input_price, output_price = get_model_pricing("gpt-4o")

  # Get timestamp of when pricing was last updated
  timestamp = get_last_updated()
  print(f"Pricing last updated: {timestamp}")
"""

import json
from datetime import datetime, timedelta
from typing import Dict, Tuple, Optional
import logging

logger = logging.getLogger(__name__)

# Auto-refresh interval (24 hours)
PRICING_REFRESH_INTERVAL = timedelta(hours=24)

# Try to import optional dependency for live pricing
try:
    import requests

    REQUESTS_AVAILABLE = True
except ImportError:
    REQUESTS_AVAILABLE = False
    logger.warning("requests library not available - live pricing updates disabled")

# Import default pricing data
from .default_pricing import DEFAULT_PRICING_DATA

# URL to fetch live pricing data
PRICING_JSON_URL = "https://static.cylestio.com/latest.json"


def _fetch_live_pricing() -> Optional[Dict]:
    """
    Fetch live pricing data from GitHub JSON source.
    Returns pricing data dict (in the same format as DEFAULT_PRICING_DATA) or None if failed.
    """
    if not REQUESTS_AVAILABLE:
        logger.warning("requests library not available - cannot fetch live pricing")
        return None

    try:
        logger.info(f"Fetching live pricing data from {PRICING_JSON_URL}...")

        response = requests.get(PRICING_JSON_URL, timeout=10)
        response.raise_for_status()

        pricing_data = response.json()

        # Validate the structure
        if "models" not in pricing_data or "last_updated" not in pricing_data:
            logger.error("Invalid pricing data structure from live source")
            return None

        total_models = sum(len(models) for models in pricing_data.get("models", {}).values())
        logger.info(f"Successfully fetched pricing for {total_models} models from live source")

        return pricing_data

    except requests.RequestException as e:
        logger.warning(f"Failed to fetch live pricing (network error): {e}")
        return None
    except json.JSONDecodeError as e:
        logger.warning(f"Failed to parse live pricing JSON: {e}")
        return None
    except Exception as e:
        logger.warning(f"Unexpected error fetching live pricing: {e}")
        return None


def _flatten_pricing_data(pricing_data: Dict) -> Dict[str, Tuple[float, float]]:
    """
    Convert the nested pricing data structure to a flat dict for easy lookups.

    Args:
        pricing_data: The pricing data with nested structure (models -> provider -> model_name -> pricing)

    Returns:
        Flat dict mapping model_name -> (input_price, output_price)
    """
    flat_pricing = {}

    models_data = pricing_data.get("models", {})
    for provider, models in models_data.items():
        for model_name, model_info in models.items():
            input_price = model_info.get("input", 0.0)
            output_price = model_info.get("output", 0.0)
            flat_pricing[model_name.lower()] = (input_price, output_price)

    return flat_pricing


def get_current_pricing() -> Tuple[Dict[str, Tuple[float, float]], str]:
    """
    Get current pricing data, always attempting to fetch from GitHub on server start.
    Returns (flat_pricing_dict, last_updated_iso).

    Logic:
    1. Try to fetch live data from GitHub
    2. If fetch fails, fall back to hardcoded default data (in-memory only)
    """
    # Always try to fetch from GitHub first
    logger.info("Fetching pricing from GitHub...")
    live_data = _fetch_live_pricing()

    if live_data:
        logger.info(f"Using live pricing from GitHub")
        flat_pricing = _flatten_pricing_data(live_data)
        return flat_pricing, live_data.get("last_updated")

    # Fetch failed, use default pricing (fallback)
    logger.warning("Failed to fetch live pricing, using default pricing")
    flat_pricing = _flatten_pricing_data(DEFAULT_PRICING_DATA)
    return flat_pricing, DEFAULT_PRICING_DATA.get("last_updated")


# Global pricing data (loaded once per module import, auto-refreshes after 24h)
# Always tries to fetch from GitHub first, falls back to in-memory defaults
# All data kept in memory only (no disk caching)
# Use force_refresh_pricing() to manually update after import
_CURRENT_PRICING, _LAST_UPDATED = get_current_pricing()
_LAST_FETCHED: datetime = datetime.now()  # Track when we last fetched


def _maybe_refresh_pricing() -> None:
    """Check if pricing data is stale and refresh if needed (24h timeout)."""
    global _LAST_FETCHED

    if datetime.now() - _LAST_FETCHED > PRICING_REFRESH_INTERVAL:
        logger.info("Pricing data is stale (>24h), refreshing...")
        force_refresh_pricing()


def get_model_pricing(model_name: str) -> Tuple[float, float]:
    """
    Get pricing for a model.

    Args:
        model_name: Name or identifier of the model (case-insensitive)

    Returns:
        Tuple of (input_price_per_1m, output_price_per_1m)
        Returns (0, 0) if model pricing is not available
    """
    # Auto-refresh if stale (>24h since last fetch)
    _maybe_refresh_pricing()

    model_lower = model_name.lower().strip()

    # Direct match
    if model_lower in _CURRENT_PRICING:
        return _CURRENT_PRICING[model_lower]

    # Fuzzy matching for model families
    for model_key in _CURRENT_PRICING.keys():
        if model_key in model_lower or model_lower in model_key:
            return _CURRENT_PRICING[model_key]

    # Return (0, 0) if pricing not available
    logger.warning(f"Pricing not available for model: {model_name}")
    return (0.0, 0.0)


def get_last_updated() -> str:
    """
    Get the timestamp of when pricing data was last updated.

    Returns:
        ISO format timestamp string
    """
    return _LAST_UPDATED


def force_refresh_pricing() -> bool:
    """
    Force a refresh of pricing data from live sources.
    Returns True if successful, False otherwise.

    This can be called manually or via an API endpoint to trigger
    an immediate pricing update. Pricing data is kept in memory only.
    """
    global _CURRENT_PRICING, _LAST_UPDATED, _LAST_FETCHED

    logger.info("Force refreshing pricing data...")
    live_data = _fetch_live_pricing()

    # Always update _LAST_FETCHED to avoid repeated failed attempts
    _LAST_FETCHED = datetime.now()

    if live_data:
        _CURRENT_PRICING = _flatten_pricing_data(live_data)
        _LAST_UPDATED = live_data.get("last_updated")
        logger.info("Successfully force-refreshed pricing data")
        return True

    logger.warning("Failed to force-refresh pricing data")
    return False


# Example usage and testing
if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)

    print("Model Pricing Information")
    print("=" * 60)

    print(f"Last Updated: {get_last_updated()}")
    print(f"Total Models: {len(_CURRENT_PRICING)}")
    print(f"Source: {PRICING_JSON_URL}")
    print()

    # Test some models
    test_models = [
        "gpt-4o",
        "gpt-4o-mini",
        "claude-3-5-haiku",
        "claude-sonnet-4",
        "o1-preview",
        "gpt-5",
        "unknown-model",
    ]

    print("Sample Model Pricing (USD per 1M tokens):")
    print("-" * 60)
    for model in test_models:
        input_price, output_price = get_model_pricing(model)
        print(f"{model:35} | ${input_price:6.2f} | ${output_price:6.2f}")
