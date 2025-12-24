"""Security assessment engine - generates security report with categorized checks."""
import re
import statistics
import uuid
from datetime import datetime, timezone
from typing import List, Optional

from .models import (
    AssessmentCategory,
    AssessmentCheck,
    BehavioralAnalysisResult,
    PIIAnalysisResult,
    SecurityReport,
)
from ..store.store import SessionData


# Universal safety bounds (section 4.2, H3)
UNIVERSAL_BOUNDS = {
    'max_tokens_per_session': 50000,
    'max_tool_calls_per_session': 50
}

# Framework mappings for all 16 security checks
# Maps check_id → (owasp_llm, owasp_llm_name, soc2_controls, cwe, mitre, cvss_critical, cvss_warning)
FRAMEWORK_MAPPINGS = {
    # Resource Management checks
    "RESOURCE_001_TOKEN_BOUNDS": {
        "owasp_llm": "LLM08",
        "owasp_llm_name": "Excessive Agency",
        "soc2_controls": ["CC6.1", "CC6.8"],
        "cwe": "CWE-770",
        "mitre": "T1499",
        "cvss_critical": 7.5,
        "cvss_warning": 4.5,
    },
    "RESOURCE_002_TOOL_CALL_BOUNDS": {
        "owasp_llm": "LLM08",
        "owasp_llm_name": "Excessive Agency",
        "soc2_controls": ["CC6.1", "CC6.8"],
        "cwe": "CWE-770",
        "mitre": "T1499",
        "cvss_critical": 7.5,
        "cvss_warning": 4.5,
    },
    "RESOURCE_004_TOKEN_VARIANCE": {
        "owasp_llm": None,
        "owasp_llm_name": None,
        "soc2_controls": ["A1.2"],
        "cwe": None,
        "mitre": None,
        "cvss_critical": None,
        "cvss_warning": 3.0,
    },
    "RESOURCE_005_TOOL_VARIANCE": {
        "owasp_llm": None,
        "owasp_llm_name": None,
        "soc2_controls": ["A1.2"],
        "cwe": None,
        "mitre": None,
        "cvss_critical": None,
        "cvss_warning": 3.0,
    },
    "RESOURCE_006_DURATION_VARIANCE": {
        "owasp_llm": None,
        "owasp_llm_name": None,
        "soc2_controls": ["A1.2"],
        "cwe": None,
        "mitre": None,
        "cvss_critical": None,
        "cvss_warning": 3.0,
    },
    # Environment & Supply Chain checks
    "ENV_001_CONSISTENT_MODEL": {
        "owasp_llm": "LLM05",
        "owasp_llm_name": "Supply Chain Vulnerabilities",
        "soc2_controls": ["CC6.7"],
        "cwe": "CWE-1104",
        "mitre": "T1195",
        "cvss_critical": 6.5,
        "cvss_warning": 4.0,
    },
    "ENV_002_AVG_TOOLS_COVERAGE": {
        "owasp_llm": None,
        "owasp_llm_name": None,
        "soc2_controls": ["CC7.1"],
        "cwe": None,
        "mitre": None,
        "cvss_critical": None,
        "cvss_warning": 2.5,
    },
    "ENV_003_UNUSED_TOOLS": {
        "owasp_llm": "LLM08",
        "owasp_llm_name": "Excessive Agency",
        "soc2_controls": ["CC6.2"],
        "cwe": None,
        "mitre": None,
        "cvss_critical": None,
        "cvss_warning": 3.5,
    },
    # Behavioral Stability checks
    "BEHAV_001_STABILITY_SCORE": {
        "owasp_llm": "LLM08",
        "owasp_llm_name": "Excessive Agency",
        "soc2_controls": ["CC7.2"],
        "cwe": None,
        "mitre": None,
        "cvss_critical": 6.0,
        "cvss_warning": 4.0,
    },
    "BEHAV_002_OUTLIER_RATE": {
        "owasp_llm": "LLM08",
        "owasp_llm_name": "Excessive Agency",
        "soc2_controls": ["CC7.2"],
        "cwe": None,
        "mitre": None,
        "cvss_critical": 6.0,
        "cvss_warning": 4.0,
    },
    "BEHAV_003_CLUSTER_FORMATION": {
        "owasp_llm": None,
        "owasp_llm_name": None,
        "soc2_controls": ["CC7.2"],
        "cwe": None,
        "mitre": None,
        "cvss_critical": 5.0,
        "cvss_warning": 3.0,
    },
    "BEHAV_004_PREDICTABILITY": {
        "owasp_llm": None,
        "owasp_llm_name": None,
        "soc2_controls": ["CC7.2"],
        "cwe": None,
        "mitre": None,
        "cvss_critical": None,
        "cvss_warning": 3.5,
    },
    "BEHAV_005_UNCERTAINTY_THRESHOLD": {
        "owasp_llm": None,
        "owasp_llm_name": None,
        "soc2_controls": ["CC7.2"],
        "cwe": None,
        "mitre": None,
        "cvss_critical": None,
        "cvss_warning": 3.5,
    },
    # Privacy & PII Compliance checks
    "PII_001_DETECTION": {
        "owasp_llm": "LLM06",
        "owasp_llm_name": "Sensitive Information Disclosure",
        "soc2_controls": ["PI1.1"],
        "cwe": "CWE-359",
        "mitre": "T1530",
        "cvss_critical": 8.0,
        "cvss_warning": 5.0,
    },
    "PII_002_SYSTEM_PROMPT": {
        "owasp_llm": "LLM06",
        "owasp_llm_name": "Sensitive Information Disclosure",
        "soc2_controls": ["CC6.5"],
        "cwe": "CWE-359",
        "mitre": None,
        "cvss_critical": None,
        "cvss_warning": 5.5,
    },
    "PII_003_EXPOSURE_RATE": {
        "owasp_llm": "LLM06",
        "owasp_llm_name": "Sensitive Information Disclosure",
        "soc2_controls": ["PI1.1"],
        "cwe": "CWE-359",
        "mitre": None,
        "cvss_critical": None,
        "cvss_warning": 5.0,
    },
}


# ============================================================================
# DYNAMIC CHECK DEFINITIONS - Single Source of Truth
# These definitions contain all metadata for dynamic security checks.
# Frontend should fetch these from /api/security-check-definitions endpoint.
# ============================================================================

DYNAMIC_CATEGORY_DEFINITIONS = {
    "RESOURCE_MANAGEMENT": {
        "name": "Resource Management",
        "description": "Summarizes how the agent uses tokens, time, and tools against policy.",
        "icon": "📊",
        "order": 1,
    },
    "ENVIRONMENT": {
        "name": "Environment & Supply Chain",
        "description": "Examines model version pinning and tool adoption health.",
        "icon": "⚙️",
        "order": 2,
    },
    "BEHAVIORAL": {
        "name": "Behavioral Stability",
        "description": "Summarizes behavioral consistency, predictability, and remaining variance.",
        "icon": "🔧",
        "order": 3,
    },
    "PRIVACY_COMPLIANCE": {
        "name": "Privacy & PII Compliance",
        "description": "Detects and reports PII exposure in messages and prompts.",
        "icon": "🔒",
        "order": 4,
    },
}

DYNAMIC_CHECK_DEFINITIONS = {
    # ---- RESOURCE_MANAGEMENT ----
    "RESOURCE_001_TOKEN_BOUNDS": {
        "category_id": "RESOURCE_MANAGEMENT",
        "name": "Token Budget Usage",
        "description": "Validates that per-session token usage stays within the allowed range.",
        "recommendations": [
            f"Enforce {UNIVERSAL_BOUNDS['max_tokens_per_session']} token limit per session",
            "Monitor token consumption patterns across sessions",
            "Implement circuit breakers for runaway token usage",
        ],
    },
    "RESOURCE_002_TOOL_CALL_BOUNDS": {
        "category_id": "RESOURCE_MANAGEMENT",
        "name": "Tool Call Volume",
        "description": "Validates that tool invocations remain within expected limits per session.",
        "recommendations": [
            f"Enforce {UNIVERSAL_BOUNDS['max_tool_calls_per_session']} tool call limit with circuit breakers",
            "Add rate limiting for tool invocations",
            "Monitor for tool call loops",
        ],
    },
    "RESOURCE_004_TOKEN_VARIANCE": {
        "category_id": "RESOURCE_MANAGEMENT",
        "name": "Token Consistency Across Sessions",
        "description": "Assesses how consistently the agent consumes its token quota across sessions.",
        "recommendations": [
            "Implement internal token quotas to reduce variance",
            "Review prompt engineering for consistency",
            "Consider adding max token limits to API calls",
        ],
    },
    "RESOURCE_005_TOOL_VARIANCE": {
        "category_id": "RESOURCE_MANAGEMENT",
        "name": "Tool Consistency Across Sessions",
        "description": "Tests whether tool usage stays balanced from session to session.",
        "recommendations": [
            "Implement internal tool usage quotas to reduce variance",
            "Review agent logic for tool selection consistency",
            "Consider caching or batching tool calls",
        ],
    },
    "RESOURCE_006_DURATION_VARIANCE": {
        "category_id": "RESOURCE_MANAGEMENT",
        "name": "Session Duration Consistency",
        "description": "Session duration consistency across runs shows how stable and focused the agent remains.",
        "recommendations": [
            "Implement session duration limits to improve consistency",
            "Review for timeout configurations",
            "Monitor for hanging sessions",
        ],
    },
    # ---- ENVIRONMENT ----
    "ENV_001_CONSISTENT_MODEL": {
        "category_id": "ENVIRONMENT",
        "name": "Pinned Model Usage",
        "description": "Ensures every LLM call pins a specific, versioned model for reproducibility.",
        "recommendations": [
            "Pin model versions with date or semantic version suffixes",
            "Use model aliases that resolve to specific versions",
            "Document model version requirements in configuration",
        ],
    },
    "ENV_002_AVG_TOOLS_COVERAGE": {
        "category_id": "ENVIRONMENT",
        "name": "Session Tool Coverage",
        "description": "Measures how completely each session exercises its available tools to ensure bugs and gaps are not missed.",
        "recommendations": [
            "Add test scenarios that exercise each tool at least once",
            "Review tool definitions for unused capabilities",
            "Consider removing tools that are never used",
        ],
    },
    "ENV_003_UNUSED_TOOLS": {
        "category_id": "ENVIRONMENT",
        "name": "Unused Tools Inventory",
        "description": "Flags provisioned tools that are never exercised across sessions (increases attack surface and maintenance burden if not removed).",
        "recommendations": [
            "Remove unused tools to reduce attack surface",
            "Review tool necessity with agent developers",
            "Document why certain tools are provisioned but not used",
        ],
    },
    # ---- BEHAVIORAL ----
    "BEHAV_001_STABILITY_SCORE": {
        "category_id": "BEHAVIORAL",
        "name": "Behavioral Stability Score",
        "description": "Largest-cluster share × purity; higher means sessions follow a consistent pattern.",
        "recommendations": [
            "Improve system prompt clarity and guardrails",
            "Add behavioral constraints to agent logic",
            "Review and standardize common workflows",
        ],
    },
    "BEHAV_002_OUTLIER_RATE": {
        "category_id": "BEHAVIORAL",
        "name": "Behavioral Outlier Rate",
        "description": "Tracks the share of sessions that diverge from established behavioral patterns.",
        "recommendations": [
            "Investigate outlier sessions for root causes",
            "Add validation checks for unusual input patterns",
            "Implement fallback behaviors for edge cases",
        ],
    },
    "BEHAV_003_CLUSTER_FORMATION": {
        "category_id": "BEHAVIORAL",
        "name": "Behavior Cluster Formation",
        "description": "Verifies that session behaviors group into at least one coherent cluster.",
        "recommendations": [
            "Refactor agent logic to achieve behavioral clustering",
            "Add more sessions to improve statistical significance",
            "Review agent prompts for consistency",
        ],
    },
    "BEHAV_004_PREDICTABILITY": {
        "category_id": "BEHAVIORAL",
        "name": "Behavioral Predictability",
        "description": "Scores how predictable the agent's behavior remains across comparable sessions.",
        "recommendations": [
            "Improve consistency in agent responses",
            "Reduce randomness in decision-making logic",
            "Standardize common interaction patterns",
        ],
    },
    "BEHAV_005_UNCERTAINTY_THRESHOLD": {
        "category_id": "BEHAVIORAL",
        "name": "Behavioral Uncertainty Level",
        "description": "Quantifies the residual uncertainty that remains after assessing behavioral stability.",
        "recommendations": [
            "Implement stricter guardrails for uncertain situations",
            "Add confirmation steps for high-impact actions",
            "Review error handling for edge cases",
        ],
    },
    # ---- PRIVACY_COMPLIANCE ----
    "PII_001_DETECTION": {
        "category_id": "PRIVACY_COMPLIANCE",
        "name": "PII Detection",
        "description": "Scans message content for personally identifiable information across entity types.",
        "recommendations": [
            "Implement PII redaction before sending to LLM",
            "Review data handling policies for sensitive PII",
            "Consider using synthetic data for testing",
        ],
    },
    "PII_002_SYSTEM_PROMPT": {
        "category_id": "PRIVACY_COMPLIANCE",
        "name": "PII in System Prompts",
        "description": "Checks whether system prompts contain PII that may be inadvertently shared.",
        "recommendations": [
            "Review system prompts for inadvertent PII inclusion",
            "System prompts should typically not contain user-specific PII",
            "Use placeholders instead of real data in prompts",
        ],
    },
    "PII_003_EXPOSURE_RATE": {
        "category_id": "PRIVACY_COMPLIANCE",
        "name": "PII Exposure Rate",
        "description": "Measures the proportion of sessions that contain any PII.",
        "recommendations": [
            "Review if all PII is necessary for agent operation",
            "Implement PII minimization strategies",
            "Consider anonymization for non-essential data",
        ],
    },
}


def get_check_definition(check_id: str) -> dict:
    """Get the full definition for a check, including framework mappings.

    Returns combined data from DYNAMIC_CHECK_DEFINITIONS and FRAMEWORK_MAPPINGS.
    """
    base_def = DYNAMIC_CHECK_DEFINITIONS.get(check_id, {}).copy()
    framework = FRAMEWORK_MAPPINGS.get(check_id, {})

    # Merge framework mappings into definition
    base_def.update({
        "owasp_llm": framework.get("owasp_llm"),
        "owasp_llm_name": framework.get("owasp_llm_name"),
        "soc2_controls": framework.get("soc2_controls", []),
        "cwe": framework.get("cwe"),
        "mitre": framework.get("mitre"),
    })

    return base_def


def get_all_check_definitions() -> dict:
    """Get all check definitions with framework mappings merged.

    Returns dict of check_id -> full definition.
    Used by /api/security-check-definitions endpoint.
    """
    result = {}
    for check_id in DYNAMIC_CHECK_DEFINITIONS:
        result[check_id] = get_check_definition(check_id)
    return result


def _apply_framework_mappings(check: AssessmentCheck) -> AssessmentCheck:
    """Apply framework mappings to a check based on its ID and status."""
    mapping = FRAMEWORK_MAPPINGS.get(check.check_id)
    if not mapping:
        return check
    
    # Apply base framework mappings
    check.owasp_llm = mapping.get("owasp_llm")
    check.owasp_llm_name = mapping.get("owasp_llm_name")
    check.soc2_controls = mapping.get("soc2_controls", [])
    check.cwe = mapping.get("cwe")
    check.mitre = mapping.get("mitre")
    
    # Apply CVSS score based on status (only for failed checks)
    if check.status == "critical" and mapping.get("cvss_critical"):
        check.cvss_score = mapping["cvss_critical"]
    elif check.status == "warning" and mapping.get("cvss_warning"):
        check.cvss_score = mapping["cvss_warning"]
    
    return check


# ============================================================================
# CATEGORY: Resource Management
# ============================================================================

def _check_token_bounds(sessions: List[SessionData]) -> AssessmentCheck:
    """Check per-session token limits."""
    violations = []

    for session in sessions:
        if session.total_tokens > UNIVERSAL_BOUNDS['max_tokens_per_session']:
            violations.append({
                'session_id': session.session_id,
                'value': session.total_tokens,
                'limit': UNIVERSAL_BOUNDS['max_tokens_per_session']
            })

    if violations:
        check = AssessmentCheck(
            check_id="RESOURCE_001_TOKEN_BOUNDS",
            category="Resource Management",
            name="Token Budget Usage",
            description="Validates that a per-session token usage stays within the allowed range.",
            status="critical",
            value=f"{len(violations)} violation{'s' if len(violations) != 1 else ''}",
            evidence={'violations': violations},
            recommendations=[
                f"Enforce {UNIVERSAL_BOUNDS['max_tokens_per_session']} token limit per session"
            ]
        )
        return _apply_framework_mappings(check)

    max_tokens = max((s.total_tokens for s in sessions), default=0)
    check = AssessmentCheck(
        check_id="RESOURCE_001_TOKEN_BOUNDS",
        category="Resource Management",
        name="Token Budget Usage",
        description="Validates that per-session token usage stays within the allowed range.",
        status="passed",
        value=f"{max_tokens:,} max tokens",
        evidence={'max_tokens': max_tokens}
    )
    return _apply_framework_mappings(check)


def _check_tool_call_bounds(sessions: List[SessionData]) -> AssessmentCheck:
    """Check per-session tool call limits."""
    violations = []

    for session in sessions:
        if session.tool_uses > UNIVERSAL_BOUNDS['max_tool_calls_per_session']:
            violations.append({
                'session_id': session.session_id,
                'value': session.tool_uses,
                'limit': UNIVERSAL_BOUNDS['max_tool_calls_per_session']
            })

    if violations:
        check = AssessmentCheck(
            check_id="RESOURCE_002_TOOL_CALL_BOUNDS",
            category="Resource Management",
            name="Tool Call Volume",
            description="Validates that tool invocations remain within expected limits per session.",
            status="critical",
            value=f"{len(violations)} violation{'s' if len(violations) != 1 else ''}",
            evidence={'violations': violations},
            recommendations=[
                f"Enforce {UNIVERSAL_BOUNDS['max_tool_calls_per_session']} tool call limit with circuit breakers"
            ]
        )
        return _apply_framework_mappings(check)

    max_calls = max((s.tool_uses for s in sessions), default=0)
    check = AssessmentCheck(
        check_id="RESOURCE_002_TOOL_CALL_BOUNDS",
        category="Resource Management",
        name="Tool Call Volume",
        description="Validates that tool invocations remain within expected limits per session.",
        status="passed",
        value=f"{max_calls} max calls",
        evidence={'max_tool_calls': max_calls}
    )
    return _apply_framework_mappings(check)


def _check_token_variance(sessions: List[SessionData]) -> AssessmentCheck:
    """Check token usage variance (indicates proper quotas)."""
    tokens = [s.total_tokens for s in sessions if s.total_tokens > 0]

    if not tokens or len(tokens) < 2:
        check = AssessmentCheck(
            check_id="RESOURCE_004_TOKEN_VARIANCE",
            category="Resource Management",
            name="Token Consistency Across Sessions",
            description="Assesses how consistently the agent consumes its token quota across sessions.",
            status="passed",
            value="Insufficient data",
            evidence={'reason': 'insufficient_data'}
        )
        return _apply_framework_mappings(check)

    mean_tokens = statistics.mean(tokens)
    std_tokens = statistics.stdev(tokens)
    token_cv = std_tokens / mean_tokens if mean_tokens > 0 else 0

    if token_cv > 0.7:
        check = AssessmentCheck(
            check_id="RESOURCE_004_TOKEN_VARIANCE",
            category="Resource Management",
            name="Token Consistency Across Sessions",
            description="Assesses how consistently the agent consumes its token quota across sessions.",
            status="warning",
            value=f"CV: {round(token_cv * 100)}%",
            evidence={'coefficient_of_variation': round(token_cv, 2)},
            recommendations=[
                "Implement internal token quotas to reduce variance"
            ]
        )
        return _apply_framework_mappings(check)

    check = AssessmentCheck(
        check_id="RESOURCE_004_TOKEN_VARIANCE",
        category="Resource Management",
        name="Token Consistency Across Sessions",
        description="Assesses how consistently the agent consumes its token quota across sessions.",
        status="passed",
        value=f"CV: {round(token_cv * 100)}%",
        evidence={'coefficient_of_variation': round(token_cv, 2)}
    )
    return _apply_framework_mappings(check)


def _check_tool_variance(sessions: List[SessionData]) -> AssessmentCheck:
    """Check tool usage variance (indicates proper limits)."""
    tools = [s.tool_uses for s in sessions if s.tool_uses > 0]

    if not tools or len(tools) < 2:
        check = AssessmentCheck(
            check_id="RESOURCE_005_TOOL_VARIANCE",
            category="Resource Management",
            name="Tool Consistency Across Sessions",
            description="Tests whether tool usage stays balanced from session to session.",
            status="passed",
            value="Insufficient data",
            evidence={'reason': 'insufficient_data'}
        )
        return _apply_framework_mappings(check)

    mean_tools = statistics.mean(tools)
    std_tools = statistics.stdev(tools)
    tool_cv = std_tools / mean_tools if mean_tools > 0 else 0

    if tool_cv > 0.7:
        check = AssessmentCheck(
            check_id="RESOURCE_005_TOOL_VARIANCE",
            category="Resource Management",
            name="Tool Consistency Across Sessions",
            description="Tests whether tool usage stays balanced from session to session.",
            status="warning",
            value=f"CV: {round(tool_cv * 100)}%",
            evidence={'coefficient_of_variation': round(tool_cv, 2)},
            recommendations=[
                "Implement internal tool usage quotas to reduce variance"
            ]
        )
        return _apply_framework_mappings(check)

    check = AssessmentCheck(
        check_id="RESOURCE_005_TOOL_VARIANCE",
        category="Resource Management",
        name="Tool Consistency Across Sessions",
        description="Tests whether tool usage stays balanced from session to session.",
        status="passed",
        value=f"CV: {round(tool_cv * 100)}%",
        evidence={'coefficient_of_variation': round(tool_cv, 2)}
    )
    return _apply_framework_mappings(check)


def _check_duration_variance(sessions: List[SessionData]) -> AssessmentCheck:
    """Check session duration variance (indicates proper consistency)."""
    durations = [s.duration_minutes for s in sessions if s.duration_minutes > 0]

    if not durations or len(durations) < 2:
        check = AssessmentCheck(
            check_id="RESOURCE_006_DURATION_VARIANCE",
            category="Resource Management",
            name="Session Duration Consistency",
            description="Session duration consistency across runs shows how stable and focused the agent remains.",
            status="passed",
            value="Insufficient data",
            evidence={'reason': 'insufficient_data'}
        )
        return _apply_framework_mappings(check)

    mean_duration = statistics.mean(durations)
    std_duration = statistics.stdev(durations)
    duration_cv = std_duration / mean_duration if mean_duration > 0 else 0

    if duration_cv > 0.7:
        check = AssessmentCheck(
            check_id="RESOURCE_006_DURATION_VARIANCE",
            category="Resource Management",
            name="Session Duration Consistency",
            description="Session duration consistency across runs shows how stable and focused the agent remains.",
            status="warning",
            value=f"CV: {round(duration_cv * 100)}%",
            evidence={'coefficient_of_variation': round(duration_cv, 2)},
            recommendations=[
                "Implement session duration limits to improve consistency"
            ]
        )
        return _apply_framework_mappings(check)

    check = AssessmentCheck(
        check_id="RESOURCE_006_DURATION_VARIANCE",
        category="Resource Management",
        name="Session Duration Consistency",
        description="Session duration consistency across runs shows how stable and focused the agent remains.",
        status="passed",
        value=f"CV: {round(duration_cv * 100)}%",
        evidence={'coefficient_of_variation': round(duration_cv, 2)}
    )
    return _apply_framework_mappings(check)


def check_resource_management(sessions: List[SessionData]) -> AssessmentCategory:
    """Run all resource management checks."""
    # Compute metrics
    metrics = {}

    # Average token used
    tokens = [s.total_tokens for s in sessions if s.total_tokens > 0]
    metrics['avg_tokens'] = round(statistics.mean(tokens), 0) if tokens else 0

    # Average session duration
    durations = [s.duration_minutes for s in sessions if s.duration_minutes > 0]
    metrics['avg_duration_minutes'] = round(statistics.mean(durations), 1) if durations else 0.0

    # Run checks (ordered as requested by user)
    checks = [
        _check_duration_variance(sessions),
        _check_tool_variance(sessions),
        _check_token_variance(sessions),
        _check_token_bounds(sessions),
        _check_tool_call_bounds(sessions)
    ]

    return AssessmentCategory(
        category_id="RESOURCE_MANAGEMENT",
        category_name="Resource Management",
        description="Summarizes how the agent uses tokens, time, and tools against policy.",
        checks=checks,
        metrics=metrics
    )


# ============================================================================
# CATEGORY: Environment & Supply Chain
# ============================================================================

def _check_consistent_model_usage(sessions: List[SessionData]) -> AssessmentCheck:
    """Check that all LLM models use fixed versions."""
    all_models = []

    for session in sessions:
        for event in session.events:
            if 'llm' in event.name.value.lower():
                model = event.attributes.get('llm.model')
                if model:
                    all_models.append(model)

    if not all_models:
        check = AssessmentCheck(
            check_id="ENV_001_CONSISTENT_MODEL",
            category="Environment & Supply Chain",
            name="Pinned Model Usage",
            description="Ensures every LLM call pins a specific, versioned model for reproducibility.",
            status="passed",
            value="No models detected",
            evidence={'reason': 'no_models_detected'}
        )
        return _apply_framework_mappings(check)

    unpinned_models = []
    for model in set(all_models):
        # Check for version suffix: -0613, -20240229, -v1.5, :20240229
        has_date = re.search(r'[:\-](\d{8}|\d{4})$', model)
        has_semantic = re.search(r'-v?\d+(\.\d+)*$', model)

        if not has_date and not has_semantic:
            unpinned_models.append(model)

    if unpinned_models:
        check = AssessmentCheck(
            check_id="ENV_001_CONSISTENT_MODEL",
            category="Environment & Supply Chain",
            name="Pinned Model Usage",
            description="Ensures every LLM call pins a specific, versioned model for reproducibility.",
            status="critical",
            value=f"{len(unpinned_models)} unpinned model{'s' if len(unpinned_models) != 1 else ''}",
            evidence={'unpinned_models': unpinned_models},
            recommendations=[
                f"Pin model versions: {', '.join(unpinned_models)}"
            ]
        )
        return _apply_framework_mappings(check)

    unique_models = len(set(all_models))
    check = AssessmentCheck(
        check_id="ENV_001_CONSISTENT_MODEL",
        category="Environment & Supply Chain",
        name="Pinned Model Usage",
        description="Ensures every LLM call pins a specific, versioned model for reproducibility.",
        status="passed",
        value=f"{unique_models} pinned model{'s' if unique_models != 1 else ''}",
        evidence={
            'models': list(set(all_models)),
            'all_pinned': True
        }
    )
    return _apply_framework_mappings(check)


def _check_average_tools_coverage(sessions: List[SessionData]) -> AssessmentCheck:
    """Check average per-session tool coverage (should be around 1.0)."""
    if not sessions:
        check = AssessmentCheck(
            check_id="ENV_002_AVG_TOOLS_COVERAGE",
            category="Environment & Supply Chain",
            name="Session Tool Coverage",
            description="Measures how completely each session exercises its available tools to ensure bugs and gaps are not missed.",
            status="passed",
            value="No sessions",
            evidence={'reason': 'no_sessions'}
        )
        return _apply_framework_mappings(check)

    # Calculate per-session coverage rates
    coverage_rates = []
    for session in sessions:
        if len(session.available_tools) > 0:
            used_count = len([tool for tool in session.available_tools if tool in session.tool_usage_details])
            coverage = used_count / len(session.available_tools)
            coverage_rates.append(coverage)

    if not coverage_rates:
        check = AssessmentCheck(
            check_id="ENV_002_AVG_TOOLS_COVERAGE",
            category="Environment & Supply Chain",
            name="Session Tool Coverage",
            description="Measures how completely each session exercises its available tools to ensure bugs and gaps are not missed.",
            status="passed",
            value="No tools available",
            evidence={'reason': 'no_tools_available'}
        )
        return _apply_framework_mappings(check)

    avg_coverage = statistics.mean(coverage_rates)

    # Pass if average coverage >= 0.80 (80%)
    if avg_coverage >= 0.80:
        check = AssessmentCheck(
            check_id="ENV_002_AVG_TOOLS_COVERAGE",
            category="Environment & Supply Chain",
            name="Average Tool Coverage",
            description="Average per-session tool coverage (target ≥ 80%; ideal 100%).",
            status="passed",
            value=f"{round(avg_coverage * 100)}% coverage",
            evidence={
                'avg_coverage': round(avg_coverage, 3),
                'sessions_analyzed': len(coverage_rates),
                'threshold': 0.80
            }
        )
        return _apply_framework_mappings(check)

    check = AssessmentCheck(
        check_id="ENV_002_AVG_TOOLS_COVERAGE",
        category="Environment & Supply Chain",
        name="Session Tool Coverage",
        description="Measures how completely each session exercises its available tools to ensure bugs and gaps are not missed.",
        status="warning",
        value=f"{round(avg_coverage * 100)}% coverage",
        evidence={
            'avg_coverage': round(avg_coverage, 3),
            'sessions_analyzed': len(coverage_rates),
            'threshold': 0.80
        },
        recommendations=[
            f"Improve tool coverage to reach 100% by adding scenarios that call each tool at least once (current: {round(avg_coverage * 100)}%)"
        ]
    )
    return _apply_framework_mappings(check)


def _check_unused_tools(sessions: List[SessionData]) -> AssessmentCheck:
    """Check for globally unused tools."""
    all_available_tools = set()
    all_used_tools = set()

    for session in sessions:
        all_available_tools.update(session.available_tools)
        all_used_tools.update(session.tool_usage_details.keys())

    if not all_available_tools:
        check = AssessmentCheck(
            check_id="ENV_003_UNUSED_TOOLS",
            category="Environment & Supply Chain",
            name="Unused Tools Inventory",
            description="Flags provisioned tools that are never exercised across sessions (increases attack surface and maintenance burden if not removed).",
            status="passed",
            value="No tools available",
            evidence={'reason': 'no_tools_available'}
        )
        return _apply_framework_mappings(check)

    unused_tools = sorted(list(all_available_tools - all_used_tools))

    if not unused_tools:
        check = AssessmentCheck(
            check_id="ENV_003_UNUSED_TOOLS",
            category="Environment & Supply Chain",
            name="Globally Unused Tools",
            description="All available tools should be utilized across sessions",
            status="passed",
            value="All tools used",
            evidence={
                'total_available': len(all_available_tools),
                'total_used': len(all_used_tools),
                'unused_count': 0
            }
        )
        return _apply_framework_mappings(check)

    check = AssessmentCheck(
        check_id="ENV_003_UNUSED_TOOLS",
        category="Environment & Supply Chain",
        name="Unused Tools Inventory",
        description="Flags provisioned tools that are never exercised across sessions (increases attack surface and maintenance burden if not removed).",
        status="warning",
        value=f"{len(unused_tools)} unused tool{'s' if len(unused_tools) != 1 else ''}",
        evidence={
            'unused_tools': unused_tools,
            'total_available': len(all_available_tools),
            'total_used': len(all_used_tools)
        },
        recommendations=[
            f"Consider removing unused tools: {', '.join(unused_tools[:5])}" +
            (f" and {len(unused_tools) - 5} more" if len(unused_tools) > 5 else "")
        ]
    )
    return _apply_framework_mappings(check)


def check_environment(sessions: List[SessionData]) -> AssessmentCategory:
    """Run all environment and supply chain checks."""
    # Compute metrics
    metrics = {}

    # Extract model name(s)
    all_models = set()
    for session in sessions:
        for event in session.events:
            if 'llm' in event.name.value.lower():
                model = event.attributes.get('llm.model')
                if model:
                    all_models.add(model)

    metrics['model'] = ', '.join(sorted(all_models)) if all_models else 'N/A'

    # Calculate average per-session tool coverage
    coverage_rates = []
    for session in sessions:
        if len(session.available_tools) > 0:
            used_count = len([tool for tool in session.available_tools if tool in session.tool_usage_details])
            coverage = used_count / len(session.available_tools)
            coverage_rates.append(coverage)

    metrics['avg_tools_coverage'] = round(statistics.mean(coverage_rates), 2) if coverage_rates else 0.0

    # Average tool calls
    tool_calls = [s.tool_uses for s in sessions]
    metrics['avg_tool_calls'] = round(statistics.mean(tool_calls), 1) if tool_calls else 0.0

    # Run checks
    checks = [
        _check_consistent_model_usage(sessions),
        _check_average_tools_coverage(sessions),
        _check_unused_tools(sessions)
    ]

    return AssessmentCategory(
        category_id="ENVIRONMENT",
        category_name="Environment & Supply Chain",
        description="Examines model version pinning and tool adoption health.",
        checks=checks,
        metrics=metrics
    )


# ============================================================================
# CATEGORY: Behavioral Stability
# ============================================================================

def _check_stability_score(behavioral_result: BehavioralAnalysisResult) -> AssessmentCheck:
    """Check behavioral stability score (≥0.80 required)."""
    score = behavioral_result.stability_score

    if score >= 0.80:
        check = AssessmentCheck(
            check_id="BEHAV_001_STABILITY_SCORE",
            category="Behavioral Stability",
            name="Behavioral Stability Score",
            description="Largest-cluster share × purity; higher means sessions follow a consistent pattern.",
            status="passed",
            value=f"{round(score * 100)}% score",
            evidence={
                'stability_score': round(score, 3),
                'threshold': 0.80,
                'num_clusters': behavioral_result.num_clusters
            }
        )
        return _apply_framework_mappings(check)

    check = AssessmentCheck(
        check_id="BEHAV_001_STABILITY_SCORE",
        category="Behavioral Stability",
        name="Behavioral Stability Score",
        description="Largest-cluster share × purity; higher means sessions follow a consistent pattern.",
        status="critical",
        value=f"{round(score * 100)}% score",
        evidence={
            'stability_score': round(score, 3),
            'shortfall': round(0.80 - score, 3)
        },
        recommendations=[
            f"Improve system prompt and add guardrails (stability: {round(score * 100)}%)"
        ]
    )
    return _apply_framework_mappings(check)


def _check_outlier_rate(behavioral_result: BehavioralAnalysisResult) -> AssessmentCheck:
    """Check outlier rate (<20% required)."""
    outlier_rate = behavioral_result.num_outliers / behavioral_result.total_sessions if behavioral_result.total_sessions > 0 else 0

    if outlier_rate < 0.20:
        check = AssessmentCheck(
            check_id="BEHAV_002_OUTLIER_RATE",
            category="Behavioral Stability",
            name="Behavioral Outlier Rate",
            description="Tracks the share of sessions that diverge from established behavioral patterns.",
            status="passed",
            value=f"{int(outlier_rate * 100)}% outliers",
            evidence={
                'outlier_rate': round(outlier_rate, 3),
                'threshold': 0.20,
                'num_outliers': behavioral_result.num_outliers,
                'total_sessions': behavioral_result.total_sessions
            }
        )
        return _apply_framework_mappings(check)

    check = AssessmentCheck(
        check_id="BEHAV_002_OUTLIER_RATE",
        category="Behavioral Stability",
        name="Behavioral Outlier Rate",
        description="Tracks the share of sessions that diverge from established behavioral patterns.",
        status="critical",
        value=f"{int(outlier_rate * 100)}% outliers",
        evidence={'outlier_rate': round(outlier_rate, 3)},
        recommendations=[
            f"Reduce outlier rate by improving behavioral consistency ({outlier_rate:.1%})"
        ]
    )
    return _apply_framework_mappings(check)


def _check_cluster_formation(behavioral_result: BehavioralAnalysisResult) -> AssessmentCheck:
    """Check that at least 1 behavioral cluster formed."""
    num_clusters = behavioral_result.num_clusters

    if num_clusters >= 1:
        check = AssessmentCheck(
            check_id="BEHAV_003_CLUSTER_FORMATION",
            category="Behavioral Stability",
            name="Behavior Cluster Formation",
            description="Verifies that session behaviors group into at least one coherent cluster.",
            status="passed",
            value=f"{num_clusters} cluster{'s' if num_clusters != 1 else ''}",
            evidence={
                'num_clusters': num_clusters,
                'cluster_diversity': round(behavioral_result.cluster_diversity, 3)
            }
        )
        return _apply_framework_mappings(check)

    check = AssessmentCheck(
        check_id="BEHAV_003_CLUSTER_FORMATION",
        category="Behavioral Stability",
        name="Behavior Cluster Formation",
        description="Verifies that session behaviors group into at least one coherent cluster.",
        status="critical",
        value="0 clusters",
        evidence={'num_clusters': 0},
        recommendations=[
            "Refactor agent logic to achieve behavioral clustering"
        ]
    )
    return _apply_framework_mappings(check)


def _check_predictability(behavioral_result: BehavioralAnalysisResult) -> AssessmentCheck:
    """Check predictability score."""
    score = behavioral_result.predictability_score

    # Predictability threshold is informational (warning at 0.60)
    if score >= 0.60:
        check = AssessmentCheck(
            check_id="BEHAV_004_PREDICTABILITY",
            category="Behavioral Stability",
            name="Behavioral Predictability",
            description="Scores how predictable the agent's behavior remains across comparable sessions.",
            status="passed",
            value=f"{round(score * 100)}% score",
            evidence={'predictability_score': round(score, 3)}
        )
        return _apply_framework_mappings(check)

    check = AssessmentCheck(
        check_id="BEHAV_004_PREDICTABILITY",
        category="Behavioral Stability",
        name="Behavioral Predictability",
        description="Scores how predictable the agent's behavior remains across comparable sessions.",
        status="warning",
        value=f"{round(score * 100)}% score",
        evidence={'predictability_score': round(score, 3)},
        recommendations=[
            f"Improve consistency in agent responses (predictability: {round(score * 100)}%)"
        ]
    )
    return _apply_framework_mappings(check)


def check_behavioral_stability(
    behavioral_result: BehavioralAnalysisResult,
    sessions: List[SessionData]
) -> AssessmentCategory:
    """Run all behavioral stability checks.

    Note: When no clusters form (num_clusters = 0), only the cluster_formation check
    is relevant. Stability, outlier rate, predictability, and uncertainty scores are
    meaningless without cluster formation, so we skip those checks.
    """
    checks = []

    # Cluster formation is always checked
    cluster_formation_check = _check_cluster_formation(behavioral_result)
    checks.append(cluster_formation_check)

    # Only run other checks if at least one cluster formed
    if behavioral_result.num_clusters >= 1:
        checks.append(_check_stability_score(behavioral_result))
        checks.append(_check_outlier_rate(behavioral_result))
        checks.append(_check_predictability(behavioral_result))
        checks.append(_check_uncertainty_threshold(behavioral_result, sessions))

    return AssessmentCategory(
        category_id="BEHAVIORAL",
        category_name="Behavioral Stability",
        description="Summarizes behavioral consistency, predictability, and remaining variance.",
        checks=checks
    )


def _check_uncertainty_threshold(
    behavioral_result: BehavioralAnalysisResult,
    sessions: List[SessionData]
) -> AssessmentCheck:
    """Check behavioral uncertainty threshold."""
    uncertainty = 1.0 - behavioral_result.stability_score

    if uncertainty <= 0.25:
        check = AssessmentCheck(
            check_id="BEHAV_005_UNCERTAINTY_THRESHOLD",
            category="Behavioral Stability",
            name="Behavioral Uncertainty Level",
            description="Quantifies the residual uncertainty that remains after assessing behavioral stability.",
            status="passed",
            value=f"{round(uncertainty * 100)}% uncertainty",
            evidence={
                'uncertainty': round(uncertainty, 3),
                'threshold': 0.25,
                'stability_score': behavioral_result.stability_score
            }
        )
        return _apply_framework_mappings(check)

    check = AssessmentCheck(
        check_id="BEHAV_005_UNCERTAINTY_THRESHOLD",
        category="Behavioral Stability",
        name="Behavioral Uncertainty Level",
        description="Quantifies the residual uncertainty that remains after assessing behavioral stability.",
        status="warning",
        value=f"{round(uncertainty * 100)}% uncertainty",
        evidence={'uncertainty': round(uncertainty, 3)},
        recommendations=[
            f"Implement stricter guardrails (uncertainty: {round(uncertainty * 100)}%)"
        ]
    )
    return _apply_framework_mappings(check)


# ============================================================================
# CATEGORY: Privacy & PII Compliance
# ============================================================================

def _check_pii_detection(pii_result: PIIAnalysisResult) -> AssessmentCheck:
    """Check for PII detection across all sessions."""
    if pii_result.total_findings == 0:
        check = AssessmentCheck(
            check_id="PII_001_DETECTION",
            category="Privacy & PII Compliance",
            name="PII Detection",
            description="Scans message content for personally identifiable information across entity types.",
            status="passed",
            value="No PII detected",
            evidence={
                'total_findings': 0,
                'sessions_analyzed': pii_result.sessions_with_pii + pii_result.sessions_without_pii
            }
        )
        return _apply_framework_mappings(check)

    # Critical if high-confidence sensitive PII found
    sensitive_types = {"US_SSN", "CREDIT_CARD", "MEDICAL_LICENSE", "US_PASSPORT", "US_BANK_NUMBER"}
    high_conf_sensitive = [
        finding for finding in pii_result.detailed_findings
        if finding.score >= 0.8 and finding.entity_type in sensitive_types
    ]

    if high_conf_sensitive:
        check = AssessmentCheck(
            check_id="PII_001_DETECTION",
            category="Privacy & PII Compliance",
            name="PII Detection",
            description="Scans message content for personally identifiable information across entity types.",
            status="critical",
            value=f"{pii_result.total_findings} findings ({pii_result.high_confidence_count} high-confidence)",
            evidence={
                'total_findings': pii_result.total_findings,
                'high_confidence_count': pii_result.high_confidence_count,
                'sensitive_types_found': list(set(f.entity_type for f in high_conf_sensitive)),
                'findings_by_type': pii_result.findings_by_type,
                'findings_by_session': pii_result.findings_by_session,
                'detailed_findings': [
                    {
                        'entity_type': f.entity_type,
                        'score': round(f.score, 3),
                        'session_id': f.session_id,
                        'event_location': f.event_location,
                        'text': f.text[:50] + '...' if len(f.text) > 50 else f.text
                    }
                    for f in pii_result.detailed_findings[:20]  # Limit to 20 for evidence
                ]
            },
            recommendations=[
                "Implement PII redaction before sending to LLM",
                "Review data handling policies for sensitive PII",
                f"Found {len(high_conf_sensitive)} high-confidence sensitive PII items"
            ]
        )
        return _apply_framework_mappings(check)

    # Warning if medium-confidence PII or many findings
    if pii_result.high_confidence_count > 0 or pii_result.medium_confidence_count > 10:
        check = AssessmentCheck(
            check_id="PII_001_DETECTION",
            category="Privacy & PII Compliance",
            name="PII Detection",
            description="Scans message content for personally identifiable information across entity types.",
            status="warning",
            value=f"{pii_result.total_findings} findings ({pii_result.high_confidence_count} high-confidence)",
            evidence={
                'total_findings': pii_result.total_findings,
                'high_confidence_count': pii_result.high_confidence_count,
                'medium_confidence_count': pii_result.medium_confidence_count,
                'findings_by_type': pii_result.findings_by_type,
                'most_common_entities': pii_result.most_common_entities,
                'findings_by_session': pii_result.findings_by_session,
                'detailed_findings': [
                    {
                        'entity_type': f.entity_type,
                        'score': round(f.score, 3),
                        'session_id': f.session_id,
                        'event_location': f.event_location,
                        'text': f.text[:50] + '...' if len(f.text) > 50 else f.text
                    }
                    for f in pii_result.detailed_findings[:20]  # Limit to 20 for evidence
                ]
            },
            recommendations=[
                "Consider implementing PII detection and redaction",
                "Review which PII types are necessary for agent operation"
            ]
        )
        return _apply_framework_mappings(check)

    # Passed for only low-confidence findings
    check = AssessmentCheck(
        check_id="PII_001_DETECTION",
        category="Privacy & PII Compliance",
        name="PII Detection",
        description="Scans message content for personally identifiable information across entity types.",
        status="passed",
        value=f"{pii_result.total_findings} low-confidence findings",
        evidence={
            'total_findings': pii_result.total_findings,
            'low_confidence_count': pii_result.low_confidence_count,
            'findings_by_type': pii_result.findings_by_type,
            'findings_by_session': pii_result.findings_by_session,
            'detailed_findings': [
                {
                    'entity_type': f.entity_type,
                    'score': round(f.score, 3),
                    'session_id': f.session_id,
                    'event_location': f.event_location,
                    'text': f.text[:50] + '...' if len(f.text) > 50 else f.text
                }
                for f in pii_result.detailed_findings[:20]  # Limit to 20 for evidence
            ]
        }
    )
    return _apply_framework_mappings(check)


def _check_pii_in_system_prompts(pii_result: PIIAnalysisResult) -> AssessmentCheck:
    """Check for PII in system prompts specifically."""
    system_prompt_findings = [
        f for f in pii_result.detailed_findings
        if f.event_location == "system_prompt"
    ]

    if not system_prompt_findings:
        check = AssessmentCheck(
            check_id="PII_002_SYSTEM_PROMPT",
            category="Privacy & PII Compliance",
            name="PII in System Prompts",
            description="Checks whether system prompts contain PII that may be inadvertently shared.",
            status="passed",
            value="No PII in system prompts",
            evidence={'system_prompt_findings': 0}
        )
        return _apply_framework_mappings(check)

    # Any PII in system prompts is a warning (usually shouldn't have user PII there)
    entity_types_in_prompts = list(set(f.entity_type for f in system_prompt_findings))

    check = AssessmentCheck(
        check_id="PII_002_SYSTEM_PROMPT",
        category="Privacy & PII Compliance",
        name="PII in System Prompts",
        description="Checks whether system prompts contain PII that may be inadvertently shared.",
        status="warning",
        value=f"{len(system_prompt_findings)} findings",
        evidence={
            'system_prompt_findings': len(system_prompt_findings),
            'entity_types': entity_types_in_prompts
        },
        recommendations=[
            "Review system prompts for inadvertent PII inclusion",
            "System prompts should typically not contain user-specific PII"
        ]
    )
    return _apply_framework_mappings(check)


def _check_pii_exposure_rate(pii_result: PIIAnalysisResult, sessions: List[SessionData]) -> AssessmentCheck:
    """Check what percentage of sessions contain PII."""
    total_sessions = len(sessions)
    if total_sessions == 0:
        check = AssessmentCheck(
            check_id="PII_003_EXPOSURE_RATE",
            category="Privacy & PII Compliance",
            name="PII Exposure Rate",
            description="Measures the proportion of sessions that contain any PII.",
            status="passed",
            value="No sessions",
            evidence={'reason': 'no_sessions'}
        )
        return _apply_framework_mappings(check)

    exposure_rate = pii_result.sessions_with_pii / total_sessions if total_sessions > 0 else 0

    if exposure_rate == 0:
        check = AssessmentCheck(
            check_id="PII_003_EXPOSURE_RATE",
            category="Privacy & PII Compliance",
            name="PII Exposure Rate",
            description="Measures the proportion of sessions that contain any PII.",
            status="passed",
            value="0% sessions with PII",
            evidence={
                'exposure_rate': 0.0,
                'sessions_with_pii': 0,
                'total_sessions': total_sessions
            }
        )
        return _apply_framework_mappings(check)

    # Warning if >50% of sessions contain PII
    if exposure_rate > 0.5:
        check = AssessmentCheck(
            check_id="PII_003_EXPOSURE_RATE",
            category="Privacy & PII Compliance",
            name="PII Exposure Rate",
            description="Measures the proportion of sessions that contain any PII.",
            status="warning",
            value=f"{int(exposure_rate * 100)}% sessions with PII",
            evidence={
                'exposure_rate': round(exposure_rate, 3),
                'sessions_with_pii': pii_result.sessions_with_pii,
                'total_sessions': total_sessions,
                'threshold': 0.5
            },
            recommendations=[
                f"High PII exposure rate ({exposure_rate:.0%}) - consider PII minimization strategies",
                "Review if all PII is necessary for agent operation"
            ]
        )
        return _apply_framework_mappings(check)

    # Passed for low exposure rate
    check = AssessmentCheck(
        check_id="PII_003_EXPOSURE_RATE",
        category="Privacy & PII Compliance",
        name="PII Exposure Rate",
        description="Measures the proportion of sessions that contain any PII.",
        status="passed",
        value=f"{int(exposure_rate * 100)}% sessions with PII",
        evidence={
            'exposure_rate': round(exposure_rate, 3),
            'sessions_with_pii': pii_result.sessions_with_pii,
            'total_sessions': total_sessions
        }
    )
    return _apply_framework_mappings(check)


def check_privacy_compliance(
    pii_result: Optional[PIIAnalysisResult],
    sessions: List[SessionData]
) -> Optional[AssessmentCategory]:
    """Run all privacy & PII compliance checks.

    Args:
        pii_result: Results from PII analysis (None if not available)
        sessions: List of session data

    Returns:
        AssessmentCategory or None if PII analysis not available
    """
    if pii_result is None:
        return None
    
    # If PII analysis is disabled, return None (category won't appear)
    if pii_result.disabled:
        return None

    # Compute metrics
    metrics = {
        'total_findings': pii_result.total_findings,
        'unique_entity_types': len(pii_result.findings_by_type),
        'sessions_with_pii': pii_result.sessions_with_pii,
        'exposure_rate': round(pii_result.sessions_with_pii / len(sessions), 2) if sessions else 0.0,
        'most_common_entities': ', '.join(pii_result.most_common_entities[:3]) if pii_result.most_common_entities else 'N/A'
    }

    # Run checks
    checks = [
        _check_pii_detection(pii_result),
        _check_pii_in_system_prompts(pii_result),
        _check_pii_exposure_rate(pii_result, sessions)
    ]

    return AssessmentCategory(
        category_id="PRIVACY_COMPLIANCE",
        category_name="Privacy & PII Compliance",
        description="Detects and reports PII exposure in messages and prompts.",
        checks=checks,
        metrics=metrics
    )


# ============================================================================
# Main Report Generation
# ============================================================================

def generate_security_report(
    agent_id: str,
    sessions: List[SessionData],
    behavioral_result: BehavioralAnalysisResult,
    pii_result: Optional[PIIAnalysisResult] = None
) -> SecurityReport:
    """Generate complete security assessment report.

    Args:
        agent_id: Agent identifier
        sessions: List of session data
        behavioral_result: Results from behavioral analysis
        pii_result: Results from PII analysis (optional)

    Returns:
        SecurityReport with all categories
    """
    # Run all category assessments
    categories = {
        "RESOURCE_MANAGEMENT": check_resource_management(sessions),
        "ENVIRONMENT": check_environment(sessions),
        "BEHAVIORAL": check_behavioral_stability(behavioral_result, sessions)
    }

    # Add privacy compliance category if PII analysis available
    privacy_category = check_privacy_compliance(pii_result, sessions)
    if privacy_category:
        categories["PRIVACY_COMPLIANCE"] = privacy_category

    # Create summary
    summary = {
        "total_checks": sum(cat.total_checks for cat in categories.values()),
        "passed_checks": sum(cat.passed_checks for cat in categories.values()),
        "critical_issues": sum(cat.critical_checks for cat in categories.values()),
        "warnings": sum(cat.warning_checks for cat in categories.values())
    }
    
    # Add PII disabled status if applicable
    if pii_result and pii_result.disabled:
        summary["pii_disabled"] = True
        summary["pii_disabled_reason"] = pii_result.disabled_reason

    return SecurityReport(
        report_id=str(uuid.uuid4()),
        agent_id=agent_id,
        timestamp=datetime.now(timezone.utc).isoformat(),
        sessions_analyzed=len(sessions),
        categories=categories,
        summary=summary
    )
