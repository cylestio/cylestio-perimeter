# Terminology Rename: agent → agent_step

## Summary

Rename `agent` / `agent_id` to `agent_step` / `agent_step_id` **within the live_trace module only**. This applies to the entity derived from system prompt hash (the inner level), NOT the agent_workflow grouping level which stays unchanged.

**Scope:** `src/interceptors/live_trace/` only (~35 files)
- Database columns and table names
- Backend API routes and parameters
- Frontend routes and route parameters
- UI labels and text strings
- Test files and story files

**Out of Scope:** Proxy layer (middleware, providers, events) keeps `agent_id` terminology
- The interceptor receives `agent_id` from proxy and stores it as `agent_step_id` internally

---

## Naming Convention

| Current | New |
|---------|-----|
| `agent_id` | `agent_step_id` |
| `agent` (entity) | `agent_step` |
| `agents` (table) | `agent_steps` |
| `/agent/` (route) | `/agent-step/` |
| "Agent" (UI) | "Agent Step" |
| "Agents" (UI plural) | "Agent Steps" |

**Unchanged:**
- `agent_workflow_id` stays as-is
- `agent_workflow` stays as-is
- "Agent Workflow" stays as-is

---

## Phase 1: Backend Database Schema ✅ COMPLETED

### File: `src/interceptors/live_trace/store/store.py`

**Table rename:**
- `agents` table → `agent_steps` table (line ~40)

**Column renames across all tables:**
- `agent_id` → `agent_step_id` (in: sessions, agent_steps, analysis_sessions, findings, security_checks, behavioral_analysis, ide_connections)
- Index: `idx_agents_agent_workflow_id` → `idx_agent_steps_agent_workflow_id`

**Data class renames:**
- `AgentData` class → `AgentStepData` class (line ~297)
- Constructor param: `agent_id` → `agent_step_id`

**Method renames:**
- `_serialize_agent()` → `_serialize_agent_step()`
- `_deserialize_agent()` → `_deserialize_agent_step()`
- `get_all_agents()` → `get_all_agent_steps()`
- `update_agent_info()` → `update_agent_step_info()`
- All internal references to `agent_id` variable → `agent_step_id`

---

## Phase 2: Backend API Server

### File: `src/interceptors/live_trace/server.py`

**API route renames:**
- `GET /api/agent/{id}` → `GET /api/agent-step/{id}`
- `GET /api/agent/{id}/sessions` → `GET /api/agent-step/{id}/sessions`
- `GET /api/agent/{id}/security-checks` → `GET /api/agent-step/{id}/security-checks`

**Parameter renames:**
- Query param `agent_id` → `agent_step_id` (in sessions/list, dashboard endpoints)
- Path param `agent_id` → `agent_step_id`

**Response field renames:**
- All response dicts: `agent_id` → `agent_step_id`

---

## Phase 3: Backend MCP Tools

### File: `src/interceptors/live_trace/mcp/tools.py`

**Tool parameter renames:**
- `get_agents` tool → `get_agent_steps`
- `update_agent_info` tool → `update_agent_step_info`
- Input param `agent_id` → `agent_step_id` in all tools

### File: `src/interceptors/live_trace/mcp/handlers.py`

**Handler renames:**
- `handle_get_agents()` → `handle_get_agent_steps()`
- `handle_update_agent_info()` → `handle_update_agent_step_info()`
- All `agent_id` variable references → `agent_step_id`

---

## Phase 4: Backend Runtime Engine

### File: `src/interceptors/live_trace/runtime/engine.py`

**Method renames:**
- `_get_agent_summary()` → `_get_agent_step_summary()`
- All `agent_id` parameter names → `agent_step_id`

---

## Phase 5: Backend Interceptor

### File: `src/interceptors/live_trace/interceptor.py`

**Translation point (proxy → live_trace):**
- Receives `agent_id` from `request.state.agent_id` (proxy layer terminology)
- Internally rename variable to `agent_step_id`
- Pass `agent_step_id` to `store.add_event()`

```python
# Before:
agent_id = getattr(request_data.request.state, 'agent_id', 'unknown')
self.store.add_event(event, session_id, agent_id)

# After:
agent_step_id = getattr(request_data.request.state, 'agent_id', 'unknown')  # proxy uses 'agent_id'
self.store.add_event(event, session_id, agent_step_id)
```

---

## Phase 6: Frontend Types

### File: `src/interceptors/live_trace/frontend/src/api/types/agent.ts`
- Rename to: `agentStep.ts`
- Type renames: `AgentAnalytics` → `AgentStepAnalytics`, etc.

### File: `src/interceptors/live_trace/frontend/src/api/types/dashboard.ts`
- Field: `agent_id` → `agent_step_id` in all interfaces

### File: `src/interceptors/live_trace/frontend/src/api/types/session.ts`
- Field: `agent_id` → `agent_step_id`

---

## Phase 7: Frontend API Endpoints

### File: `src/interceptors/live_trace/frontend/src/api/endpoints/agent.ts`
- Rename to: `agentStep.ts`
- Function: `fetchAgent()` → `fetchAgentStep()`
- Endpoint: `/api/agent/${id}` → `/api/agent-step/${id}`

### File: `src/interceptors/live_trace/frontend/src/api/endpoints/session.ts`
- Query param: `agent_id` → `agent_step_id`

---

## Phase 8: Frontend Routes (App.tsx)

### File: `src/interceptors/live_trace/frontend/src/App.tsx`

**Route path changes:**
- `/agent-workflow/:agentWorkflowId/agent/:agentId` → `/agent-workflow/:agentWorkflowId/agent-step/:agentStepId`
- `/agent-workflow/:agentWorkflowId/agent/:agentId/report` → `/agent-workflow/:agentWorkflowId/agent-step/:agentStepId/report`

**Route param renames:**
- `:agentId` → `:agentStepId` in all routes

---

## Phase 9: Frontend Pages

### Rename files:
- `pages/AgentDetail/` → `pages/AgentStepDetail/`
- `pages/AgentReport/` → `pages/AgentStepReport/`

### Files to update:

**AgentStepDetail (formerly AgentDetail):**
- Component name: `AgentDetail` → `AgentStepDetail`
- Route param: `agentId` → `agentStepId`
- API calls: `fetchAgent()` → `fetchAgentStep()`

**AgentStepReport (formerly AgentReport):**
- Component name: `AgentReport` → `AgentStepReport`
- Route param: `agentId` → `agentStepId`

**AgentWorkflowDetail.tsx:**
- Link paths: `/agent/` → `/agent-step/`
- UI labels: "Agents" → "Agent Steps"
- Variable names: `agent` → `agentStep`

**Sessions.tsx, SessionDetail.tsx:**
- Link paths: `/agent/` → `/agent-step/`
- Labels: "Agent" → "Agent Step"

**Portfolio.tsx:**
- UI labels: "Agents" → "Agent Steps"
- Link paths update

**Overview.tsx:**
- Label: "Agents" sidebar nav → "Agent Steps"

**All other pages with breadcrumbs:**
- Update breadcrumb labels from "Agents" to "Agent Steps"

---

## Phase 10: Frontend Components

### Rename folders:
- `components/domain/agents/` → `components/domain/agent-steps/`

### File renames within:
- `AgentListItem.tsx` → `AgentStepListItem.tsx`
- `AgentSelector.tsx` → `AgentStepSelector.tsx`
- All related style files

### Component renames:
- `AgentListItem` → `AgentStepListItem`
- `AgentSelector` → `AgentStepSelector`

### Files to update:

**SessionsTable.tsx:**
- Column header: "Agent" → "Agent Step"
- Link paths: `/agent/` → `/agent-step/`
- Prop: `agentId` → `agentStepId`

**AnalysisSessionsTable.tsx:**
- Same changes as SessionsTable

**SecurityChecksExplorer.tsx:**
- Labels: "Agent X of Y" → "Agent Step X of Y"
- Link paths update

---

## Phase 11: Frontend Utils

### File: `src/interceptors/live_trace/frontend/src/utils/breadcrumbs.ts`

- Function: `agentLink()` → `agentStepLink()` (if exists)
- Breadcrumb label: "Agents" → "Agent Steps" (in agent step context)
- Paths: `/agent/` → `/agent-step/`

---

## Phase 12: Story Files

All `.stories.tsx` files need updates:

- `AgentDetail.stories.tsx` → `AgentStepDetail.stories.tsx`
- `AgentReport.stories.tsx` → `AgentStepReport.stories.tsx`
- Route paths in stories: `/agent/` → `/agent-step/`
- Text assertions: "Agent" → "Agent Step"

**Files:**
- `StaticAnalysis.stories.tsx`
- `SessionsTable.stories.tsx`
- `SecurityChecksExplorer.stories.tsx`
- `SecurityCheckItem.stories.tsx`
- `Overview.stories.tsx`
- `Portfolio.stories.tsx`
- All other story files with agent references

---

## Phase 13: Test Files

### Backend tests:
- `src/interceptors/live_trace/store/test_store.py`
- `src/interceptors/live_trace/mcp/test_handlers.py`
- `src/interceptors/live_trace/runtime/tests/test_engine.py`
- `src/interceptors/live_trace/runtime/tests/test_analysis_runner.py`

All need `agent_id` → `agent_step_id` updates.

---

## Phase 14: Documentation & Config

### Files:
- `src/interceptors/live_trace/CLAUDE.md`
- `src/interceptors/live_trace/frontend/CLAUDE.md`
- `src/templates/INSTALLATION.md`
- `src/templates/cursor-rules/.cursorrules`
- `examples/configs/anthropic-live-trace.yaml`

---

## Execution Order

1. Backend database schema (store.py) - foundational change
2. Backend API server - update routes and responses
3. Backend MCP tools and handlers
4. Backend runtime engine
5. Backend interceptor
6. Frontend types - update all interfaces
7. Frontend API endpoints
8. Frontend routes (App.tsx)
9. Frontend pages (rename and update)
10. Frontend components (rename and update)
11. Frontend utils
12. Story files
13. Test files
14. Documentation

---

## File Count Summary

| Category | File Count |
|----------|------------|
| Backend core (live_trace) | 6 files |
| Backend tests | 4 files |
| Frontend types | 4 files |
| Frontend endpoints | 3 files |
| Frontend pages | 10+ files |
| Frontend components | 8+ files |
| Frontend stories | 10+ files |
| Documentation/Templates | 5 files |
| **Total** | ~50 files |

---

## Notes

1. **Git strategy:** Use `git mv` for file renames to preserve history
2. **Proxy translation:** The interceptor.py is the boundary - it receives `agent_id` from proxy and uses `agent_step_id` internally
3. **This plan is a reference document** - no automated execution, intended for manual implementation
