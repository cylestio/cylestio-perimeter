"""MCP tools for retrieving security patterns and fix templates."""
from typing import Any, Dict

from src.kb.loader import get_kb_loader
from src.mcp.models import MCPError, MCPToolResponse


def get_security_patterns(context: str = "all", min_severity: str = "LOW") -> Dict[str, Any]:
    """Get OWASP LLM patterns for AI analysis.

    Args:
        context: Filter context - "all" or specific like "prompt_injection",
                "excessive_agency", "data_exposure", "rate_limiting"
        min_severity: Minimum severity - "LOW", "MEDIUM", "HIGH", "CRITICAL"

    Returns:
        MCPToolResponse with patterns data or error.
    """
    try:
        loader = get_kb_loader()
        patterns = loader.get_security_patterns(context=context, min_severity=min_severity)

        return MCPToolResponse(
            success=True,
            data={
                "patterns": patterns,
                "total_count": len(patterns),
                "context": context,
                "min_severity": min_severity,
                "instructions": (
                    "Use these patterns to analyze the target code for security vulnerabilities. "
                    "Each pattern includes detection indicators, impact assessment, and remediation guidance. "
                    "Cross-reference findings with OWASP LLM Top 10 controls for comprehensive analysis."
                ),
            },
        ).model_dump()
    except Exception as e:
        return MCPToolResponse(
            success=False,
            error=MCPError(
                code="KB_LOAD_ERROR",
                message=f"Failed to load security patterns: {str(e)}",
                suggestion="Check that KB files exist and are valid YAML.",
            ).model_dump(),
        ).model_dump()


def get_owasp_control(control_id: str) -> Dict[str, Any]:
    """Get detailed info for specific OWASP control.

    Args:
        control_id: OWASP control ID (e.g., "LLM01", "LLM08")

    Returns:
        MCPToolResponse with control data or error.
    """
    try:
        loader = get_kb_loader()
        control = loader.get_owasp_control(control_id)

        if not control:
            available_controls = loader.get_all_owasp_controls()
            return MCPToolResponse(
                success=False,
                error=MCPError(
                    code="CONTROL_NOT_FOUND",
                    message=f"OWASP control '{control_id}' not found.",
                    suggestion=f"Available controls: {', '.join(available_controls)}",
                ).model_dump(),
            ).model_dump()

        return MCPToolResponse(
            success=True,
            data={
                "control": control,
                "control_id": control_id,
                "instructions": (
                    "Use this control information to understand the security vulnerability pattern. "
                    "Review the description, detection indicators, and prevention strategies. "
                    "Apply the mitigation techniques when analyzing or fixing code."
                ),
            },
        ).model_dump()
    except Exception as e:
        return MCPToolResponse(
            success=False,
            error=MCPError(
                code="KB_LOAD_ERROR",
                message=f"Failed to load OWASP control: {str(e)}",
                suggestion="Check that KB files exist and are valid YAML.",
            ).model_dump(),
        ).model_dump()


def get_fix_template(finding_type: str) -> Dict[str, Any]:
    """Get remediation template for finding type.

    Args:
        finding_type: Type of finding (e.g., "PROMPT_INJECTION", "RATE_LIMIT")

    Returns:
        MCPToolResponse with fix template or error.
    """
    try:
        loader = get_kb_loader()
        template = loader.get_fix_template(finding_type)

        if not template:
            available_types = loader.get_all_fix_types()
            return MCPToolResponse(
                success=False,
                error=MCPError(
                    code="TEMPLATE_NOT_FOUND",
                    message=f"Fix template for '{finding_type}' not found.",
                    suggestion=f"Available templates: {', '.join(available_types)}",
                ).model_dump(),
            ).model_dump()

        return MCPToolResponse(
            success=True,
            data={
                "template": template,
                "finding_type": finding_type,
                "instructions": (
                    "Apply this fix pattern to the vulnerable code. "
                    "Review the 'before_pattern' to identify the issue, then implement the 'after_pattern'. "
                    "Follow the application guidance step-by-step, and verify the fix using the verification checklist."
                ),
            },
        ).model_dump()
    except Exception as e:
        return MCPToolResponse(
            success=False,
            error=MCPError(
                code="KB_LOAD_ERROR",
                message=f"Failed to load fix template: {str(e)}",
                suggestion="Check that KB files exist and are valid YAML.",
            ).model_dump(),
        ).model_dump()
