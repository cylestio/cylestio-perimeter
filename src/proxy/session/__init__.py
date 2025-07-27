"""Core session management for the proxy layer.

This package provides platform-level session detection and management
that enriches all LLM requests with session information.
"""

from .manager import SessionManager
from .detector import SessionDetector

__all__ = ["SessionManager", "SessionDetector"]