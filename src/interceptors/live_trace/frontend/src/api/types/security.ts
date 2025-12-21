/**
 * Dynamic Security Analysis Types
 *
 * These types are used for runtime behavior analysis (dynamic analysis).
 * The backend is the single source of truth for check definitions.
 * Fetch definitions from /api/security-check-definitions once on app load.
 */

// ============================================================================
// Category Types
// ============================================================================

/**
 * Dynamic analysis category IDs as returned by the backend.
 */
export type DynamicCategoryId =
  | 'RESOURCE_MANAGEMENT'
  | 'ENVIRONMENT'
  | 'BEHAVIORAL'
  | 'PRIVACY_COMPLIANCE';

/**
 * Category definition from /api/security-check-definitions.
 */
export interface DynamicCategoryDefinition {
  name: string;
  description: string;
  icon: string;
  order: number;
}

// ============================================================================
// Check Definition Types (from backend)
// ============================================================================

/**
 * Check definition from /api/security-check-definitions.
 * Contains static metadata about a security check.
 */
export interface DynamicCheckDefinition {
  category_id: DynamicCategoryId;
  name: string;
  description: string;
  recommendations: string[];
  // Framework mappings
  owasp_llm: string | null;
  owasp_llm_name: string | null;
  soc2_controls: string[];
  cwe: string | null;
  mitre: string | null;
}

/**
 * Response from /api/security-check-definitions endpoint.
 */
export interface SecurityCheckDefinitionsResponse {
  dynamic_checks: Record<string, DynamicCheckDefinition>;
  dynamic_categories: Record<DynamicCategoryId, DynamicCategoryDefinition>;
}

// ============================================================================
// PII Status Types
// ============================================================================

/**
 * PII analysis status for async tracking.
 * - complete: PII analysis finished, results available
 * - pending: PII analysis is running
 * - refreshing: Re-analyzing with new data
 * - disabled: PII detection is disabled
 * - not_available: No PII checks have run yet
 */
export type PiiStatus =
  | 'complete'
  | 'pending'
  | 'refreshing'
  | 'disabled'
  | 'not_available';

// ============================================================================
// Security Check Types (from API responses)
// ============================================================================

/**
 * Check status as returned by the backend.
 * 'analyzing' is used when PII analysis is still pending.
 */
export type DynamicCheckStatus = 'passed' | 'warning' | 'critical' | 'analyzing';

/**
 * Framework mappings for a security check.
 */
export interface DynamicFrameworkMappings {
  owasp_llm?: string | null;
  owasp_llm_name?: string | null;
  soc2_controls?: string[];
  cwe?: string | null;
  mitre?: string | null;
  cvss_score?: number | null;
}

/**
 * Dynamic security check as returned by API endpoints.
 * This is the runtime check result with status and evidence.
 */
export interface DynamicSecurityCheck {
  // Identifiers
  check_id: string;
  agent_id: string;
  agent_workflow_id?: string;
  analysis_session_id?: string;

  // Classification
  category_id: DynamicCategoryId;
  check_type: string;

  // Result
  status: DynamicCheckStatus;
  title: string;
  value?: string;

  // Extended data (may come from definitions or backend)
  description?: string;
  evidence?: Record<string, unknown>;
  recommendations?: string[];

  // Framework mappings (enriched from definitions)
  framework_mappings?: DynamicFrameworkMappings;

  // Metadata
  created_at?: string;

  // Sessions affected (for drawer)
  affected_sessions?: string[];
}

// ============================================================================
// Summary Types
// ============================================================================

/**
 * Summary of check results for an agent or workflow.
 */
export interface DynamicChecksSummary {
  total: number;
  passed: number;
  warnings: number;
  critical: number;
  pii_status?: PiiStatus;
}

// ============================================================================
// API Response Types
// ============================================================================

/**
 * Agent security data in workflow response.
 */
export interface DynamicAgentSecurityData {
  agent_id: string;
  agent_name: string;
  checks: DynamicSecurityCheck[];
  latest_check_at?: string;
  summary: DynamicChecksSummary;
}

/**
 * Response from /api/agent-workflow/{id}/security-checks.
 */
export interface DynamicWorkflowSecurityChecksResponse {
  agent_workflow_id: string;
  agents: DynamicAgentSecurityData[];
  total_summary: DynamicChecksSummary & {
    agents_analyzed: number;
  };
}

/**
 * Response from /api/agent/{id}/security-checks.
 */
export interface DynamicAgentSecurityChecksResponse {
  agent_id: string;
  checks: DynamicSecurityCheck[];
  summary: DynamicChecksSummary;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Enrich a security check with definition data.
 * Call this to merge API check data with cached definitions.
 */
export function enrichCheckWithDefinition(
  check: DynamicSecurityCheck,
  definitions: Record<string, DynamicCheckDefinition>
): DynamicSecurityCheck {
  const definition = definitions[check.check_id];
  if (!definition) return check;

  return {
    ...check,
    description: check.description || definition.description,
    recommendations: check.recommendations || definition.recommendations,
    framework_mappings: {
      owasp_llm: definition.owasp_llm,
      owasp_llm_name: definition.owasp_llm_name,
      soc2_controls: definition.soc2_controls,
      cwe: definition.cwe,
      mitre: definition.mitre,
      ...check.framework_mappings,
    },
  };
}

/**
 * Group checks by category.
 */
export function groupChecksByCategory(
  checks: DynamicSecurityCheck[]
): Record<DynamicCategoryId, DynamicSecurityCheck[]> {
  const grouped: Record<DynamicCategoryId, DynamicSecurityCheck[]> = {
    RESOURCE_MANAGEMENT: [],
    ENVIRONMENT: [],
    BEHAVIORAL: [],
    PRIVACY_COMPLIANCE: [],
  };

  for (const check of checks) {
    if (check.category_id in grouped) {
      grouped[check.category_id].push(check);
    }
  }

  return grouped;
}

/**
 * Calculate summary from a list of checks.
 */
export function calculateChecksSummary(
  checks: DynamicSecurityCheck[],
  piiStatus?: PiiStatus
): DynamicChecksSummary {
  return {
    total: checks.length,
    passed: checks.filter((c) => c.status === 'passed').length,
    warnings: checks.filter((c) => c.status === 'warning').length,
    critical: checks.filter((c) => c.status === 'critical').length,
    pii_status: piiStatus,
  };
}

/**
 * Get the highest severity from a list of checks.
 */
export function getHighestSeverity(
  checks: DynamicSecurityCheck[]
): DynamicCheckStatus {
  if (checks.some((c) => c.status === 'critical')) return 'critical';
  if (checks.some((c) => c.status === 'warning')) return 'warning';
  if (checks.some((c) => c.status === 'analyzing')) return 'analyzing';
  return 'passed';
}
