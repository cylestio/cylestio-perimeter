"""Cylestio smart interceptor package.

This package contains all session management functionality:
- CylestioSessionInterceptor: Smart session detection and management
- SessionManager: Core session tracking logic  
- SessionDetector: Legacy session detection (for backward compatibility)
"""

from .session_interceptor import CylestioSessionInterceptor
from .session_manager import SessionManager
from .session_detector import SessionDetector

__all__ = ["CylestioSessionInterceptor", "SessionManager", "SessionDetector"]