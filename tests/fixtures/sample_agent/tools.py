"""
Tool definitions for the sample agent.

⚠️ DO NOT use this code in production!
This contains intentional security vulnerabilities for testing.
"""
import os
import sqlite3
from typing import Any, Dict, List, Optional


class DangerousTools:
    """Tool implementations with security vulnerabilities."""
    
    def __init__(self):
        # VULNERABILITY [DATA] - Database credentials hardcoded
        self.db_password = "admin123!"
        self.db_connection = None
    
    def shell_execute(self, command: str, args: List[str] = None) -> str:
        """Execute a shell command.
        
        VULNERABILITY [TOOL] - No command validation or sandboxing.
        """
        import subprocess
        
        # CRITICAL: Direct shell execution without any constraints
        full_command = command
        if args:
            full_command += " " + " ".join(args)
        
        # No allowlist of commands
        # No argument sanitization
        # No sandbox/container isolation
        result = subprocess.run(
            full_command,
            shell=True,  # Shell=True is dangerous
            capture_output=True,
            text=True
        )
        
        return result.stdout or result.stderr
    
    def database_query(self, query: str, params: tuple = None) -> List[Dict]:
        """Execute a database query.
        
        VULNERABILITY [TOOL] - SQL injection possible.
        """
        if not self.db_connection:
            self.db_connection = sqlite3.connect("agent.db")
        
        cursor = self.db_connection.cursor()
        
        # CRITICAL: String formatting instead of parameterized query
        # This allows SQL injection
        cursor.execute(query)  # query could contain user-controlled SQL
        
        rows = cursor.fetchall()
        return [dict(row) for row in rows]
    
    def file_operations(
        self, 
        operation: str, 
        path: str, 
        content: Optional[str] = None
    ) -> str:
        """Perform file operations.
        
        VULNERABILITY [TOOL] - No path validation, allows traversal.
        """
        # HIGH: No path validation - allows directory traversal
        # Could access /etc/passwd, ~/.ssh/id_rsa, etc.
        
        if operation == "read":
            # No check if path is within allowed directory
            with open(path, "r") as f:
                return f.read()
        
        elif operation == "write":
            # No check if path is within allowed directory
            # Could overwrite system files
            with open(path, "w") as f:
                f.write(content or "")
            return f"Written to {path}"
        
        elif operation == "delete":
            # CRITICAL: Can delete any file!
            os.remove(path)
            return f"Deleted {path}"
        
        elif operation == "list":
            # Can list any directory
            return str(os.listdir(path))
        
        return "Unknown operation"
    
    def http_request(self, url: str, method: str = "GET", data: dict = None) -> str:
        """Make HTTP requests.
        
        VULNERABILITY [TOOL] - SSRF vulnerability, no URL validation.
        """
        import requests
        
        # HIGH: No URL validation - allows SSRF attacks
        # Could access internal services, metadata APIs, etc.
        # Examples:
        # - http://169.254.169.254/latest/meta-data/ (AWS metadata)
        # - http://localhost:6379/ (internal Redis)
        # - http://internal-api.corp/ (internal services)
        
        if method == "GET":
            response = requests.get(url)
        elif method == "POST":
            response = requests.post(url, json=data)
        else:
            response = requests.request(method, url, json=data)
        
        return response.text
    
    def send_email(self, to: str, subject: str, body: str) -> str:
        """Send an email.
        
        VULNERABILITY [BEHAVIORAL] - No approval for sensitive action.
        """
        # HIGH: No human approval for sending emails
        # Agent could send spam, phishing, or leak data
        
        import smtplib
        from email.mime.text import MIMEText
        
        # VULNERABILITY [DATA] - Hardcoded SMTP credentials
        smtp_password = "email_password_123"
        
        msg = MIMEText(body)
        msg['Subject'] = subject
        msg['To'] = to
        
        # Would send email without any approval gate
        # ...
        
        return f"Email sent to {to}"
    
    def generate_code(self, spec: str) -> str:
        """Generate code based on specification.
        
        VULNERABILITY [OUTPUT] - Generated code executed without review.
        """
        # Simulate code generation
        generated = f"# Generated code for: {spec}\nprint('Hello')"
        
        # CRITICAL: Executing generated code without review
        exec(generated)  # NEVER do this!
        
        return generated


# Tool definitions for the agent
AVAILABLE_TOOLS = [
    {
        "name": "shell_execute",
        "description": "Execute shell commands on the system",
        "parameters": {
            "command": {"type": "string", "description": "Command to execute"},
            "args": {"type": "array", "description": "Command arguments"}
        }
    },
    {
        "name": "database_query",
        "description": "Query the database",
        "parameters": {
            "query": {"type": "string", "description": "SQL query to execute"}
        }
    },
    {
        "name": "file_operations",
        "description": "Read, write, or delete files",
        "parameters": {
            "operation": {"type": "string", "enum": ["read", "write", "delete", "list"]},
            "path": {"type": "string", "description": "File path"},
            "content": {"type": "string", "description": "Content to write"}
        }
    },
    {
        "name": "http_request",
        "description": "Make HTTP requests to any URL",
        "parameters": {
            "url": {"type": "string", "description": "URL to request"},
            "method": {"type": "string", "description": "HTTP method"},
            "data": {"type": "object", "description": "Request body"}
        }
    },
    {
        "name": "send_email",
        "description": "Send emails to anyone",
        "parameters": {
            "to": {"type": "string", "description": "Recipient email"},
            "subject": {"type": "string", "description": "Email subject"},
            "body": {"type": "string", "description": "Email body"}
        }
    },
    {
        "name": "generate_code",
        "description": "Generate and execute code",
        "parameters": {
            "spec": {"type": "string", "description": "Code specification"}
        }
    }
]
