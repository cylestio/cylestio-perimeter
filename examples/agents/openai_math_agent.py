#!/usr/bin/env python3
"""
OpenAI AI Agent with Math Tool and Session Management
A math agent that maintains conversation history across multiple calculations using OpenAI's Chat Completions API.
"""

import json
import math
import os
from openai import OpenAI


def execute_math_tool(operation, **kwargs):
    """Execute math operations based on the tool call."""
    try:
        if operation == "add":
            return kwargs["a"] + kwargs["b"]
        elif operation == "subtract":
            return kwargs["a"] - kwargs["b"]
        elif operation == "multiply":
            return kwargs["a"] * kwargs["b"]
        elif operation == "divide":
            if kwargs["b"] == 0:
                return "Error: Division by zero"
            return kwargs["a"] / kwargs["b"]
        elif operation == "power":
            return kwargs["base"] ** kwargs["exponent"]
        elif operation == "sqrt":
            if kwargs["number"] < 0:
                return "Error: Cannot take square root of negative number"
            return math.sqrt(kwargs["number"])
        else:
            return f"Error: Unknown operation {operation}"
    except Exception as e:
        return f"Error: {str(e)}"


class ChatCompletionsSessionAgent:
    """Math agent using Chat Completions API with session management via message history."""
    
    def __init__(self, client):
        self.client = client
        self.messages = [
            {
                "role": "system",
                "content": "You are a helpful math assistant. Use the math_calculator tool to perform calculations when needed. Be conversational and helpful in your responses. Remember previous calculations and can reference them in future conversations."
            }
        ]  # Store complete conversation history with system prompt
        
        # Define the math tool for Chat Completions
        self.tools = [
            {
                "type": "function",
                "function": {
                    "name": "math_calculator",
                    "description": "Perform mathematical calculations including basic arithmetic, power, and square root operations",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "operation": {
                                "type": "string",
                                "enum": ["add", "subtract", "multiply", "divide", "power", "sqrt"],
                                "description": "The mathematical operation to perform"
                            },
                            "a": {"type": "number", "description": "First number (for binary operations)"},
                            "b": {"type": "number", "description": "Second number (for binary operations)"},
                            "base": {"type": "number", "description": "Base number for power operation"},
                            "exponent": {"type": "number", "description": "Exponent for power operation"},
                            "number": {"type": "number", "description": "Number for square root operation"}
                        },
                        "required": ["operation"]
                    }
                }
            }
        ]
    
    def calculate(self, query):
        """Process calculation maintaining session via message history."""
        print(f"\n🤖 User: {query}")
        print(f"📚 Messages in history: {len(self.messages)}")
        
        # Add user message to conversation history
        self.messages.append({
            "role": "user",
            "content": query
        })
        
        # Get OpenAI's response via Chat Completions
        response = self.client.chat.completions.create(
            model="gpt-4o-mini",
            messages=self.messages,
            tools=self.tools,
            tool_choice="auto",
        )
        
        message = response.choices[0].message
        
        # Check if the model wants to use tools
        if hasattr(message, "tool_calls") and message.tool_calls:
            print(f"📊 Agent is using {len(message.tool_calls)} tool call(s)")
            
            # Add assistant message with tool calls to history
            self.messages.append({
                "role": "assistant",
                "content": message.content,
                "tool_calls": message.tool_calls,
            })
            
            # Execute each tool call
            for tool_call in message.tool_calls:
                if tool_call.function.name == "math_calculator":
                    args = json.loads(tool_call.function.arguments or "{}")
                    print(f"🔧 Calculating with arguments: {args}")
                    result = execute_math_tool(**args)
                    
                    # Add tool result to history
                    self.messages.append({
                        "role": "tool",
                        "tool_call_id": tool_call.id,
                        "content": str(result),
                    })
            
            # Get final response from OpenAI with tool results
            final_response = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=self.messages,
                tools=self.tools,
            )
            
            final_message = final_response.choices[0].message
            if getattr(final_message, "content", None):
                print(f"🎯 Agent: {final_message.content}")
                
                # Add final assistant response to history
                self.messages.append({
                    "role": "assistant",
                    "content": final_message.content
                })
        else:
            # OpenAI responded without using functions
            if getattr(message, "content", None):
                print(f"🎯 Agent: {message.content}")
                
                # Add assistant response to history
                self.messages.append({
                    "role": "assistant",
                    "content": message.content
                })


def main():
    """Main function demonstrating the session-based math agent."""
    
    # Check for API key
    if not os.getenv("OPENAI_API_KEY"):
        print("❌ Error: OPENAI_API_KEY environment variable not set")
        print("Please set your API key: export OPENAI_API_KEY='your-key-here'")
        return
    
    # Initialize OpenAI client
    try:
        base_url = os.getenv("OPENAI_BASE_URL")
        client = OpenAI(base_url=base_url) if base_url else OpenAI()
        if base_url:
            print(f"✅ OpenAI client initialized successfully (base_url={base_url})")
        else:
            print("✅ OpenAI client initialized successfully")
    except Exception as e:
        print(f"❌ Error initializing OpenAI client: {e}")
        return
    
    # Create session-based agent
    agent = ChatCompletionsSessionAgent(client)
    
    print("🚀 Starting OpenAI Math Agent with Session Management")
    print("=" * 60)
    
    # Example calculations that demonstrate session continuity
    calculations = [
        "What is 25 + 17?",
        "Now multiply that result by 2",  # References previous result
        "Calculate the square root of 144",
        "Add the square root result to my first calculation",  # References multiple previous results
        "What was my first calculation?",  # Tests memory
    ]
    
    for calculation in calculations:
        try:
            agent.calculate(calculation)
        except Exception as e:
            print(f"❌ Error processing calculation: {e}")
    
    print(f"\n📊 Final conversation length: {len(agent.messages)} messages (including system prompt)")
    print("=" * 60)
    print("🎉 OpenAI Math Agent Session Demo Complete - Agent shutting down")


if __name__ == "__main__":
    main()