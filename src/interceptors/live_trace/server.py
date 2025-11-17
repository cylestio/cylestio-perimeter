"""FastAPI server for the live trace dashboard."""
from pathlib import Path

from fastapi import FastAPI
from fastapi.responses import HTMLResponse, JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles

from src.utils.logger import get_logger

from .analysis.insights import InsightsEngine

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
    async def api_dashboard():
        """Get complete dashboard data as JSON."""
        try:
            data = await insights.get_dashboard_data()
            data["refresh_interval"] = refresh_interval
            return JSONResponse(data)
        except Exception as e:
            logger.error(f"Error getting dashboard data: {e}")
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
        """Get all sessions as JSON."""
        try:
            data = await insights.get_dashboard_data()
            return JSONResponse(data["sessions"])
        except Exception as e:
            logger.error(f"Error getting sessions: {e}")
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
