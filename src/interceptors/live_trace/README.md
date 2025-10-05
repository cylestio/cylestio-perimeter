# Live Trace Interceptor

Real-time debugging and monitoring interceptor with a React-based web dashboard for tracing LLM requests, sessions, and agent behavior.

## Quick Start

```yaml
# config.yaml
interceptors:
  - type: live_trace
    enabled: true
    config:
      server_port: 8080
      auto_open_browser: true
```

Then build the frontend:

```bash
cd src/interceptors/live_trace/frontend
npm install
npm run build
```

Visit `http://localhost:8080` after starting your proxy.

## Features

- 🔍 **Real-time monitoring** - Live dashboard with auto-refresh
- 📊 **Rich analytics** - Sessions, agents, performance metrics
- 🌐 **React dashboard** - Modern UI with Cylestio brand colors
- ⚡ **Zero impact** - Async processing, no proxy latency
- 💾 **Smart storage** - In-memory with circular buffers

## Dashboard Pages

- **Dashboard** (`/`) - Global stats, agents, sessions
- **Agent Details** (`/agent/{id}`) - Agent metrics and sessions
- **Session Timeline** (`/session/{id}`) - Event-by-event flow

## API Endpoints

- `GET /api/dashboard` - Dashboard data
- `GET /api/agent/{id}` - Agent details
- `GET /api/session/{id}` - Session timeline
- `GET /health` - Health check

## Configuration

```yaml
config:
  server_port: 8080              # Dashboard port
  auto_open_browser: true        # Open browser on startup
  max_events: 10000              # Max events in memory
  retention_minutes: 30          # Session retention
  refresh_interval: 2            # Auto-refresh interval (seconds)
```

## Development

See [frontend/README.md](frontend/README.md) for React development instructions.

## Architecture

```
┌─────────────┐
│   Browser   │
│ (React App) │
└──────┬──────┘
       │ fetch('/api/...')
       ▼
┌─────────────────────┐
│  FastAPI Server     │
│  ├─ Static React    │
│  └─ JSON APIs       │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│  TraceStore         │
│  └─ InsightsEngine  │
└─────────────────────┘
```

## Performance

- **Zero latency** - Async event processing
- **Memory efficient** - Configurable limits
- **Smart cleanup** - Auto-remove old sessions
