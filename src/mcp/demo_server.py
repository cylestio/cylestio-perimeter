"""Demo script showing MCP server usage."""
from src.mcp import call_tool, initialize_mcp, list_tools


def demo_list_tools():
    """Demo listing all available tools."""
    print("=" * 60)
    print("Available MCP Tools")
    print("=" * 60)

    tools = list_tools()
    print(f"\nTotal tools: {len(tools)}\n")

    for i, tool in enumerate(tools, 1):
        print(f"{i}. {tool['name']}")
        print(f"   Description: {tool['description']}")
        required = tool["parameters"].get("required", [])
        if required:
            print(f"   Required params: {', '.join(required)}")
        print()


def demo_knowledge_tools():
    """Demo knowledge tools."""
    print("=" * 60)
    print("Knowledge Tools Demo")
    print("=" * 60)

    # Get security patterns
    print("\n1. Getting security patterns...")
    result = call_tool("get_security_patterns", {"context": "all", "min_severity": "HIGH"})
    if result["success"]:
        print(f"   Found {result['data']['total_count']} patterns")
        print(f"   Context: {result['data']['context']}")
        print(f"   Min severity: {result['data']['min_severity']}")
    else:
        print(f"   Error: {result['error']['message']}")

    # Get specific OWASP control
    print("\n2. Getting OWASP control LLM01...")
    result = call_tool("get_owasp_control", {"control_id": "LLM01"})
    if result["success"]:
        control = result["data"]["control"]
        print(f"   Control: {control.get('title', 'N/A')}")
        print(f"   ID: {result['data']['control_id']}")
    else:
        print(f"   Error: {result['error']['message']}")

    # Get fix template
    print("\n3. Getting fix template for PROMPT_INJECTION...")
    result = call_tool("get_fix_template", {"finding_type": "PROMPT_INJECTION"})
    if result["success"]:
        print(f"   Template for: {result['data']['finding_type']}")
        print(f"   Has template: {bool(result['data']['template'])}")
    else:
        print(f"   Error: {result['error']['message']}")


def demo_error_handling():
    """Demo error handling."""
    print("\n" + "=" * 60)
    print("Error Handling Demo")
    print("=" * 60)

    # Unknown tool
    print("\n1. Calling unknown tool...")
    result = call_tool("unknown_tool", {})
    print(f"   Success: {result['success']}")
    print(f"   Error code: {result['error']['code']}")
    print(f"   Message: {result['error']['message']}")

    # Missing required parameter
    print("\n2. Missing required parameter...")
    result = call_tool("get_owasp_control", {})
    print(f"   Success: {result['success']}")
    print(f"   Error code: {result['error']['code']}")
    print(f"   Message: {result['error']['message'][:60]}...")


if __name__ == "__main__":
    print("\nMCP Server Module Demo")
    print("=" * 60)
    print()

    # Demo 1: List tools
    demo_list_tools()

    # Demo 2: Knowledge tools
    demo_knowledge_tools()

    # Demo 3: Error handling
    demo_error_handling()

    print("\n" + "=" * 60)
    print("Demo Complete")
    print("=" * 60)
