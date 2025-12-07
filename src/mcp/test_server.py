"""Tests for MCP server module."""
import pytest

from src.mcp.server import call_tool, list_tools


def test_list_tools():
    """Test that list_tools returns all 8 tools."""
    tools = list_tools()

    # Verify we have 8 tools
    assert len(tools) == 8

    # Verify all expected tool names are present
    tool_names = {tool["name"] for tool in tools}
    expected_names = {
        "get_security_patterns",
        "get_owasp_control",
        "get_fix_template",
        "create_analysis_session",
        "complete_analysis_session",
        "store_finding",
        "get_findings",
        "update_finding_status",
    }
    assert tool_names == expected_names

    # Verify each tool has required fields
    for tool in tools:
        assert "name" in tool
        assert "description" in tool
        assert "parameters" in tool
        assert tool["description"]  # Non-empty description


def test_call_tool_get_security_patterns():
    """Test calling get_security_patterns tool."""
    result = call_tool("get_security_patterns", {})

    # Should return a successful response
    assert isinstance(result, dict)
    assert result.get("success") is True
    assert "data" in result
    assert "patterns" in result["data"]
    assert "total_count" in result["data"]


def test_call_tool_unknown_tool():
    """Test calling an unknown tool returns error."""
    result = call_tool("unknown_tool", {})

    # Should return an error response
    assert isinstance(result, dict)
    assert result.get("success") is False
    assert "error" in result
    assert result["error"]["code"] == "UNKNOWN_TOOL"
    assert "unknown_tool" in result["error"]["message"]
    assert "Available tools:" in result["error"]["suggestion"]


def test_tool_definitions_structure():
    """Test that tool definitions have proper structure."""
    tools = list_tools()

    for tool in tools:
        # Each tool must have parameters with type object
        assert tool["parameters"]["type"] == "object"
        assert "properties" in tool["parameters"]

        # Check for required fields if present
        if "required" in tool["parameters"]:
            assert isinstance(tool["parameters"]["required"], list)
            # All required fields must be in properties
            for req_field in tool["parameters"]["required"]:
                assert req_field in tool["parameters"]["properties"]


def test_call_tool_with_invalid_arguments():
    """Test calling tools with invalid arguments."""
    # Test get_owasp_control without required control_id
    result = call_tool("get_owasp_control", {})

    # Should fail due to missing required parameter
    assert isinstance(result, dict)
    assert result.get("success") is False
    assert "error" in result
    assert result["error"]["code"] == "INVALID_ARGUMENTS"
    assert "control_id" in result["error"]["message"]


def test_all_knowledge_tools():
    """Test all knowledge tools can be called."""
    knowledge_tools = [
        ("get_security_patterns", {}),
        ("get_owasp_control", {"control_id": "LLM01"}),
        ("get_fix_template", {"finding_type": "PROMPT_INJECTION"}),
    ]

    for tool_name, args in knowledge_tools:
        result = call_tool(tool_name, args)
        assert isinstance(result, dict)
        # Should have success key
        assert "success" in result
