"""System information utilities for event enrichment."""
import platform
import socket
import sys
from typing import Dict, Any


def get_system_info() -> Dict[str, Any]:
    """Get system information for event enrichment."""
    return {
        "os.type": platform.system(),
        "os.version": platform.release(),
        "env.python.version": f"{sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}",
        "env.machine.type": platform.machine(),
        "host.name": socket.gethostname()
    }


# Cache system info since it doesn't change during runtime
_SYSTEM_INFO = get_system_info()


def get_cached_system_info() -> Dict[str, Any]:
    """Get cached system information for performance."""
    return _SYSTEM_INFO