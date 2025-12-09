"""FastAPI server for the live trace dashboard."""
import os
import time
from pathlib import Path
from typing import Optional

import httpx
from fastapi import FastAPI, Request
from fastapi.responses import FileResponse, HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

from src.kb.loader import get_kb_loader
from src.utils.logger import get_logger

from .analysis.insights import InsightsEngine
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
    async def api_dashboard(workflow_id: Optional[str] = None):
        """Get complete dashboard data as JSON, optionally filtered by workflow."""
        try:
            data = await insights.get_dashboard_data(workflow_id=workflow_id)
            data["refresh_interval"] = refresh_interval
            return JSONResponse(data)
        except Exception as e:
            logger.error(f"Error getting dashboard data: {e}")
            return JSONResponse({"error": str(e)}, status_code=500)

    @app.get("/api/workflows")
    async def api_workflows():
        """Get all workflows with agent counts."""
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
        workflow_id: Optional[str] = None,
        agent_id: Optional[str] = None,
        status: Optional[str] = None,
        limit: int = 100,
    ):
        """Get sessions with filtering by workflow_id, agent_id, and/or status.

        Args:
            workflow_id: Filter by workflow ID. Use "unassigned" for sessions without workflow.
            agent_id: Filter by agent ID.
            status: Filter by status - "ACTIVE", "INACTIVE", or "COMPLETED".
            limit: Maximum number of sessions to return (default 100).

        Returns:
            JSON response with sessions list and metadata.
        """
        try:
            sessions = insights.store.get_sessions_filtered(
                workflow_id=workflow_id,
                agent_id=agent_id,
                status=status,
                limit=limit,
            )
            return JSONResponse({
                "sessions": sessions,
                "total_count": len(sessions),
                "filters": {
                    "workflow_id": workflow_id,
                    "agent_id": agent_id,
                    "status": status,
                    "limit": limit,
                },
            })
        except Exception as e:
            logger.error(f"Error getting filtered sessions: {e}")
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
            from .analysis.default_pricing import DEFAULT_PRICING_DATA
            from .analysis.model_pricing import get_last_updated

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
            from .analysis.model_pricing import get_model_pricing
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

    @app.get("/api/workflow/{workflow_id}/findings")
    async def api_get_workflow_findings(
        workflow_id: str,
        severity: Optional[str] = None,
        status: Optional[str] = None,
        limit: int = 100,
    ):
        """Get security findings for a workflow."""
        try:
            findings = insights.store.get_findings(
                workflow_id=workflow_id,
                severity=severity.upper() if severity else None,
                status=status.upper() if status else None,
                limit=limit,
            )
            summary = insights.store.get_workflow_findings_summary(workflow_id)
            return JSONResponse({
                "findings": findings,
                "summary": summary,
            })
        except Exception as e:
            logger.error(f"Error getting workflow findings: {e}")
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

            # Get session to extract workflow_id
            session = insights.store.get_analysis_session(session_id)
            if not session:
                return JSONResponse({"error": "Session not found"}, status_code=404)

            workflow_id = session["workflow_id"]

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
                workflow_id=workflow_id,
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

    @app.get("/api/sessions/analysis")
    async def api_get_analysis_sessions(
        workflow_id: Optional[str] = None,
        status: Optional[str] = None,
        limit: int = 100,
    ):
        """List analysis sessions."""
        try:
            sessions = insights.store.get_analysis_sessions(
                workflow_id=workflow_id,
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
            workflow_id = body.get("workflow_id")
            session_type = body.get("session_type", "STATIC")
            workflow_name = body.get("workflow_name")

            if not workflow_id:
                return JSONResponse({"error": "workflow_id is required"}, status_code=400)

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
                workflow_id=workflow_id,
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
