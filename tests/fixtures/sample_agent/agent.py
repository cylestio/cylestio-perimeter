"""
Sample AI Agent with INTENTIONAL security vulnerabilities.

⚠️ DO NOT use this code in production!
This is for testing Agent Inspector security scanning only.
"""
import os
import json
import subprocess
from typing import Any

# VULNERABILITY [DATA] - Hardcoded API key (LLM06)
OPENAI_API_KEY = "sk-proj-abc123def456ghi789jkl012mno345pqr678stu901vwx234"
ANTHROPIC_API_KEY = "sk-ant-api03-123456789abcdef"

# VULNERABILITY [SUPPLY] - Unpinned model version
MODEL = "gpt-4"  # Should pin to specific version like "gpt-4-0125-preview"


class VulnerableAgent:
    """An AI agent with multiple security vulnerabilities."""
    
    def __init__(self, user_id: str):
        self.user_id = user_id
        self.conversation_history = []
        # VULNERABILITY [MEMORY] - No memory isolation, all users share history
        self._global_memory = {}
    
    def build_prompt(self, user_input: str, context: str = "") -> str:
        """Build the prompt for the LLM.
        
        VULNERABILITY [PROMPT] - User input directly concatenated into system prompt.
        This allows prompt injection attacks.
        """
        # CRITICAL: User input goes directly into system prompt without sanitization
        system_prompt = f"""You are a helpful assistant for user {self.user_id}.
        
User context: {user_input}

Additional context: {context}

Follow these instructions carefully and help the user with their request.
"""
        return system_prompt
    
    def process_response(self, llm_response: str) -> str:
        """Process LLM response before returning to user.
        
        VULNERABILITY [OUTPUT] - Response used directly in SQL without escaping.
        """
        # HIGH: Agent output used directly in SQL query
        query = f"INSERT INTO responses (content) VALUES ('{llm_response}')"
        self._execute_query(query)
        
        # MEDIUM: Output logged without redaction
        print(f"[LOG] User {self.user_id} response: {llm_response}")
        
        return llm_response
    
    def _execute_query(self, query: str):
        """Execute a database query (simulated)."""
        # This would execute the SQL - vulnerable to injection
        pass
    
    def execute_tool(self, tool_name: str, args: dict) -> Any:
        """Execute a tool based on LLM decision.
        
        VULNERABILITY [TOOL] - Shell command execution without constraints.
        """
        if tool_name == "run_command":
            # CRITICAL: Shell command execution with user-controlled input
            command = args.get("command", "")
            result = subprocess.run(command, shell=True, capture_output=True)
            return result.stdout.decode()
        
        elif tool_name == "read_file":
            # HIGH: File access without path validation
            file_path = args.get("path", "")
            # No path traversal protection!
            with open(file_path, "r") as f:
                return f.read()
        
        elif tool_name == "write_file":
            # HIGH: File write without any constraints
            file_path = args.get("path", "")
            content = args.get("content", "")
            with open(file_path, "w") as f:
                f.write(content)
            return "File written"
        
        return None
    
    def run_conversation(self, messages: list) -> str:
        """Run a conversation with the agent.
        
        VULNERABILITY [BEHAVIORAL] - No token limits or rate limiting.
        """
        # MEDIUM: No token limits
        # MEDIUM: No rate limiting on tool calls
        # HIGH: Missing approval gate for sensitive operations
        
        # Simulate conversation loop
        response = ""
        tool_calls = 0
        
        # VULNERABILITY [BEHAVIORAL] - Unbounded loop
        while True:
            # Process message
            user_msg = messages[-1] if messages else ""
            
            # VULNERABILITY [PROMPT] - No input validation
            prompt = self.build_prompt(user_msg)
            
            # Simulate LLM call (would use API key here)
            llm_response = self._call_llm(prompt)
            
            # Check if tool call needed
            if "TOOL_CALL:" in llm_response:
                tool_calls += 1
                # No limit on tool calls!
                tool_result = self._handle_tool_call(llm_response)
                messages.append({"role": "tool", "content": tool_result})
                continue
            
            response = self.process_response(llm_response)
            break
        
        return response
    
    def _call_llm(self, prompt: str) -> str:
        """Call the LLM API."""
        # VULNERABILITY [DATA] - API key used from hardcoded constant
        headers = {"Authorization": f"Bearer {OPENAI_API_KEY}"}
        # ... API call implementation
        return "Simulated response"
    
    def _handle_tool_call(self, response: str) -> str:
        """Parse and execute tool calls from LLM response."""
        # Parse tool call
        tool_name = "run_command"  # Simplified
        tool_args = {"command": "ls -la"}
        
        # VULNERABILITY [TOOL] - No permission check
        return str(self.execute_tool(tool_name, tool_args))
    
    def load_external_prompt(self, url: str) -> str:
        """Load a prompt template from external URL.
        
        VULNERABILITY [SUPPLY] - External prompt loading without validation.
        """
        # HIGH: Loading prompts from external sources without validation
        import requests
        response = requests.get(url)
        return response.text  # No integrity check!
    
    def store_conversation(self, messages: list):
        """Store conversation for future reference.
        
        VULNERABILITY [MEMORY] - Plaintext storage, no encryption.
        """
        # MEDIUM: Storing conversation in plaintext
        history_file = f"conversations/{self.user_id}.json"
        
        # MEDIUM: No encryption of sensitive conversation data
        with open(history_file, "w") as f:
            json.dump(messages, f)
        
        # VULNERABILITY [MEMORY] - Global memory shared across users
        self._global_memory[self.user_id] = messages
    
    def handle_error(self, error: Exception):
        """Handle errors from the agent.
        
        VULNERABILITY [DATA] - Credentials in error messages.
        """
        # HIGH: Exposing credentials in error messages
        error_msg = f"Error occurred with API key {OPENAI_API_KEY[:20]}...: {error}"
        print(error_msg)
        raise Exception(error_msg)


def create_agent(user_id: str) -> VulnerableAgent:
    """Create a new agent instance."""
    return VulnerableAgent(user_id)


if __name__ == "__main__":
    # Example usage (DO NOT RUN IN PRODUCTION)
    agent = create_agent("user123")
    
    # This demonstrates the vulnerabilities
    messages = [{"role": "user", "content": "Hello, can you help me?"}]
    response = agent.run_conversation(messages)
    print(f"Response: {response}")
