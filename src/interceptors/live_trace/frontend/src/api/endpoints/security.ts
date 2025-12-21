/**
 * Security API Endpoints
 *
 * Endpoints for dynamic security analysis data.
 */

import type {
  SecurityCheckDefinitionsResponse,
  DynamicAgentSecurityChecksResponse,
  DynamicWorkflowSecurityChecksResponse,
  DynamicSecurityCheck,
} from '../types/security';

// Re-export types for convenience
export type {
  SecurityCheckDefinitionsResponse,
  DynamicSecurityCheck,
  DynamicAgentSecurityChecksResponse,
  DynamicWorkflowSecurityChecksResponse,
} from '../types/security';

/**
 * Fetch security check definitions (single source of truth).
 * Cache the result - these definitions rarely change.
 */
export async function fetchSecurityCheckDefinitions(): Promise<SecurityCheckDefinitionsResponse> {
  const response = await fetch('/api/security-check-definitions');
  if (!response.ok) {
    throw new Error(`Failed to fetch security check definitions: ${response.statusText}`);
  }
  const data = await response.json();
  if (data.error) {
    throw new Error(data.error);
  }
  return data;
}

/**
 * Fetch dynamic security checks for an agent.
 */
export interface FetchAgentSecurityChecksParams {
  categoryId?: string;
  status?: string;
  limit?: number;
}

export async function fetchAgentDynamicChecks(
  agentId: string,
  params?: FetchAgentSecurityChecksParams
): Promise<DynamicAgentSecurityChecksResponse> {
  const queryParams = new URLSearchParams();
  if (params?.categoryId) queryParams.set('category_id', params.categoryId);
  if (params?.status) queryParams.set('status', params.status);
  if (params?.limit) queryParams.set('limit', String(params.limit));

  const queryString = queryParams.toString();
  const url = `/api/agent/${agentId}/security-checks${queryString ? '?' + queryString : ''}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch agent security checks: ${response.statusText}`);
  }
  const data = await response.json();
  if (data.error) {
    throw new Error(data.error);
  }

  // Map backend response to our types
  return {
    agent_id: data.agent_id,
    checks: data.checks.map(mapBackendCheck),
    summary: {
      total: data.summary?.total ?? data.checks.length,
      passed: data.summary?.passed ?? 0,
      warnings: data.summary?.warnings ?? 0,
      critical: data.summary?.critical ?? 0,
      pii_status: data.summary?.pii_status,
    },
  };
}

/**
 * Fetch dynamic security checks for a workflow (all agents).
 */
export interface FetchWorkflowSecurityChecksParams {
  categoryId?: string;
  status?: string;
  limit?: number;
}

export async function fetchWorkflowDynamicChecks(
  workflowId: string,
  params?: FetchWorkflowSecurityChecksParams
): Promise<DynamicWorkflowSecurityChecksResponse> {
  const queryParams = new URLSearchParams();
  if (params?.categoryId) queryParams.set('category_id', params.categoryId);
  if (params?.status) queryParams.set('status', params.status);
  if (params?.limit) queryParams.set('limit', String(params.limit));

  const queryString = queryParams.toString();
  const url = `/api/agent-workflow/${workflowId}/security-checks${queryString ? '?' + queryString : ''}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch workflow security checks: ${response.statusText}`);
  }
  const data = await response.json();
  if (data.error) {
    throw new Error(data.error);
  }

  return {
    agent_workflow_id: data.agent_workflow_id,
    agents: data.agents.map((agent: Record<string, unknown>) => ({
      agent_id: agent.agent_id,
      agent_name: agent.agent_name,
      checks: (agent.checks as Record<string, unknown>[]).map(mapBackendCheck),
      latest_check_at: agent.latest_check_at,
      summary: agent.summary,
    })),
    total_summary: data.total_summary,
  };
}

/**
 * Map backend check format to DynamicSecurityCheck.
 */
function mapBackendCheck(check: Record<string, unknown>): DynamicSecurityCheck {
  return {
    check_id: check.check_id as string,
    agent_id: check.agent_id as string,
    agent_workflow_id: check.agent_workflow_id as string | undefined,
    analysis_session_id: check.analysis_session_id as string | undefined,
    category_id: check.category_id as DynamicSecurityCheck['category_id'],
    check_type: check.check_type as string,
    status: check.status as DynamicSecurityCheck['status'],
    title: (check.title || check.name) as string,
    value: check.value as string | undefined,
    description: check.description as string | undefined,
    evidence: check.evidence as Record<string, unknown> | undefined,
    recommendations: check.recommendations as string[] | undefined,
    created_at: check.created_at as string | undefined,
    framework_mappings: check.framework_mappings
      ? (check.framework_mappings as DynamicSecurityCheck['framework_mappings'])
      : undefined,
  };
}
