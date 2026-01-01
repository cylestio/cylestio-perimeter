"""Tool parsing utilities for LLM requests and responses."""
from typing import Any, Dict, List, Optional

from src.utils.logger import get_logger

logger = get_logger(__name__)


class ToolParser:
    """Parser for tool usage in LLM requests and responses.

    Handles parsing of tool execution requests and results from
    both OpenAI and Anthropic API formats.
    """

    def parse_tool_results(self, body: Optional[Dict[str, Any]], provider: Optional[str] = None) -> List[Dict[str, Any]]:
        """Extract tool results from request messages.

        Args:
            body: Request body
            provider: Provider name (openai, anthropic) to use appropriate parsing logic

        Returns:
            List of tool result dictionaries
        """
        if not body:
            return []

        provider_name = provider.lower() if provider else ""

        # OpenAI format: tool results in messages
        if provider_name == "openai":
            return self._parse_openai_tool_results(body)

        # Anthropic format: tool_result in content[]
        elif provider_name == "anthropic":
            return self._parse_anthropic_tool_results(body)

        # Fallback: try both formats
        else:
            # Try OpenAI first
            openai_results = self._parse_openai_tool_results(body)
            if openai_results:
                return openai_results

            # Then try Anthropic
            return self._parse_anthropic_tool_results(body)

    def _build_openai_tool_call_map(self, messages: List[Dict[str, Any]]) -> Dict[str, str]:
        """Build a map of tool_call_id -> tool_name from OpenAI assistant messages.

        OpenAI's tool role messages don't include the tool name, only tool_call_id.
        This method scans assistant messages with tool_calls to build a lookup map.

        Args:
            messages: List of OpenAI chat messages

        Returns:
            Dict mapping tool_call_id to function name
        """
        tool_name_map = {}
        for message in messages:
            if message.get("role") == "assistant":
                for tool_call in message.get("tool_calls", []):
                    call_id = tool_call.get("id")
                    function = tool_call.get("function", {})
                    tool_name = function.get("name")
                    if call_id and tool_name:
                        tool_name_map[call_id] = tool_name
        return tool_name_map

    def _parse_openai_tool_results(self, body: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Parse tool results from OpenAI request format."""
        tool_results = []

        # Chat Completions API: tool results in messages array
        if "messages" in body:
            tool_name_map = self._build_openai_tool_call_map(body["messages"])

            for message in body["messages"]:
                # OpenAI tool results come in "tool" role messages
                if message.get("role") == "tool":
                    tool_call_id = message.get("tool_call_id")
                    content_value = message.get("content")
                    # Try message.name first (backward compat), then lookup from map
                    tool_name = message.get("name") or tool_name_map.get(tool_call_id)
                    tool_results.append({
                        "tool_use_id": tool_call_id,
                        "name": tool_name,
                        "content": content_value,
                        "result": content_value,
                        "is_error": False  # OpenAI doesn't have explicit error flag
                    })

        # Responses API: tool results in input array
        if "input" in body:
            input_data = body["input"]
            if isinstance(input_data, list):
                # First pass: collect tool names from function_call entries
                tool_name_map = {}
                for item in input_data:
                    if (isinstance(item, dict) and
                        item.get("type") == "function_call"):
                        call_id = item.get("call_id")
                        tool_name = item.get("name")
                        if call_id and tool_name:
                            tool_name_map[call_id] = tool_name

                # Second pass: collect tool results with names
                for item in input_data:
                    # Look for function_call_output entries
                    if (isinstance(item, dict) and
                        item.get("type") == "function_call_output"):
                        call_id = item.get("call_id")
                        tool_name = tool_name_map.get(call_id)
                        output_value = item.get("output")
                        tool_results.append({
                            "tool_use_id": call_id,
                            "name": tool_name,
                            "content": output_value,
                            "result": output_value,
                            "is_error": False
                        })

        return tool_results

    def _parse_anthropic_tool_results(self, body: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Parse tool results from Anthropic request format."""
        if "messages" not in body:
            return []

        # First, collect all tool_use blocks to map tool_use_id to tool name
        tool_use_map = {}
        for message in body["messages"]:
            if message.get("role") == "assistant" and isinstance(message.get("content"), list):
                for content_item in message["content"]:
                    if isinstance(content_item, dict) and content_item.get("type") == "tool_use":
                        tool_use_id = content_item.get("id")
                        tool_name = content_item.get("name")
                        if tool_use_id and tool_name:
                            tool_use_map[tool_use_id] = tool_name

        # Now parse tool results and match them with tool names
        tool_results = []
        for message in body["messages"]:
            if message.get("role") == "user" and isinstance(message.get("content"), list):
                for content_item in message["content"]:
                    if isinstance(content_item, dict) and content_item.get("type") == "tool_result":
                        tool_use_id = content_item.get("tool_use_id")
                        tool_name = tool_use_map.get(tool_use_id, "unknown")

                        tool_results.append({
                            "tool_use_id": tool_use_id,
                            "name": tool_name,  # Add the tool name!
                            "result": content_item.get("content"),
                            "content": content_item.get("content"),  # Keep for backward compatibility
                            "is_error": content_item.get("is_error", False)
                        })

        return tool_results

    def parse_tool_requests(self, body: Optional[Dict[str, Any]], provider: Optional[str] = None) -> List[Dict[str, Any]]:
        """Extract tool use requests from response content (typically from LLM assistant's response).

        Args:
            body: Response body
            provider: Provider name (openai, anthropic) to use appropriate parsing logic

        Returns:
            List of tool use dictionaries
        """
        if not body:
            return []

        provider_name = provider.lower() if provider else ""

        # OpenAI format: tool_calls in choices[].message
        if provider_name == "openai":
            return self._parse_openai_tool_requests(body)

        # Anthropic format: tool_use in content[]
        elif provider_name == "anthropic":
            return self._parse_anthropic_tool_requests(body)

        # Fallback: try both formats
        else:
            # Try OpenAI first
            openai_tools = self._parse_openai_tool_requests(body)
            if openai_tools:
                return openai_tools

            # Then try Anthropic
            return self._parse_anthropic_tool_requests(body)

    def _parse_openai_tool_requests(self, body: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Parse tool requests from OpenAI response format."""
        tool_uses = []

        # Handle Chat Completions API format (choices array)
        choices = body.get("choices", [])
        for choice in choices:
            message = choice.get("message", {})
            tool_calls = message.get("tool_calls", [])

            for tool_call in tool_calls:
                function = tool_call.get("function", {})

                # Parse arguments if it's a JSON string (OpenAI format)
                args = function.get("arguments", {})
                if isinstance(args, str):
                    try:
                        import json
                        args = json.loads(args)
                    except (json.JSONDecodeError, TypeError):
                        args = {"raw_arguments": args}

                tool_uses.append({
                    "id": tool_call.get("id"),
                    "name": function.get("name"),
                    "input": args
                })

        # Handle Responses API format (output array)
        output = body.get("output", [])
        if isinstance(output, list):
            for item in output:
                if isinstance(item, dict) and item.get("type") == "function_call":
                    # Parse arguments if it's a JSON string
                    args = item.get("arguments", {})
                    if isinstance(args, str):
                        try:
                            import json
                            args = json.loads(args)
                        except (json.JSONDecodeError, TypeError):
                            args = {"raw_arguments": args}

                    tool_uses.append({
                        "id": item.get("call_id"),
                        "name": item.get("name"),
                        "input": args
                    })

        return tool_uses

    def _parse_anthropic_tool_requests(self, body: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Parse tool requests from Anthropic response format."""
        if "content" not in body:
            return []

        tool_uses = []
        content = body["content"]
        if isinstance(content, list):
            for content_item in content:
                if isinstance(content_item, dict) and content_item.get("type") == "tool_use":
                    tool_uses.append({
                        "id": content_item.get("id"),
                        "name": content_item.get("name"),
                        "input": content_item.get("input", {})
                    })

        return tool_uses


# Default instance
tool_parser = ToolParser()
