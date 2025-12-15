# Workflow to Agent Workflow Terminology Changes

This document lists all changes made to rename "Workflow" to "Agent Workflow" throughout the codebase.

**Terminology mapping:**
- `Workflow` → `Agent Workflow`
- `Workflows` → `Agent Workflows`
- `workflow` → `agentWorkflow` (in code)
- `/workflow/` → `/agent-workflow/` (in URLs)
- `/agent/` → `/agent-workflow/` (in frontend routes)
- `workflow_id` → `agent_workflow_id` (in API/params)
- `workflowId` → `agentWorkflowId` (in JS/TS)
- `workflow.id` → `agent_workflow.id` (in event attributes)

---

## 1. File Renames (use `git mv`)

### Frontend Pages

| Current Path | New Path |
|--------------|----------|
| `src/interceptors/live_trace/frontend/src/pages/WorkflowsHome/` | `src/interceptors/live_trace/frontend/src/pages/AgentWorkflowsHome/` |
| `src/interceptors/live_trace/frontend/src/pages/WorkflowsHome/WorkflowsHome.tsx` | `.../AgentWorkflowsHome.tsx` |
| `src/interceptors/live_trace/frontend/src/pages/WorkflowsHome/WorkflowsHome.styles.ts` | `.../AgentWorkflowsHome.styles.ts` |
| `src/interceptors/live_trace/frontend/src/pages/WorkflowsHome/WorkflowsHome.stories.tsx` | `.../AgentWorkflowsHome.stories.tsx` |
| `src/interceptors/live_trace/frontend/src/pages/WorkflowDetail/` | `src/interceptors/live_trace/frontend/src/pages/AgentWorkflowDetail/` |
| `src/interceptors/live_trace/frontend/src/pages/WorkflowDetail/WorkflowDetail.tsx` | `.../AgentWorkflowDetail.tsx` |
| `src/interceptors/live_trace/frontend/src/pages/WorkflowDetail/WorkflowDetail.styles.ts` | `.../AgentWorkflowDetail.styles.ts` |

### Frontend Components

| Current Path | New Path |
|--------------|----------|
| `src/interceptors/live_trace/frontend/src/components/domain/workflows/` | `.../components/domain/agent-workflows/` |
| `.../workflows/WorkflowCard.tsx` | `.../agent-workflows/AgentWorkflowCard.tsx` |
| `.../workflows/WorkflowCard.styles.ts` | `.../agent-workflows/AgentWorkflowCard.styles.ts` |
| `.../workflows/WorkflowCard.stories.tsx` | `.../agent-workflows/AgentWorkflowCard.stories.tsx` |
| `.../workflows/WorkflowSelector.tsx` | `.../agent-workflows/AgentWorkflowSelector.tsx` |
| `.../workflows/WorkflowSelector.styles.ts` | `.../agent-workflows/AgentWorkflowSelector.styles.ts` |
| `.../workflows/WorkflowSelector.stories.tsx` | `.../agent-workflows/AgentWorkflowSelector.stories.tsx` |

### Frontend API

| Current Path | New Path |
|--------------|----------|
| `src/interceptors/live_trace/frontend/src/api/endpoints/workflow.ts` | `.../endpoints/agentWorkflow.ts` |
| `src/interceptors/live_trace/frontend/src/api/types/workflows.ts` | `.../types/agentWorkflows.ts` |

---

## 2. Core Proxy Routes

### Main Entry Point

**File:** `src/main.py`

| Change | Before | After |
|--------|--------|-------|
| Route path | `/workflow/{workflow_id}/{path:path}` | `/agent-workflow/{agent_workflow_id}/{path:path}` |
| Function name | `workflow_proxy_request` | `agent_workflow_proxy_request` |
| State attribute | `request.state.workflow_id` | `request.state.agent_workflow_id` |
| Docstring | "Proxy requests with workflow context" | "Proxy requests with agent workflow context" |

### Middleware

**File:** `src/proxy/middleware.py`

| Change | Before | After |
|--------|--------|-------|
| Metadata key | `'workflow_id'` | `'agent_workflow_id'` |
| State access | `getattr(request_data.request.state, 'workflow_id', None)` | `getattr(request_data.request.state, 'agent_workflow_id', None)` |

---

## 3. Provider Event Attributes

### Anthropic Provider

**File:** `src/providers/anthropic.py`

| Change | Before | After |
|--------|--------|-------|
| Comment | "Get agent_id, model, and workflow_id" | "Get agent_id, model, and agent_workflow_id" |
| Variable | `workflow_id = request_metadata.get("workflow_id")` | `agent_workflow_id = request_metadata.get("agent_workflow_id")` |
| Event attribute | `llm_finish_event.attributes["workflow.id"]` | `llm_finish_event.attributes["agent_workflow.id"]` |
| Tool event attribute | `tool_execution_event.attributes["workflow.id"]` | `tool_execution_event.attributes["agent_workflow.id"]` |

### OpenAI Provider

**File:** `src/providers/openai.py`

| Change | Before | After |
|--------|--------|-------|
| Comment | "Get agent_id, model, and workflow_id" | "Get agent_id, model, and agent_workflow_id" |
| Variable | `workflow_id = request_metadata.get("workflow_id")` | `agent_workflow_id = request_metadata.get("agent_workflow_id")` |
| Event attribute | `llm_finish_event.attributes["workflow.id"]` | `llm_finish_event.attributes["agent_workflow.id"]` |
| Tool event attribute | `tool_execution_event.attributes["workflow.id"]` | `tool_execution_event.attributes["agent_workflow.id"]` |

---

## 4. Frontend URL Routes (App.tsx)

**File:** `src/interceptors/live_trace/frontend/src/App.tsx`

| Change | Before | After |
|--------|--------|-------|
| Regex function | `getAgentIdFromPath`, `/agent/` regex | `getAgentWorkflowIdFromPath`, `/agent-workflow/` |
| URL variable | `urlAgentId` | `urlAgentWorkflowId` |
| State | `workflows`, `workflowsLoaded` | `agentWorkflows`, `agentWorkflowsLoaded` |
| Selected | `selectedWorkflow` | `selectedAgentWorkflow` |
| Handler | `handleWorkflowSelect` | `handleAgentWorkflowSelect` |
| Fetch variable | `workflowIdForFetch` | `agentWorkflowIdForFetch` |
| Navigate URLs | `/agent/unassigned`, `/agent/${id}` | `/agent-workflow/unassigned`, `/agent-workflow/${id}` |
| All route paths | `/agent/:agentId/...` | `/agent-workflow/:agentWorkflowId/...` |
| Nav item labels | `System prompts` | `Agents` |
| Nav item paths | `/agent/${urlAgentId}/system-prompts` | `/agent-workflow/${urlAgentWorkflowId}/agents` |
| Component | `<WorkflowSelector>` | `<AgentWorkflowSelector>` |
| Import | `WorkflowsHome` | `AgentWorkflowsHome` |

---

## 5. Breadcrumbs Utility

**File:** `src/interceptors/live_trace/frontend/src/utils/breadcrumbs.ts`

| Change | Before | After |
|--------|--------|-------|
| Function name | `buildWorkflowBreadcrumbs` | `buildAgentWorkflowBreadcrumbs` |
| Parameter | `workflowId` | `agentWorkflowId` |
| Label | `'Workflows'` | `'Agent Workflows'` |
| URL path | `/workflow/${id}` | `/agent-workflow/${id}` |
| Function name | `workflowLink` | `agentWorkflowLink` |

---

## 6. UI Labels

### "Workflows" → "Agent Workflows"

| File | Change |
|------|--------|
| `AgentWorkflowsHome.tsx` | All breadcrumb labels, hero text, section titles |
| `AgentWorkflowDetail.tsx` | Breadcrumb labels, page titles |
| `StaticAnalysis.tsx` | Breadcrumb labels |
| `DynamicAnalysis.tsx` | Breadcrumb labels |
| `Portfolio.tsx` | Breadcrumb labels |
| `Overview.tsx` | Breadcrumb labels |
| `Reports.tsx` | Breadcrumb labels |
| `AttackSurface.tsx` | Breadcrumb labels |
| `Recommendations.tsx` | Breadcrumb labels |
| `DevConnection.tsx` | Breadcrumb labels |
| `Sessions.tsx` | Breadcrumb function call |
| `ConnectionSuccess.tsx` | Button text "View Workflows" → "View Agent Workflows" |

### "Workflow" (singular) → "Agent Workflow"

| File | Change |
|------|--------|
| `Connect.tsx` | Hero text, toggle labels, instructions |
| `AgentWorkflowCard.tsx` | "View Workflow →" link text |
| `AgentWorkflowSelector.tsx` | Default label, title, placeholder |

---

## 7. Route Parameters

| File | Before | After |
|------|--------|-------|
| `Sessions.tsx` | `useParams<{ workflowId }>` | `useParams<{ agentWorkflowId }>` |
| `StaticAnalysis.tsx` | `useParams<{ workflowId }>` | `useParams<{ agentWorkflowId }>` |
| `DynamicAnalysis.tsx` | `useParams<{ workflowId }>` | `useParams<{ agentWorkflowId }>` |
| `SessionDetail.tsx` | `useParams<{ workflowId }>` | `useParams<{ agentWorkflowId }>` |
| `AgentWorkflowDetail.tsx` | `useParams<{ workflowId }>` | `useParams<{ agentWorkflowId }>` |
| `AgentDetail.tsx` | Route param, breadcrumb function | `agentWorkflowId` |
| `AgentReport.tsx` | Route param, breadcrumb function | `agentWorkflowId` |
| `Portfolio.tsx` | Route param | `agentWorkflowId` |
| `Overview.tsx` | Route param | `agentWorkflowId` |
| `SessionsTable.tsx` | Prop | `agentWorkflowId` |
| `AnalysisSessionsTable.tsx` | Prop | `agentWorkflowId` |
| `SecurityChecksExplorer.tsx` | Prop | `agentWorkflowId` |

---

## 8. TypeScript Types & Interfaces

**File:** `src/interceptors/live_trace/frontend/src/api/types/agentWorkflows.ts`

| Before | After |
|--------|-------|
| `interface APIWorkflow` | `interface APIAgentWorkflow` |
| `interface WorkflowsResponse` | `interface AgentWorkflowsResponse` |
| `workflows: APIWorkflow[]` | `agent_workflows: APIAgentWorkflow[]` |

**File:** `src/interceptors/live_trace/frontend/src/api/endpoints/agentWorkflow.ts`

| Before | After |
|--------|-------|
| `WorkflowFindingsResponse` | `AgentWorkflowFindingsResponse` |
| `FetchWorkflowFindingsParams` | `FetchAgentWorkflowFindingsParams` |
| `fetchWorkflowFindings` | `fetchAgentWorkflowFindings` |
| `WorkflowSecurityCheck` | `AgentWorkflowSecurityCheck` |
| `WorkflowSecurityChecksSummary` | `AgentWorkflowSecurityChecksSummary` |
| `WorkflowSecurityChecksResponse` | `AgentWorkflowSecurityChecksResponse` |
| `fetchWorkflowSecurityChecks` | `fetchAgentWorkflowSecurityChecks` |

**File:** `src/interceptors/live_trace/frontend/src/api/types/findings.ts`

| Before | After |
|--------|-------|
| `WorkflowFindingsResponse` | `AgentWorkflowFindingsResponse` |

**File:** `src/interceptors/live_trace/frontend/src/components/domain/agent-workflows/AgentWorkflowSelector.tsx`

| Before | After |
|--------|-------|
| `interface Workflow` | `interface AgentWorkflow` |
| `interface WorkflowSelectorProps` | `interface AgentWorkflowSelectorProps` |
| `workflows: Workflow[]` | `agentWorkflows: AgentWorkflow[]` |
| `selectedWorkflow` | `selectedAgentWorkflow` |
| `WorkflowSelector` | `AgentWorkflowSelector` |

---

## 9. API Endpoints

### Frontend Dashboard API

**File:** `src/interceptors/live_trace/frontend/src/api/endpoints/dashboard.ts`

| Before | After |
|--------|-------|
| `import { WorkflowsResponse }` | `import { AgentWorkflowsResponse }` |
| `fetchWorkflows` | `fetchAgentWorkflows` |
| `url += '?workflow_id=...'` | `url += '?agent_workflow_id=...'` |
| `fetch('/api/workflows')` | `fetch('/api/agent-workflows')` |

### Frontend IDE API

**File:** `src/interceptors/live_trace/frontend/src/api/endpoints/ide.ts`

| Before | After |
|--------|-------|
| Parameter | `workflowId` | `agentWorkflowId` |
| Query param | `workflow_id` | `agent_workflow_id` |

### Frontend Session API

**File:** `src/interceptors/live_trace/frontend/src/api/endpoints/session.ts`

| Before | After |
|--------|-------|
| Parameter | `workflowId` | `agentWorkflowId` |
| Query param | `workflow_id` | `agent_workflow_id` |

### Frontend Workflow API

**File:** `src/interceptors/live_trace/frontend/src/api/endpoints/agentWorkflow.ts`

| Before | After |
|--------|-------|
| URL | `/api/workflow/${workflowId}/findings` | `/api/agent-workflow/${agentWorkflowId}/findings` |
| URL | `/api/workflow/${workflowId}/security-checks` | `/api/agent-workflow/${agentWorkflowId}/security-checks` |
| Query param | `workflow_id=` | `agent_workflow_id=` |

---

## 10. Backend API Routes

**File:** `src/interceptors/live_trace/server.py`

| Before | After |
|--------|-------|
| `@app.get("/api/dashboard")` param | `workflow_id: Optional[str]` | `agent_workflow_id: Optional[str]` |
| Route | `@app.get("/api/workflows")` | `@app.get("/api/agent-workflows")` |
| Function | `api_workflows` | `api_agent_workflows` |
| Store call | `get_workflows()` | `get_agent_workflows()` |
| Response key | `{"workflows": ...}` | `{"agent_workflows": ...}` |
| Route | `@app.get("/api/workflow/{workflow_id}/findings")` | `@app.get("/api/agent-workflow/{agent_workflow_id}/findings")` |
| Route | `@app.get("/api/workflow/{workflow_id}/security-checks")` | `@app.get("/api/agent-workflow/{agent_workflow_id}/security-checks")` |
| All param names | `workflow_id` | `agent_workflow_id` |
| IDE status param | `workflow_id` | `agent_workflow_id` |
| Sessions list param | `workflow_id` | `agent_workflow_id` |
| Analysis sessions param | `workflow_id` | `agent_workflow_id` |

---

## 11. Backend Store

**File:** `src/interceptors/live_trace/store/store.py`

### Database Schema

| Table | Before | After |
|-------|--------|-------|
| `sessions` | `workflow_id TEXT` | `agent_workflow_id TEXT` |
| `agents` | `workflow_id TEXT` | `agent_workflow_id TEXT` |
| `analysis_sessions` | `workflow_id TEXT`, `workflow_name TEXT` | `agent_workflow_id TEXT`, `agent_workflow_name TEXT` |
| `findings` | `workflow_id TEXT` | `agent_workflow_id TEXT` |
| `security_checks` | `workflow_id TEXT` | `agent_workflow_id TEXT` |
| `ide_connections` | `workflow_id TEXT` | `agent_workflow_id TEXT` |

### Index Names

| Before | After |
|--------|-------|
| `idx_sessions_workflow_id` | `idx_sessions_agent_workflow_id` |
| `idx_agents_workflow_id` | `idx_agents_agent_workflow_id` |
| `idx_analysis_sessions_workflow_id` | `idx_analysis_sessions_agent_workflow_id` |
| `idx_findings_workflow_id` | `idx_findings_agent_workflow_id` |
| `idx_ide_connections_workflow_id` | `idx_ide_connections_agent_workflow_id` |

### Data Classes

| Class | Before | After |
|-------|--------|-------|
| `SessionData.__init__` | `workflow_id` param | `agent_workflow_id` param |
| `SessionData` | `self.workflow_id` | `self.agent_workflow_id` |
| `AgentData.__init__` | `workflow_id` param | `agent_workflow_id` param |
| `AgentData` | `self.workflow_id` | `self.agent_workflow_id` |

### Methods

| Before | After |
|--------|-------|
| `get_workflows()` | `get_agent_workflows()` |
| `get_all_agents(workflow_id)` | `get_all_agents(agent_workflow_id)` |
| `update_agent_info(..., workflow_id)` | `update_agent_info(..., agent_workflow_id)` |
| `create_analysis_session(workflow_id, workflow_name)` | `create_analysis_session(agent_workflow_id, agent_workflow_name)` |
| `get_analysis_sessions(workflow_id)` | `get_analysis_sessions(agent_workflow_id)` |
| `store_finding(workflow_id)` | `store_finding(agent_workflow_id)` |
| `get_findings(workflow_id)` | `get_findings(agent_workflow_id)` |
| `get_workflow_findings_summary(workflow_id)` | `get_agent_workflow_findings_summary(agent_workflow_id)` |
| `store_security_check(..., workflow_id)` | `store_security_check(..., agent_workflow_id)` |
| `get_security_checks(workflow_id)` | `get_security_checks(agent_workflow_id)` |
| `persist_security_checks(..., workflow_id)` | `persist_security_checks(..., agent_workflow_id)` |
| `register_ide_connection(..., workflow_id)` | `register_ide_connection(..., agent_workflow_id)` |
| `get_ide_connections(workflow_id)` | `get_ide_connections(agent_workflow_id)` |
| `update_ide_heartbeat(..., workflow_id)` | `update_ide_heartbeat(..., agent_workflow_id)` |
| `get_ide_connection_status(workflow_id)` | `get_ide_connection_status(agent_workflow_id)` |
| `count_sessions_filtered(workflow_id)` | `count_sessions_filtered(agent_workflow_id)` |
| `get_sessions_filtered(workflow_id)` | `get_sessions_filtered(agent_workflow_id)` |

---

## 12. MCP Tools

**File:** `src/interceptors/live_trace/mcp/tools.py`

| Tool | Parameter Before | Parameter After |
|------|------------------|-----------------|
| `create_analysis_session` | `workflow_id`, `workflow_name` | `agent_workflow_id`, `agent_workflow_name` |
| `get_findings` | `workflow_id` | `agent_workflow_id` |
| `get_workflow_state` | Tool renamed to `get_agent_workflow_state`, `workflow_id` | `agent_workflow_id` |
| `get_tool_usage_summary` | `workflow_id` | `agent_workflow_id` |
| `get_workflow_correlation` | Tool renamed to `get_agent_workflow_correlation`, `workflow_id` | `agent_workflow_id` |
| `get_agents` | `workflow_id` | `agent_workflow_id` |
| `update_agent_info` | `workflow_id` | `agent_workflow_id` |
| `register_ide_connection` | `workflow_id` | `agent_workflow_id` |
| `ide_heartbeat` | `workflow_id` | `agent_workflow_id` |
| `get_ide_connection_status` | `workflow_id` | `agent_workflow_id` |

---

## 13. MCP Handlers

**File:** `src/interceptors/live_trace/mcp/handlers.py`

| Handler | Before | After |
|---------|--------|-------|
| `handle_create_analysis_session` | `workflow_id`, `workflow_name` | `agent_workflow_id`, `agent_workflow_name` |
| `handle_store_finding` | `session["workflow_id"]` | `session["agent_workflow_id"]` |
| `handle_get_findings` | `workflow_id` | `agent_workflow_id` |
| `handle_get_workflow_state` | Renamed to `handle_get_agent_workflow_state`, all `workflow_id` | `agent_workflow_id` |
| `handle_get_tool_usage_summary` | `workflow_id` | `agent_workflow_id` |
| `handle_get_workflow_correlation` | Renamed to `handle_get_agent_workflow_correlation`, all `workflow_id` | `agent_workflow_id` |
| `handle_get_agents` | `workflow_id` | `agent_workflow_id` |
| `handle_update_agent_info` | `workflow_id` | `agent_workflow_id` |
| `handle_register_ide_connection` | `workflow_id` | `agent_workflow_id` |
| `handle_ide_heartbeat` | `workflow_id` | `agent_workflow_id` |
| `handle_get_ide_connection_status` | `workflow_id` | `agent_workflow_id` |
| Dashboard URLs in responses | `/workflow/{workflow_id}` | `/agent-workflow/{agent_workflow_id}` |
| Base URL hints | `base_url='...workflow/{workflow_id}'` | `base_url='...agent-workflow/{agent_workflow_id}'` |

---

## 14. Runtime Engine

**File:** `src/interceptors/live_trace/runtime/engine.py`

| Before | After |
|--------|-------|
| `get_dashboard_data(workflow_id)` | `get_dashboard_data(agent_workflow_id)` |
| `_get_security_analysis(workflow_id)` | `_get_security_analysis(agent_workflow_id)` |
| `_get_agent_summary(workflow_id)` | `_get_agent_summary(agent_workflow_id)` |
| `_get_recent_sessions(workflow_id)` | `_get_recent_sessions(agent_workflow_id)` |
| `_get_latest_active_session(workflow_id)` | `_get_latest_active_session(agent_workflow_id)` |
| Response key | `"workflow_id"` | `"agent_workflow_id"` |
| Agent data key | `"workflow_id"` | `"agent_workflow_id"` |

**File:** `src/interceptors/live_trace/runtime/analysis_runner.py`

| Before | After |
|--------|-------|
| Protocol method param | `workflow_id` | `agent_workflow_id` |
| Variable | `workflow_id = agent.workflow_id` | `agent_workflow_id = agent.agent_workflow_id` |
| Variable | `workflow_name` | `agent_workflow_name` |

---

## 15. Templates

### AGENT_INSPECTOR_SETUP.md

**File:** `src/templates/AGENT_INSPECTOR_SETUP.md`

| Before | After |
|--------|-------|
| `workflow_id="my-agent"` | `agent_workflow_id="my-agent"` |
| Table header "workflow_id" | "agent_workflow_id" |
| `create_analysis_session(workflow_id, "STATIC")` | `create_analysis_session(agent_workflow_id, "STATIC")` |
| "Derive workflow_id from folder name" | "Derive agent_workflow_id from folder name" |

### README.md

**File:** `src/templates/README.md`

| Before | After |
|--------|-------|
| `get_workflow_state` | `get_agent_workflow_state` |
| `get_workflow_correlation` | `get_agent_workflow_correlation` |
| `base_url="http://localhost:4000/workflow/my-project"` | `base_url="http://localhost:4000/agent-workflow/my-project"` |
| Dashboard URL | `/workflow/{workflow_id}` | `/agent-workflow/{agent_workflow_id}` |

### Cursor Rules

**File:** `src/templates/cursor-rules/.cursorrules`

| Before | After |
|--------|-------|
| `workflow_id required` | `agent_workflow_id required` |
| "Workflow Lifecycle Tools" section | "Agent Workflow Lifecycle Tools" |
| `get_workflow_state` | `get_agent_workflow_state` |
| `get_workflow_correlation` | `get_agent_workflow_correlation` |
| All `workflow_id` params | `agent_workflow_id` |
| All `/workflow/` URLs | `/agent-workflow/` |
| "Same workflow_id for static and dynamic" | "Same agent_workflow_id for static and dynamic" |

**File:** `src/templates/cursor-rules/agent-inspector.mdc`

Same changes as .cursorrules file.

### Skills

**File:** `src/templates/skills/static-analysis/SKILL.md`

| Before | After |
|--------|-------|
| "Derive workflow_id" | "Derive agent_workflow_id" |
| `get_workflow_state(workflow_id)` | `get_agent_workflow_state(agent_workflow_id)` |
| `create_analysis_session(workflow_id, ...)` | `create_analysis_session(agent_workflow_id, ...)` |
| `get_workflow_correlation(workflow_id)` | `get_agent_workflow_correlation(agent_workflow_id)` |
| All `workflow_id` | `agent_workflow_id` |

**File:** `src/templates/skills/dynamic-analysis/SKILL.md`

| Before | After |
|--------|-------|
| "same workflow_id" | "same agent_workflow_id" |
| `WORKFLOW_ID = "my-agent-v1"` | `AGENT_WORKFLOW_ID = "my-agent-v1"` |
| All `/workflow/` URLs | `/agent-workflow/` |
| `get_workflow_state(workflow_id)` | `get_agent_workflow_state(agent_workflow_id)` |
| `get_workflow_correlation(workflow_id)` | `get_agent_workflow_correlation(agent_workflow_id)` |
| Dashboard URL | `/workflow/{workflow_id}` | `/agent-workflow/{agent_workflow_id}` |

**File:** `src/templates/skills/auto-fix/SKILL.md`

| Before | After |
|--------|-------|
| `get_findings(workflow_id, ...)` | `get_findings(agent_workflow_id, ...)` |
| `get_workflow_state(workflow_id)` | `get_agent_workflow_state(agent_workflow_id)` |
| `get_workflow_correlation(workflow_id)` | `get_agent_workflow_correlation(agent_workflow_id)` |

---

## 16. Frontend Documentation

**File:** `src/interceptors/live_trace/frontend/docs/COMPONENTS_INDEX.md`

| Before | After |
|--------|-------|
| `/workflow/${workflowId}/static-analysis` | `/agent-workflow/${agentWorkflowId}/static-analysis` |

**File:** `src/interceptors/live_trace/frontend/docs/templates/STORY.md`

| Before | After |
|--------|-------|
| `initialEntries: ['/workflow/abc123/agent/xyz']` | `initialEntries: ['/agent-workflow/abc123/agent/xyz']` |

---

## 17. Test Files

### Provider Tests

**File:** `tests/providers/test_anthropic.py`

| Before | After |
|--------|-------|
| `class TestWorkflowIdInEvents` | `class TestAgentWorkflowIdInEvents` |
| `test_workflow_id_added_to_finish_event` | `test_agent_workflow_id_added_to_finish_event` |
| `test_workflow_id_none_when_not_provided` | `test_agent_workflow_id_none_when_not_provided` |
| `"workflow_id": "my-workflow"` | `"agent_workflow_id": "my-agent-workflow"` |
| `assert "workflow.id" in` | `assert "agent_workflow.id" in` |
| `llm_event.attributes["workflow.id"]` | `llm_event.attributes["agent_workflow.id"]` |

**File:** `tests/providers/test_openai.py`

Same changes as test_anthropic.py.

### IDE Connection Tests

**File:** `tests/interceptors/test_ide_connection.py`

| Before | After |
|--------|-------|
| All `workflow_id=` params | `agent_workflow_id=` |
| All `connection["workflow_id"]` | `connection["agent_workflow_id"]` |
| `get_ide_connections(workflow_id=...)` | `get_ide_connections(agent_workflow_id=...)` |
| `get_ide_connection_status(workflow_id=...)` | `get_ide_connection_status(agent_workflow_id=...)` |
| `update_ide_heartbeat(..., workflow_id=...)` | `update_ide_heartbeat(..., agent_workflow_id=...)` |

### Store Tests

**File:** `src/interceptors/live_trace/store/test_store.py`

~100+ occurrences of `workflow_id` → `agent_workflow_id`

### MCP Tests

**File:** `src/interceptors/live_trace/mcp/test_mcp.py`

| Before | After |
|--------|-------|
| `"get_workflow_state" in tool_names` | `"get_agent_workflow_state" in tool_names` |
| `"workflow_id": "test-workflow"` | `"agent_workflow_id": "test-workflow"` |
| `"workflow_name": "Test Workflow"` | `"agent_workflow_name": "Test Workflow"` |
| `session["workflow_id"]` | `session["agent_workflow_id"]` |
| `get_workflow_state` tool calls | `get_agent_workflow_state` |

**File:** `src/interceptors/live_trace/mcp/test_router.py`

| Before | After |
|--------|-------|
| `"get_workflow_state" in tool_names` | `"get_agent_workflow_state" in tool_names` |
| `"workflow_id": "test-workflow"` | `"agent_workflow_id": "test-agent-workflow"` |
| `content["session"]["workflow_id"]` | `content["session"]["agent_workflow_id"]` |
| `test_workflow_state_tool` | `test_agent_workflow_state_tool` |
| `"workflow_id": "new-workflow"` | `"agent_workflow_id": "new-agent-workflow"` |

**File:** `src/interceptors/live_trace/mcp/test_handlers.py`

| Before | After |
|--------|-------|
| `test_get_workflow_state_no_data` | `test_get_agent_workflow_state_no_data` |
| `test_get_workflow_state_with_static` | `test_get_agent_workflow_state_with_static` |
| `call_tool("get_workflow_state", {"workflow_id": ...})` | `call_tool("get_agent_workflow_state", {"agent_workflow_id": ...})` |
| `get_findings(workflow_id=...)` | `get_findings(agent_workflow_id=...)` |

### Runtime Engine Tests

**File:** `src/interceptors/live_trace/runtime/tests/test_engine.py`

| Before | After |
|--------|-------|
| `class TestInsightsWorkflowFiltering` | `class TestInsightsAgentWorkflowFiltering` |
| `_create_agent(store, agent_id, workflow_id)` | `_create_agent(store, agent_id, agent_workflow_id)` |
| `AgentData(agent_id, workflow_id)` | `AgentData(agent_id, agent_workflow_id)` |
| `test_get_dashboard_data_filters_by_workflow` | `test_get_dashboard_data_filters_by_agent_workflow` |
| `get_dashboard_data(workflow_id=...)` | `get_dashboard_data(agent_workflow_id=...)` |
| `data["workflow_id"]` | `data["agent_workflow_id"]` |

### Story Files

**File:** `AgentWorkflowsHome.stories.tsx` (renamed from WorkflowsHome.stories.tsx)

| Before | After |
|--------|-------|
| `import { WorkflowsHome }` | `import { AgentWorkflowsHome }` |
| `Meta<typeof WorkflowsHome>` | `Meta<typeof AgentWorkflowsHome>` |
| `title: 'Pages/WorkflowsHome'` | `title: 'Pages/AgentWorkflowsHome'` |
| `generateWorkflows` | `generateAgentWorkflows` |
| `WithTwelveWorkflows` | `WithTwelveAgentWorkflows` |

**File:** `AgentWorkflowCard.stories.tsx` (renamed)

| Before | After |
|--------|-------|
| `import { WorkflowCard }` | `import { AgentWorkflowCard }` |
| `title: 'Domain/Workflows/WorkflowCard'` | `title: 'Domain/AgentWorkflows/AgentWorkflowCard'` |
| `name: 'New Workflow'` | `name: 'New Agent Workflow'` |

**File:** `AgentWorkflowSelector.stories.tsx` (renamed)

| Before | After |
|--------|-------|
| `import { WorkflowSelector, type Workflow }` | `import { AgentWorkflowSelector, type AgentWorkflow }` |
| `title: 'Domain/Workflows/WorkflowSelector'` | `title: 'Domain/AgentWorkflows/AgentWorkflowSelector'` |
| `mockWorkflows: Workflow[]` | `mockAgentWorkflows: AgentWorkflow[]` |
| `InteractiveWorkflowSelector` | `InteractiveAgentWorkflowSelector` |

**File:** `ConnectionSuccess.stories.tsx`

| Before | After |
|--------|-------|
| `onViewWorkflows: fn()` | `onViewAgentWorkflows: fn()` |
| `ClickViewWorkflows` | `ClickViewAgentWorkflows` |
| `expect(args.onViewWorkflows)` | `expect(args.onViewAgentWorkflows)` |

---

## 18. Callback Props

| File | Before | After |
|------|--------|-------|
| `ConnectionSuccess.tsx` | `onViewWorkflows: () => void` | `onViewAgentWorkflows: () => void` |
| `Connect.tsx` | `onViewWorkflows={() => navigate('/')}` | `onViewAgentWorkflows={() => navigate('/')}` |

---

## 19. Styled Components

**File:** `AgentWorkflowsHome.styles.ts`

| Before | After |
|--------|-------|
| `WorkflowsGrid` | `AgentWorkflowsGrid` |
| `EmptyWorkflows` | `EmptyAgentWorkflows` |

**File:** `AgentWorkflowDetail.styles.ts`

| Before | After |
|--------|-------|
| `WorkflowHeader` | `AgentWorkflowHeader` |
| `WorkflowInfo` | `AgentWorkflowInfo` |
| `WorkflowName` | `AgentWorkflowName` |
| `WorkflowId` | `AgentWorkflowId` |
| `WorkflowStats` | `AgentWorkflowStats` |

**File:** `AgentWorkflowCard.styles.ts`

| Before | After |
|--------|-------|
| `WorkflowInfo` | `AgentWorkflowInfo` |
| `WorkflowName` | `AgentWorkflowName` |
| `WorkflowId` | `AgentWorkflowId` |

**File:** `AgentWorkflowSelector.styles.ts`

| Before | After |
|--------|-------|
| `WorkflowSelectorContainer` | `AgentWorkflowSelectorContainer` |
| `WorkflowSelectBox` | `AgentWorkflowSelectBox` |
| `WorkflowInfo` | `AgentWorkflowInfo` |
| `WorkflowIcon` | `AgentWorkflowIcon` |
| `WorkflowDropdown` | `AgentWorkflowDropdown` |
| `WorkflowOption` | `AgentWorkflowOption` |

---

## 20. Barrel Exports

**File:** `src/interceptors/live_trace/frontend/src/pages/index.ts`

| Before | After |
|--------|-------|
| `export { WorkflowDetail }` | `export { AgentWorkflowDetail }` |
| `export { WorkflowsHome }` | `export { AgentWorkflowsHome }` |

**File:** `src/interceptors/live_trace/frontend/src/components/domain/agent-workflows/index.ts`

| Before | After |
|--------|-------|
| `export { WorkflowSelector }` | `export { AgentWorkflowSelector }` |
| `export type { WorkflowSelectorProps, Workflow }` | `export type { AgentWorkflowSelectorProps, AgentWorkflow }` |
| `export { WorkflowCard }` | `export { AgentWorkflowCard }` |

**File:** `src/interceptors/live_trace/frontend/src/components/domain/index.ts`

| Before | After |
|--------|-------|
| `export * from './workflows'` | `export * from './agent-workflows'` |

---

## Summary Count

- **~90 files** changed
- **~1600+ individual line changes**
- **File renames:** 16 files
- **Route URLs:** `/workflow/` → `/agent-workflow/`, `/agent/` → `/agent-workflow/`
- **API endpoints:** `/api/workflow/` → `/api/agent-workflow/`, `/api/workflows` → `/api/agent-workflows`
- **Params:** `workflowId` → `agentWorkflowId`, `workflow_id` → `agent_workflow_id`
- **Labels:** `Workflows` → `Agent Workflows`, `Workflow` → `Agent Workflow`
- **Types:** `Workflow` → `AgentWorkflow`, `APIWorkflow` → `APIAgentWorkflow`
- **Functions:** `fetchWorkflows` → `fetchAgentWorkflows`, `get_workflows` → `get_agent_workflows`, etc.
- **MCP Tools:** `get_workflow_state` → `get_agent_workflow_state`, `get_workflow_correlation` → `get_agent_workflow_correlation`
- **Event attributes:** `workflow.id` → `agent_workflow.id`
- **DB columns:** `workflow_id` → `agent_workflow_id`, `workflow_name` → `agent_workflow_name`

---

## Key Changes by Layer

### 1. Proxy Layer (Entry Point)
- `src/main.py`: Route `/workflow/{workflow_id}/` → `/agent-workflow/{agent_workflow_id}/`
- `src/proxy/middleware.py`: Request state key

### 2. Provider Layer (Event Generation)
- `src/providers/anthropic.py`: Event attributes `workflow.id` → `agent_workflow.id`
- `src/providers/openai.py`: Event attributes `workflow.id` → `agent_workflow.id`

### 3. Store Layer (Persistence)
- `src/interceptors/live_trace/store/store.py`: All DB schema, data classes, methods

### 4. Runtime Layer (Analysis)
- `src/interceptors/live_trace/runtime/engine.py`: Dashboard data methods
- `src/interceptors/live_trace/runtime/analysis_runner.py`: Analysis session creation

### 5. API Layer (Server)
- `src/interceptors/live_trace/server.py`: All REST endpoints

### 6. MCP Layer (Tools)
- `src/interceptors/live_trace/mcp/tools.py`: Tool definitions
- `src/interceptors/live_trace/mcp/handlers.py`: Tool implementations

### 7. Frontend Layer
- All pages, components, API endpoints, types

### 8. Documentation/Templates
- All cursor rules, skills, setup guides

### 9. Tests
- All test files across providers, store, MCP, runtime, frontend

---

## 21. Additional Cleanup Items (Missed in Initial Pass)

These are additional items that need to be updated to complete the terminology change:

### server.py (lines 107-110)

| Before | After |
|--------|-------|
| `workflows = insights.store.get_agent_workflows()` | `agent_workflows = insights.store.get_agent_workflows()` |
| `return JSONResponse({"workflows": workflows})` | `return JSONResponse({"agentWorkflows": agent_workflows})` |
| `logger.error(f"Error getting workflows: {e}")` | `logger.error(f"Error getting agent workflows: {e}")` |

### test_mcp.py (line 315)

| Before | After |
|--------|-------|
| `assert "workflow_id" in tool_result["error"]` | `assert "agent_workflow_id" in tool_result["error"]` |

### engine.py (lines 81-82, 114, 121, 155-186)

| Before | After |
|--------|-------|
| Docstring: "Optional workflow ID to filter by" | "Optional agent workflow ID to filter by" |
| Docstring: "with no workflow" | "with no agent workflow" |
| Docstring: "for the workflow" | "for the agent workflow" |
| Comment: "for this workflow" | "for this agent workflow" |
| Variable: `workflow_agents` | `agents_in_workflow` |

### store.py (lines 1012-1074, 2147)

| Before | After |
|--------|-------|
| Docstring: "List of workflow dicts" | "List of agent workflow dicts" |
| Docstring: "Includes workflows from agents" | "Includes agent workflows from agents" |
| Variable: `workflows = []` | `agent_workflows = []` |
| Comment: "Get workflows with agent counts" | "Get agent workflows with agent counts" |
| Variable: `workflows.append(...)` | `agent_workflows.append(...)` |
| `return workflows` | `return agent_workflows` |
| Comment: "for this workflow" (line 2147) | "for this agent workflow" |
| SQL comment: "(for workflow names)" | "(for agent workflow names)" |

### tools.py (lines 70, 208, 264)

| Before | After |
|--------|-------|
| `"description": "Human-readable workflow/project name"` | `"description": "Human-readable agent workflow/project name"` |
| `"description": "...linking to workflows or naming."` | `"description": "...linking to agent workflows or naming."` |
| `"description": "The workflow/agent ID..."` | `"description": "The agent workflow ID..."` |
