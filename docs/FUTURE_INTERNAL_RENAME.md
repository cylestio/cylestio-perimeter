# Future: Internal Naming Rename Scope

This document describes the scope of a potential full internal rename to align internal naming with the new header naming conventions.

## Current State

The HTTP headers have been renamed, but internal names remain unchanged:

| HTTP Header | Internal Name | New Concept |
|-------------|---------------|-------------|
| `x-cylestio-prompt-id` | `agent_id` | Prompt pattern identifier |
| `x-cylestio-conversation-id` | `session_id` | Conversation/thread ID |
| `x-cylestio-session-id` | stored as `session` tag | Workflow execution grouping |

## Proposed Rename

| Current Internal Name | Proposed Internal Name |
|----------------------|------------------------|
| `agent_id` | `prompt_id` |
| `session_id` | `conversation_id` |

## Scope Analysis

A full internal rename would affect approximately **71 files** across the codebase:

### Core Proxy (7 files)
- `src/proxy/middleware.py` - Request processing
- `src/proxy/handler.py` - Header filtering
- `src/proxy/interceptor_base.py` - LLMRequestData/LLMResponseData
- `src/proxy/session/detector.py` - Session detection
- `src/replay/replay_pipeline.py` - Replay functionality
- `tests/integration/test_proxy_flow.py` - Integration tests
- `tests/providers/test_session_tags.py` - Tag tests

### Provider Layer (4 files)
- `src/providers/base.py` - Base provider with `evaluate_agent_id()`
- `src/providers/openai.py` - OpenAI provider
- `src/providers/anthropic.py` - Anthropic provider
- `src/providers/session_utils.py` - Session utilities

### Events System (4 files)
- `src/events/base.py` - BaseEvent with agent_id, session_id fields
- `src/events/types.py` - Event creation methods
- `src/events/openai.py` - OpenAI events
- `src/events/anthropic.py` - Anthropic events

### Live Trace Interceptor (7 files)
- `src/interceptors/live_trace/interceptor.py` - Event processing
- `src/interceptors/live_trace/store/store.py` - **SQL schema, all DB operations**
- `src/interceptors/live_trace/server.py` - REST API endpoints
- `src/interceptors/live_trace/mcp/handlers.py` - MCP tool handlers
- `src/interceptors/live_trace/mcp/tools.py` - MCP tool definitions
- `src/interceptors/live_trace/mcp/router.py` - MCP router
- `src/interceptors/live_trace/models.py` - TraceSession, TraceAgent models

### Runtime Analysis (5 files)
- `src/interceptors/live_trace/runtime/engine.py` - Analysis engine
- `src/interceptors/live_trace/runtime/analysis_runner.py` - Analysis orchestration
- `src/interceptors/live_trace/runtime/session_monitor.py` - Session monitoring
- `src/interceptors/live_trace/runtime/behavioral.py` - Behavioral analysis
- `src/interceptors/live_trace/runtime/security.py` - Security checks

### Frontend (20+ files)
- `src/interceptors/live_trace/frontend/src/api/types/session.ts`
- `src/interceptors/live_trace/frontend/src/api/types/agent.ts`
- `src/interceptors/live_trace/frontend/src/api/types/dashboard.ts`
- `src/interceptors/live_trace/frontend/src/api/types/findings.ts`
- `src/interceptors/live_trace/frontend/src/api/types/security.ts`
- `src/interceptors/live_trace/frontend/src/api/endpoints/session.ts`
- `src/interceptors/live_trace/frontend/src/api/endpoints/agentWorkflow.ts`
- `src/interceptors/live_trace/frontend/src/api/endpoints/security.ts`
- 15+ component files using these types

### Test Files (5+ files)
- `tests/providers/test_session_tags.py`
- `tests/providers/test_external_ids.py`
- `tests/interceptors/test_session_tags_store.py`
- `src/interceptors/live_trace/store/test_store.py`
- `src/interceptors/live_trace/runtime/tests/test_*.py`

### Documentation (2 files)
- `docs/headers.md` - Header documentation
- Various template files in `src/templates/`

## Database Schema Changes

The SQLite schema would need migration:

```sql
-- sessions table
ALTER TABLE sessions RENAME COLUMN session_id TO conversation_id;
-- Note: agent_id would become prompt_id

-- agents table
ALTER TABLE agents RENAME COLUMN agent_id TO prompt_id;

-- Similar for other tables with foreign key relationships
```

## API Response Changes

All API responses would change field names:

```json
// Before
{
  "session_id": "abc123",
  "agent_id": "prompt-xyz"
}

// After
{
  "conversation_id": "abc123",
  "prompt_id": "prompt-xyz"
}
```

This is a **breaking change** for API consumers.

## Recommended Approach

If this rename is undertaken:

1. **Phase 1: Aliases** - Add aliases in API responses (`agent_id` AND `prompt_id` both present)
2. **Phase 2: Deprecation** - Mark old names as deprecated with warnings
3. **Phase 3: Internal Rename** - Rename internal code while maintaining API aliases
4. **Phase 4: API Migration** - Remove old API field names (breaking change)

## Decision

For now, we have chosen to:
- ✅ Rename HTTP headers (user-facing, easy to migrate)
- ❌ Keep internal names unchanged (too much scope, breaking changes)

The header rename provides the user-facing benefits without the significant refactoring effort.
