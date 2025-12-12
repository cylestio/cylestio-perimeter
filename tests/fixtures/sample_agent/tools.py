"""Sample tools with INTENTIONAL SECURITY VULNERABILITIES for testing.

DO NOT USE IN PRODUCTION - This file is for security scanner testing only.
"""
import subprocess
from typing import Any


# =============================================================================
# VULNERABILITY: TOOL_DANGEROUS_UNRESTRICTED (CRITICAL)
# Shell command execution without any constraints
# =============================================================================
def execute_shell(command: str) -> str:
    """Execute a shell command - VULNERABLE: no restrictions.
    
    ❌ CRITICAL: Can execute ANY command, no validation, no sandboxing.
    """
    # ❌ VULNERABLE: shell=True with user input
    result = subprocess.run(command, shell=True, capture_output=True, text=True)
    return result.stdout


# =============================================================================
# VULNERABILITY: TOOL_INPUT_UNVALIDATED (HIGH)
# File operations without path validation
# =============================================================================
def read_file(path: str) -> str:
    """Read a file - VULNERABLE: no path validation.
    
    ❌ HIGH: Can read ANY file including /etc/passwd, ~/.ssh/id_rsa, etc.
    """
    # ❌ VULNERABLE: No path validation
    with open(path, 'r') as f:
        return f.read()


def write_file(path: str, content: str) -> bool:
    """Write to a file - VULNERABLE: no path validation.
    
    ❌ HIGH: Can write to ANY path, could overwrite system files.
    """
    # ❌ VULNERABLE: No path validation
    with open(path, 'w') as f:
        f.write(content)
    return True


# =============================================================================
# VULNERABILITY: TOOL_NO_CONFIRM (HIGH)
# Destructive operation without human confirmation
# =============================================================================
def delete_user(user_id: str) -> bool:
    """Delete a user account - VULNERABLE: no confirmation.
    
    ❌ HIGH: Destructive action without human-in-the-loop.
    """
    # ❌ VULNERABLE: No confirmation for destructive action
    # In a real system this would delete from database
    print(f"Deleting user: {user_id}")
    return True


def process_refund(amount: float, account_id: str) -> bool:
    """Process a refund - VULNERABLE: no confirmation for large amounts.
    
    ❌ HIGH: Large financial operation without approval.
    """
    # ❌ VULNERABLE: No human gate for high-value operations
    if amount > 10000:
        # Should require human approval for large refunds!
        pass
    
    print(f"Processing refund of ${amount} to account {account_id}")
    return True


# =============================================================================
# VULNERABILITY: TOOL_NO_TIMEOUT (MEDIUM)
# Operations without timeout
# =============================================================================
def fetch_url(url: str) -> str:
    """Fetch URL content - VULNERABLE: no timeout.
    
    ❌ MEDIUM: Could hang forever on slow/malicious URLs.
    """
    import urllib.request
    # ❌ VULNERABLE: No timeout
    with urllib.request.urlopen(url) as response:
        return response.read().decode('utf-8')


# =============================================================================
# Tool registry (makes it easy for agent to discover tools)
# =============================================================================
AVAILABLE_TOOLS = {
    "execute_shell": execute_shell,
    "read_file": read_file,
    "write_file": write_file,
    "delete_user": delete_user,
    "process_refund": process_refund,
    "fetch_url": fetch_url,
}


def get_tool(name: str) -> Any:
    """Get a tool by name."""
    return AVAILABLE_TOOLS.get(name)
