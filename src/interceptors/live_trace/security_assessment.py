"""Security assessment engine - generates security report with categorized checks."""
import re
import statistics
import uuid
from datetime import datetime, timezone
from typing import List

from .risk_models import (
    AssessmentCategory,
    AssessmentCheck,
    BehavioralAnalysisResult,
    SecurityReport,
)
from .store import SessionData


# Universal safety bounds (section 4.2, H3)
UNIVERSAL_BOUNDS = {
    'max_tokens_per_session': 50000,
    'max_tool_calls_per_session': 50
}


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
        return AssessmentCheck(
            check_id="RESOURCE_001_TOKEN_BOUNDS",
            category="Resource Management",
            name="Token Budget Usage",
            description="Validates that per-session token usage stays within the allowed range.",
            status="critical",
            value=f"{len(violations)} violation{'s' if len(violations) != 1 else ''}",
            evidence={'violations': violations},
            recommendations=[
                f"Enforce {UNIVERSAL_BOUNDS['max_tokens_per_session']} token limit per session"
            ]
        )

    max_tokens = max((s.total_tokens for s in sessions), default=0)
    return AssessmentCheck(
        check_id="RESOURCE_001_TOKEN_BOUNDS",
        category="Resource Management",
        name="Token Budget Usage",
        description="Validates that per-session token usage stays within the allowed range.",
        status="passed",
        value=f"{max_tokens:,} max tokens",
        evidence={'max_tokens': max_tokens}
    )


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
        return AssessmentCheck(
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

    max_calls = max((s.tool_uses for s in sessions), default=0)
    return AssessmentCheck(
        check_id="RESOURCE_002_TOOL_CALL_BOUNDS",
        category="Resource Management",
        name="Tool Call Volume",
        description="Validates that tool invocations remain within expected limits per session.",
        status="passed",
        value=f"{max_calls} max calls",
        evidence={'max_tool_calls': max_calls}
    )


def _check_token_variance(sessions: List[SessionData]) -> AssessmentCheck:
    """Check token usage variance (indicates proper quotas)."""
    tokens = [s.total_tokens for s in sessions if s.total_tokens > 0]

    if not tokens or len(tokens) < 2:
        return AssessmentCheck(
            check_id="RESOURCE_004_TOKEN_VARIANCE",
            category="Resource Management",
            name="Token Consistency Across Sessions",
            description="Assesses how consistently the agent consumes its token quota across sessions.",
            status="passed",
            value="Insufficient data",
            evidence={'reason': 'insufficient_data'}
        )

    mean_tokens = statistics.mean(tokens)
    std_tokens = statistics.stdev(tokens)
    token_cv = std_tokens / mean_tokens if mean_tokens > 0 else 0

    if token_cv > 0.7:
        return AssessmentCheck(
            check_id="RESOURCE_004_TOKEN_VARIANCE",
            category="Resource Management",
            name="Token Consistency Across Sessions",
            description="Assesses how consistently the agent consumes its token quota across sessions.",
            status="warning",
            value=f"CV: {token_cv:.2f}",
            evidence={'coefficient_of_variation': round(token_cv, 2)},
            recommendations=[
                "Implement internal token quotas to reduce variance"
            ]
        )

    return AssessmentCheck(
        check_id="RESOURCE_004_TOKEN_VARIANCE",
        category="Resource Management",
        name="Token Consistency Across Sessions",
        description="Assesses how consistently the agent consumes its token quota across sessions.",
        status="passed",
        value=f"CV: {token_cv:.2f}",
        evidence={'coefficient_of_variation': round(token_cv, 2)}
    )


def _check_tool_variance(sessions: List[SessionData]) -> AssessmentCheck:
    """Check tool usage variance (indicates proper limits)."""
    tools = [s.tool_uses for s in sessions if s.tool_uses > 0]

    if not tools or len(tools) < 2:
        return AssessmentCheck(
            check_id="RESOURCE_005_TOOL_VARIANCE",
            category="Resource Management",
            name="Tool Consistency Across Sessions",
            description="Tests whether tool usage stays balanced from session to session.",
            status="passed",
            value="Insufficient data",
            evidence={'reason': 'insufficient_data'}
        )

    mean_tools = statistics.mean(tools)
    std_tools = statistics.stdev(tools)
    tool_cv = std_tools / mean_tools if mean_tools > 0 else 0

    if tool_cv > 0.7:
        return AssessmentCheck(
            check_id="RESOURCE_005_TOOL_VARIANCE",
            category="Resource Management",
            name="Tool Consistency Across Sessions",
            description="Tests whether tool usage stays balanced from session to session.",
            status="warning",
            value=f"CV: {tool_cv:.2f}",
            evidence={'coefficient_of_variation': round(tool_cv, 2)},
            recommendations=[
                "Implement internal tool usage quotas to reduce variance"
            ]
        )

    return AssessmentCheck(
        check_id="RESOURCE_005_TOOL_VARIANCE",
        category="Resource Management",
        name="Tool Consistency Across Sessions",
        description="Tests whether tool usage stays balanced from session to session.",
        status="passed",
        value=f"CV: {tool_cv:.2f}",
        evidence={'coefficient_of_variation': round(tool_cv, 2)}
    )


def _check_duration_variance(sessions: List[SessionData]) -> AssessmentCheck:
    """Check session duration variance (indicates proper consistency)."""
    durations = [s.duration_minutes for s in sessions if s.duration_minutes > 0]

    if not durations or len(durations) < 2:
        return AssessmentCheck(
            check_id="RESOURCE_006_DURATION_VARIANCE",
            category="Resource Management",
            name="Session Duration Consistency",
            description="Session duration consistency across runs shows how stable and focused the agent remains.",
            status="passed",
            value="Insufficient data",
            evidence={'reason': 'insufficient_data'}
        )

    mean_duration = statistics.mean(durations)
    std_duration = statistics.stdev(durations)
    duration_cv = std_duration / mean_duration if mean_duration > 0 else 0

    if duration_cv > 0.7:
        return AssessmentCheck(
            check_id="RESOURCE_006_DURATION_VARIANCE",
            category="Resource Management",
            name="Session Duration Consistency",
            description="Session duration consistency across runs shows how stable and focused the agent remains.",
            status="warning",
            value=f"CV: {duration_cv:.2f}",
            evidence={'coefficient_of_variation': round(duration_cv, 2)},
            recommendations=[
                "Implement session duration limits to improve consistency"
            ]
        )

    return AssessmentCheck(
        check_id="RESOURCE_006_DURATION_VARIANCE",
        category="Resource Management",
        name="Session Duration Consistency",
        description="Session duration consistency across runs shows how stable and focused the agent remains.",
        status="passed",
        value=f"CV: {duration_cv:.2f}",
        evidence={'coefficient_of_variation': round(duration_cv, 2)}
    )


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
        description="Summarizes how the agent uses tokens, time, and tools against policy",
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
        return AssessmentCheck(
            check_id="ENV_001_CONSISTENT_MODEL",
            category="Environment & Supply Chain",
            name="Pinned Model Usage",
            description="Ensures every LLM call pins a specific, versioned model for reproducibility.",
            status="passed",
            value="No models detected",
            evidence={'reason': 'no_models_detected'}
        )

    unpinned_models = []
    for model in set(all_models):
        # Check for version suffix: -0613, -20240229, -v1.5, :20240229
        has_date = re.search(r'[:\-](\d{8}|\d{4})$', model)
        has_semantic = re.search(r'-v?\d+(\.\d+)*$', model)

        if not has_date and not has_semantic:
            unpinned_models.append(model)

    if unpinned_models:
        return AssessmentCheck(
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

    unique_models = len(set(all_models))
    return AssessmentCheck(
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


def _check_average_tools_coverage(sessions: List[SessionData]) -> AssessmentCheck:
    """Check average per-session tools coverage (should be around 1.0)."""
    if not sessions:
        return AssessmentCheck(
            check_id="ENV_002_AVG_TOOLS_COVERAGE",
            category="Environment & Supply Chain",
            name="Session Tool Coverage",
            description="Measures how completely each session leverages its available tools.",
            status="passed",
            value="No sessions",
            evidence={'reason': 'no_sessions'}
        )

    # Calculate per-session coverage rates
    coverage_rates = []
    for session in sessions:
        if len(session.available_tools) > 0:
            used_count = len([tool for tool in session.available_tools if tool in session.tool_usage_details])
            coverage = used_count / len(session.available_tools)
            coverage_rates.append(coverage)

    if not coverage_rates:
        return AssessmentCheck(
            check_id="ENV_002_AVG_TOOLS_COVERAGE",
            category="Environment & Supply Chain",
            name="Session Tool Coverage",
            description="Measures how completely each session leverages its available tools.",
            status="passed",
            value="No tools available",
            evidence={'reason': 'no_tools_available'}
        )

    avg_coverage = statistics.mean(coverage_rates)

    # Pass if average coverage >= 0.80 (80%)
    if avg_coverage >= 0.80:
        return AssessmentCheck(
            check_id="ENV_002_AVG_TOOLS_COVERAGE",
            category="Environment & Supply Chain",
            name="Average Tools Coverage",
            description="Average per-session tools coverage should be around 1.0",
            status="passed",
            value=f"{avg_coverage:.2f} coverage",
            evidence={
                'avg_coverage': round(avg_coverage, 3),
                'sessions_analyzed': len(coverage_rates),
                'threshold': 0.80
            }
        )

    return AssessmentCheck(
        check_id="ENV_002_AVG_TOOLS_COVERAGE",
        category="Environment & Supply Chain",
        name="Session Tool Coverage",
        description="Measures how completely each session leverages its available tools.",
        status="warning",
        value=f"{avg_coverage:.2f} coverage",
        evidence={
            'avg_coverage': round(avg_coverage, 3),
            'sessions_analyzed': len(coverage_rates),
            'threshold': 0.80
        },
        recommendations=[
            f"Improve tools coverage to reach 1.0 (current: {avg_coverage:.2f})"
        ]
    )


def _check_unused_tools(sessions: List[SessionData]) -> AssessmentCheck:
    """Check for globally unused tools."""
    all_available_tools = set()
    all_used_tools = set()

    for session in sessions:
        all_available_tools.update(session.available_tools)
        all_used_tools.update(session.tool_usage_details.keys())

    if not all_available_tools:
        return AssessmentCheck(
            check_id="ENV_003_UNUSED_TOOLS",
            category="Environment & Supply Chain",
            name="Unused Tools Inventory",
            description="Flags provisioned tools that are never exercised across sessions.",
            status="passed",
            value="No tools available",
            evidence={'reason': 'no_tools_available'}
        )

    unused_tools = sorted(list(all_available_tools - all_used_tools))

    if not unused_tools:
        return AssessmentCheck(
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

    return AssessmentCheck(
        check_id="ENV_003_UNUSED_TOOLS",
        category="Environment & Supply Chain",
        name="Unused Tools Inventory",
        description="Flags provisioned tools that are never exercised across sessions.",
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

    # Calculate average per-session tools coverage
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
        description="Examines model version pinning and tool adoption health",
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
        return AssessmentCheck(
            check_id="BEHAV_001_STABILITY_SCORE",
            category="Behavioral Stability",
            name="Behavior Stability Score",
            description="Evaluates whether observed session behaviors stay stable across the scenarios we analyze.",
            status="passed",
            value=f"{score:.2f} score",
            evidence={
                'stability_score': round(score, 3),
                'threshold': 0.80,
                'num_clusters': behavioral_result.num_clusters
            }
        )

    return AssessmentCheck(
        check_id="BEHAV_001_STABILITY_SCORE",
        category="Behavioral Stability",
        name="Behavior Stability Score",
        description="Evaluates whether observed session behaviors stay stable across the scenarios we analyze.",
        status="critical",
        value=f"{score:.2f} score",
        evidence={
            'stability_score': round(score, 3),
            'shortfall': round(0.80 - score, 3)
        },
        recommendations=[
            f"Improve system prompt and add guardrails (stability: {score:.2f})"
        ]
    )


def _check_outlier_rate(behavioral_result: BehavioralAnalysisResult) -> AssessmentCheck:
    """Check outlier rate (<20% required)."""
    outlier_rate = behavioral_result.num_outliers / behavioral_result.total_sessions if behavioral_result.total_sessions > 0 else 0

    if outlier_rate < 0.20:
        return AssessmentCheck(
            check_id="BEHAV_002_OUTLIER_RATE",
            category="Behavioral Stability",
            name="Behavior Outlier Rate",
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

    return AssessmentCheck(
        check_id="BEHAV_002_OUTLIER_RATE",
        category="Behavioral Stability",
        name="Behavior Outlier Rate",
        description="Tracks the share of sessions that diverge from established behavioral patterns.",
        status="critical",
        value=f"{int(outlier_rate * 100)}% outliers",
        evidence={'outlier_rate': round(outlier_rate, 3)},
        recommendations=[
            f"Reduce outlier rate by improving behavioral consistency ({outlier_rate:.1%})"
        ]
    )


def _check_cluster_formation(behavioral_result: BehavioralAnalysisResult) -> AssessmentCheck:
    """Check that at least 1 behavioral cluster formed."""
    num_clusters = behavioral_result.num_clusters

    if num_clusters >= 1:
        return AssessmentCheck(
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

    return AssessmentCheck(
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


def _check_predictability(behavioral_result: BehavioralAnalysisResult) -> AssessmentCheck:
    """Check predictability score."""
    score = behavioral_result.predictability_score

    # Predictability threshold is informational (warning at 0.60)
    if score >= 0.60:
        return AssessmentCheck(
            check_id="BEHAV_004_PREDICTABILITY",
            category="Behavioral Stability",
            name="Behavior Predictability",
            description="Scores how predictable the agent's behavior remains across comparable sessions.",
            status="passed",
            value=f"{score:.2f} score",
            evidence={'predictability_score': round(score, 3)}
        )

    return AssessmentCheck(
        check_id="BEHAV_004_PREDICTABILITY",
        category="Behavioral Stability",
        name="Behavior Predictability",
        description="Scores how predictable the agent's behavior remains across comparable sessions.",
        status="warning",
        value=f"{score:.2f} score",
        evidence={'predictability_score': round(score, 3)},
        recommendations=[
            f"Improve consistency in agent responses (predictability: {score:.2f})"
        ]
    )


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
        description="Summarizes behavioral consistency, predictability, and remaining variance",
        checks=checks
    )


def _check_uncertainty_threshold(
    behavioral_result: BehavioralAnalysisResult,
    sessions: List[SessionData]
) -> AssessmentCheck:
    """Check behavioral uncertainty threshold."""
    uncertainty = 1.0 - behavioral_result.stability_score

    if uncertainty <= 0.25:
        return AssessmentCheck(
            check_id="BEHAV_005_UNCERTAINTY_THRESHOLD",
            category="Behavioral Stability",
            name="Behavioral Uncertainty Level",
            description="Quantifies the residual uncertainty that remains after assessing behavioral stability.",
            status="passed",
            value=f"{uncertainty:.2f} uncertainty",
            evidence={
                'uncertainty': round(uncertainty, 3),
                'threshold': 0.25,
                'stability_score': behavioral_result.stability_score
            }
        )

    return AssessmentCheck(
        check_id="BEHAV_005_UNCERTAINTY_THRESHOLD",
        category="Behavioral Stability",
        name="Behavioral Uncertainty Level",
        description="Quantifies the residual uncertainty that remains after assessing behavioral stability.",
        status="warning",
        value=f"{uncertainty:.2f} uncertainty",
        evidence={'uncertainty': round(uncertainty, 3)},
        recommendations=[
            f"Implement stricter guardrails (uncertainty: {uncertainty:.2f})"
        ]
    )


# ============================================================================
# Main Report Generation
# ============================================================================

def generate_security_report(
    agent_id: str,
    sessions: List[SessionData],
    behavioral_result: BehavioralAnalysisResult
) -> SecurityReport:
    """Generate complete security assessment report.

    Args:
        agent_id: Agent identifier
        sessions: List of session data
        behavioral_result: Results from behavioral analysis

    Returns:
        SecurityReport with all categories
    """
    # Run all category assessments
    categories = {
        "RESOURCE_MANAGEMENT": check_resource_management(sessions),
        "ENVIRONMENT": check_environment(sessions),
        "BEHAVIORAL": check_behavioral_stability(behavioral_result, sessions)
    }

    # Create summary
    summary = {
        "total_checks": sum(cat.total_checks for cat in categories.values()),
        "passed_checks": sum(cat.passed_checks for cat in categories.values()),
        "critical_issues": sum(cat.critical_checks for cat in categories.values()),
        "warnings": sum(cat.warning_checks for cat in categories.values())
    }

    return SecurityReport(
        report_id=str(uuid.uuid4()),
        agent_id=agent_id,
        timestamp=datetime.now(timezone.utc).isoformat(),
        sessions_analyzed=len(sessions),
        categories=categories,
        summary=summary
    )
