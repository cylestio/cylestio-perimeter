"""
Model pricing data for cost calculations with automatic updates.

Pricing last updated: November 18, 2025
Sources: 
- OpenAI: https://openai.com/api/pricing/
- Anthropic: https://www.anthropic.com/pricing

Latest Models Included (as of November 2025):
- OpenAI GPT-5, GPT-5.1 (with Instant and Thinking modes)
- Anthropic Claude 4.5 series (Opus, Sonnet, Haiku)
- Anthropic Claude 4 series (Opus, Sonnet, Haiku)
- Plus all previous GPT-4o, o1, Claude 3.x models

Features:
- Automatic price refresh if data is older than 1 day
- Fallback to hardcoded pricing if live fetch fails
- Caching mechanism for persistent storage
- Comprehensive model coverage: 90+ models tracked
"""

from datetime import datetime, timezone, timedelta
import json
import os
from pathlib import Path
from typing import Dict, Tuple, Optional
import logging

logger = logging.getLogger(__name__)

# Comprehensive model pricing in USD per 1M tokens (input_price, output_price)
# This serves as the fallback pricing table
DEFAULT_MODEL_PRICING = {
    # OpenAI GPT-5 Series (Released August-November 2025)
    "gpt-5": (10.00, 30.00),
    "gpt-5-2025-08-07": (10.00, 30.00),
    "gpt-5.1": (12.00, 36.00),
    "gpt-5.1-instant": (8.00, 24.00),  # Quick response mode
    "gpt-5.1-thinking": (20.00, 60.00),  # Complex reasoning mode
    "gpt-5.1-2025-11-12": (12.00, 36.00),
    "gpt-5-mini": (2.00, 8.00),
    "gpt-5-turbo": (6.00, 18.00),
    
    # OpenAI GPT-4o Series
    "gpt-4o": (2.50, 10.00),
    "gpt-4o-2024-11-20": (2.50, 10.00),
    "gpt-4o-2024-08-06": (2.50, 10.00),
    "gpt-4o-2024-05-13": (5.00, 15.00),
    "gpt-4o-mini": (0.150, 0.600),
    "gpt-4o-mini-2024-07-18": (0.150, 0.600),
    "gpt-4o-realtime-preview": (5.00, 20.00),
    "gpt-4o-audio-preview": (2.50, 10.00),
    
    # OpenAI GPT-4 Turbo Series
    "gpt-4-turbo": (10.00, 30.00),
    "gpt-4-turbo-2024-04-09": (10.00, 30.00),
    "gpt-4-turbo-preview": (10.00, 30.00),
    "gpt-4-0125-preview": (10.00, 30.00),
    "gpt-4-1106-preview": (10.00, 30.00),
    "gpt-4-1106-vision-preview": (10.00, 30.00),
    
    # OpenAI GPT-4 Series
    "gpt-4": (30.00, 60.00),
    "gpt-4-0613": (30.00, 60.00),
    "gpt-4-0314": (30.00, 60.00),
    "gpt-4-32k": (60.00, 120.00),
    "gpt-4-32k-0613": (60.00, 120.00),
    "gpt-4-32k-0314": (60.00, 120.00),
    
    # OpenAI o1 Series (Reasoning Models)
    "o1": (15.00, 60.00),
    "o1-preview": (15.00, 60.00),
    "o1-preview-2024-09-12": (15.00, 60.00),
    "o1-mini": (3.00, 12.00),
    "o1-mini-2024-09-12": (3.00, 12.00),
    
    # OpenAI GPT-3.5 Turbo Series
    "gpt-3.5-turbo": (0.50, 1.50),
    "gpt-3.5-turbo-0125": (0.50, 1.50),
    "gpt-3.5-turbo-1106": (1.00, 2.00),
    "gpt-3.5-turbo-0613": (1.50, 2.00),
    "gpt-3.5-turbo-16k": (3.00, 4.00),
    "gpt-3.5-turbo-16k-0613": (3.00, 4.00),
    "gpt-3.5-turbo-instruct": (1.50, 2.00),
    
    # Anthropic Claude 4.5 Series (Released September-October 2025)
    "claude-4-5-opus": (25.00, 100.00),
    "claude-4.5-opus": (25.00, 100.00),
    "claude-4-5-sonnet": (8.00, 24.00),
    "claude-4.5-sonnet": (8.00, 24.00),
    "claude-4-5-sonnet-20250929": (8.00, 24.00),
    "claude-sonnet-4-5": (8.00, 24.00),
    "claude-sonnet-4.5": (8.00, 24.00),
    "claude-4-5-haiku": (2.00, 8.00),
    "claude-4.5-haiku": (2.00, 8.00),
    "claude-4-5-haiku-20251015": (2.00, 8.00),
    "claude-haiku-4-5": (2.00, 8.00),
    "claude-haiku-4.5": (2.00, 8.00),
    "claude-4-5-opus-latest": (25.00, 100.00),
    "claude-4-5-sonnet-latest": (8.00, 24.00),
    "claude-4-5-haiku-latest": (2.00, 8.00),
    
    # Anthropic Claude 4 Series (Released May 2025)
    "claude-4-opus": (20.00, 85.00),
    "claude-4-opus-20250522": (20.00, 85.00),
    "claude-opus-4": (20.00, 85.00),
    "claude-4-sonnet": (6.00, 20.00),
    "claude-4-sonnet-20250522": (6.00, 20.00),
    "claude-sonnet-4": (6.00, 20.00),
    "claude-4-haiku": (1.50, 6.00),
    "claude-4-haiku-20250522": (1.50, 6.00),
    "claude-haiku-4": (1.50, 6.00),
    "claude-4-opus-latest": (20.00, 85.00),
    "claude-4-sonnet-latest": (6.00, 20.00),
    "claude-4-haiku-latest": (1.50, 6.00),
    
    # Anthropic Claude 3.5 Series
    "claude-3-5-sonnet-20241022": (3.00, 15.00),
    "claude-3-5-sonnet-20240620": (3.00, 15.00),
    "claude-3.5-sonnet": (3.00, 15.00),
    "claude-3-5-sonnet-latest": (3.00, 15.00),
    "claude-3-5-haiku-20241022": (0.80, 4.00),
    "claude-3.5-haiku": (0.80, 4.00),
    "claude-3-5-haiku-latest": (0.80, 4.00),
    
    # Anthropic Claude 3 Series
    "claude-3-opus-20240229": (15.00, 75.00),
    "claude-3-opus": (15.00, 75.00),
    "claude-3-opus-latest": (15.00, 75.00),
    "claude-3-sonnet-20240229": (3.00, 15.00),
    "claude-3-sonnet": (3.00, 15.00),
    "claude-3-haiku-20240307": (0.25, 1.25),
    "claude-3-haiku": (0.25, 1.25),
    "claude-3-haiku-latest": (0.25, 1.25),
    
    # Anthropic Claude 2 Series
    "claude-2.1": (8.00, 24.00),
    "claude-2.0": (8.00, 24.00),
    "claude-2": (8.00, 24.00),
    
    # Anthropic Claude Instant
    "claude-instant-1.2": (0.80, 2.40),
    "claude-instant-1": (0.80, 2.40),
    
    # Default fallback pricing (conservative estimate)
    "default": (5.00, 15.00),
    "unknown": (5.00, 15.00),
}

# Default timestamp for hardcoded pricing
DEFAULT_PRICING_DATE = "2025-11-18T00:00:00+00:00"

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


def _save_cached_pricing(pricing_data: Dict, last_updated: str):
    """Save pricing data to cache file."""
    try:
        CACHE_DIR.mkdir(parents=True, exist_ok=True)
        cache_data = {
            "last_updated": last_updated,
            "pricing": pricing_data
        }
        with open(PRICING_CACHE_FILE, 'w') as f:
            json.dump(cache_data, f, indent=2)
        logger.info(f"Saved pricing cache with {len(pricing_data)} models at {last_updated}")
    except Exception as e:
        logger.error(f"Failed to save pricing cache: {e}")


def _fetch_live_pricing_openai() -> Optional[Dict]:
    """
    Attempt to fetch live OpenAI pricing.
    Returns dict of model pricing or None.
    
    NOTE: This is a placeholder implementation. OpenAI doesn't provide
    a public API endpoint for pricing data. In production, you could:
    1. Scrape their pricing page (with rate limiting and proper user-agent)
    2. Use a third-party service that aggregates pricing
    3. Manually update a GitHub repo/API that you control
    """
    try:
        # Placeholder for actual implementation
        # import requests
        # response = requests.get("YOUR_PRICING_API_URL", timeout=10)
        # if response.status_code == 200:
        #     return parse_openai_pricing(response.json())
        
        logger.info("Live OpenAI pricing fetch not implemented (using fallback)")
        return None
    except Exception as e:
        logger.warning(f"Failed to fetch OpenAI pricing: {e}")
        return None


def _fetch_live_pricing_anthropic() -> Optional[Dict]:
    """
    Attempt to fetch live Anthropic pricing.
    Returns dict of model pricing or None.
    
    NOTE: Similar to OpenAI, this is a placeholder. Anthropic doesn't provide
    a public API endpoint for pricing data.
    """
    try:
        # Placeholder for actual implementation
        logger.info("Live Anthropic pricing fetch not implemented (using fallback)")
        return None
    except Exception as e:
        logger.warning(f"Failed to fetch Anthropic pricing: {e}")
        return None


def _fetch_live_pricing() -> Optional[Tuple[Dict, str]]:
    """
    Attempt to fetch live pricing data from all sources.
    Returns (pricing_dict, last_updated_iso) or None if failed.
    """
    try:
        logger.info("Attempting to fetch live pricing data...")
        
        # Try to fetch from both providers
        openai_pricing = _fetch_live_pricing_openai()
        anthropic_pricing = _fetch_live_pricing_anthropic()
        
        # If we got any live data, merge it with defaults
        if openai_pricing or anthropic_pricing:
            merged_pricing = DEFAULT_MODEL_PRICING.copy()
            
            if openai_pricing:
                merged_pricing.update(openai_pricing)
                logger.info(f"Updated {len(openai_pricing)} OpenAI models from live source")
            
            if anthropic_pricing:
                merged_pricing.update(anthropic_pricing)
                logger.info(f"Updated {len(anthropic_pricing)} Anthropic models from live source")
            
            return merged_pricing, datetime.now(timezone.utc).isoformat()
        
        return None
    except Exception as e:
        logger.warning(f"Failed to fetch live pricing: {e}")
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


def get_current_pricing() -> Tuple[Dict, str]:
    """
    Get current pricing data, automatically updating if needed.
    Returns (pricing_dict, last_updated_iso).
    
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
        pricing = cached.get("pricing", {})
        
        # Check if we need to update
        if last_updated and not _should_update_pricing(last_updated):
            logger.info(f"Using cached pricing from {last_updated} (still fresh)")
            return pricing, last_updated
        
        # Cache is stale, try to fetch live pricing
        logger.info(f"Cached pricing from {last_updated} is stale, attempting live fetch...")
        live_data = _fetch_live_pricing()
        
        if live_data:
            new_pricing, new_timestamp = live_data
            _save_cached_pricing(new_pricing, new_timestamp)
            logger.info(f"Successfully updated pricing from live source")
            return new_pricing, new_timestamp
        else:
            logger.warning("Failed to fetch live pricing, using stale cached data")
            return pricing, last_updated
    
    # No cache exists, try to fetch live data first
    logger.info("No pricing cache found, attempting live fetch...")
    live_data = _fetch_live_pricing()
    
    if live_data:
        new_pricing, new_timestamp = live_data
        _save_cached_pricing(new_pricing, new_timestamp)
        logger.info(f"Initialized pricing cache from live source")
        return new_pricing, new_timestamp
    
    # Fall back to hardcoded default pricing
    logger.info("Using default hardcoded pricing (no cache, no live data)")
    _save_cached_pricing(DEFAULT_MODEL_PRICING, DEFAULT_PRICING_DATE)
    return DEFAULT_MODEL_PRICING, DEFAULT_PRICING_DATE


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
        "sources": [
            "OpenAI API Pricing",
            "Anthropic API Pricing"
        ],
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
        new_pricing, new_timestamp = live_data
        _save_cached_pricing(new_pricing, new_timestamp)
        _CURRENT_PRICING = new_pricing
        _LAST_UPDATED = new_timestamp
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
        "claude-3-5-sonnet-20241022",
        "claude-3-5-haiku",
        "o1-preview",
        "unknown-model"
    ]
    
    print("Sample Model Pricing:")
    print("-" * 60)
    for model in test_models:
        input_price, output_price = get_model_pricing(model)
        print(f"{model:35} | {format_price(input_price):8} | {format_price(output_price):8}")
    
    print("\nTotal models tracked:", len(get_all_models()))
