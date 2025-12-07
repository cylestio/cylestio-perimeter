"""Tests for knowledge MCP tools."""
import pytest

from .knowledge import get_fix_template, get_owasp_control, get_security_patterns


class TestGetSecurityPatterns:
    """Tests for get_security_patterns function."""

    def test_get_all_patterns(self):
        """Test getting all security patterns."""
        result = get_security_patterns()

        assert result["success"] is True
        assert "data" in result
        assert "patterns" in result["data"]
        assert "total_count" in result["data"]
        assert result["data"]["total_count"] > 0
        assert result["data"]["context"] == "all"
        assert result["data"]["min_severity"] == "LOW"
        assert "instructions" in result["data"]

        # Verify patterns structure
        patterns = result["data"]["patterns"]
        assert isinstance(patterns, dict)
        assert len(patterns) > 0

        # Check that patterns contain expected controls
        assert "LLM01" in patterns or "LLM06" in patterns or "LLM08" in patterns

    def test_filter_by_context_prompt_injection(self):
        """Test filtering patterns by prompt_injection context."""
        result = get_security_patterns(context="prompt_injection")

        assert result["success"] is True
        patterns = result["data"]["patterns"]

        # Should only contain LLM01
        assert "LLM01" in patterns
        assert patterns["LLM01"]["name"] == "Prompt Injection"
        assert result["data"]["context"] == "prompt_injection"

    def test_filter_by_context_data_exposure(self):
        """Test filtering patterns by data_exposure context."""
        result = get_security_patterns(context="data_exposure")

        assert result["success"] is True
        patterns = result["data"]["patterns"]

        # Should only contain LLM06
        assert "LLM06" in patterns
        assert patterns["LLM06"]["name"] == "Sensitive Information Disclosure"

    def test_filter_by_context_excessive_agency(self):
        """Test filtering patterns by excessive_agency context."""
        result = get_security_patterns(context="excessive_agency")

        assert result["success"] is True
        patterns = result["data"]["patterns"]

        # Should only contain LLM08
        assert "LLM08" in patterns
        assert patterns["LLM08"]["name"] == "Excessive Agency"

    def test_filter_by_severity_high(self):
        """Test filtering patterns by HIGH severity."""
        result = get_security_patterns(min_severity="HIGH")

        assert result["success"] is True
        patterns = result["data"]["patterns"]

        # All returned patterns should be HIGH or CRITICAL
        for pattern in patterns.values():
            severity = pattern.get("severity", "").upper()
            assert severity in ["HIGH", "CRITICAL"]

    def test_filter_by_severity_critical(self):
        """Test filtering patterns by CRITICAL severity."""
        result = get_security_patterns(min_severity="CRITICAL")

        assert result["success"] is True
        patterns = result["data"]["patterns"]

        # All returned patterns should be CRITICAL
        for pattern in patterns.values():
            assert pattern.get("severity", "").upper() == "CRITICAL"

    def test_filter_by_context_and_severity(self):
        """Test filtering by both context and severity."""
        result = get_security_patterns(
            context="prompt_injection", min_severity="CRITICAL"
        )

        assert result["success"] is True
        patterns = result["data"]["patterns"]

        # Should contain LLM01 if it's CRITICAL severity
        if patterns:
            assert "LLM01" in patterns
            assert patterns["LLM01"]["severity"].upper() == "CRITICAL"


class TestGetOwaspControl:
    """Tests for get_owasp_control function."""

    def test_get_valid_control_llm01(self):
        """Test getting LLM01 control."""
        result = get_owasp_control("LLM01")

        assert result["success"] is True
        assert "data" in result
        assert "control" in result["data"]
        assert result["data"]["control_id"] == "LLM01"
        assert "instructions" in result["data"]

        # Verify control structure
        control = result["data"]["control"]
        assert control["name"] == "Prompt Injection"
        assert control["severity"] == "CRITICAL"
        assert "description" in control
        assert "what_to_look_for" in control
        assert "code_indicators" in control
        assert "remediation" in control

    def test_get_valid_control_llm06(self):
        """Test getting LLM06 control."""
        result = get_owasp_control("LLM06")

        assert result["success"] is True
        control = result["data"]["control"]
        assert control["name"] == "Sensitive Information Disclosure"
        assert control["severity"] == "HIGH"

    def test_get_valid_control_llm08(self):
        """Test getting LLM08 control."""
        result = get_owasp_control("LLM08")

        assert result["success"] is True
        control = result["data"]["control"]
        assert control["name"] == "Excessive Agency"
        assert control["severity"] == "CRITICAL"

    def test_get_invalid_control(self):
        """Test getting invalid control ID."""
        result = get_owasp_control("INVALID")

        assert result["success"] is False
        assert "error" in result
        error = result["error"]
        assert error["code"] == "CONTROL_NOT_FOUND"
        assert "INVALID" in error["message"]
        assert "suggestion" in error
        # Should suggest available controls
        assert "LLM" in error["suggestion"]

    def test_get_nonexistent_control(self):
        """Test getting control that doesn't exist."""
        result = get_owasp_control("LLM99")

        assert result["success"] is False
        assert result["error"]["code"] == "CONTROL_NOT_FOUND"


class TestGetFixTemplate:
    """Tests for get_fix_template function."""

    def test_get_prompt_injection_template(self):
        """Test getting PROMPT_INJECTION fix template."""
        result = get_fix_template("PROMPT_INJECTION")

        assert result["success"] is True
        assert "data" in result
        assert "template" in result["data"]
        assert result["data"]["finding_type"] == "PROMPT_INJECTION"
        assert "instructions" in result["data"]

        # Verify template structure
        template = result["data"]["template"]
        assert template["owasp_control"] == "LLM01"
        assert "description" in template
        assert "before_pattern" in template
        assert "after_pattern" in template
        assert "application_guidance" in template
        assert "verification" in template

        # Verify before/after patterns contain code
        assert "def handle_message" in template["before_pattern"]
        assert "def sanitize_input" in template["after_pattern"]

    def test_get_data_exposure_template(self):
        """Test getting DATA_EXPOSURE fix template."""
        result = get_fix_template("DATA_EXPOSURE")

        assert result["success"] is True
        template = result["data"]["template"]
        assert template["owasp_control"] == "LLM06"
        assert "presidio" in template["after_pattern"].lower()

    def test_get_excessive_agency_template(self):
        """Test getting EXCESSIVE_AGENCY fix template."""
        result = get_fix_template("EXCESSIVE_AGENCY")

        assert result["success"] is True
        template = result["data"]["template"]
        assert template["owasp_control"] == "LLM08"
        assert "ALLOWED_TOOLS" in template["after_pattern"]
        assert "REQUIRES_CONFIRMATION" in template["after_pattern"]

    def test_get_rate_limit_template(self):
        """Test getting RATE_LIMIT fix template."""
        result = get_fix_template("RATE_LIMIT")

        assert result["success"] is True
        template = result["data"]["template"]
        assert template["owasp_control"] == "LLM04"
        assert "RateLimiter" in template["after_pattern"]

    def test_get_invalid_template(self):
        """Test getting invalid template type."""
        result = get_fix_template("INVALID_TYPE")

        assert result["success"] is False
        assert "error" in result
        error = result["error"]
        assert error["code"] == "TEMPLATE_NOT_FOUND"
        assert "INVALID_TYPE" in error["message"]
        assert "suggestion" in error
        # Should suggest available templates
        assert "PROMPT_INJECTION" in error["suggestion"] or "DATA_EXPOSURE" in error["suggestion"]

    def test_template_guidance_is_actionable(self):
        """Test that templates include actionable guidance."""
        result = get_fix_template("PROMPT_INJECTION")

        assert result["success"] is True
        template = result["data"]["template"]

        # Application guidance should be a list of steps
        assert isinstance(template["application_guidance"], list)
        assert len(template["application_guidance"]) > 0

        # Verification should be a checklist
        assert isinstance(template["verification"], list)
        assert len(template["verification"]) > 0


class TestErrorHandling:
    """Tests for error handling in knowledge tools."""

    def test_patterns_includes_helpful_instructions(self):
        """Test that successful responses include helpful instructions."""
        result = get_security_patterns()

        assert result["success"] is True
        instructions = result["data"]["instructions"]
        assert len(instructions) > 0
        assert "analyze" in instructions.lower() or "use" in instructions.lower()

    def test_control_includes_helpful_instructions(self):
        """Test that control responses include helpful instructions."""
        result = get_owasp_control("LLM01")

        assert result["success"] is True
        instructions = result["data"]["instructions"]
        assert len(instructions) > 0
        assert any(
            word in instructions.lower()
            for word in ["use", "understand", "review", "apply"]
        )

    def test_template_includes_helpful_instructions(self):
        """Test that template responses include helpful instructions."""
        result = get_fix_template("PROMPT_INJECTION")

        assert result["success"] is True
        instructions = result["data"]["instructions"]
        assert len(instructions) > 0
        assert "apply" in instructions.lower() or "fix" in instructions.lower()
