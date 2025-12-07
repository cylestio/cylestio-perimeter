"""Example usage of MCP models."""
from models import (
    Finding,
    FindingCreate,
    FindingEvidence,
    AnalysisSession,
    AnalysisSessionCreate,
    FindingSeverity,
    FindingStatus,
    SessionType,
    SessionStatus,
    MCPToolResponse,
    calculate_risk_score,
    generate_finding_id,
    generate_session_id,
    get_timestamp,
)


def example_usage():
    """Demonstrate MCP models usage."""
    print("MCP Models Example Usage\n" + "=" * 60)

    # 1. Create an analysis session
    print("\n1. Creating an analysis session...")
    session_id = generate_session_id()
    session = AnalysisSession(
        session_id=session_id,
        agent_id="agent_claude_001",
        agent_name="Claude Static Analyzer",
        session_type=SessionType.STATIC,
        status=SessionStatus.IN_PROGRESS,
        created_at=get_timestamp()
    )
    print(f"   Session ID: {session.session_id}")
    print(f"   Agent: {session.agent_name}")
    print(f"   Type: {session.session_type}")
    print(f"   Status: {session.status}")

    # 2. Create findings
    print("\n2. Creating findings...")
    findings = []

    # Critical finding
    finding1 = Finding(
        finding_id=generate_finding_id(),
        session_id=session_id,
        agent_id="agent_claude_001",
        file_path="/src/api/prompt_handler.py",
        line_start=45,
        line_end=52,
        finding_type="LLM01",
        severity=FindingSeverity.CRITICAL,
        title="Prompt Injection Vulnerability",
        description="User input is directly concatenated into system prompt without sanitization",
        evidence=FindingEvidence(
            code_snippet='prompt = f"System: {system_msg}\\nUser: {user_input}"',
            context="User input handling in chat endpoint"
        ),
        owasp_mapping=["LLM01:2023", "A03:2021"],
        status=FindingStatus.OPEN,
        created_at=get_timestamp(),
        updated_at=get_timestamp()
    )
    findings.append(finding1)
    print(f"   Created: {finding1.title} ({finding1.severity})")

    # High finding
    finding2 = Finding(
        finding_id=generate_finding_id(),
        session_id=session_id,
        agent_id="agent_claude_001",
        file_path="/src/tools/file_access.py",
        line_start=23,
        line_end=28,
        finding_type="LLM06",
        severity=FindingSeverity.HIGH,
        title="Excessive Agency - Unrestricted File Access",
        description="Agent has read/write access to entire filesystem without restrictions",
        evidence=FindingEvidence(
            code_snippet='def read_file(path: str):\n    return open(path).read()',
            context="File tool with no path validation"
        ),
        owasp_mapping=["LLM06:2023"],
        status=FindingStatus.OPEN,
        created_at=get_timestamp(),
        updated_at=get_timestamp()
    )
    findings.append(finding2)
    print(f"   Created: {finding2.title} ({finding2.severity})")

    # Medium finding
    finding3 = Finding(
        finding_id=generate_finding_id(),
        session_id=session_id,
        agent_id="agent_claude_001",
        file_path="/src/config/settings.py",
        line_start=12,
        line_end=15,
        finding_type="LLM05",
        severity=FindingSeverity.MEDIUM,
        title="Sensitive Data Exposure in Logs",
        description="API keys logged in plaintext during debugging",
        evidence=FindingEvidence(
            code_snippet='logger.debug(f"API Key: {config.api_key}")',
            context="Configuration initialization"
        ),
        owasp_mapping=["LLM05:2023"],
        status=FindingStatus.OPEN,
        created_at=get_timestamp(),
        updated_at=get_timestamp()
    )
    findings.append(finding3)
    print(f"   Created: {finding3.title} ({finding3.severity})")

    # 3. Calculate risk score
    print("\n3. Calculating risk score...")
    risk_score = calculate_risk_score(findings)
    print(f"   Total findings: {len(findings)}")
    print(f"   Risk score: {risk_score}/100")
    print(f"   Breakdown: CRITICAL(25) + HIGH(15) + MEDIUM(5) = {risk_score}")

    # 4. Update session
    print("\n4. Updating session with findings...")
    session.findings_count = len(findings)
    session.risk_score = risk_score
    session.status = SessionStatus.COMPLETED
    session.completed_at = get_timestamp()
    print(f"   Status: {session.status}")
    print(f"   Findings count: {session.findings_count}")
    print(f"   Risk score: {session.risk_score}")

    # 5. Create MCP response
    print("\n5. Creating MCP tool response...")
    response = MCPToolResponse(
        success=True,
        data={
            "session_id": session.session_id,
            "findings": [f.model_dump() for f in findings],
            "risk_score": risk_score
        }
    )
    print(f"   Success: {response.success}")
    print(f"   Data keys: {list(response.data.keys())}")

    # 6. Demonstrate enum serialization
    print("\n6. Demonstrating enum serialization...")
    finding_dict = finding1.model_dump()
    print(f"   Finding severity as dict: {finding_dict['severity']} (type: {type(finding_dict['severity']).__name__})")
    print(f"   Finding status as dict: {finding_dict['status']} (type: {type(finding_dict['status']).__name__})")

    import json
    finding_json = finding1.model_dump_json()
    finding_parsed = json.loads(finding_json)
    print(f"   Finding severity from JSON: {finding_parsed['severity']}")

    print("\n" + "=" * 60)
    print("Example completed successfully!")


if __name__ == "__main__":
    example_usage()
