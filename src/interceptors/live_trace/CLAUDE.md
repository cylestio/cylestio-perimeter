# CLAUDE.md - Live Trace Interceptor

This file provides guidance for working with the live_trace interceptor module.

## Overview

The live_trace interceptor provides real-time tracing, monitoring, and security analysis for LLM agent sessions. It captures events, runs behavioral and security analysis, and exposes results via REST API and MCP tools.

**Frontend**: See `frontend/CLAUDE.md` for React dashboard guidance.

## Commands

```bash
# Run all live_trace tests
pytest src/interceptors/live_trace/ -v

# Run specific test modules
pytest src/interceptors/live_trace/store/test_store.py -v
pytest src/interceptors/live_trace/runtime/tests/ -v
pytest src/interceptors/live_trace/mcp/test_handlers.py -v

# Type checking
./venv/bin/python -m mypy src/interceptors/live_trace/
```

## Architecture

```
live_trace/
├── interceptor.py          # Entry point - initializes components, handles events
├── server.py               # FastAPI REST endpoints
├── models.py               # Shared Pydantic models
├── store/
│   └── store.py           # TraceStore - SQLite persistence, all DB operations
├── runtime/
│   ├── engine.py          # AnalysisEngine - computation (behavioral + security)
│   ├── analysis_runner.py # Orchestrates when/how analysis runs
│   ├── session_monitor.py # Background thread for session completion detection
│   ├── behavioral.py      # Clustering, stability, outlier detection
│   ├── security.py        # Security checks (the "Report Checks")
│   ├── pii.py             # PII detection using Presidio
│   ├── models.py          # Analysis result models
│   └── model_pricing.py   # Token cost calculation
└── mcp/
    ├── tools.py           # MCP tool definitions (source of truth)
    ├── handlers.py        # MCP tool implementations
    └── router.py          # MCP FastAPI router
```

## Component Responsibilities

| Component | Owns | Does NOT Own |
|-----------|------|--------------|
| `interceptor.py` | Event capture, component initialization, lifecycle | Analysis logic |
| `store/store.py` | All database operations, session/agent data models | Analysis computation |
| `runtime/engine.py` | Risk analysis computation, caching, PII orchestration | Trigger decisions, persistence |
| `runtime/analysis_runner.py` | When to run analysis, burst handling, result persistence | Actual computation |
| `runtime/session_monitor.py` | Session completion detection (background polling) | Analysis decisions |
| `server.py` | REST API endpoints | Business logic (delegates to engine/store) |

## Key Patterns

### Analysis Flow

Analysis is triggered automatically when sessions complete:

```
Session inactive for 30s → SessionMonitor detects
       ↓
AnalysisRunner.trigger(agent_id)
       ↓
_should_run() checks: not running + min sessions + new sessions
       ↓
AnalysisEngine.compute_risk_analysis()
       ├── behavioral.analyze_agent_behavior()
       ├── security.generate_security_report()
       └── pii.analyze_sessions_for_pii() [background]
       ↓
AnalysisRunner._persist_results() → DB
```

### Session Lifecycle

1. **ACTIVE**: Receiving events, not yet completed
2. **COMPLETED**: Inactive for `session_completion_timeout` (default 30s)
3. **REACTIVATED**: Completed session receives new event → clears analysis, becomes active

### Caching Strategy

- **Risk analysis cache**: Invalidated when session count OR completed count changes
- **PII results cache**: Keyed by (session_count, completed_count), background refresh
- **Behavioral percentiles**: Frozen on first calculation, never recalculated

### Thread Safety

- `TraceStore` uses `RLock` for all operations
- `AnalysisRunner` uses `Lock` for running state
- `AnalysisEngine` uses `threading.Lock` for PII task management
- Background analysis runs in asyncio tasks, doesn't block event loop

## Database Schema

Key tables (see `store.py` for full schema):

- `sessions` - Agent session data with events JSON
- `agents` - Agent metadata with cached percentiles
- `analysis_sessions` - Analysis run metadata
- `security_checks` - Persisted security check results
- `behavioral_analysis` - Persisted behavioral results
- `findings` - Static analysis findings (from MCP tools)

## API Endpoints

### Core Data
- `GET /api/dashboard` - Dashboard data (optionally filter by `workflow_id`)
- `GET /api/agent/{id}` - Agent details with risk analysis
- `GET /api/session/{id}` - Session timeline with events
- `GET /api/sessions/list` - Paginated sessions with filters

### Security Analysis
- `GET /api/agent/{id}/security-checks` - Latest security checks
- `GET /api/security-checks` - Query with filters
- `GET /api/workflow/{id}/security-checks` - Grouped by agent

### MCP
- `POST /mcp` - MCP protocol endpoint (SSE)

## MCP Tools

**Source of truth**: `mcp/tools.py`

When modifying MCP tools, also update:
- `src/templates/INSTALLATION.md`
- `src/templates/cursor-rules/.cursorrules`
- `src/templates/cursor-rules/agent-inspector.mdc`
- `src/templates/skills/static-analysis/SKILL.md`
- `src/templates/skills/auto-fix/SKILL.md`

Key tools:
- `get_security_patterns` - OWASP patterns for analysis
- `create_analysis_session` / `complete_analysis_session` - Session lifecycle
- `store_finding` / `get_findings` - Finding management
- `get_agent_workflow_state` - Workflow lifecycle status
- `get_agents` / `update_agent_info` - Agent discovery

## Configuration

```yaml
interceptors:
  - type: live_trace
    config:
      server_port: 7100
      server_host: 127.0.0.1
      auto_open_browser: true
      session_completion_timeout: 30    # Seconds before marking inactive
      completion_check_interval: 10     # Polling interval
      enable_presidio: true             # PII detection
      storage_mode: sqlite              # or "memory"
      db_path: ./trace_data/live_trace.db
```

## Development Guidelines

### Adding New Analysis

1. Add computation logic in `runtime/` (e.g., `my_analysis.py`)
2. Add result model to `runtime/models.py`
3. Integrate into `AnalysisEngine.compute_risk_analysis()`
4. Add persistence methods to `TraceStore` if needed
5. Update `AnalysisRunner._persist_results()` to save results

### Adding New API Endpoints

1. Add endpoint in `server.py`
2. Delegate to `insights` (engine) or `insights.store` for data
3. Keep endpoint handlers thin - logic belongs in engine/store

### Adding New MCP Tools

1. Add tool definition to `mcp/tools.py`
2. Add handler in `mcp/handlers.py`
3. Update template files (see list above)

### Testing

- Store tests: `store/test_store.py`
- Runtime tests: `runtime/tests/` (engine, pii, behavioral, session_monitor)
- MCP tests: `mcp/test_handlers.py`
- Tests are co-located with their modules

## Common Pitfalls

1. **Don't hold store lock during long operations** - Use `with self.store.lock:` only for data access
2. **PII runs in background** - Never block on PII results; use cached/pending status
3. **Percentiles are frozen** - First calculation locks behavioral baselines forever
4. **Session reactivation clears analysis** - A completed session receiving events loses signatures
5. **MCP tools.py is source of truth** - Template files must be manually synced
