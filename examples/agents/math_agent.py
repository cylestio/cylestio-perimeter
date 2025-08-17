#!/usr/bin/env python3
"""
Anthropic AI Agent with Math Tool
A simple agent that can perform mathematical calculations using tool calls.
"""

import json
import math
import os
from anthropic import Anthropic


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


class AnthropicSessionMathAgent:
    """Math agent that maintains a single session (message history) across multiple queries."""

    def __init__(self, client):
        self.client = client
        self.messages = []
        # Add system prompt to guide the agent's behavior
        self.system_prompt = (
            "You are a helpful math assistant with access to a calculator tool :) "
            "You can perform various mathematical operations including addition, subtraction, "
            "multiplication, division, exponentiation, and square roots. "
            "When users ask math questions, use the math_calculator tool to provide accurate results. "
            "Always explain your calculations clearly and be conversational in your responses. "
            "If a user asks about previous calculations, refer back to the conversation history."
        )
        # Define the math tool once for the whole session
        self.math_tool = {
            "name": "math_calculator",
            "description": "Perform mathematical calculations including basic arithmetic, power, and square root operations",
            "input_schema": {
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

    def calculate(self, query):
        """Process a single query while preserving conversation state."""
        print(f"\n🤖 User: {query}")

        # Add user message to the ongoing history
        self.messages.append({"role": "user", "content": query})

        # First turn: let Claude decide whether to call tools
        response = self.client.messages.create(
            model="claude-3-haiku-20240307",
            max_tokens=1024,
            system=self.system_prompt,
            messages=self.messages,
            tools=[self.math_tool]
        )

        # Add assistant message (which may contain tool_use blocks) to history
        self.messages.append({"role": "assistant", "content": response.content})

        # If tool calls are requested, execute and provide results, then get the final answer
        if response.stop_reason == "tool_use":
            tool_uses = [block for block in response.content if getattr(block, "type", None) == "tool_use"]
            print(f"📊 Agent is using {len(tool_uses)} math tool(s)")

            tool_results = []
            for tool_use in tool_uses:
                print(f"🔧 Calculating: {tool_use.name} with {tool_use.input}")
                result = execute_math_tool(**tool_use.input)
                tool_results.append({
                    "type": "tool_result",
                    "tool_use_id": tool_use.id,
                    "content": str(result)
                })

            # Tool results are returned from the user role per Anthropic's spec
            self.messages.append({"role": "user", "content": tool_results})

            final_response = self.client.messages.create(
                model="claude-3-haiku-20240307",
                max_tokens=1024,
                system=self.system_prompt,
                messages=self.messages,
                tools=[self.math_tool]
            )

            # Persist final assistant response to history
            self.messages.append({"role": "assistant", "content": final_response.content})

            for content_block in final_response.content:
                if getattr(content_block, "type", None) == "text":
                    print(f"🎯 Agent: {content_block.text}")
        else:
            # No tools used; print assistant text blocks
            for content_block in response.content:
                if getattr(content_block, "type", None) == "text":
                    print(f"🎯 Agent: {content_block.text}")


def main():
    """Main function to run the math agent with example calculations."""
    
    # Check for API key
    if not os.getenv("ANTHROPIC_API_KEY"):
        print("❌ Error: ANTHROPIC_API_KEY environment variable not set")
        print("Please set your API key: export ANTHROPIC_API_KEY='your-key-here'")
        return
    
    # Initialize Anthropic client
    try:
        base_url = os.getenv("ANTHROPIC_BASE_URL")
        client = Anthropic(base_url=base_url) if base_url else Anthropic()
        if base_url:
            print(f"✅ Anthropic client initialized successfully (base_url={base_url})")
        else:
            print("✅ Anthropic client initialized successfully")
    except Exception as e:
        print(f"❌ Error initializing Anthropic client: {e}")
        return
    
    print("🚀 Starting Math Agent Demo (single session across multiple queries)")
    print("=" * 50)
    
    # Example calculations to demonstrate the agent
    calculations = [
        "What is 25 + 17?",
        "Calculate the square root of 144",
        "What is 7 raised to the power of 3?", 
        "Divide 100 by 4",
        "What is 15 * 8?",
        "Calculate 50 - 23",
        "Now add 10 to that last result",
        "And what was my second question?"
    ]
    
    # Create a single agent instance to preserve session
    agent = AnthropicSessionMathAgent(client)

    for calculation in calculations:
        try:
            agent.calculate(calculation)
        except Exception as e:
            print(f"❌ Error processing calculation: {e}")
    
    print("\n" + "=" * 50)
    print("🎉 Math Agent Demo Complete - Agent shutting down")


if __name__ == "__main__":
    main()