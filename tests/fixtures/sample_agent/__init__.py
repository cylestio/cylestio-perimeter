"""
Sample agent fixture for testing Agent Inspector security scanning.

⚠️ DO NOT use in production - contains intentional vulnerabilities!
"""
from .agent import VulnerableAgent, create_agent
from .tools import DangerousTools, AVAILABLE_TOOLS

__all__ = ['VulnerableAgent', 'create_agent', 'DangerousTools', 'AVAILABLE_TOOLS']
