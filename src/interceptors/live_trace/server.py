"""FastAPI server for the live trace dashboard."""
import os
import time
from importlib.metadata import version as get_package_version, PackageNotFoundError
from pathlib import Path
from typing import Optional

import httpx
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

from src.kb.loader import get_kb_loader
from src.utils.logger import get_logger


def _get_version() -> str:
    """Get package version from installed metadata."""
    try:
        return get_package_version("cylestio-perimeter")
    except PackageNotFoundError:
        return "unknown"

from .runtime.engine import InsightsEngine
from .mcp import create_mcp_router
from .mcp.security import LocalhostSecurityMiddleware
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


def create_trace_server(insights: InsightsEngine, refresh_interval: int = 2) -> FastAPI:
    """Create the FastAPI application for the trace dashboard.

    Args:
        insights: InsightsEngine instance
        refresh_interval: Page refresh interval in seconds

    Returns:
        FastAPI application
    """
    app = FastAPI(
        title="Live Trace Dashboard",
        description="Real-time tracing and debugging dashboard",
        version=_get_version()
    )

    # Add CORS middleware for local development security
    # Only allow requests from localhost origins
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            "http://localhost:5173",    # Vite dev server (legacy)
            "http://127.0.0.1:5173",
            "http://localhost:7500",    # Vite dev server (current)
            "http://127.0.0.1:7500",
            "http://localhost:7100",    # Dashboard itself
            "http://127.0.0.1:7100",
        ],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.add_middleware(LocalhostSecurityMiddleware)

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
    async def api_dashboard(agent_workflow_id: Optional[str] = None):
        """Get complete dashboard data as JSON, optionally filtered by agent workflow."""
        try:
            data = await insights.get_dashboard_data(agent_workflow_id=agent_workflow_id)
            data["refresh_interval"] = refresh_interval
            return JSONResponse(data)
        except Exception as e:
            logger.error(f"Error getting dashboard data: {e}")
            return JSONResponse({"error": str(e)}, status_code=500)

    @app.get("/api/agent-workflows")
    async def api_agent_workflows():
        """Get all agent workflows with agent counts."""
        try:
            agent_workflows = insights.store.get_agent_workflows()
            return JSONResponse({"agent_workflows": agent_workflows})
        except Exception as e:
            logger.error(f"Error getting agent workflows: {e}")
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

    @app.get("/api/agents")
    async def api_agents():
        """Get all agents as JSON."""
        try:
            data = await insights.get_dashboard_data()
            return JSONResponse(data["agents"])
        except Exception as e:
            logger.error(f"Error getting agents: {e}")
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
        agent_workflow_id: Optional[str] = None,
        agent_id: Optional[str] = None,
        status: Optional[str] = None,
        cluster_id: Optional[str] = None,
        tags: Optional[str] = None,
        limit: int = 10,
        offset: int = 0,
    ):
        """Get sessions with filtering by agent_workflow_id, agent_id, status, cluster_id, and/or tags.

        Args:
            agent_workflow_id: Filter by agent workflow ID. Use "unassigned" for sessions without agent workflow.
            agent_id: Filter by agent ID.
            status: Filter by status - "ACTIVE", "INACTIVE", or "COMPLETED".
            cluster_id: Filter by behavioral cluster ID (e.g., "cluster_1").
            tags: Comma-separated list of tags to filter by. Each tag can be "key:value" or just "key".
                  All tags must match (AND logic).
            limit: Maximum number of sessions to return (default 10).
            offset: Number of sessions to skip for pagination (default 0).

        Returns:
            JSON response with sessions list and metadata.
        """
        try:
            # Parse comma-separated tags into list
            tags_list = [t.strip() for t in tags.split(",")] if tags else None

            # Get total count for pagination (with same filters, but no limit/offset)
            total_count = insights.store.count_sessions_filtered(
                agent_workflow_id=agent_workflow_id,
                agent_id=agent_id,
                status=status,
                cluster_id=cluster_id,
                tags=tags_list,
            )
            sessions = insights.store.get_sessions_filtered(
                agent_workflow_id=agent_workflow_id,
                agent_id=agent_id,
                status=status,
                cluster_id=cluster_id,
                tags=tags_list,
                limit=limit,
                offset=offset,
            )
            return JSONResponse({
                "sessions": sessions,
                "total_count": total_count,
                "filters": {
                    "agent_workflow_id": agent_workflow_id,
                    "agent_id": agent_id,
                    "status": status,
                    "cluster_id": cluster_id,
                    "tags": tags,
                    "limit": limit,
                    "offset": offset,
                },
            })
        except Exception as e:
            logger.error(f"Error getting filtered sessions: {e}")
            return JSONResponse({"error": str(e)}, status_code=500)

    @app.get("/api/sessions/tags")
    async def api_sessions_tags(
        agent_workflow_id: Optional[str] = None,
    ):
        """Get all unique tag keys and values from sessions.

        Args:
            agent_workflow_id: Filter by agent workflow ID. Use "unassigned" for sessions without agent workflow.

        Returns:
            List of tag suggestions with key and values array.
        """
        try:
            tags = insights.store.get_session_tags(
                agent_workflow_id=agent_workflow_id,
            )
            return JSONResponse({
                "tags": tags,
            })
        except Exception as e:
            logger.error(f"Error getting session tags: {e}")
            return JSONResponse({"error": str(e)}, status_code=500)

    @app.get("/api/agent/{agent_id}")
    async def api_agent(agent_id: str):
        """Get agent details as JSON."""
        try:
            data = await insights.get_agent_data(agent_id)
            return JSONResponse(data)
        except Exception as e:
            logger.error(f"Error getting agent data: {e}")
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

    # ==================== Security Check Definitions Endpoint ====================

    @app.get("/api/security-check-definitions")
    async def api_get_security_check_definitions():
        """Get all dynamic security check definitions (single source of truth).

        Returns check definitions with framework mappings and category metadata.
        Frontend should fetch this once on app load and cache.
        """
        try:
            from .runtime.security import (
                get_all_check_definitions,
                DYNAMIC_CATEGORY_DEFINITIONS,
            )

            return JSONResponse({
                "dynamic_checks": get_all_check_definitions(),
                "dynamic_categories": DYNAMIC_CATEGORY_DEFINITIONS,
            })
        except Exception as e:
            logger.error(f"Error getting security check definitions: {e}")
            return JSONResponse({"error": str(e)}, status_code=500)

    # ==================== Findings API Endpoints ====================

    @app.get("/api/agent-workflow/{agent_workflow_id}/findings")
    async def api_get_agent_workflow_findings(
        agent_workflow_id: str,
        severity: Optional[str] = None,
        status: Optional[str] = None,
        limit: int = 100,
    ):
        """Get security findings for an agent workflow."""
        try:
            findings = insights.store.get_findings(
                agent_workflow_id=agent_workflow_id,
                severity=severity.upper() if severity else None,
                status=status.upper() if status else None,
                limit=limit,
            )
            summary = insights.store.get_agent_workflow_findings_summary(agent_workflow_id)
            return JSONResponse({
                "findings": findings,
                "summary": summary,
            })
        except Exception as e:
            logger.error(f"Error getting agent workflow findings: {e}")
            return JSONResponse({"error": str(e)}, status_code=500)

    @app.get("/api/agent-workflow/{agent_workflow_id}/security-checks")
    async def api_get_agent_workflow_security_checks(
        agent_workflow_id: str,
        category_id: Optional[str] = None,
        status: Optional[str] = None,
        limit: int = 100,
    ):
        """Get security checks grouped by agent for an agent workflow."""
        try:
            # Get all agents in agent workflow
            agents = insights.store.get_all_agents(agent_workflow_id=agent_workflow_id)

            # Build per-agent data
            agents_data = []
            total_checks = 0
            total_passed = 0
            total_warnings = 0
            total_critical = 0

            for agent in agents:
                checks = insights.store.get_latest_security_checks_for_agent(
                    agent.agent_id
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
                    "agent_id": agent.agent_id,
                    "agent_name": agent.id_short if hasattr(agent, 'id_short') else agent.agent_id[:12],
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

            # Check if PII analysis is available (look for PRIVACY_COMPLIANCE category)
            has_pii_checks = any(
                any(c.get('category_id') == 'PRIVACY_COMPLIANCE' for c in agent_data['checks'])
                for agent_data in agents_data
            )
            pii_status = "complete" if has_pii_checks else "not_available"

            # Total summary across all agents
            total_summary = {
                "total_checks": total_checks,
                "passed": total_passed,
                "warnings": total_warnings,
                "critical": total_critical,
                "agents_analyzed": len(agents),
                "pii_status": pii_status,
            }

            return JSONResponse({
                "agent_workflow_id": agent_workflow_id,
                "agents": agents_data,
                "total_summary": total_summary,
            })
        except Exception as e:
            logger.error(f"Error getting agent workflow security checks: {e}")
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

            # Get session to extract agent_workflow_id
            session = insights.store.get_analysis_session(session_id)
            if not session:
                return JSONResponse({"error": "Session not found"}, status_code=404)

            agent_workflow_id = session["agent_workflow_id"]

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
                agent_workflow_id=agent_workflow_id,
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

    @app.get("/api/agent/{agent_id}/security-checks")
    async def api_get_agent_security_checks(
        agent_id: str,
        category_id: Optional[str] = None,
        status: Optional[str] = None,
        limit: int = 100,
    ):
        """Get security checks for an agent (from latest analysis)."""
        try:
            # Get latest checks for the agent
            checks = insights.store.get_latest_security_checks_for_agent(agent_id)

            # Apply filters
            if category_id:
                checks = [c for c in checks if c['category_id'] == category_id]
            if status:
                checks = [c for c in checks if c['status'] == status.lower()]

            # Apply limit
            checks = checks[:limit]

            # Get summary
            summary = insights.store.get_agent_security_summary(agent_id)

            # Check if PII analysis is available (look for PRIVACY_COMPLIANCE category)
            has_pii_checks = any(
                c.get('category_id') == 'PRIVACY_COMPLIANCE' for c in checks
            )
            pii_status = "complete" if has_pii_checks else "not_available"

            return JSONResponse({
                "agent_id": agent_id,
                "checks": checks,
                "summary": {**summary, "pii_status": pii_status},
            })
        except Exception as e:
            logger.error(f"Error getting security checks: {e}")
            return JSONResponse({"error": str(e)}, status_code=500)

    @app.get("/api/security-checks")
    async def api_get_security_checks(
        agent_id: Optional[str] = None,
        analysis_session_id: Optional[str] = None,
        category_id: Optional[str] = None,
        status: Optional[str] = None,
        limit: int = 100,
    ):
        """Get security checks with optional filtering."""
        try:
            checks = insights.store.get_security_checks(
                agent_id=agent_id,
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
        agent_workflow_id: Optional[str] = None,
        status: Optional[str] = None,
        limit: int = 100,
    ):
        """List analysis sessions."""
        try:
            sessions = insights.store.get_analysis_sessions(
                agent_workflow_id=agent_workflow_id,
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
        """Create a new analysis session for an agent workflow."""
        try:
            body = await request.json()
            agent_workflow_id = body.get("agent_workflow_id")
            session_type = body.get("session_type", "STATIC")
            agent_workflow_name = body.get("agent_workflow_name")

            if not agent_workflow_id:
                return JSONResponse({"error": "agent_workflow_id is required"}, status_code=400)

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
                agent_workflow_id=agent_workflow_id,
                session_type=session_type_enum.value,
                agent_workflow_name=agent_workflow_name,
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

    # Note: api_get_session_findings is defined later in the file with additional
    # severity_breakdown field. That definition handles all use cases.

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

    # ==================== Recommendations API Endpoints ====================

    @app.get("/api/workflow/{workflow_id}/recommendations")
    async def api_get_workflow_recommendations(
        workflow_id: str,
        status: Optional[str] = None,
        severity: Optional[str] = None,
        category: Optional[str] = None,
        blocking_only: bool = False,
        limit: int = 100,
    ):
        """Get recommendations for a workflow."""
        try:
            recommendations = insights.store.get_recommendations(
                workflow_id=workflow_id,
                status=status.upper() if status else None,
                severity=severity.upper() if severity else None,
                category=category.upper() if category else None,
                blocking_only=blocking_only,
                limit=limit,
            )
            return JSONResponse({
                "recommendations": recommendations,
                "total_count": len(recommendations),
                "workflow_id": workflow_id,
            })
        except Exception as e:
            logger.error(f"Error getting recommendations: {e}")
            return JSONResponse({"error": str(e)}, status_code=500)

    @app.get("/api/recommendations/{recommendation_id}")
    async def api_get_recommendation(recommendation_id: str):
        """Get a specific recommendation by ID."""
        try:
            recommendation = insights.store.get_recommendation(recommendation_id)
            if not recommendation:
                return JSONResponse({"error": "Recommendation not found"}, status_code=404)

            # Also get the linked finding details
            finding = insights.store.get_finding(recommendation['source_finding_id'])

            # Get audit history for this recommendation
            audit_log = insights.store.get_audit_log(
                entity_type='recommendation',
                entity_id=recommendation_id,
                limit=20,
            )

            return JSONResponse({
                "recommendation": recommendation,
                "finding": finding,
                "audit_log": audit_log,
            })
        except Exception as e:
            logger.error(f"Error getting recommendation: {e}")
            return JSONResponse({"error": str(e)}, status_code=500)

    @app.post("/api/recommendations/{recommendation_id}/start-fix")
    async def api_start_fix(recommendation_id: str, request: Request):
        """Start working on a fix for a recommendation."""
        try:
            body = await request.json() if await request.body() else {}
            fixed_by = body.get("fixed_by")

            recommendation = insights.store.start_fix(
                recommendation_id=recommendation_id,
                fixed_by=fixed_by,
            )

            if not recommendation:
                return JSONResponse({"error": "Recommendation not found"}, status_code=404)

            return JSONResponse({
                "recommendation": recommendation,
                "message": f"Fix started for {recommendation_id}",
            })
        except Exception as e:
            logger.error(f"Error starting fix: {e}")
            return JSONResponse({"error": str(e)}, status_code=500)

    @app.post("/api/recommendations/{recommendation_id}/complete-fix")
    async def api_complete_fix(recommendation_id: str, request: Request):
        """Mark a recommendation as fixed."""
        try:
            body = await request.json() if await request.body() else {}

            recommendation = insights.store.complete_fix(
                recommendation_id=recommendation_id,
                fix_notes=body.get("fix_notes"),
                files_modified=body.get("files_modified"),
                fix_commit=body.get("fix_commit"),
                fix_method=body.get("fix_method"),
                fixed_by=body.get("fixed_by"),
            )

            if not recommendation:
                return JSONResponse({"error": "Recommendation not found"}, status_code=404)

            return JSONResponse({
                "recommendation": recommendation,
                "message": f"Fix completed for {recommendation_id}",
            })
        except Exception as e:
            logger.error(f"Error completing fix: {e}")
            return JSONResponse({"error": str(e)}, status_code=500)

    @app.post("/api/recommendations/{recommendation_id}/verify")
    async def api_verify_fix(recommendation_id: str, request: Request):
        """Verify a fix for a recommendation."""
        try:
            body = await request.json()
            verification_result = body.get("verification_result")
            success = body.get("success", True)
            verified_by = body.get("verified_by")

            if not verification_result:
                return JSONResponse({"error": "verification_result is required"}, status_code=400)

            recommendation = insights.store.verify_fix(
                recommendation_id=recommendation_id,
                verification_result=verification_result,
                success=success,
                verified_by=verified_by,
            )

            if not recommendation:
                return JSONResponse({"error": "Recommendation not found"}, status_code=404)

            return JSONResponse({
                "recommendation": recommendation,
                "message": f"Verification {'passed' if success else 'failed'} for {recommendation_id}",
            })
        except Exception as e:
            logger.error(f"Error verifying fix: {e}")
            return JSONResponse({"error": str(e)}, status_code=500)

    @app.post("/api/recommendations/{recommendation_id}/dismiss")
    async def api_dismiss_recommendation(recommendation_id: str, request: Request):
        """Dismiss or ignore a recommendation."""
        try:
            body = await request.json()
            reason = body.get("reason")
            dismiss_type = body.get("dismiss_type", "DISMISSED")
            dismissed_by = body.get("dismissed_by")

            if not reason:
                return JSONResponse({"error": "reason is required"}, status_code=400)

            recommendation = insights.store.dismiss_recommendation(
                recommendation_id=recommendation_id,
                reason=reason,
                dismiss_type=dismiss_type,
                dismissed_by=dismissed_by,
            )

            if not recommendation:
                return JSONResponse({"error": "Recommendation not found"}, status_code=404)

            return JSONResponse({
                "recommendation": recommendation,
                "message": f"Recommendation {recommendation_id} dismissed",
            })
        except Exception as e:
            logger.error(f"Error dismissing recommendation: {e}")
            return JSONResponse({"error": str(e)}, status_code=500)

    @app.get("/api/workflow/{workflow_id}/production-readiness")
    async def api_get_production_readiness(workflow_id: str):
        """Get production readiness status for a workflow.

        Single source of truth for static/dynamic analysis status and gate status.
        Used by both the Overview page ProductionReadiness component and the
        sidebar Security Checks timeline.

        Returns:
            - static_analysis: status (pending/running/completed), critical_count
            - dynamic_analysis: status (pending/running/completed), critical_count
            - gate: is_blocked, blocking_count, state (BLOCKED/OPEN)
        """
        try:
            readiness = insights.store.get_production_readiness(workflow_id)
            return JSONResponse(readiness)
        except Exception as e:
            logger.error(f"Error getting production readiness: {e}")
            return JSONResponse({"error": str(e)}, status_code=500)

    @app.get("/api/workflow/{workflow_id}/compliance-report")
    async def api_get_compliance_report(workflow_id: str, report_type: str = "security_assessment", save: bool = False):
        """Generate a compliance report for the workflow.

        Query params:
        - report_type: security_assessment (default)
        - save: if true, saves the report to history

        Returns a comprehensive report including:
        - Executive summary with gate status and decision
        - OWASP LLM Top 10 coverage
        - SOC2 compliance status
        - Security checks by category
        - Remediation summary
        - Audit trail
        - Blocking items detail
        """
        try:
            report = insights.store.generate_compliance_report(workflow_id)
            report["report_type"] = report_type

            # Save to history if requested
            if save:
                report_id = insights.store.save_report(
                    workflow_id=workflow_id,
                    report_type=report_type,
                    report_data=report,
                )
                report["report_id"] = report_id

            return JSONResponse(report)
        except Exception as e:
            logger.error(f"Error generating compliance report: {e}")
            return JSONResponse({"error": str(e)}, status_code=500)

    @app.get("/api/workflow/{workflow_id}/reports")
    async def api_get_reports(workflow_id: str, report_type: str = None, limit: int = 50):
        """Get list of generated reports for a workflow.

        Query params:
        - report_type: Optional filter by report type
        - limit: Maximum number of reports to return (default 50)

        Returns list of report metadata (not including full report data).
        """
        try:
            reports = insights.store.get_reports(
                workflow_id=workflow_id,
                report_type=report_type,
                limit=limit,
            )
            return JSONResponse({"reports": reports})
        except Exception as e:
            logger.error(f"Error getting reports: {e}")
            return JSONResponse({"error": str(e)}, status_code=500)

    @app.get("/api/reports/{report_id}")
    async def api_get_report(report_id: str):
        """Get a specific report by ID including full report data."""
        try:
            report = insights.store.get_report(report_id)
            if not report:
                return JSONResponse({"error": "Report not found"}, status_code=404)
            return JSONResponse(report)
        except Exception as e:
            logger.error(f"Error getting report: {e}")
            return JSONResponse({"error": str(e)}, status_code=500)

    @app.delete("/api/reports/{report_id}")
    async def api_delete_report(report_id: str):
        """Delete a report by ID."""
        try:
            deleted = insights.store.delete_report(report_id)
            if not deleted:
                return JSONResponse({"error": "Report not found"}, status_code=404)
            return JSONResponse({"success": True, "report_id": report_id})
        except Exception as e:
            logger.error(f"Error deleting report: {e}")
            return JSONResponse({"error": str(e)}, status_code=500)

    @app.get("/api/workflow/{workflow_id}/static-summary")
    async def api_get_static_summary(workflow_id: str):
        """Get static analysis summary for a workflow with 7 security check categories.

        Returns findings grouped by the 7 security check categories:
        PROMPT, OUTPUT, TOOL, DATA, MEMORY, SUPPLY, BEHAVIOR
        """
        try:
            # The 7 security check categories configuration
            SECURITY_CATEGORIES = [
                {"category_id": "PROMPT", "name": "Prompt Security", "owasp_llm": ["LLM01"]},
                {"category_id": "OUTPUT", "name": "Output Security", "owasp_llm": ["LLM02"]},
                {"category_id": "TOOL", "name": "Tool Security", "owasp_llm": ["LLM07", "LLM08"]},
                {"category_id": "DATA", "name": "Data & Secrets", "owasp_llm": ["LLM06"]},
                {"category_id": "MEMORY", "name": "Memory & Context", "owasp_llm": []},
                {"category_id": "SUPPLY", "name": "Supply Chain", "owasp_llm": ["LLM05"]},
                {"category_id": "BEHAVIOR", "name": "Behavioral Boundaries", "owasp_llm": ["LLM08", "LLM09"]},
            ]

            # Severity order for determining max severity
            severity_order = {"CRITICAL": 0, "HIGH": 1, "MEDIUM": 2, "LOW": 3}

            # Get analysis sessions
            sessions = insights.store.get_analysis_sessions(
                agent_workflow_id=workflow_id,
                limit=100,
            )
            static_sessions = [s for s in sessions if s.get('session_type') == 'STATIC']

            # Find the latest COMPLETED static session
            latest_session = None
            for s in static_sessions:
                if s.get('status') == 'COMPLETED':
                    latest_session = s
                    break

            # Get findings from the LATEST scan only (current state of the codebase)
            # Historical findings are accessible via their respective sessions
            if latest_session:
                current_findings = insights.store.get_findings(
                    session_id=latest_session.get('session_id'),
                    limit=1000,
                )
            else:
                # Fallback: no completed sessions, show all findings
                current_findings = insights.store.get_findings(
                    agent_workflow_id=workflow_id,
                    limit=1000,
                )

            # Also get ALL findings for this workflow (for historical context)
            all_findings = insights.store.get_findings(
                agent_workflow_id=workflow_id,
                limit=1000,
            )

            # Group CURRENT findings by category (for security checks display)
            findings_by_category = {}
            for f in current_findings:
                cat = f.get('category', 'PROMPT')  # Default to PROMPT if not specified
                if cat not in findings_by_category:
                    findings_by_category[cat] = []
                findings_by_category[cat].append(f)

            # Build the 7 security check cards only if a completed static analysis exists
            checks = []
            # Only count OPEN findings for severity summary
            severity_counts = {"critical": 0, "high": 0, "medium": 0, "low": 0}

            # Only build checks if there's a completed static analysis session
            if latest_session:
                for cat_config in SECURITY_CATEGORIES:
                    cat_id = cat_config["category_id"]
                    cat_findings = findings_by_category.get(cat_id, [])

                    # Separate OPEN vs resolved findings
                    open_findings = [f for f in cat_findings if f.get('status') == 'OPEN']

                    # Get max severity from OPEN findings only
                    max_severity = None
                    if open_findings:
                        for f in open_findings:
                            sev = f.get('severity', 'LOW')
                            if max_severity is None or severity_order.get(sev, 4) < severity_order.get(max_severity, 4):
                                max_severity = sev
                            # Count severities only for OPEN findings
                            sev_key = sev.lower()
                            if sev_key in severity_counts:
                                severity_counts[sev_key] += 1

                    # Determine check status based on OPEN findings only
                    # PASS: No OPEN findings
                    # INFO: Only MEDIUM OPEN findings
                    # FAIL: Any HIGH or CRITICAL OPEN findings
                    status = "PASS"
                    if open_findings:
                        has_critical_or_high = any(f.get('severity') in ['CRITICAL', 'HIGH'] for f in open_findings)
                        has_medium = any(f.get('severity') == 'MEDIUM' for f in open_findings)
                        if has_critical_or_high:
                            status = "FAIL"
                        elif has_medium:
                            status = "INFO"

                    checks.append({
                        "category_id": cat_id,
                        "name": cat_config["name"],
                        "status": status,
                        "owasp_llm": cat_config["owasp_llm"],
                        "findings_count": len(cat_findings),  # Total findings (all statuses)
                        "open_count": len(open_findings),  # Only open findings
                        "max_severity": max_severity,  # Max severity of OPEN findings only
                        "findings": cat_findings[:10],  # All findings for display
                    })

            # Calculate summary based on check statuses (which are based on OPEN findings)
            passed_count = sum(1 for c in checks if c["status"] == "PASS")
            failed_count = sum(1 for c in checks if c["status"] == "FAIL")
            info_count = sum(1 for c in checks if c["status"] == "INFO")
            # Gate is blocked only if there are OPEN HIGH/CRITICAL findings
            has_open_blocking = severity_counts["critical"] > 0 or severity_counts["high"] > 0
            gate_status = "BLOCKED" if has_open_blocking else "UNBLOCKED"

            # Get last scan info (only from completed sessions)
            last_scan = None
            if latest_session:
                last_scan = {
                    "timestamp": latest_session.get("created_at"),
                    "scanned_by": latest_session.get("scanned_by", "AI Assistant"),
                    "files_analyzed": latest_session.get("files_analyzed"),
                    "duration_ms": latest_session.get("duration_ms"),
                    "session_id": latest_session.get("session_id"),
                }

            # Build scan history with findings per session
            scan_history = []
            for session in static_sessions:
                session_id = session.get('session_id')
                # Get findings for this specific session
                session_findings = insights.store.get_findings(session_id=session_id, limit=1000)

                scan_history.append({
                    "session_id": session_id,
                    "created_at": session.get("created_at"),
                    "status": session.get("status"),
                    "session_type": session.get("session_type"),
                    "findings_count": len(session_findings),
                    "severity_breakdown": {
                        "critical": sum(1 for f in session_findings if f.get('severity') == 'CRITICAL'),
                        "high": sum(1 for f in session_findings if f.get('severity') == 'HIGH'),
                        "medium": sum(1 for f in session_findings if f.get('severity') == 'MEDIUM'),
                        "low": sum(1 for f in session_findings if f.get('severity') == 'LOW'),
                    }
                })

            # Calculate historical findings summary (resolved findings from previous scans)
            resolved_findings = [f for f in all_findings if f.get('status') in ['FIXED', 'RESOLVED', 'DISMISSED', 'IGNORED']]
            historical_summary = {
                "total_resolved": len(resolved_findings),
                "fixed": sum(1 for f in resolved_findings if f.get('status') == 'FIXED'),
                "resolved": sum(1 for f in resolved_findings if f.get('status') == 'RESOLVED'),
                "dismissed": sum(1 for f in resolved_findings if f.get('status') in ['DISMISSED', 'IGNORED']),
            }

            # Get recommendations count
            all_recs = insights.store.get_recommendations(workflow_id=workflow_id, limit=1000)

            return JSONResponse({
                "workflow_id": workflow_id,
                "last_scan": last_scan,
                "checks": checks,
                "summary": {
                    "total_checks": len(checks),
                    "passed": passed_count,
                    "failed": failed_count,
                    "info": info_count,
                    "gate_status": gate_status,
                },
                "recommendations_count": len(all_recs),
                "severity_counts": severity_counts,
                "scan_history": scan_history,
                "historical_summary": historical_summary,
            })
        except Exception as e:
            logger.error(f"Error getting static summary: {e}")
            return JSONResponse({"error": str(e)}, status_code=500)

    @app.get("/api/session/{session_id}/findings")
    async def api_get_session_findings(
        session_id: str,
        severity: Optional[str] = None,
        status: Optional[str] = None,
        limit: int = 1000,
    ):
        """Get findings for a specific analysis session (for viewing historical scans).

        Supports optional filtering by severity and status.
        Returns findings with severity breakdown.
        """
        try:
            # Get the session info
            session = insights.store.get_analysis_session(session_id)
            if not session:
                return JSONResponse({"error": "Session not found"}, status_code=404)

            # Get findings for this session with optional filters
            findings = insights.store.get_findings(
                session_id=session_id,
                severity=severity.upper() if severity else None,
                status=status.upper() if status else None,
                limit=limit,
            )

            # Calculate severity breakdown
            severity_breakdown = {
                "critical": sum(1 for f in findings if f.get('severity') == 'CRITICAL'),
                "high": sum(1 for f in findings if f.get('severity') == 'HIGH'),
                "medium": sum(1 for f in findings if f.get('severity') == 'MEDIUM'),
                "low": sum(1 for f in findings if f.get('severity') == 'LOW'),
            }

            return JSONResponse({
                "session_id": session_id,
                "session": session,
                "findings": findings,
                "findings_count": len(findings),
                "total_count": len(findings),  # Alias for backwards compatibility
                "severity_breakdown": severity_breakdown,
            })
        except Exception as e:
            logger.error(f"Error getting session findings: {e}")
            return JSONResponse({"error": str(e)}, status_code=500)

    @app.get("/api/workflow/{workflow_id}/dynamic-summary")
    async def api_get_dynamic_summary(workflow_id: str):
        """Get dynamic analysis summary for a workflow."""
        try:
            # Get agents in this workflow
            agents = insights.store.get_all_agents(agent_workflow_id=workflow_id)

            # Get analysis sessions
            sessions = insights.store.get_analysis_sessions(
                agent_workflow_id=workflow_id,
                limit=10,
            )
            dynamic_sessions = [s for s in sessions if s.get('session_type') == 'DYNAMIC']

            # Aggregate agent metrics
            total_sessions = 0
            total_messages = 0
            total_tokens = 0
            total_tools = 0
            total_errors = 0
            all_tools_used = set()
            all_tools_available = set()

            for agent in agents:
                total_sessions += agent.total_sessions
                total_messages += agent.total_messages
                total_tokens += agent.total_tokens
                total_tools += agent.total_tools
                total_errors += agent.total_errors
                all_tools_used.update(agent.used_tools)
                all_tools_available.update(agent.available_tools)

            return JSONResponse({
                "workflow_id": workflow_id,
                "agents_count": len(agents),
                "total_sessions": total_sessions,
                "total_messages": total_messages,
                "total_tokens": total_tokens,
                "total_tool_calls": total_tools,
                "total_errors": total_errors,
                "tools_used": list(all_tools_used),
                "tools_available": list(all_tools_available),
                "tool_coverage": round(len(all_tools_used) / len(all_tools_available) * 100, 1) if all_tools_available else 0,
                "dynamic_sessions": dynamic_sessions,
                "latest_session": dynamic_sessions[0] if dynamic_sessions else None,
            })
        except Exception as e:
            logger.error(f"Error getting dynamic summary: {e}")
            return JSONResponse({"error": str(e)}, status_code=500)

    @app.get("/api/workflow/{workflow_id}/correlation-summary")
    async def api_get_correlation_summary(workflow_id: str):
        """Get correlation summary for a workflow.

        Phase 5: Shows counts of findings by correlation state
        (VALIDATED, UNEXERCISED, RUNTIME_ONLY, THEORETICAL).
        """
        try:
            summary = insights.store.get_correlation_summary(workflow_id)
            return JSONResponse(summary)
        except Exception as e:
            logger.error(f"Error getting correlation summary: {e}")
            return JSONResponse({"error": str(e)}, status_code=500)

    @app.get("/api/workflow/{workflow_id}/analysis-sessions")
    async def api_get_workflow_analysis_sessions(
        workflow_id: str,
        status: Optional[str] = None,
        limit: int = 100,
    ):
        """Get analysis sessions for a workflow."""
        try:
            sessions = insights.store.get_analysis_sessions(
                agent_workflow_id=workflow_id,
                status=status.upper() if status else None,
                limit=limit,
            )
            return JSONResponse({
                "sessions": sessions,
                "total_count": len(sessions),
                "workflow_id": workflow_id,
            })
        except Exception as e:
            logger.error(f"Error getting analysis sessions: {e}")
            return JSONResponse({"error": str(e)}, status_code=500)

    # ==================== Dynamic Analysis On-Demand Trigger Endpoints ====================

    @app.get("/api/workflow/{workflow_id}/dynamic-analysis-status")
    async def api_get_dynamic_analysis_status(workflow_id: str):
        """Get comprehensive dynamic analysis status for a workflow.

        Returns:
        - can_trigger: Whether analysis can be triggered
        - is_running: Whether analysis is currently running
        - total_unanalyzed_sessions: Sessions not yet analyzed
        - agents_with_new_sessions: Number of agents with new data
        - agents_status: Per-agent breakdown
        - last_analysis: Info about the last analysis run
        """
        try:
            status = insights.store.get_dynamic_analysis_status(workflow_id)
            return JSONResponse(status)
        except Exception as e:
            logger.error(f"Error getting dynamic analysis status: {e}")
            return JSONResponse({"error": str(e)}, status_code=500)

    @app.post("/api/workflow/{workflow_id}/trigger-dynamic-analysis")
    async def api_trigger_dynamic_analysis(workflow_id: str, force: bool = False):
        """Trigger on-demand dynamic analysis for a workflow.

        Analysis:
        - Only processes sessions not yet analyzed (incremental)
        - Runs per-agent security checks and behavioral analysis
        - Creates findings and recommendations for failed checks
        - Auto-resolves issues not seen in new scans

        Query params:
        - force: If true, re-run on all completed sessions even if already analyzed

        Returns:
        - status: "triggered", "already_running", or "no_new_sessions"
        - sessions_analyzed: Number of sessions analyzed
        - agents_analyzed: Number of agents analyzed
        - findings_created: Number of findings created
        """
        try:
            from datetime import datetime, timezone
            import uuid

            # Get current status
            status = insights.store.get_dynamic_analysis_status(workflow_id)

            if status['is_running']:
                return JSONResponse({
                    "status": "already_running",
                    "message": "Analysis is already in progress",
                    "last_analysis": status.get('last_analysis'),
                })

            # If force=true, reset sessions to unanalyzed state first
            if force:
                insights.store.reset_sessions_to_unanalyzed(workflow_id)
                # Re-fetch status after reset
                status = insights.store.get_dynamic_analysis_status(workflow_id)

            if status['total_unanalyzed_sessions'] == 0:
                return JSONResponse({
                    "status": "no_new_sessions",
                    "message": "All sessions have already been analyzed. Run more test sessions first.",
                    "last_analysis": status.get('last_analysis'),
                })

            # Create analysis session (IN_PROGRESS)
            analysis_session_id = f"dynamic_{workflow_id}_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}"

            insights.store.create_analysis_session(
                session_id=analysis_session_id,
                agent_workflow_id=workflow_id,
                session_type="DYNAMIC",
                agent_workflow_name=workflow_id,
            )

            # IMPORTANT: Resolve ALL existing dynamic findings before creating new ones
            # This ensures only the current scan's findings are active (like static analysis)
            insights.store.resolve_all_dynamic_findings(workflow_id, analysis_session_id)

            # Get unanalyzed sessions by agent
            unanalyzed_by_agent = insights.store.get_unanalyzed_sessions_by_agent(workflow_id)

            # Track results
            total_sessions_analyzed = 0
            agents_analyzed = 0
            total_findings_created = 0
            all_check_ids_found = []  # For auto-resolve

            for agent_id, session_ids in unanalyzed_by_agent.items():
                if not session_ids:
                    continue

                # Get the actual SessionData objects for these sessions
                sessions = []
                for sid in session_ids:
                    session = insights.store.get_session(sid)
                    if session:
                        sessions.append(session)

                if not sessions:
                    continue

                # Run the full analysis for this agent using ONLY the new sessions
                # This ensures analysis reflects the current state, not historical issues
                try:
                    result = await insights.compute_risk_analysis(agent_id, sessions=sessions)

                    if result and result.security_report:
                        # Persist security checks
                        agent = insights.store.get_agent(agent_id)
                        agent_workflow_id = agent.agent_workflow_id if agent else workflow_id

                        checks_persisted = insights.store.persist_security_checks(
                            agent_id=agent_id,
                            security_report=result.security_report,
                            analysis_session_id=analysis_session_id,
                            agent_workflow_id=agent_workflow_id,
                        )

                        # Create findings and recommendations for failed checks
                        findings_created = await _create_dynamic_findings_and_recommendations(
                            insights.store,
                            workflow_id,
                            agent_id,
                            analysis_session_id,
                            result.security_report,
                        )

                        total_findings_created += findings_created

                        # Collect check IDs for auto-resolve
                        for category in result.security_report.categories.values():
                            for check in category.checks:
                                if check.status in ('critical', 'warning'):
                                    all_check_ids_found.append(check.check_id)

                        # Persist behavioral analysis if available
                        if result.behavioral_analysis:
                            insights.store.store_behavioral_analysis(
                                agent_id=agent_id,
                                analysis_session_id=analysis_session_id,
                                behavioral_result=result.behavioral_analysis,
                            )

                        logger.info(f"[DYNAMIC] Persisted {checks_persisted} checks, {findings_created} findings for agent {agent_id}")

                except Exception as e:
                    logger.error(f"[DYNAMIC] Error analyzing agent {agent_id}: {e}", exc_info=True)
                    continue

                # Mark sessions as analyzed
                insights.store.mark_sessions_analyzed(session_ids, analysis_session_id)
                total_sessions_analyzed += len(session_ids)
                agents_analyzed += 1

            # Auto-resolve old findings not seen in this scan
            resolved = insights.store.auto_resolve_stale_findings(
                workflow_id=workflow_id,
                analysis_session_id=analysis_session_id,
                current_check_ids=all_check_ids_found,
            )

            # Complete the analysis session (with sessions_analyzed count)
            insights.store.complete_analysis_session(
                session_id=analysis_session_id,
                findings_count=total_findings_created,
                sessions_analyzed=total_sessions_analyzed,
            )

            return JSONResponse({
                "status": "completed",
                "message": f"Analysis completed for {agents_analyzed} agent(s)",
                "analysis_session_id": analysis_session_id,
                "sessions_analyzed": total_sessions_analyzed,
                "agents_analyzed": agents_analyzed,
                "findings_created": total_findings_created,
                "issues_auto_resolved": resolved.get('resolved_count', 0),
            })

        except Exception as e:
            logger.error(f"Error in dynamic analysis: {e}", exc_info=True)
            return JSONResponse({"error": str(e)}, status_code=500)

    async def _create_dynamic_findings_and_recommendations(
        store,
        workflow_id: str,
        agent_id: str,
        analysis_session_id: str,
        security_report,
    ) -> int:
        """Create findings and recommendations for failed security checks.

        Similar pattern to static analysis - each failed check creates:
        - A finding (what was detected)
        - A recommendation (what to do about it)
        """
        import uuid
        from datetime import datetime, timezone

        findings_created = 0

        for category_id, category in security_report.categories.items():
            for check in category.checks:
                # Only create findings for failed checks (critical or warning)
                if check.status not in ('critical', 'warning'):
                    continue

                # Map check status to severity
                severity = 'CRITICAL' if check.status == 'critical' else 'HIGH'

                # Generate IDs
                finding_id = f"FND-DYN-{uuid.uuid4().hex[:8].upper()}"
                rec_id = f"REC-DYN-{uuid.uuid4().hex[:8].upper()}"

                # Create the finding (code_snippet goes in evidence)
                store.store_finding(
                    finding_id=finding_id,
                    session_id=analysis_session_id,
                    agent_workflow_id=workflow_id,
                    file_path=f"runtime:{agent_id}",  # Use agent as "location"
                    finding_type=check.check_id,
                    severity=severity,
                    title=check.name,
                    description=check.description,
                    owasp_mapping=[check.owasp_llm] if check.owasp_llm else [],
                    source_type='DYNAMIC',
                    category=category_id,
                    check_id=check.check_id,
                    cvss_score=check.cvss_score,
                    cwe=check.cwe,
                    soc2_controls=check.soc2_controls,
                    line_start=None,
                    line_end=None,
                    evidence={
                        'check_id': check.check_id,
                        'value': check.value,
                        'evidence': check.evidence,
                        'recommendations': check.recommendations,
                    },
                    auto_create_recommendation=False,  # We create it manually
                )

                # Create the recommendation
                store.create_recommendation(
                    recommendation_id=rec_id,
                    workflow_id=workflow_id,
                    source_type='DYNAMIC',
                    source_finding_id=finding_id,
                    category=category_id,
                    severity=severity,
                    title=f"Fix: {check.name}",
                    description=check.description,
                    fix_hints='\n'.join(check.recommendations) if check.recommendations else None,
                    owasp_llm=check.owasp_llm,
                    cwe=check.cwe,
                    soc2_controls=check.soc2_controls,
                    cvss_score=check.cvss_score,
                    file_path=f"runtime:{agent_id}",
                    code_snippet=check.value,
                    impact=f"Detected in runtime analysis: {check.value}",
                    fix_complexity='MEDIUM',
                )

                findings_created += 1
                logger.debug(f"[DYNAMIC] Created finding {finding_id} and recommendation {rec_id} for check {check.check_id}")

        return findings_created

    @app.get("/api/workflow/{workflow_id}/analysis-history")
    async def api_get_analysis_history(
        workflow_id: str,
        session_type: str = "DYNAMIC",
        limit: int = 20,
    ):
        """Get analysis history for a workflow.

        Shows past analysis runs with their results.
        Latest analysis is marked and impacts gate status.
        Historical analyses are view-only.
        """
        try:
            sessions = insights.store.get_analysis_sessions(
                agent_workflow_id=workflow_id,
                limit=limit,
            )

            # Filter by session_type
            filtered = [s for s in sessions if s.get('session_type') == session_type.upper()]

            # Determine latest
            latest_id = None
            if filtered:
                # Latest is the most recent completed one
                completed = [s for s in filtered if s.get('status') == 'COMPLETED']
                if completed:
                    latest_id = completed[0]['session_id']

            return JSONResponse({
                "workflow_id": workflow_id,
                "session_type": session_type,
                "analyses": filtered,
                "latest_id": latest_id,
                "total_count": len(filtered),
            })
        except Exception as e:
            logger.error(f"Error getting analysis history: {e}")
            return JSONResponse({"error": str(e)}, status_code=500)

    @app.get("/api/audit-log")
    async def api_get_audit_log(
        entity_type: Optional[str] = None,
        entity_id: Optional[str] = None,
        action: Optional[str] = None,
        limit: int = 100,
    ):
        """Get audit log entries."""
        try:
            entries = insights.store.get_audit_log(
                entity_type=entity_type,
                entity_id=entity_id,
                action=action,
                limit=limit,
            )
            return JSONResponse({
                "entries": entries,
                "total_count": len(entries),
            })
        except Exception as e:
            logger.error(f"Error getting audit log: {e}")
            return JSONResponse({"error": str(e)}, status_code=500)

    # ==================== IDE Activity Status Endpoints ====================

    @app.get("/api/ide/status")
    async def api_ide_connection_status(agent_workflow_id: str):
        """Get simplified IDE activity status for the dashboard.

        Activity is tracked automatically when any MCP tool with agent_workflow_id is called.
        IDE metadata (type, workspace, model) is optional and provided via ide_heartbeat.

        Args:
            agent_workflow_id: The workflow to check (required)

        Returns:
            JSON with:
            - has_activity: Whether any MCP activity has been recorded
            - last_seen: ISO timestamp of last activity
            - last_seen_relative: Human-readable relative time
            - ide: IDE metadata dict or null if not provided
        """
        try:
            status = insights.store.get_workflow_ide_status(agent_workflow_id)
            return JSONResponse(status)
        except Exception as e:
            logger.error(f"Error getting IDE status: {e}")
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
