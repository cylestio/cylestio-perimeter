"""Core session management for the proxy layer.

This package provides platform-level session detection that enriches
all LLM requests with session information. Session logic is now handled
by providers using shared utilities.
"""

from .detector import SessionDetector

__all__ = ["SessionDetector"]