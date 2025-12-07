"""Demo script showing how to use MCP tools (knowledge and storage)."""
import json

from .knowledge import get_fix_template, get_owasp_control, get_security_patterns
from .storage import (
    complete_analysis_session,
    create_analysis_session,
    get_findings,
    set_store,
    store_finding,
    update_finding_status,
)


def demo_security_analysis_workflow():
    """Demonstrate a typical security analysis workflow using the knowledge tools."""
    print("=" * 80)
    print("KNOWLEDGE MCP TOOLS - DEMO WORKFLOW")
    print("=" * 80)
    print()

    # Step 1: Get all security patterns for analysis
    print("Step 1: Retrieve security patterns for code analysis")
    print("-" * 80)
    result = get_security_patterns(context="all", min_severity="LOW")

    if result["success"]:
        patterns = result["data"]["patterns"]
        print(f"Retrieved {len(patterns)} security patterns:")
        for pattern_id, pattern in patterns.items():
            print(f"  - {pattern_id}: {pattern['name']} ({pattern['severity']})")
        print()
    else:
        print(f"Error: {result['error']['message']}")
        return

    # Step 2: Get detailed information about a specific control
    print("Step 2: Get detailed information about Prompt Injection (LLM01)")
    print("-" * 80)
    result = get_owasp_control("LLM01")

    if result["success"]:
        control = result["data"]["control"]
        print(f"Control: {control['name']}")
        print(f"Severity: {control['severity']}")
        print(f"\nDescription:")
        print(f"  {control['description'].strip()}")
        print(f"\nWhat to look for:")
        for indicator in control["what_to_look_for"][:3]:
            print(f"  - {indicator}")
        print()
    else:
        print(f"Error: {result['error']['message']}")
        return

    # Step 3: Get fix template for remediation
    print("Step 3: Get fix template for PROMPT_INJECTION vulnerability")
    print("-" * 80)
    result = get_fix_template("PROMPT_INJECTION")

    if result["success"]:
        template = result["data"]["template"]
        print(f"Template: {result['data']['finding_type']}")
        print(f"OWASP Control: {template['owasp_control']}")
        print(f"\nApplication Guidance:")
        for i, step in enumerate(template["application_guidance"], 1):
            print(f"  {i}. {step}")
        print(f"\nVerification Checklist:")
        for i, check in enumerate(template["verification"], 1):
            print(f"  {i}. {check}")
        print()
    else:
        print(f"Error: {result['error']['message']}")
        return

    # Step 4: Filter patterns by context
    print("Step 4: Filter patterns by specific context (excessive_agency)")
    print("-" * 80)
    result = get_security_patterns(context="excessive_agency", min_severity="HIGH")

    if result["success"]:
        patterns = result["data"]["patterns"]
        print(f"Found {len(patterns)} patterns matching criteria:")
        for pattern_id, pattern in patterns.items():
            print(f"  - {pattern_id}: {pattern['name']}")
        print()
    else:
        print(f"Error: {result['error']['message']}")
        return

    # Step 5: Demonstrate error handling
    print("Step 5: Error handling with invalid control ID")
    print("-" * 80)
    result = get_owasp_control("INVALID_CONTROL")

    if not result["success"]:
        error = result["error"]
        print(f"Error Code: {error['code']}")
        print(f"Message: {error['message']}")
        print(f"Suggestion: {error['suggestion']}")
        print()
    else:
        print("Unexpected success - should have returned error")
        return

    print("=" * 80)
    print("DEMO COMPLETED SUCCESSFULLY")
    print("=" * 80)


def demo_storage_workflow():
    """Demonstrate storage tools for managing analysis sessions and findings."""
    from src.interceptors.live_trace.store import TraceStore

    print("=" * 80)
    print("STORAGE MCP TOOLS - DEMO WORKFLOW")
    print("=" * 80)
    print()

    # Initialize store
    store = TraceStore(storage_mode="memory")
    set_store(store)

    # Step 1: Create analysis session
    print("Step 1: Create an analysis session")
    print("-" * 80)
    result = create_analysis_session(
        agent_id="test-agent-001",
        session_type="STATIC",
        agent_name="My Security Agent",
    )

    if result["success"]:
        session = result["data"]["session"]
        session_id = session["session_id"]
        print(f"Session created: {session_id}")
        print(f"  Agent: {session['agent_name']} ({session['agent_id']})")
        print(f"  Type: {session['session_type']}")
        print(f"  Status: {session['status']}")
        print()
    else:
        print(f"Error: {result['error']['message']}")
        return

    # Step 2: Store findings
    print("Step 2: Store security findings")
    print("-" * 80)

    findings_data = [
        {
            "file_path": "src/agent.py",
            "finding_type": "PROMPT_INJECTION",
            "severity": "CRITICAL",
            "title": "Unvalidated user input in prompt",
            "description": "User input is directly concatenated without validation",
            "line_start": 42,
            "code_snippet": 'prompt = f"User says: {user_input}"',
            "owasp_mapping": ["LLM01"],
        },
        {
            "file_path": "src/tools.py",
            "finding_type": "EXCESSIVE_AGENCY",
            "severity": "HIGH",
            "title": "Tool has unrestricted file system access",
            "description": "File operations tool can access any path without validation",
            "line_start": 128,
            "code_snippet": "def read_file(path): return open(path).read()",
            "owasp_mapping": ["LLM08"],
        },
        {
            "file_path": "src/config.py",
            "finding_type": "DATA_LEAK",
            "severity": "MEDIUM",
            "title": "API keys logged in plaintext",
            "description": "Configuration logs contain sensitive API keys",
            "line_start": 15,
            "owasp_mapping": ["LLM06"],
        },
    ]

    finding_ids = []
    for finding_data in findings_data:
        result = store_finding(session_id=session_id, **finding_data)
        if result["success"]:
            finding = result["data"]["finding"]
            finding_ids.append(finding["finding_id"])
            print(f"Finding stored: {finding['finding_id']}")
            print(f"  {finding['severity']}: {finding['title']}")
            print(f"  Location: {finding['file_path']}:{finding.get('line_start', 'N/A')}")
            print()
        else:
            print(f"Error: {result['error']['message']}")

    # Step 3: Get findings with filters
    print("Step 3: Query findings with filters")
    print("-" * 80)

    result = get_findings(session_id=session_id, severity="HIGH")
    if result["success"]:
        findings = result["data"]["findings"]
        print(f"Found {len(findings)} HIGH severity findings:")
        for finding in findings:
            print(f"  - {finding['title']}")
        print()
    else:
        print(f"Error: {result['error']['message']}")

    # Step 4: Update finding status
    print("Step 4: Update finding status")
    print("-" * 80)

    if finding_ids:
        result = update_finding_status(
            finding_id=finding_ids[0],
            status="FIXED",
            notes="Applied input validation and sanitization",
        )
        if result["success"]:
            finding = result["data"]["finding"]
            print(f"Finding {finding['finding_id']} updated to {finding['status']}")
            print(f"  Notes: Applied input validation and sanitization")
            print()
        else:
            print(f"Error: {result['error']['message']}")

    # Step 5: Complete session and calculate risk
    print("Step 5: Complete session and calculate risk score")
    print("-" * 80)

    result = complete_analysis_session(session_id=session_id)
    if result["success"]:
        session = result["data"]["session"]
        risk_score = result["data"]["risk_score"]
        print(f"Session completed: {session['session_id']}")
        print(f"  Status: {session['status']}")
        print(f"  Findings: {session['findings_count']}")
        print(f"  Risk Score: {risk_score}/100")
        print()
    else:
        print(f"Error: {result['error']['message']}")

    # Step 6: Get all findings for the session
    print("Step 6: Review all findings")
    print("-" * 80)

    result = get_findings(session_id=session_id)
    if result["success"]:
        findings = result["data"]["findings"]
        print(f"Total findings: {len(findings)}")
        for finding in findings:
            print(f"  [{finding['severity']}] {finding['title']} - {finding['status']}")
        print()
    else:
        print(f"Error: {result['error']['message']}")

    print("=" * 80)
    print("STORAGE DEMO COMPLETED SUCCESSFULLY")
    print("=" * 80)


if __name__ == "__main__":
    print("\n")
    demo_security_analysis_workflow()
    print("\n\n")
    demo_storage_workflow()
