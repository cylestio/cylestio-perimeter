"""Sample config with INTENTIONAL SECURITY VULNERABILITIES for testing.

DO NOT USE IN PRODUCTION - This file is for security scanner testing only.
"""

# =============================================================================
# VULNERABILITY: SECRET_API_KEY (CRITICAL)
# Hardcoded API key in source code
# =============================================================================
# ❌ CRITICAL: API key hardcoded in source
# This should be: os.getenv("OPENAI_API_KEY")
OPENAI_API_KEY = "sk-proj-FAKE-KEY-FOR-TESTING-ONLY-abcd1234"

# ❌ CRITICAL: Another hardcoded secret
ANTHROPIC_API_KEY = "sk-ant-FAKE-KEY-FOR-TESTING-ONLY-efgh5678"

# ❌ HIGH: Database credentials
DATABASE_PASSWORD = "super_secret_password_123"


# =============================================================================
# Non-vulnerable configurations (for comparison)
# =============================================================================
MAX_TOKENS = 4096
DEFAULT_MODEL = "gpt-4"
TIMEOUT_SECONDS = 30

# Agent configuration
AGENT_CONFIG = {
    "name": "Test Agent",
    "version": "1.0.0",
    "max_iterations": 100,  # Good: has a limit
}
