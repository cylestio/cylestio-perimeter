# Live Trace Interceptor

Real-time debugging and monitoring interceptor with a React-based web dashboard for tracing LLM requests, sessions, and agent behavior.

## Quick Start

```yaml
# config.yaml
interceptors:
  - type: live_trace
    enabled: true
    config:
      server_port: 7100
      auto_open_browser: true
```

Then build the frontend:

```bash
cd src/interceptors/live_trace/frontend
npm install
npm run build
```

Visit `http://localhost:7100` after starting your proxy.

## Features

- **Real-time monitoring** - Live dashboard with auto-refresh
- **Rich analytics** - Sessions, agents, performance metrics
- **Security checks** - Automated security assessment with historical tracking
- **Behavioral analysis** - Clustering, stability, and outlier detection
- **PII detection** - Automatic sensitive data detection
- **React dashboard** - Modern UI with Cylestio brand colors
- **Zero impact** - Async processing, no proxy latency
- **Smart storage** - SQLite with in-memory fallback

## Architecture

### Folder Structure

```
live_trace/
├── __init__.py
├── interceptor.py          # Entry point, event handling
├── models.py               # Shared data models
├── server.py               # REST API endpoints
├── README.md               # This file
│
├── store/                  # Data persistence (SQLite/memory)
│   ├── __init__.py
│   ├── store.py           # TraceStore - sessions, agents, findings, security checks
│   └── test_store.py
│
├── runtime/                # Runtime/Dynamic analysis
│   ├── __init__.py
│   ├── engine.py          # AnalysisEngine - orchestrates all analysis
│   ├── behavioral.py      # Behavioral analysis (clustering, stability)
│   ├── security.py        # Security checks (the "Report Checks")
│   ├── pii.py             # PII detection
│   ├── scheduler.py       # Analysis trigger logic
│   ├── models.py          # Analysis result models
│   └── tests/
│       ├── test_engine.py
│       ├── test_behavioral.py
│       ├── test_security.py
│       ├── test_pii.py
│       └── test_scheduler.py
│
├── mcp/                    # MCP tools for AI assistant integration
│   ├── __init__.py
│   ├── tools.py
│   ├── handlers.py
│   └── test_handlers.py
│
├── api/                    # API route definitions
│   └── __init__.py
│
└── frontend/               # React dashboard
```

### Component Responsibilities

| Component | Responsibility |
|-----------|----------------|
| `interceptor.py` | Event capture, session lifecycle management |
| `store/store.py` | All database operations (sessions, agents, findings, security checks) |
| `runtime/engine.py` | Orchestrates analysis, manages cache, integrates scheduler |
| `runtime/behavioral.py` | Clustering, stability, outlier detection (in-memory results) |
| `runtime/security.py` | Security checks - results persisted to database |
| `runtime/pii.py` | PII detection using Presidio |
| `runtime/scheduler.py` | `should_run_analysis()` logic, burst handling |
| `server.py` | REST API endpoint handlers |
| `mcp/handlers.py` | MCP tool implementations |

### Analysis Trigger Flow

Analysis runs automatically when sessions complete, not on-demand:

```
Session marked completed (background thread)
         │
         ▼
  scheduler.should_run_analysis(agent_id)
         │
         ├─ Is analysis running? → Skip if yes
         │
         ├─ Has completed_count changed? → Run if yes
         │
         ▼
  engine.run_analysis(agent_id)  ← Runs in background
         │
         ├─ 1. behavioral.analyze() → In-memory cache
         │
         ├─ 2. security.run_checks() → Returns checks
         │
         ├─ 3. store.persist_security_checks() → DB
         │
         ▼
  scheduler.mark_analysis_completed(agent_id)
         │
         └─ Check if more sessions arrived during analysis
            └─ If yes → trigger new analysis run
```

### Burst Session Handling

The scheduler prevents duplicate analysis runs during burst traffic:

1. When a session completes, `should_run_analysis()` is called
2. If analysis is already running for that agent, skip
3. After analysis completes, check if new sessions arrived
4. If so, automatically trigger another analysis run

## Dashboard Pages

- **Dashboard** (`/`) - Global stats, agents, sessions
- **Agent Details** (`/agent/{id}`) - Agent metrics, sessions, security checks
- **Session Timeline** (`/session/{id}`) - Event-by-event flow

## API Endpoints

### Core Endpoints

- `GET /api/dashboard` - Dashboard data
- `GET /api/agent/{id}` - Agent details
- `GET /api/session/{id}` - Session timeline
- `GET /health` - Health check

### Security Check Endpoints

- `GET /api/agent/{agent_id}/security-checks` - Latest security checks for an agent
- `GET /api/security-checks` - Query security checks with filters

Query parameters for `/api/security-checks`:
- `agent_id` - Filter by agent
- `analysis_session_id` - Filter by analysis session
- `category_id` - Filter by category (e.g., RESOURCE_MANAGEMENT, BEHAVIORAL)
- `status` - Filter by status (passed, warning, critical)
- `limit` - Max results (default: 100)
- `offset` - Pagination offset

## Database Schema

### Security Checks Table

```sql
CREATE TABLE security_checks (
    check_id TEXT PRIMARY KEY,
    agent_id TEXT NOT NULL,
    workflow_id TEXT,
    analysis_session_id TEXT NOT NULL,
    category_id TEXT NOT NULL,
    check_type TEXT NOT NULL,
    status TEXT NOT NULL,        -- passed, warning, critical
    title TEXT NOT NULL,
    description TEXT,
    value TEXT,
    evidence TEXT,               -- JSON
    recommendations TEXT,        -- JSON array
    created_at REAL NOT NULL,
    FOREIGN KEY (analysis_session_id) REFERENCES analysis_sessions(session_id)
);
```

## Configuration

```yaml
config:
  server_port: 7100              # Dashboard port
  auto_open_browser: true        # Open browser on startup
  max_events: 10000              # Max events in memory
  retention_minutes: 30          # Session retention
  refresh_interval: 2            # Auto-refresh interval (seconds)
  storage_type: sqlite           # sqlite or memory
```

## Development

See [frontend/README.md](frontend/README.md) for React development instructions.

### Running Tests

```bash
# All live_trace tests
pytest src/interceptors/live_trace/ -v

# Specific test modules
pytest src/interceptors/live_trace/store/test_store.py -v
pytest src/interceptors/live_trace/runtime/tests/ -v
pytest src/interceptors/live_trace/mcp/test_handlers.py -v
```

## Performance

- **Zero latency** - Async event processing
- **Memory efficient** - Configurable limits with SQLite persistence
- **Smart cleanup** - Auto-remove old sessions
- **Burst protection** - Scheduler prevents duplicate analysis runs
