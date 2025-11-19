"""
Model pricing data for cost calculations with automatic updates.

Pricing last updated: November 19, 2025
Source: https://raw.githubusercontent.com/cylestio/ai-model-pricing/main/latest.json

Latest Models Included (as of November 2025):
- OpenAI GPT-5, GPT-5.1 (with Instant and Thinking modes)
- Anthropic Claude 4, Claude 3.x series (Opus, Sonnet, Haiku)
- Plus all previous GPT-4o, o1, and Claude models

Features:
- Automatic price refresh if data is older than 1 day
- Fallback to local default pricing if live fetch fails
- Caching mechanism for persistent storage
- Comprehensive model coverage: 50+ models tracked

DEPENDENCIES:
- requests: For HTTP requests (pip install requests)
This dependency is optional - the module will work with fallback pricing if not installed.

USAGE:
  from model_pricing import get_model_pricing, get_pricing_info, force_refresh_pricing
  
  # Get pricing for a model
  input_price, output_price = get_model_pricing("gpt-4o")
  
  # Get info about pricing data
  info = get_pricing_info()
  print(f"Last updated: {info['last_updated']}")
  
  # Force refresh pricing from live sources
  success = force_refresh_pricing()
"""

from datetime import datetime, timezone, timedelta
import json
from pathlib import Path
from typing import Dict, Tuple, Optional
import logging

logger = logging.getLogger(__name__)

# Try to import optional dependency for live pricing
try:
    import requests
    REQUESTS_AVAILABLE = True
except ImportError:
    REQUESTS_AVAILABLE = False
    logger.warning("requests library not available - live pricing updates disabled")

# Default pricing data structure - matches the format from the GitHub JSON
# This serves as the fallback pricing if live fetch fails
DEFAULT_PRICING_DATA = {
    "last_updated": "2025-11-19T13:51:48.278670+00:00",
    "models": {
        "anthropic": {
            "claude-3-5-haiku": {
                "description": "Claude Haiku 3.5 (latest)",
                "input": 0.8,
                "output": 4.0
            },
            "claude-3-5-haiku-20241022": {
                "description": "Claude Haiku 3.5",
                "input": 0.8,
                "output": 4.0
            },
            "claude-3-7-sonnet": {
                "description": "Claude Sonnet 3.7 (latest)",
                "input": 3.0,
                "output": 15.0
            },
            "claude-3-7-sonnet-20250219": {
                "description": "Claude Sonnet 3.7",
                "input": 3.0,
                "output": 15.0
            },
            "claude-3-haiku": {
                "description": "Claude Haiku 3 (latest)",
                "input": 0.25,
                "output": 1.25
            },
            "claude-3-haiku-20240307": {
                "description": "Claude Haiku 3",
                "input": 0.25,
                "output": 1.25
            },
            "claude-opus-4": {
                "description": "Claude Opus 4 (latest)",
                "input": 15.0,
                "output": 75.0
            },
            "claude-opus-4-20250514": {
                "description": "Claude Opus 4",
                "input": 15.0,
                "output": 75.0
            },
            "claude-sonnet-4": {
                "description": "Claude Sonnet 4 (latest)",
                "input": 3.0,
                "output": 15.0
            },
            "claude-sonnet-4-20250514": {
                "description": "Claude Sonnet 4",
                "input": 3.0,
                "output": 15.0
            }
        },
        "openai": {
            "gpt-3.5-turbo": {
                "description": "GPT-3.5 Turbo",
                "input": 0.5,
                "output": 1.5
            },
            "gpt-3.5-turbo-0125": {
                "description": "GPT-3.5 Turbo (0125)",
                "input": 0.5,
                "output": 1.5
            },
            "gpt-3.5-turbo-0613": {
                "description": "GPT-3.5 Turbo (0613)",
                "input": 1.5,
                "output": 2.0
            },
            "gpt-3.5-turbo-1106": {
                "description": "GPT-3.5 Turbo (1106)",
                "input": 1.0,
                "output": 2.0
            },
            "gpt-3.5-turbo-16k": {
                "description": "GPT-3.5 Turbo 16K",
                "input": 3.0,
                "output": 4.0
            },
            "gpt-3.5-turbo-16k-0613": {
                "description": "GPT-3.5 Turbo 16K (0613)",
                "input": 3.0,
                "output": 4.0
            },
            "gpt-3.5-turbo-instruct": {
                "description": "GPT-3.5 Turbo Instruct",
                "input": 1.5,
                "output": 2.0
            },
            "gpt-4": {
                "description": "GPT-4",
                "input": 30.0,
                "output": 60.0
            },
            "gpt-4-0125-preview": {
                "description": "GPT-4 (0125-preview)",
                "input": 10.0,
                "output": 30.0
            },
            "gpt-4-0314": {
                "description": "GPT-4 (0314)",
                "input": 30.0,
                "output": 60.0
            },
            "gpt-4-0613": {
                "description": "GPT-4 (0613)",
                "input": 30.0,
                "output": 60.0
            },
            "gpt-4-1106-preview": {
                "description": "GPT-4 (1106-preview)",
                "input": 10.0,
                "output": 30.0
            },
            "gpt-4-1106-vision-preview": {
                "description": "GPT-4 Vision (1106-preview)",
                "input": 10.0,
                "output": 30.0
            },
            "gpt-4-32k": {
                "description": "GPT-4 32K",
                "input": 60.0,
                "output": 120.0
            },
            "gpt-4-32k-0314": {
                "description": "GPT-4 32K (0314)",
                "input": 60.0,
                "output": 120.0
            },
            "gpt-4-32k-0613": {
                "description": "GPT-4 32K (0613)",
                "input": 60.0,
                "output": 120.0
            },
            "gpt-4-turbo": {
                "description": "GPT-4 Turbo",
                "input": 10.0,
                "output": 30.0
            },
            "gpt-4-turbo-2024-04-09": {
                "description": "GPT-4 Turbo (2024-04-09)",
                "input": 10.0,
                "output": 30.0
            },
            "gpt-4-turbo-preview": {
                "description": "GPT-4 Turbo Preview",
                "input": 10.0,
                "output": 30.0
            },
            "gpt-4o": {
                "description": "GPT-4o",
                "input": 2.5,
                "output": 10.0
            },
            "gpt-4o-2024-05-13": {
                "description": "GPT-4o (2024-05-13)",
                "input": 5.0,
                "output": 15.0
            },
            "gpt-4o-2024-08-06": {
                "description": "GPT-4o (2024-08-06)",
                "input": 2.5,
                "output": 10.0
            },
            "gpt-4o-2024-11-20": {
                "description": "GPT-4o (2024-11-20)",
                "input": 2.5,
                "output": 10.0
            },
            "gpt-4o-audio-preview": {
                "description": "GPT-4o Audio Preview",
                "input": 2.5,
                "output": 10.0
            },
            "gpt-4o-mini": {
                "description": "GPT-4o Mini",
                "input": 0.15,
                "output": 0.6
            },
            "gpt-4o-mini-2024-07-18": {
                "description": "GPT-4o Mini (2024-07-18)",
                "input": 0.15,
                "output": 0.6
            },
            "gpt-4o-realtime-preview": {
                "description": "GPT-4o Realtime Preview",
                "input": 5.0,
                "output": 20.0
            },
            "gpt-5": {
                "description": "GPT-5",
                "input": 10.0,
                "output": 30.0
            },
            "gpt-5-2025-08-07": {
                "description": "GPT-5 (2025-08-07)",
                "input": 10.0,
                "output": 30.0
            },
            "gpt-5-mini": {
                "description": "GPT-5 Mini",
                "input": 2.0,
                "output": 8.0
            },
            "gpt-5-turbo": {
                "description": "GPT-5 Turbo",
                "input": 6.0,
                "output": 18.0
            },
            "gpt-5.1": {
                "description": "GPT-5.1",
                "input": 12.0,
                "output": 36.0
            },
            "gpt-5.1-2025-11-12": {
                "description": "GPT-5.1 (2025-11-12)",
                "input": 12.0,
                "output": 36.0
            },
            "gpt-5.1-instant": {
                "description": "GPT-5.1 Instant",
                "input": 8.0,
                "output": 24.0
            },
            "gpt-5.1-thinking": {
                "description": "GPT-5.1 Thinking",
                "input": 20.0,
                "output": 60.0
            },
            "o1": {
                "description": "o1",
                "input": 15.0,
                "output": 60.0
            },
            "o1-mini": {
                "description": "o1 Mini",
                "input": 3.0,
                "output": 12.0
            },
            "o1-mini-2024-09-12": {
                "description": "o1 Mini (2024-09-12)",
                "input": 3.0,
                "output": 12.0
            },
            "o1-preview": {
                "description": "o1 Preview",
                "input": 15.0,
                "output": 60.0
            },
            "o1-preview-2024-09-12": {
                "description": "o1 Preview (2024-09-12)",
                "input": 15.0,
                "output": 60.0
            }
        }
    },
    "sources": {
        "anthropic": "https://docs.anthropic.com/en/docs/about-claude/models",
        "openai": "https://platform.openai.com/docs/pricing"
    }
}

# URL to fetch live pricing data
PRICING_JSON_URL = "https://raw.githubusercontent.com/cylestio/ai-model-pricing/main/latest.json"

# Path to store the cached pricing data
CACHE_DIR = Path(__file__).parent / "cache"
PRICING_CACHE_FILE = CACHE_DIR / "model_pricing_cache.json"


def _load_cached_pricing() -> Optional[Dict]:
    """Load pricing data from cache file."""
    try:
        if PRICING_CACHE_FILE.exists():
            with open(PRICING_CACHE_FILE, 'r') as f:
                return json.load(f)
    except Exception as e:
        logger.warning(f"Failed to load cached pricing: {e}")
    return None


def _save_cached_pricing(pricing_data: Dict):
    """Save pricing data to cache file."""
    try:
        CACHE_DIR.mkdir(parents=True, exist_ok=True)
        with open(PRICING_CACHE_FILE, 'w') as f:
            json.dump(pricing_data, f, indent=2)
        
        total_models = sum(len(models) for models in pricing_data.get("models", {}).values())
        logger.info(f"Saved pricing cache with {total_models} models at {pricing_data.get('last_updated')}")
    except Exception as e:
        logger.error(f"Failed to save pricing cache: {e}")


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


def _should_update_pricing(last_updated_str: str) -> bool:
    """Check if pricing data is older than 1 day."""
    try:
        # Handle both ISO format and date-only format
        if 'T' not in last_updated_str:
            last_updated_str = f"{last_updated_str}T00:00:00+00:00"
        
        last_updated = datetime.fromisoformat(last_updated_str.replace('Z', '+00:00'))
        
        # Ensure timezone-aware comparison
        if last_updated.tzinfo is None:
            last_updated = last_updated.replace(tzinfo=timezone.utc)
        
        now = datetime.now(timezone.utc)
        age = now - last_updated
        
        logger.debug(f"Pricing age: {age.days} days, {age.seconds // 3600} hours")
        return age > timedelta(days=1)
    except Exception as e:
        logger.warning(f"Failed to check pricing age: {e}")
        return True  # If we can't determine age, try to update


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
            input_price = model_info.get("input", 5.0)
            output_price = model_info.get("output", 15.0)
            flat_pricing[model_name.lower()] = (input_price, output_price)
    
    # Add default fallback
    flat_pricing["default"] = (5.0, 15.0)
    flat_pricing["unknown"] = (5.0, 15.0)
    
    return flat_pricing


def get_current_pricing() -> Tuple[Dict[str, Tuple[float, float]], str]:
    """
    Get current pricing data, automatically updating if needed.
    Returns (flat_pricing_dict, last_updated_iso).
    
    Logic:
    1. Check cache
    2. If cache is fresh (< 1 day old), use it
    3. If cache is stale, try to fetch live data
    4. If live fetch fails, fall back to cached or default data
    """
    # Try to load from cache
    cached = _load_cached_pricing()
    
    if cached:
        last_updated = cached.get("last_updated")
        
        # Check if we need to update
        if last_updated and not _should_update_pricing(last_updated):
            logger.info(f"Using cached pricing from {last_updated} (still fresh)")
            flat_pricing = _flatten_pricing_data(cached)
            return flat_pricing, last_updated
        
        # Cache is stale, try to fetch live pricing
        logger.info(f"Cached pricing from {last_updated} is stale, attempting live fetch...")
        live_data = _fetch_live_pricing()
        
        if live_data:
            _save_cached_pricing(live_data)
            logger.info(f"Successfully updated pricing from live source")
            flat_pricing = _flatten_pricing_data(live_data)
            return flat_pricing, live_data.get("last_updated")
        else:
            logger.warning("Failed to fetch live pricing, using stale cached data")
            flat_pricing = _flatten_pricing_data(cached)
            return flat_pricing, last_updated
    
    # No cache exists, try to fetch live data first
    logger.info("No pricing cache found, attempting live fetch...")
    live_data = _fetch_live_pricing()
    
    if live_data:
        _save_cached_pricing(live_data)
        logger.info(f"Initialized pricing cache from live source")
        flat_pricing = _flatten_pricing_data(live_data)
        return flat_pricing, live_data.get("last_updated")
    
    # Fall back to hardcoded default pricing
    logger.info("Using default hardcoded pricing (no cache, no live data)")
    _save_cached_pricing(DEFAULT_PRICING_DATA)
    flat_pricing = _flatten_pricing_data(DEFAULT_PRICING_DATA)
    return flat_pricing, DEFAULT_PRICING_DATA.get("last_updated")


# Global pricing data (loaded once per module import)
# This will automatically check age and update if needed
_CURRENT_PRICING, _LAST_UPDATED = get_current_pricing()


def get_model_pricing(model_name: str) -> Tuple[float, float]:
    """
    Get pricing for a model.
    
    Args:
        model_name: Name or identifier of the model (case-insensitive)
        
    Returns:
        Tuple of (input_price_per_1m, output_price_per_1m)
    """
    model_lower = model_name.lower().strip()
    
    # Direct match
    if model_lower in _CURRENT_PRICING:
        return _CURRENT_PRICING[model_lower]
    
    # Fuzzy matching for model families
    for model_key in _CURRENT_PRICING.keys():
        if model_key in model_lower or model_lower in model_key:
            return _CURRENT_PRICING[model_key]
    
    # Return default if no match
    return _CURRENT_PRICING.get("default", (5.00, 15.00))


def format_price(price: float) -> str:
    """Format price for display."""
    if price < 1:
        return f"${price:.3f}"
    return f"${price:.2f}"


def get_pricing_info() -> dict:
    """Get information about pricing data."""
    return {
        "last_updated": _LAST_UPDATED,
        "total_models": len(_CURRENT_PRICING) - 2,  # Exclude default and unknown
        "source": PRICING_JSON_URL,
        "note": "Prices are per 1M tokens (input/output)",
        "auto_update": "Pricing automatically refreshes if older than 1 day"
    }


def force_refresh_pricing() -> bool:
    """
    Force a refresh of pricing data from live sources.
    Returns True if successful, False otherwise.
    
    This can be called manually or via an API endpoint to trigger
    an immediate pricing update.
    """
    global _CURRENT_PRICING, _LAST_UPDATED
    
    logger.info("Force refreshing pricing data...")
    live_data = _fetch_live_pricing()
    
    if live_data:
        _save_cached_pricing(live_data)
        _CURRENT_PRICING = _flatten_pricing_data(live_data)
        _LAST_UPDATED = live_data.get("last_updated")
        logger.info("Successfully force-refreshed pricing data")
        return True
    
    logger.warning("Failed to force-refresh pricing data")
    return False


def get_all_models() -> list:
    """Get list of all models with pricing information."""
    return [
        {
            "model": model_name,
            "input_price": prices[0],
            "output_price": prices[1],
            "provider": "OpenAI" if "gpt" in model_name or "o1" in model_name else "Anthropic"
        }
        for model_name, prices in sorted(_CURRENT_PRICING.items())
        if model_name not in ["default", "unknown"]
    ]


# Example usage and testing
if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    
    print("Model Pricing Information")
    print("=" * 60)
    
    info = get_pricing_info()
    print(f"Last Updated: {info['last_updated']}")
    print(f"Total Models: {info['total_models']}")
    print(f"Auto-Update: {info['auto_update']}")
    print()
    
    # Test some models
    test_models = [
        "gpt-4o",
        "gpt-4o-mini",
        "claude-3-5-haiku",
        "claude-sonnet-4",
        "o1-preview",
        "gpt-5",
        "unknown-model"
    ]
    
    print("Sample Model Pricing:")
    print("-" * 60)
    for model in test_models:
        input_price, output_price = get_model_pricing(model)
        print(f"{model:35} | {format_price(input_price):8} | {format_price(output_price):8}")
    
    print("\nTotal models tracked:", len(get_all_models()))
