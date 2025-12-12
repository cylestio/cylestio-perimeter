"""Sample agent with INTENTIONAL SECURITY VULNERABILITIES for testing.

DO NOT USE IN PRODUCTION - This file is for security scanner testing only.
"""
import logging
from openai import OpenAI

from config import OPENAI_API_KEY
from tools import execute_shell, read_file, delete_user

logger = logging.getLogger(__name__)

client = OpenAI(api_key=OPENAI_API_KEY)


# =============================================================================
# VULNERABILITY: PROMPT_INJECT_DIRECT (CRITICAL)
# User input directly embedded in prompt string
# =============================================================================
def handle_request(user_input: str) -> str:
    """Handle user request - VULNERABLE to prompt injection."""
    # ❌ VULNERABLE: User input directly in f-string
    prompt = f"Help the user with: {user_input}"
    
    response = client.chat.completions.create(
        model="gpt-4",  # Also MODEL_UNPINNED issue
        messages=[{"role": "user", "content": prompt}]
    )
    return response.choices[0].message.content


# =============================================================================
# VULNERABILITY: PROMPT_JAILBREAK (HIGH)
# No input filtering before using in prompt
# =============================================================================
def process_document(doc_content: str, user_query: str) -> str:
    """Process document with user query - VULNERABLE to indirect injection."""
    # ❌ VULNERABLE: No filtering of doc_content or user_query
    prompt = f"""
    Document content:
    {doc_content}
    
    User question:
    {user_query}
    
    Please answer the user's question based on the document.
    """
    
    response = client.chat.completions.create(
        model="gpt-4",
        messages=[{"role": "user", "content": prompt}]
    )
    return response.choices[0].message.content


# =============================================================================
# VULNERABILITY: DATA_PII_LOGS (HIGH)
# Logging sensitive user information
# =============================================================================
def log_user_action(user_email: str, user_ssn: str, action: str):
    """Log user action - VULNERABLE: logs PII."""
    # ❌ VULNERABLE: Logging PII (email and SSN)
    logger.info(f"User {user_email} (SSN: {user_ssn}) performed: {action}")


# =============================================================================
# VULNERABILITY: BOUNDARY_INFINITE_LOOP (MEDIUM)
# Agent loop without max iterations
# =============================================================================
class Agent:
    """Simple agent - VULNERABLE: no iteration limit."""
    
    def __init__(self):
        self.should_continue_flag = True
    
    def should_continue(self) -> bool:
        return self.should_continue_flag
    
    def step(self):
        # Do something
        pass
    
    def run(self):
        """Run agent loop - VULNERABLE: no max iterations."""
        # ❌ VULNERABLE: No max_iterations limit
        while self.should_continue():
            self.step()


# =============================================================================
# Example usage (also shows vulnerabilities in action)
# =============================================================================
if __name__ == "__main__":
    # All of these are vulnerable
    result = handle_request("What is the weather?")
    log_user_action("user@example.com", "123-45-6789", "query")
