#!/usr/bin/env python3
"""
OpenAI Math Agent with Session Management using previous_response_id.

This implementation uses the OpenAI Python SDK v1.x Responses API and submits
tool outputs back to the model when requested, while maintaining continuity via
previous_response_id across calls.
"""

import json
import math
import os
from openai import OpenAI


def execute_math_tool(operation, a=None, b=None, base=None, exponent=None, number=None, **kwargs):
    """Execute math operations."""
    try:
        if operation == "add":
            if a is None or b is None:
                return "Error: Addition requires both 'a' and 'b' parameters"
            return a + b
        elif operation == "subtract":
            if a is None or b is None:
                return "Error: Subtraction requires both 'a' and 'b' parameters"
            return a - b
        elif operation == "multiply":
            if a is None or b is None:
                return "Error: Multiplication requires both 'a' and 'b' parameters"
            return a * b
        elif operation == "divide":
            if a is None or b is None:
                return "Error: Division requires both 'a' and 'b' parameters"
            if b == 0:
                return "Error: Division by zero"
            return a / b
        elif operation == "power":
            if base is None or exponent is None:
                return "Error: Power operation requires both 'base' and 'exponent' parameters"
            return base ** exponent
        elif operation == "sqrt":
            if number is None:
                return "Error: Square root operation requires 'number' parameter"
            if number < 0:
                return "Error: Cannot take square root of negative number"
            return math.sqrt(number)
        else:
            return f"Error: Unknown operation {operation}"
    except Exception as e:
        return f"Error: {str(e)}"


class ResponseIdSessionAgent:
    """Session management using OpenAI's previous_response_id."""
    
    def __init__(self, client):
        self.client = client
        self.last_response_id = None
        self.message_count = 0  # Track message count for comparison
        self.instructions = "You are a helpful math assistant. Use the math_calculator tool to perform calculations when needed. Be conversational and helpful in your responses."
        
        # Define tools with proper function schema
        self.tools = [
            {
                "type": "function",
                "name": "math_calculator",
                "description": "Perform mathematical calculations including add, subtract, multiply, divide, power, and sqrt operations.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "operation": {
                            "type": "string",
                            "enum": ["add", "subtract", "multiply", "divide", "power", "sqrt"],
                            "description": "The mathematical operation to perform"
                        },
                        "a": {
                            "type": ["number", "null"],
                            "description": "First number for binary operations"
                        },
                        "b": {
                            "type": ["number", "null"],
                            "description": "Second number for binary operations"
                        },
                        "base": {
                            "type": ["number", "null"],
                            "description": "Base number for power operation"
                        },
                        "exponent": {
                            "type": ["number", "null"],
                            "description": "Exponent for power operation"
                        },
                        "number": {
                            "type": ["number", "null"],
                            "description": "Number for sqrt operation"
                        }
                    },
                    "required": ["operation", "a", "b", "base", "exponent", "number"],
                    "additionalProperties": False
                },
                "strict": True
            }
        ]
    
    def calculate(self, query):
        """Calculate using previous_response_id for session continuity."""
        print(f"User: {query}")
        self.message_count += 1  # Count user message
        print(f"Messages in history: {self.message_count}")
        
        # Build input based on whether this is first message or continuation
        if self.last_response_id:
            # Continue from previous response
            input_data = [{"role": "user", "content": query}]
            print(f"Continuing from response: {self.last_response_id}")
        else:
            # First message in conversation - only user message; instructions sent separately each turn
            input_data = [{"role": "user", "content": query}]
        
        # Build request parameters
        params = {
            "model": "gpt-4o-mini",
            "input": input_data,
            "tools": self.tools,
            "instructions": self.instructions
        }
        
        # Add previous_response_id if we have one
        if self.last_response_id:
            params["previous_response_id"] = self.last_response_id
        
        # Make request to Responses API
        response = self.client.responses.create(**params)
        
        # Store the response ID for next call
        self.last_response_id = response.id
        self.message_count += 1  # Count assistant response
        
        # Process function calls and get final response
        response = self._handle_function_calls(response)
        self._print_output(response)
        return response
    
    def _handle_function_calls(self, response):
        """Handle function calls in the response output and submit results."""
        try:
            # Extract function calls from response output
            function_calls = self._extract_function_calls(response)
            
            if not function_calls:
                return response
            
            print(f"Agent is using {len(function_calls)} function call(s)")
            
            # Build input with just function call outputs
            input_data = []
            
            # Execute function calls and add outputs
            for func_call in function_calls:
                call_id = func_call.call_id
                name = func_call.name
                args_json = func_call.arguments
                
                if name == "math_calculator":
                    args = json.loads(args_json) if isinstance(args_json, str) else args_json
                    result = execute_math_tool(**args)
                    print(f"Calculated: {result}")
                    self.message_count += 1  # Count tool result message
                    
                    # Add function call output to input
                    input_data.append({
                        "type": "function_call_output",
                        "call_id": call_id,
                        "output": str(result)
                    })
            
            # Make follow-up request with function outputs
            response = self.client.responses.create(
                model="gpt-4o-mini",
                tools=self.tools,
                input=input_data,
                instructions=self.instructions,
                previous_response_id=self.last_response_id
            )
            
            # Update response ID
            self.last_response_id = response.id
            self.message_count += 1  # Count follow-up response
            
            # Check for additional function calls (recursive)
            return self._handle_function_calls(response)
            
        except Exception as e:
            print(f"Error handling function calls: {e}")
            return response

    def _extract_function_calls(self, response):
        """Extract function calls from response output."""
        function_calls = []
        if hasattr(response, "output") and response.output:
            for item in response.output:
                if getattr(item, "type", None) == "function_call":
                    function_calls.append(item)
        return function_calls

    def _print_output(self, response):
        """Print assistant text from the Responses API."""
        # Use the output_text convenience property if available
        text = getattr(response, "output_text", None)
        if text:
            print(f"Agent: {text}")
            return
        
        # Fallback: extract text from output blocks
        if hasattr(response, "output") and response.output:
            texts = []
            for item in response.output:
                # Look for text content in various formats
                if getattr(item, "type", None) == "text":
                    texts.append(getattr(item, "text", ""))
                elif getattr(item, "type", None) == "message":
                    # Extract text from message content
                    content = getattr(item, "content", [])
                    if isinstance(content, str):
                        texts.append(content)
                    elif isinstance(content, list):
                        for part in content:
                            if getattr(part, "type", None) == "text":
                                texts.append(getattr(part, "text", ""))
            
            if texts:
                joined_text = "\n".join(texts)
                print(f"Agent: {joined_text}")


def main():
    """Example usage with OpenAI Responses API."""
    if not os.getenv("OPENAI_API_KEY"):
        print("Error: OPENAI_API_KEY not set")
        return
    
    base_url = os.getenv("OPENAI_BASE_URL")
    client = OpenAI(base_url=base_url) if base_url else OpenAI()
    agent = ResponseIdSessionAgent(client)
    
    print("=== OpenAI Session Agent (Response ID) ===")
    
    # Example conversation showing session continuity
    queries = [
        "What is 15 + 25?",
        "Now multiply that result by 2",  # References previous result
        "What was my first calculation?"   # Tests memory
    ]
    
    for query in queries:
        try:
            agent.calculate(query)
            print()
        except Exception as e:
            print(f"Error: {e}")
    
    print(f"Final conversation length: {agent.message_count} messages")


if __name__ == "__main__":
    main()