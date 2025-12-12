"""FastAPI server for the live trace dashboard."""
import os
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

import httpx
from fastapi import FastAPI, Request
from fastapi.responses import FileResponse, HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

from src.kb.loader import get_kb_loader
from src.utils.logger import get_logger

from .runtime.engine import InsightsEngine
from .mcp import create_mcp_router
from .models import (
    FindingSeverity,
    SessionType,
    Finding,
    FindingEvidence,
    generate_finding_id,
    generate_session_id,
    calculate_risk_score,
)

logger = get_logger(__name__)

# Get static directory for React build
STATIC_DIR = Path(__file__).parent / "static" / "dist"


def create_trace_server(insights: InsightsEngine, refresh_interval: int = 2, analysis_runner=None) -> FastAPI:
    """Create the FastAPI application for the trace dashboard.

    Args:
        insights: InsightsEngine instance
        refresh_interval: Page refresh interval in seconds
        analysis_runner: Optional AnalysisRunner instance for triggering analysis

    Returns:
        FastAPI application
    """
    app = FastAPI(
        title="Live Trace Dashboard",
        description="Real-time tracing and debugging dashboard",
        version="1.0.0"
    )

    # Include MCP router
    mcp_router = create_mcp_router(lambda: insights.store)
    app.include_router(mcp_router)

    # Mount static files (for React build)
    if STATIC_DIR.exists():
        app.mount("/assets", StaticFiles(directory=str(STATIC_DIR / "assets")), name="assets")
        logger.info(f"Mounted static files from {STATIC_DIR}")
        
        # Serve logo and favicon from root
        @app.get("/cylestio_full_logo.png")
        async def get_logo():
            logo_path = STATIC_DIR / "cylestio_full_logo.png"
            if logo_path.exists():
                return FileResponse(logo_path)
            return JSONResponse({"error": "Logo not found"}, status_code=404)
        
        @app.get("/favicon.ico")
        async def get_favicon():
            favicon_path = STATIC_DIR / "favicon.ico"
            if favicon_path.exists():
                return FileResponse(favicon_path)
            return JSONResponse({"error": "Favicon not found"}, status_code=404)
    else:
        logger.warning(f"Static directory not found: {STATIC_DIR}. Run 'cd src/interceptors/live_trace/frontend && npm run build' to build the React app.")

    # API endpoints for programmatic access
    @app.get("/api/dashboard")
    async def api_dashboard(agent_id: Optional[str] = None):
        """Get complete dashboard data as JSON, optionally filtered by workflow."""
        try:
            data = await insights.get_dashboard_data(agent_id=agent_id)
            data["refresh_interval"] = refresh_interval
            return JSONResponse(data)
        except Exception as e:
            logger.error(f"Error getting dashboard data: {e}")
            return JSONResponse({"error": str(e)}, status_code=500)

    @app.get("/api/agents")
    async def api_agents_list():
        """Get all agents with system prompt counts."""
        try:
            workflows = insights.store.get_workflows()
            return JSONResponse({"agents": workflows})
        except Exception as e:
            logger.error(f"Error getting agents: {e}")
            return JSONResponse({"error": str(e)}, status_code=500)

    # Legacy endpoint for backward compatibility
    @app.get("/api/workflows")
    async def api_workflows():
        """Get all agents with system prompt counts (legacy endpoint, use /api/agents instead)."""
        try:
            workflows = insights.store.get_workflows()
            return JSONResponse({"workflows": workflows})
        except Exception as e:
            logger.error(f"Error getting workflows: {e}")
            return JSONResponse({"error": str(e)}, status_code=500)

    @app.get("/api/stats")
    async def api_stats():
        """Get global statistics as JSON."""
        try:
            data = await insights.get_dashboard_data()
            return JSONResponse(data["stats"])
        except Exception as e:
            logger.error(f"Error getting stats: {e}")
            return JSONResponse({"error": str(e)}, status_code=500)

    @app.get("/api/system-prompts")
    async def api_system_prompts():
        """Get all system prompts as JSON."""
        try:
            data = await insights.get_dashboard_data()
            return JSONResponse(data["agents"])
        except Exception as e:
            logger.error(f"Error getting system prompts: {e}")
            return JSONResponse({"error": str(e)}, status_code=500)

    @app.get("/api/sessions")
    async def api_sessions():
        """Get all sessions as JSON (legacy endpoint)."""
        try:
            sessions = insights.store.get_sessions_filtered(limit=100)
            return JSONResponse(sessions)
        except Exception as e:
            logger.error(f"Error getting sessions: {e}")
            return JSONResponse({"error": str(e)}, status_code=500)

    @app.get("/api/sessions/list")
    async def api_sessions_list(
        agent_id: Optional[str] = None,
        system_prompt_id: Optional[str] = None,
        status: Optional[str] = None,
        limit: int = 10,
        offset: int = 0,
    ):
        """Get sessions with filtering by agent_id, system_prompt_id, and/or status.

        Args:
            agent_id: Filter by agent ID. Use "unassigned" for sessions without agent.
            system_prompt_id: Filter by system prompt ID.
            status: Filter by status - "ACTIVE", "INACTIVE", or "COMPLETED".
            limit: Maximum number of sessions to return (default 10).
            offset: Number of sessions to skip for pagination (default 0).

        Returns:
            JSON response with sessions list and metadata.
        """
        try:
            # Get total count for pagination (with same filters, but no limit/offset)
            total_count = insights.store.count_sessions_filtered(
                agent_id=agent_id,
                system_prompt_id=system_prompt_id,
                status=status,
            )
            sessions = insights.store.get_sessions_filtered(
                agent_id=agent_id,
                system_prompt_id=system_prompt_id,
                status=status,
                limit=limit,
                offset=offset,
            )
            return JSONResponse({
                "sessions": sessions,
                "total_count": total_count,
                "filters": {
                    "agent_id": agent_id,
                    "system_prompt_id": system_prompt_id,
                    "status": status,
                    "limit": limit,
                    "offset": offset,
                },
            })
        except Exception as e:
            logger.error(f"Error getting filtered sessions: {e}")
            return JSONResponse({"error": str(e)}, status_code=500)

    @app.get("/api/system-prompt/{system_prompt_id}")
    async def api_system_prompt(system_prompt_id: str):
        """Get system prompt details as JSON."""
        try:
            data = await insights.get_agent_data(system_prompt_id)
            return JSONResponse(data)
        except Exception as e:
            logger.error(f"Error getting system prompt data: {e}")
            return JSONResponse({"error": str(e)}, status_code=500)

    # Legacy endpoint for backward compatibility
    @app.get("/api/agent/{system_prompt_id}")
    async def api_agent(system_prompt_id: str):
        """Get system prompt details as JSON (legacy endpoint, use /api/system-prompt/{id} instead)."""
        try:
            data = await insights.get_agent_data(system_prompt_id)
            return JSONResponse(data)
        except Exception as e:
            logger.error(f"Error getting system prompt data: {e}")
            return JSONResponse({"error": str(e)}, status_code=500)

    @app.get("/api/session/{session_id}")
    async def api_session(session_id: str):
        """Get session details as JSON."""
        try:
            data = insights.get_session_data(session_id)
            return JSONResponse(data)
        except Exception as e:
            logger.error(f"Error getting session data: {e}")
            return JSONResponse({"error": str(e)}, status_code=500)

    @app.get("/api/config")
    async def api_config():
        """Get proxy configuration as JSON."""
        try:
            config = insights.get_proxy_config()
            return JSONResponse(config)
        except Exception as e:
            logger.error(f"Error getting config: {e}")
            return JSONResponse({"error": str(e)}, status_code=500)

    @app.get("/api/models")
    async def api_models():
        """Get available models with pricing information."""
        try:
            from .runtime.default_pricing import DEFAULT_PRICING_DATA
            from .runtime.model_pricing import get_last_updated

            models_by_provider = {}
            for provider, models_dict in DEFAULT_PRICING_DATA["models"].items():
                models_by_provider[provider] = [
                    {
                        "id": model_id,
                        "name": model_info.get("description", model_id),
                        "input": model_info.get("input", 0),
                        "output": model_info.get("output", 0)
                    }
                    for model_id, model_info in models_dict.items()
                ]

            return JSONResponse({
                "models": models_by_provider,
                "last_updated": get_last_updated()
            })
        except Exception as e:
            logger.error(f"Error getting models: {e}")
            return JSONResponse({"error": str(e)}, status_code=500)

    @app.get("/api/replay/config")
    async def api_replay_config():
        """Get configuration for replay requests."""
        try:
            config = insights.get_proxy_config()
            provider_type = config.get("provider_type", "unknown")
            base_url = config.get("provider_base_url", "")

            # Get API key from proxy config or environment
            api_key = insights.proxy_config.get("api_key")
            api_key_source = None

            if api_key:
                api_key_source = "proxy_config"
            else:
                # Try environment variables based on provider
                env_var_map = {
                    "openai": "OPENAI_API_KEY",
                    "anthropic": "ANTHROPIC_API_KEY",
                }
                env_var = env_var_map.get(provider_type)
                if env_var:
                    api_key = os.environ.get(env_var)
                    if api_key:
                        api_key_source = f"environment ({env_var})"

            # Mask API key for display (show only last 4 chars)
            masked_key = None
            if api_key:
                masked_key = "•" * 8 + api_key[-4:] if len(api_key) > 4 else "•" * len(api_key)

            return JSONResponse({
                "provider_type": provider_type,
                "base_url": base_url,
                "api_key_available": api_key is not None,
                "api_key_masked": masked_key,
                "api_key_source": api_key_source,
            })
        except Exception as e:
            logger.error(f"Error getting replay config: {e}")
            return JSONResponse({"error": str(e)}, status_code=500)

    @app.post("/api/replay")
    async def api_replay(request: Request):
        """Send a replay request directly to the LLM provider (not through proxy)."""
        try:
            body = await request.json()

            provider = body.get("provider", insights.proxy_config.get("provider_type", "openai"))
            base_url = body.get("base_url", insights.proxy_config.get("provider_base_url", ""))
            request_data = body.get("request_data", {})

            # Get API key: from request, proxy config, or environment
            api_key = body.get("api_key")
            if not api_key:
                api_key = insights.proxy_config.get("api_key")
            if not api_key:
                env_var_map = {
                    "openai": "OPENAI_API_KEY",
                    "anthropic": "ANTHROPIC_API_KEY",
                }
                env_var = env_var_map.get(provider)
                if env_var:
                    api_key = os.environ.get(env_var)

            if not api_key:
                return JSONResponse(
                    {"error": "No API key available. Please provide an API key."},
                    status_code=400
                )

            # Construct request based on provider
            # Handle base_url that may or may not include /v1
            base_url = base_url.rstrip('/')
            if provider == "openai":
                if base_url.endswith('/v1'):
                    url = f"{base_url}/chat/completions"
                else:
                    url = f"{base_url}/v1/chat/completions"
                headers = {
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                }
            elif provider == "anthropic":
                if base_url.endswith('/v1'):
                    url = f"{base_url}/messages"
                else:
                    url = f"{base_url}/v1/messages"
                headers = {
                    "x-api-key": api_key,
                    "Content-Type": "application/json",
                    "anthropic-version": "2023-06-01",
                }
            else:
                return JSONResponse(
                    {"error": f"Unsupported provider: {provider}"},
                    status_code=400
                )

            # Ensure stream is false for replay
            request_data["stream"] = False

            # Send request to LLM with timing
            start_time = time.time()
            async with httpx.AsyncClient(timeout=120.0) as client:
                response = await client.post(url, json=request_data, headers=headers)
                elapsed_ms = (time.time() - start_time) * 1000

                if response.status_code != 200:
                    return JSONResponse({
                        "error": f"LLM API error: {response.status_code}",
                        "details": response.text,
                    }, status_code=response.status_code)

                llm_response = response.json()

            # Calculate cost using model pricing
            from .runtime.model_pricing import get_model_pricing
            model_name = llm_response.get("model", request_data.get("model", ""))
            input_price, output_price = get_model_pricing(model_name)

            # Get token counts from usage
            usage = llm_response.get("usage", {})
            prompt_tokens = usage.get("prompt_tokens", 0) or usage.get("input_tokens", 0)
            completion_tokens = usage.get("completion_tokens", 0) or usage.get("output_tokens", 0)

            # Calculate cost (pricing is per 1M tokens)
            input_cost = (prompt_tokens / 1_000_000) * input_price
            output_cost = (completion_tokens / 1_000_000) * output_price
            total_cost = input_cost + output_cost

            # Parse response based on provider
            if provider == "openai":
                # Extract content from OpenAI response
                choices = llm_response.get("choices", [])
                content = []
                tool_calls = []

                if choices:
                    message = choices[0].get("message", {})
                    if message.get("content"):
                        content.append({"type": "text", "text": message["content"]})
                    if message.get("tool_calls"):
                        for tc in message["tool_calls"]:
                            tool_calls.append({
                                "name": tc.get("function", {}).get("name"),
                                "input": tc.get("function", {}).get("arguments"),
                            })
                            content.append({
                                "type": "tool_use",
                                "name": tc.get("function", {}).get("name"),
                                "input": tc.get("function", {}).get("arguments"),
                            })

                return JSONResponse({
                    "provider": provider,
                    "raw_response": llm_response,
                    "elapsed_ms": round(elapsed_ms, 2),
                    "cost": {
                        "input": round(input_cost, 6),
                        "output": round(output_cost, 6),
                        "total": round(total_cost, 6),
                    },
                    "parsed": {
                        "content": content,
                        "tool_calls": tool_calls,
                        "model": llm_response.get("model"),
                        "usage": llm_response.get("usage"),
                        "finish_reason": choices[0].get("finish_reason") if choices else None,
                    }
                })

            elif provider == "anthropic":
                # Extract content from Anthropic response
                content_blocks = llm_response.get("content", [])
                content = []
                tool_calls = []

                for block in content_blocks:
                    if block.get("type") == "text":
                        content.append({"type": "text", "text": block.get("text", "")})
                    elif block.get("type") == "tool_use":
                        tool_calls.append({
                            "name": block.get("name"),
                            "input": block.get("input"),
                        })
                        content.append({
                            "type": "tool_use",
                            "name": block.get("name"),
                            "input": block.get("input"),
                        })

                return JSONResponse({
                    "provider": provider,
                    "raw_response": llm_response,
                    "elapsed_ms": round(elapsed_ms, 2),
                    "cost": {
                        "input": round(input_cost, 6),
                        "output": round(output_cost, 6),
                        "total": round(total_cost, 6),
                    },
                    "parsed": {
                        "content": content,
                        "tool_calls": tool_calls,
                        "model": llm_response.get("model"),
                        "usage": llm_response.get("usage"),
                        "finish_reason": llm_response.get("stop_reason"),
                    }
                })

        except httpx.TimeoutException:
            return JSONResponse(
                {"error": "Request timed out. The LLM took too long to respond."},
                status_code=504
            )
        except Exception as e:
            logger.error(f"Error in replay request: {e}")
            return JSONResponse({"error": str(e)}, status_code=500)

    # ==================== Security Knowledge Endpoints ====================

    @app.get("/api/security/patterns")
    async def api_get_security_patterns(
        context: str = "all",
        min_severity: str = "LOW",
    ):
        """Get OWASP LLM security patterns for code analysis."""
        try:
            loader = get_kb_loader()
            patterns = loader.get_security_patterns(context=context, min_severity=min_severity)
            return JSONResponse({
                "patterns": patterns,
                "total_count": len(patterns),
                "context": context,
                "min_severity": min_severity,
            })
        except Exception as e:
            logger.error(f"Error getting security patterns: {e}")
            return JSONResponse({"error": str(e)}, status_code=500)

    @app.get("/api/security/owasp/{control_id}")
    async def api_get_owasp_control(control_id: str):
        """Get detailed info for a specific OWASP LLM control."""
        try:
            loader = get_kb_loader()
            control = loader.get_owasp_control(control_id)
            if not control:
                available = loader.get_all_owasp_controls()
                return JSONResponse({
                    "error": f"Control '{control_id}' not found",
                    "available_controls": available,
                }, status_code=404)
            return JSONResponse({
                "control": control,
                "control_id": control_id,
            })
        except Exception as e:
            logger.error(f"Error getting OWASP control: {e}")
            return JSONResponse({"error": str(e)}, status_code=500)

    @app.get("/api/security/fix-template/{finding_type}")
    async def api_get_fix_template(finding_type: str):
        """Get remediation template for fixing a security issue."""
        try:
            loader = get_kb_loader()
            template = loader.get_fix_template(finding_type)
            if not template:
                available = loader.get_all_fix_types()
                return JSONResponse({
                    "error": f"Template for '{finding_type}' not found",
                    "available_templates": available,
                }, status_code=404)
            return JSONResponse({
                "template": template,
                "finding_type": finding_type,
            })
        except Exception as e:
            logger.error(f"Error getting fix template: {e}")
            return JSONResponse({"error": str(e)}, status_code=500)

    # ==================== Findings API Endpoints ====================

    @app.get("/api/agent/{agent_id}/findings")
    async def api_get_agent_findings(
        agent_id: str,
        severity: Optional[str] = None,
        status: Optional[str] = None,
        limit: int = 100,
    ):
        """Get security findings for an agent."""
        try:
            findings = insights.store.get_findings(
                agent_id=agent_id,
                severity=severity.upper() if severity else None,
                status=status.upper() if status else None,
                limit=limit,
            )
            summary = insights.store.get_workflow_findings_summary(agent_id)
            return JSONResponse({
                "findings": findings,
                "summary": summary,
            })
        except Exception as e:
            logger.error(f"Error getting agent findings: {e}")
            return JSONResponse({"error": str(e)}, status_code=500)

    @app.get("/api/agent/{agent_id}/static-summary")
    async def api_get_static_summary(agent_id: str):
        """Get static analysis summary with categorized checks and gate status.
        
        Returns findings grouped into 5 security categories with pass/fail status,
        framework mappings, and overall gate status.
        """
        try:
            # Define check categories with their finding type prefixes
            CATEGORIES = {
                "PROMPT_SECURITY": {
                    "name": "Prompt Security",
                    "owasp_llm": "LLM01",
                    "prefixes": ["PROMPT_"],
                },
                "TOOL_SECURITY": {
                    "name": "Tool & Function Security",
                    "owasp_llm": "LLM08",
                    "prefixes": ["TOOL_"],
                },
                "DATA_SECURITY": {
                    "name": "Data & Secrets",
                    "owasp_llm": "LLM06",
                    "prefixes": ["SECRET_", "DATA_"],
                },
                "SUPPLY_CHAIN": {
                    "name": "Model & Supply Chain",
                    "owasp_llm": "LLM05",
                    "prefixes": ["MODEL_", "SUPPLY_", "API_"],
                },
                "BOUNDARIES": {
                    "name": "Behavioral Boundaries",
                    "owasp_llm": "LLM08/LLM09",
                    "prefixes": ["BOUNDARY_"],
                },
            }
            
            # Severity ordering for max severity calculation
            SEVERITY_ORDER = {"CRITICAL": 0, "HIGH": 1, "MEDIUM": 2, "LOW": 3, "INFO": 4}
            
            # Get all findings for this workflow
            findings = insights.store.get_findings(agent_id=agent_id, limit=1000)
            
            # Get latest STATIC analysis session
            sessions = insights.store.get_analysis_sessions(
                agent_id=agent_id, limit=10
            )
            static_sessions = [s for s in sessions if s.get("session_type") == "STATIC"]
            latest_session = static_sessions[0] if static_sessions else None
            
            # Group findings by category
            category_findings: dict = {cat_id: [] for cat_id in CATEGORIES}
            uncategorized = []
            
            for finding in findings:
                finding_type = finding.get("finding_type", "")
                matched = False
                for cat_id, cat_def in CATEGORIES.items():
                    for prefix in cat_def["prefixes"]:
                        if finding_type.startswith(prefix):
                            category_findings[cat_id].append(finding)
                            matched = True
                            break
                    if matched:
                        break
                if not matched:
                    uncategorized.append(finding)
            
            # Build checks response
            checks = []
            total_passed = 0
            total_failed = 0
            total_info = 0
            has_critical_or_high = False
            
            for cat_id, cat_def in CATEGORIES.items():
                cat_findings = category_findings[cat_id]
                findings_count = len(cat_findings)
                
                # Determine status: FAIL if any CRITICAL/HIGH open findings, INFO if MEDIUM/LOW, PASS if none
                open_findings = [f for f in cat_findings if f.get("status") == "OPEN"]
                critical_high = [f for f in open_findings if f.get("severity") in ["CRITICAL", "HIGH"]]
                
                if critical_high:
                    status = "FAIL"
                    total_failed += 1
                    has_critical_or_high = True
                elif open_findings:
                    status = "INFO"
                    total_info += 1
                else:
                    status = "PASS"
                    total_passed += 1
                
                # Calculate max severity
                max_severity = None
                if open_findings:
                    severities = [f.get("severity") for f in open_findings]
                    max_severity = min(severities, key=lambda s: SEVERITY_ORDER.get(s, 99))
                
                # Collect unique framework mappings from findings
                cwe_set = set()
                soc2_set = set()
                for f in cat_findings:
                    if f.get("cwe_mapping"):
                        cwe_set.update(f["cwe_mapping"] if isinstance(f["cwe_mapping"], list) else [])
                    if f.get("soc2_controls"):
                        soc2_set.update(f["soc2_controls"] if isinstance(f["soc2_controls"], list) else [])
                
                checks.append({
                    "category_id": cat_id,
                    "name": cat_def["name"],
                    "status": status,
                    "owasp_llm": cat_def["owasp_llm"],
                    "cwe": list(cwe_set) if cwe_set else None,
                    "soc2_controls": list(soc2_set) if soc2_set else None,
                    "findings_count": findings_count,
                    "max_severity": max_severity,
                    "findings": cat_findings,
                })
            
            # Build last_scan info
            last_scan = None
            if latest_session:
                duration_ms = None
                created_at = latest_session.get("created_at")
                completed_at = latest_session.get("completed_at")
                
                # Handle both float (Unix timestamp) and string (ISO) formats
                if isinstance(created_at, str):
                    try:
                        created_at = datetime.fromisoformat(created_at.replace('Z', '+00:00')).timestamp()
                    except (ValueError, AttributeError):
                        created_at = None
                if isinstance(completed_at, str):
                    try:
                        completed_at = datetime.fromisoformat(completed_at.replace('Z', '+00:00')).timestamp()
                    except (ValueError, AttributeError):
                        completed_at = None
                
                if completed_at and created_at:
                    duration_ms = int((completed_at - created_at) * 1000)
                
                # Build timestamp string
                timestamp_str = None
                if created_at:
                    timestamp_str = datetime.fromtimestamp(created_at, tz=timezone.utc).isoformat()

                last_scan = {
                    "timestamp": timestamp_str,
                    "scanned_by": "AI Assistant",
                    "files_analyzed": None,  # Could be added if tracked
                    "duration_ms": duration_ms,
                    "session_id": latest_session.get("session_id"),
                }
            
            # Determine gate status
            gate_status = "BLOCKED" if has_critical_or_high else "UNBLOCKED"
            
            return JSONResponse({
                "agent_id": agent_id,
                "last_scan": last_scan,
                "checks": checks,
                "summary": {
                    "total_checks": len(CATEGORIES),
                    "passed": total_passed,
                    "failed": total_failed,
                    "info": total_info,
                    "gate_status": gate_status,
                    "total_findings": len(findings),
                    "uncategorized_findings": len(uncategorized),
                },
            })
        except Exception as e:
            logger.error(f"Error getting static summary: {e}")
            return JSONResponse({"error": str(e)}, status_code=500)

    @app.get("/api/agent/{agent_id}/security-checks")
    async def api_get_agent_security_checks_grouped(
        agent_id: str,
        category_id: Optional[str] = None,
        status: Optional[str] = None,
        limit: int = 100,
    ):
        """Get security checks grouped by system prompt for an agent."""
        try:
            # Get all agents in workflow
            agents = insights.store.get_all_agents(agent_id=agent_id)

            # Build per-agent data
            agents_data = []
            total_checks = 0
            total_passed = 0
            total_warnings = 0
            total_critical = 0

            for agent in agents:
                checks = insights.store.get_latest_security_checks_for_agent(
                    agent.system_prompt_id
                )

                # Apply filters
                if category_id:
                    checks = [c for c in checks if c['category_id'] == category_id]
                if status:
                    checks = [c for c in checks if c['status'] == status.lower()]

                # Per-agent summary
                passed = sum(1 for c in checks if c['status'] == 'passed')
                warnings = sum(1 for c in checks if c['status'] == 'warning')
                critical = sum(1 for c in checks if c['status'] == 'critical')

                # Get latest check timestamp
                latest_check_at = None
                if checks:
                    timestamps = [c.get('created_at') for c in checks if c.get('created_at')]
                    if timestamps:
                        latest_check_at = max(timestamps)

                agents_data.append({
                    "system_prompt_id": agent.system_prompt_id,
                    "system_prompt_name": agent.id_short if hasattr(agent, 'id_short') else agent.system_prompt_id[:12],
                    "checks": checks[:limit],
                    "latest_check_at": latest_check_at,
                    "summary": {
                        "total": len(checks),
                        "passed": passed,
                        "warnings": warnings,
                        "critical": critical,
                    }
                })

                total_checks += len(checks)
                total_passed += passed
                total_warnings += warnings
                total_critical += critical

            # Total summary across all system prompts
            total_summary = {
                "total_checks": total_checks,
                "passed": total_passed,
                "warnings": total_warnings,
                "critical": total_critical,
                "system_prompts_analyzed": len(agents),
            }

            return JSONResponse({
                "agent_id": agent_id,
                "system_prompts": agents_data,
                "total_summary": total_summary,
            })
        except Exception as e:
            logger.error(f"Error getting agent security checks: {e}")
            return JSONResponse({"error": str(e)}, status_code=500)

    @app.post("/api/findings")
    async def api_store_finding(request: Request):
        """Store a security finding discovered during analysis."""
        try:
            body = await request.json()

            # Required fields
            session_id = body.get("session_id")
            file_path = body.get("file_path")
            finding_type = body.get("finding_type")
            severity = body.get("severity")
            title = body.get("title")

            if not all([session_id, file_path, finding_type, severity, title]):
                return JSONResponse({
                    "error": "Missing required fields",
                    "required": ["session_id", "file_path", "finding_type", "severity", "title"],
                }, status_code=400)

            # Validate severity
            try:
                severity_enum = FindingSeverity(severity.upper())
            except ValueError:
                return JSONResponse({
                    "error": f"Invalid severity '{severity}'",
                    "valid_severities": ["CRITICAL", "HIGH", "MEDIUM", "LOW"],
                }, status_code=400)

            # Get session to extract agent_id
            session = insights.store.get_analysis_session(session_id)
            if not session:
                return JSONResponse({"error": "Session not found"}, status_code=404)

            agent_id = session["agent_id"]

            # Optional fields
            description = body.get("description")
            line_start = body.get("line_start")
            line_end = body.get("line_end")
            code_snippet = body.get("code_snippet")
            context = body.get("context")
            owasp_mapping = body.get("owasp_mapping")

            # Build evidence
            evidence = {}
            if code_snippet:
                evidence["code_snippet"] = code_snippet
            if context:
                evidence["context"] = context

            finding_id = generate_finding_id()
            finding = insights.store.store_finding(
                finding_id=finding_id,
                session_id=session_id,
                agent_id=agent_id,
                file_path=file_path,
                finding_type=finding_type,
                severity=severity_enum.value,
                title=title,
                description=description,
                line_start=line_start,
                line_end=line_end,
                evidence=evidence if evidence else None,
                owasp_mapping=owasp_mapping,
            )

            return JSONResponse({"finding": finding})
        except Exception as e:
            logger.error(f"Error storing finding: {e}")
            return JSONResponse({"error": str(e)}, status_code=500)

    # ==================== Security Checks API Endpoints ====================

    @app.get("/api/system-prompt/{system_prompt_id}/security-checks")
    async def api_get_system_prompt_security_checks(
        system_prompt_id: str,
        category_id: Optional[str] = None,
        status: Optional[str] = None,
        limit: int = 100,
    ):
        """Get security checks for a system prompt (from latest analysis)."""
        try:
            # Get latest checks for the agent
            checks = insights.store.get_latest_security_checks_for_agent(system_prompt_id)

            # Apply filters
            if category_id:
                checks = [c for c in checks if c['category_id'] == category_id]
            if status:
                checks = [c for c in checks if c['status'] == status.lower()]

            # Apply limit
            checks = checks[:limit]

            # Get summary
            summary = insights.store.get_agent_security_summary(system_prompt_id)

            return JSONResponse({
                "system_prompt_id": system_prompt_id,
                "checks": checks,
                "summary": summary,
            })
        except Exception as e:
            logger.error(f"Error getting security checks: {e}")
            return JSONResponse({"error": str(e)}, status_code=500)

    @app.get("/api/system-prompt/{system_prompt_id}/behavioral-analysis")
    async def api_get_behavioral_analysis(system_prompt_id: str):
        """Get behavioral analysis data for a system prompt."""
        try:
            analysis = insights.store.get_latest_behavioral_analysis(system_prompt_id)
            
            if not analysis:
                return JSONResponse({
                    "system_prompt_id": system_prompt_id,
                    "has_data": False,
                    "message": "No behavioral analysis available yet",
                })
            
            return JSONResponse({
                "system_prompt_id": system_prompt_id,
                "has_data": True,
                "stability_score": analysis['stability_score'],
                "predictability_score": analysis['predictability_score'],
                "num_clusters": analysis['num_clusters'],
                "num_outliers": analysis['num_outliers'],
                "total_sessions": analysis['total_sessions'],
                "interpretation": analysis['interpretation'],
                "outlier_sessions": [o.get('session_id') for o in analysis.get('outliers', [])],
                "created_at": analysis['created_at'],
            })
        except Exception as e:
            logger.error(f"Error getting behavioral analysis: {e}")
            return JSONResponse({"error": str(e)}, status_code=500)

    @app.get("/api/agent/{agent_id}/behavioral-analysis")
    async def api_get_agent_behavioral_analysis(agent_id: str):
        """Get behavioral analysis data for all system prompts in an agent."""
        try:
            # Get all system prompts in this agent
            agents = insights.store.get_all_agents(agent_id=agent_id)
            
            analyses = []
            for agent in agents:
                analysis = insights.store.get_latest_behavioral_analysis(agent.system_prompt_id)
                if analysis:
                    analyses.append({
                        "system_prompt_id": agent.system_prompt_id,
                        "stability_score": analysis['stability_score'],
                        "predictability_score": analysis['predictability_score'],
                        "num_outliers": analysis['num_outliers'],
                        "total_sessions": analysis['total_sessions'],
                        "interpretation": analysis['interpretation'],
                        "outlier_sessions": [o.get('session_id') for o in analysis.get('outliers', [])],
                    })
            
            # Calculate aggregate if multiple system prompts
            if analyses:
                avg_stability = sum(a['stability_score'] for a in analyses) / len(analyses)
                avg_predictability = sum(a['predictability_score'] for a in analyses) / len(analyses)
                total_outliers = sum(a['num_outliers'] for a in analyses)
                total_sessions = sum(a['total_sessions'] for a in analyses)
            else:
                avg_stability = 0
                avg_predictability = 0
                total_outliers = 0
                total_sessions = 0
            
            return JSONResponse({
                "agent_id": agent_id,
                "has_data": len(analyses) > 0,
                "system_prompts_analyzed": len(analyses),
                "aggregate": {
                    "stability_score": avg_stability,
                    "predictability_score": avg_predictability,
                    "total_outliers": total_outliers,
                    "total_sessions": total_sessions,
                },
                "by_system_prompt": analyses,
            })
        except Exception as e:
            logger.error(f"Error getting agent behavioral analysis: {e}")
            return JSONResponse({"error": str(e)}, status_code=500)

    @app.get("/api/security-checks")
    async def api_get_security_checks(
        system_prompt_id: Optional[str] = None,
        analysis_session_id: Optional[str] = None,
        category_id: Optional[str] = None,
        status: Optional[str] = None,
        limit: int = 100,
    ):
        """Get security checks with optional filtering."""
        try:
            checks = insights.store.get_security_checks(
                system_prompt_id=system_prompt_id,
                analysis_session_id=analysis_session_id,
                category_id=category_id,
                status=status.lower() if status else None,
                limit=limit,
            )
            return JSONResponse({
                "checks": checks,
                "total_count": len(checks),
            })
        except Exception as e:
            logger.error(f"Error getting security checks: {e}")
            return JSONResponse({"error": str(e)}, status_code=500)

    @app.get("/api/sessions/analysis")
    async def api_get_analysis_sessions(
        agent_id: Optional[str] = None,
        status: Optional[str] = None,
        limit: int = 100,
    ):
        """List analysis sessions."""
        try:
            sessions = insights.store.get_analysis_sessions(
                agent_id=agent_id,
                status=status.upper() if status else None,
                limit=limit,
            )
            return JSONResponse({
                "sessions": sessions,
                "total_count": len(sessions),
            })
        except Exception as e:
            logger.error(f"Error getting analysis sessions: {e}")
            return JSONResponse({"error": str(e)}, status_code=500)

    @app.post("/api/sessions/analysis")
    async def api_create_analysis_session(request: Request):
        """Create a new analysis session for a workflow."""
        try:
            body = await request.json()
            agent_id = body.get("agent_id")
            session_type = body.get("session_type", "STATIC")
            workflow_name = body.get("workflow_name")

            if not agent_id:
                return JSONResponse({"error": "agent_id is required"}, status_code=400)

            # Validate session_type
            try:
                session_type_enum = SessionType(session_type.upper())
            except ValueError:
                return JSONResponse({
                    "error": f"Invalid session_type '{session_type}'",
                    "valid_types": ["STATIC", "DYNAMIC", "AUTOFIX"],
                }, status_code=400)

            session_id = generate_session_id()
            session = insights.store.create_analysis_session(
                session_id=session_id,
                agent_id=agent_id,
                session_type=session_type_enum.value,
                workflow_name=workflow_name,
            )

            return JSONResponse({"session": session})
        except Exception as e:
            logger.error(f"Error creating analysis session: {e}")
            return JSONResponse({"error": str(e)}, status_code=500)

    @app.post("/api/sessions/analysis/{session_id}/complete")
    async def api_complete_analysis_session(session_id: str, request: Request):
        """Complete an analysis session and calculate risk score."""
        try:
            body = await request.json() if await request.body() else {}
            calculate_risk = body.get("calculate_risk", True)

            # Verify session exists
            session = insights.store.get_analysis_session(session_id)
            if not session:
                return JSONResponse({"error": "Session not found"}, status_code=404)

            # Calculate risk score if requested
            risk_score = None
            if calculate_risk:
                findings = insights.store.get_findings(session_id=session_id)
                finding_objects = []
                for f in findings:
                    try:
                        evidence_data = f.get("evidence")
                        if isinstance(evidence_data, dict):
                            f["evidence"] = FindingEvidence(**evidence_data)
                        elif evidence_data is None:
                            f["evidence"] = FindingEvidence()
                        finding_obj = Finding(**f)
                        finding_objects.append(finding_obj)
                    except Exception:
                        pass  # Skip invalid findings
                risk_score = calculate_risk_score(finding_objects)

            completed_session = insights.store.complete_analysis_session(
                session_id=session_id,
                risk_score=risk_score,
            )

            return JSONResponse({
                "session": completed_session,
                "risk_score": risk_score,
            })
        except Exception as e:
            logger.error(f"Error completing analysis session: {e}")
            return JSONResponse({"error": str(e)}, status_code=500)

    @app.get("/api/session/{session_id}/analysis")
    async def api_get_analysis_session(session_id: str):
        """Get a specific analysis session."""
        try:
            session = insights.store.get_analysis_session(session_id)
            if not session:
                return JSONResponse({"error": "Session not found"}, status_code=404)
            return JSONResponse(session)
        except Exception as e:
            logger.error(f"Error getting analysis session: {e}")
            return JSONResponse({"error": str(e)}, status_code=500)

    @app.get("/api/session/{session_id}/findings")
    async def api_get_session_findings(
        session_id: str,
        severity: Optional[str] = None,
        status: Optional[str] = None,
        limit: int = 100,
    ):
        """Get findings for a specific analysis session."""
        try:
            findings = insights.store.get_findings(
                session_id=session_id,
                severity=severity.upper() if severity else None,
                status=status.upper() if status else None,
                limit=limit,
            )
            session = insights.store.get_analysis_session(session_id)
            return JSONResponse({
                "session": session,
                "findings": findings,
                "total_count": len(findings),
            })
        except Exception as e:
            logger.error(f"Error getting session findings: {e}")
            return JSONResponse({"error": str(e)}, status_code=500)

    @app.patch("/api/finding/{finding_id}")
    async def api_update_finding(finding_id: str, request: Request):
        """Update a finding's status."""
        try:
            body = await request.json()
            status = body.get("status")
            notes = body.get("notes")

            if not status:
                return JSONResponse({"error": "status is required"}, status_code=400)

            finding = insights.store.update_finding_status(
                finding_id=finding_id,
                status=status.upper(),
                notes=notes,
            )

            if not finding:
                return JSONResponse({"error": "Finding not found"}, status_code=404)

            return JSONResponse(finding)
        except Exception as e:
            logger.error(f"Error updating finding: {e}")
            return JSONResponse({"error": str(e)}, status_code=500)

    # ==================== IDE Connection Status Endpoints ====================

    # ==================== Recommendations API Endpoints ====================

    @app.get("/api/agent/{agent_id}/recommendations")
    async def api_get_agent_recommendations(
        agent_id: str,
        status: Optional[str] = None,
        severity: Optional[str] = None,
        blocking_only: bool = False,
        limit: int = 100,
    ):
        """Get recommendations for an agent."""
        try:
            recommendations = insights.store.get_recommendations(
                agent_id=agent_id,
                status=status.upper() if status else None,
                severity=severity.upper() if severity else None,
                blocking_only=blocking_only,
                limit=limit,
            )

            # Build summary
            by_status = {}
            by_severity = {}
            for rec in recommendations:
                s = rec.get("status", "UNKNOWN")
                sev = rec.get("severity", "UNKNOWN")
                by_status[s] = by_status.get(s, 0) + 1
                by_severity[sev] = by_severity.get(sev, 0) + 1

            return JSONResponse({
                "recommendations": recommendations,
                "total_count": len(recommendations),
                "summary": {
                    "by_status": by_status,
                    "by_severity": by_severity,
                }
            })
        except Exception as e:
            logger.error(f"Error getting agent recommendations: {e}")
            return JSONResponse({"error": str(e)}, status_code=500)

    @app.get("/api/recommendations/{recommendation_id}")
    async def api_get_recommendation_detail(recommendation_id: str):
        """Get full recommendation details by ID."""
        try:
            rec = insights.store.get_recommendation(recommendation_id)
            if not rec:
                return JSONResponse({"error": "Recommendation not found"}, status_code=404)

            # Get source finding if available
            finding = None
            if rec.get("source_finding_id"):
                finding = insights.store.get_finding(rec["source_finding_id"])

            return JSONResponse({
                "recommendation": rec,
                "finding": finding,
                "context": {
                    "agent_id": rec.get("agent_id"),
                    "related_files": rec.get("related_files", []),
                    "file_path": rec.get("file_path"),
                    "line_start": rec.get("line_start"),
                    "line_end": rec.get("line_end"),
                    "code_snippet": rec.get("code_snippet"),
                },
                "mappings": {
                    "owasp_llm": rec.get("owasp_llm"),
                    "cwe": rec.get("cwe"),
                    "mitre_atlas": rec.get("mitre_atlas"),
                    "soc2_controls": rec.get("soc2_controls", []),
                    "nist_csf": rec.get("nist_csf"),
                },
                "fix_command": f"Fix security issue {recommendation_id}",
            })
        except Exception as e:
            logger.error(f"Error getting recommendation detail: {e}")
            return JSONResponse({"error": str(e)}, status_code=500)

    @app.get("/api/agent/{agent_id}/gate-status")
    async def api_get_gate_status(agent_id: str):
        """Get gate status for Production deployment."""
        try:
            status = insights.store.get_gate_status(agent_id)

            if status["gate_status"] == "BLOCKED":
                message = f"🚫 Production BLOCKED - {status['blocking_count']} issue(s) must be resolved"
            else:
                message = "✅ Production UNBLOCKED - all critical/high issues resolved"

            return JSONResponse({
                **status,
                "message": message,
            })
        except Exception as e:
            logger.error(f"Error getting gate status: {e}")
            return JSONResponse({"error": str(e)}, status_code=500)

    @app.post("/api/recommendations/{recommendation_id}/dismiss")
    async def api_dismiss_recommendation(recommendation_id: str, request: Request):
        """Dismiss or ignore a recommendation."""
        try:
            body = await request.json()
            reason = body.get("reason")
            dismiss_type = body.get("dismiss_type", "DISMISSED")

            if not reason:
                return JSONResponse(
                    {"error": "reason is required for audit trail"},
                    status_code=400
                )

            rec = insights.store.dismiss_recommendation(
                recommendation_id=recommendation_id,
                reason=reason,
                dismiss_type=dismiss_type,
            )

            if not rec:
                return JSONResponse({"error": "Recommendation not found"}, status_code=404)

            type_desc = "Risk accepted" if dismiss_type == "DISMISSED" else "False positive"
            return JSONResponse({
                "recommendation": rec,
                "message": f"📝 {recommendation_id} marked as {dismiss_type}: {type_desc}",
            })
        except Exception as e:
            logger.error(f"Error dismissing recommendation: {e}")
            return JSONResponse({"error": str(e)}, status_code=500)

    @app.get("/api/recommendations/{recommendation_id}/audit-log")
    async def api_get_recommendation_audit_log(
        recommendation_id: str,
        limit: int = 100,
    ):
        """Get audit log entries for a specific recommendation."""
        try:
            # Verify recommendation exists
            rec = insights.store.get_recommendation(recommendation_id)
            if not rec:
                return JSONResponse({"error": "Recommendation not found"}, status_code=404)

            # Get audit log entries for this recommendation
            entries = insights.store.get_audit_log(
                entity_id=recommendation_id,
                limit=limit,
            )

            return JSONResponse({
                "recommendation_id": recommendation_id,
                "audit_log": entries,
                "total_count": len(entries),
            })
        except Exception as e:
            logger.error(f"Error getting recommendation audit log: {e}")
            return JSONResponse({"error": str(e)}, status_code=500)

    @app.post("/api/agent/{agent_id}/backfill-recommendations")
    async def api_backfill_recommendations(agent_id: str):
        """Backfill recommendations from existing findings.
        
        Creates recommendations for findings that don't have them yet.
        Useful after upgrading to the new recommendation system.
        """
        try:
            result = insights.store.backfill_recommendations_from_findings(agent_id)
            return JSONResponse({
                "success": True,
                "agent_id": agent_id,
                **result,
                "message": f"Created {result['created_count']} recommendations from {result['total_findings']} findings",
            })
        except Exception as e:
            logger.error(f"Error backfilling recommendations: {e}")
            return JSONResponse({"error": str(e)}, status_code=500)

    @app.get("/api/agent/{agent_id}/audit-log")
    async def api_get_agent_audit_log(
        agent_id: str,
        entity_type: Optional[str] = None,
        limit: int = 100,
    ):
        """Get audit log entries for an agent's recommendations."""
        try:
            # First get all recommendation IDs for this workflow
            recommendations = insights.store.get_recommendations(
                agent_id=agent_id, limit=1000
            )
            rec_ids = [r["recommendation_id"] for r in recommendations]

            # Get audit log entries for these recommendations
            all_entries = []
            for rec_id in rec_ids:
                entries = insights.store.get_audit_log(
                    entity_type=entity_type.upper() if entity_type else None,
                    entity_id=rec_id,
                    limit=limit,
                )
                all_entries.extend(entries)

            # Sort by performed_at descending and limit
            all_entries.sort(key=lambda x: x["performed_at"], reverse=True)
            all_entries = all_entries[:limit]

            return JSONResponse({
                "audit_log": all_entries,
                "total_count": len(all_entries),
            })
        except Exception as e:
            logger.error(f"Error getting audit log: {e}")
            return JSONResponse({"error": str(e)}, status_code=500)

    # ==================== IDE Connection Status Endpoints ====================

    @app.get("/api/ide/status")
    async def api_ide_connection_status(agent_id: Optional[str] = None):
        """Get IDE connection status for the dashboard.

        Args:
            agent_id: Optional filter by workflow being developed

        Returns:
            JSON with connection status, active connections, and history
        """
        try:
            status = insights.store.get_ide_connection_status(agent_id=agent_id)
            return JSONResponse(status)
        except Exception as e:
            logger.error(f"Error getting IDE connection status: {e}")
            return JSONResponse({"error": str(e)}, status_code=500)

    @app.get("/api/ide/connections")
    async def api_ide_connections(
        agent_id: Optional[str] = None,
        ide_type: Optional[str] = None,
        active_only: bool = True,
        limit: int = 100,
    ):
        """Get IDE connections with filtering.

        Args:
            agent_id: Filter by workflow
            ide_type: Filter by IDE type (cursor, claude-code, vscode)
            active_only: Only return active connections
            limit: Maximum number of connections

        Returns:
            JSON with list of connections
        """
        try:
            connections = insights.store.get_ide_connections(
                agent_id=agent_id,
                ide_type=ide_type,
                active_only=active_only,
                limit=limit,
            )
            return JSONResponse({
                "connections": connections,
                "total_count": len(connections),
            })
        except Exception as e:
            logger.error(f"Error getting IDE connections: {e}")
            return JSONResponse({"error": str(e)}, status_code=500)

    @app.get("/health")
    async def health():
        """Health check endpoint."""
        return {"status": "ok", "service": "live_trace"}

    # Serve React app for all other routes (SPA fallback)
    @app.get("/{full_path:path}")
    async def serve_react_app(full_path: str):
        """Serve the React SPA for all non-API routes."""
        index_file = STATIC_DIR / "index.html"

        if index_file.exists():
            return FileResponse(index_file)
        else:
            # React build doesn't exist - show helpful error
            logger.warning(f"React build not found at {index_file}. Please build the frontend first.")
            return HTMLResponse(
                """
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Live Trace Dashboard - Setup Required</title>
                    <style>
                        body {
                            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                            max-width: 800px;
                            margin: 50px auto;
                            padding: 20px;
                            line-height: 1.6;
                        }
                        h1 { color: #6366f1; }
                        pre {
                            background: #f1f5f9;
                            padding: 15px;
                            border-radius: 4px;
                            overflow-x: auto;
                        }
                        code { color: #6366f1; }
                        .option { margin: 20px 0; }
                    </style>
                </head>
                <body>
                    <h1>🔍 Live Trace Dashboard</h1>
                    <p>The React frontend is not built yet. Choose one of these options:</p>

                    <div class="option">
                        <h3>Option 1: Development Mode (Recommended)</h3>
                        <pre>cd src/interceptors/live_trace/frontend
npm install
npm run dev</pre>
                        <p>Then visit <a href="http://localhost:5173">http://localhost:5173</a></p>
                    </div>

                    <div class="option">
                        <h3>Option 2: Production Build</h3>
                        <pre>cd src/interceptors/live_trace/frontend
npm install
npm run build</pre>
                        <p>Then refresh this page.</p>
                    </div>

                    <p><strong>API Status:</strong> <code style="color: #10b981;">✓ Running</code> -
                    All API endpoints at <a href="/api/dashboard">/api/*</a> are available.</p>
                </body>
                </html>
                """,
                status_code=503
            )

    return app
