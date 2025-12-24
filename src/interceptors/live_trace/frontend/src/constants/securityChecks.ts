/**
 * Security check constants for the frontend.
 *
 * This file contains:
 * 1. Finding evaluation checks (for Reports page static/dynamic findings matching)
 * 2. Dynamic category display mappings (frontend-only icons and colors)
 *
 * NOTE: Runtime dynamic security check definitions (like RESOURCE_001_TOKEN_BOUNDS)
 * are fetched from the backend via /api/security-check-definitions.
 * See @api/types/security.ts for those types.
 */

import {
  BarChart3,
  Settings,
  Brain,
  Lock,
  type LucideIcon,
} from 'lucide-react';

import type { DynamicCategoryId, DynamicCheckStatus } from '@api/types/security';

// ============================================================================
// Finding Evaluation Checks (used by Reports page)
// These match static analysis findings to predefined security controls.
// ============================================================================

export interface SecurityCheckDefinition {
  id: string;
  name: string;
  description: string;
  categories: string[]; // Maps to finding categories
  keywords: string[];   // Keywords to match in finding titles
}

/**
 * Static Analysis Checks - for evaluating code pattern findings.
 */
export const STATIC_CHECKS: SecurityCheckDefinition[] = [
  { id: 'rate_limiting', name: 'Rate Limiting', description: 'Per-user request throttling', categories: ['RESOURCE_MANAGEMENT', 'TOOL'], keywords: ['rate', 'throttl', 'limit', 'budget'] },
  { id: 'input_sanitization', name: 'Input Sanitization', description: 'User input filtering before LLM', categories: ['PROMPT'], keywords: ['sanitiz', 'input', 'validation', 'filter', 'injection'] },
  { id: 'pre_execution', name: 'Pre-Execution Validation', description: 'Tool call validation before execution', categories: ['TOOL'], keywords: ['pre-execution', 'validation', 'before execution', 'tool call'] },
  { id: 'audit_logging', name: 'Audit Logging', description: 'Action and decision logging', categories: ['BEHAVIOR', 'DATA'], keywords: ['audit', 'logging', 'log', 'trail'] },
  { id: 'secret_management', name: 'Secret Management', description: 'API key handling', categories: ['DATA', 'SUPPLY'], keywords: ['secret', 'api key', 'credential', 'hardcoded'] },
  { id: 'dependency_security', name: 'Dependency Security', description: 'Known vulnerabilities in packages', categories: ['SUPPLY'], keywords: ['dependency', 'cve', 'vulnerab', 'package', 'supply chain'] },
  { id: 'output_validation', name: 'Output Validation', description: 'LLM output safety checks', categories: ['OUTPUT'], keywords: ['output', 'response', 'eval', 'exec', 'code execution'] },
  { id: 'tool_definitions', name: 'Tool Definitions', description: 'Tool schemas and capabilities', categories: ['TOOL'], keywords: ['tool', 'schema', 'capability', 'permission'] },
];

/**
 * Dynamic Finding Checks - for evaluating runtime observation findings.
 */
export const DYNAMIC_CHECKS: SecurityCheckDefinition[] = [
  { id: 'tool_monitoring', name: 'Tool Call Monitoring', description: 'All tool invocations captured', categories: ['TOOL', 'BEHAVIOR'], keywords: ['tool call', 'monitor', 'invocation'] },
  { id: 'throttling', name: 'Throttling Observation', description: 'Rate limiting behavior', categories: ['RESOURCE_MANAGEMENT'], keywords: ['throttl', 'rate', 'limit'] },
  { id: 'data_leakage', name: 'Data Leakage Detection', description: 'PII/secrets in responses', categories: ['DATA', 'OUTPUT'], keywords: ['leak', 'pii', 'expos', 'sensitive', 'exfil'] },
  { id: 'pre_execution_runtime', name: 'Pre-Execution Validation', description: 'Tool call validation observed', categories: ['TOOL'], keywords: ['validation', 'pre-execution'] },
  { id: 'behavioral_patterns', name: 'Behavioral Patterns', description: 'Tool sequence clustering', categories: ['BEHAVIORAL', 'BEHAVIOR'], keywords: ['pattern', 'cluster', 'sequence', 'behavioral', 'stability', 'outlier'] },
  { id: 'cost_tracking', name: 'Cost Tracking', description: 'Token usage per session', categories: ['RESOURCE_MANAGEMENT'], keywords: ['cost', 'token', 'budget', 'usage'] },
  { id: 'anomaly_detection', name: 'Anomaly Detection', description: 'Outlier identification', categories: ['BEHAVIORAL', 'BEHAVIOR'], keywords: ['anomal', 'outlier', 'unusual', 'unexpected'] },
];

// ============================================================================
// Dynamic Analysis Category Display (frontend-only)
// These are display-only mappings for the DynamicChecksGrid component.
// Category definitions (name, description) come from the backend.
// ============================================================================

/**
 * Category display order for dynamic security checks.
 */
export const DYNAMIC_CATEGORY_ORDER: DynamicCategoryId[] = [
  'RESOURCE_MANAGEMENT',
  'ENVIRONMENT',
  'BEHAVIORAL',
  'PRIVACY_COMPLIANCE',
];

/**
 * Icon component for each dynamic category.
 */
export const DYNAMIC_CATEGORY_ICONS: Record<DynamicCategoryId, LucideIcon> = {
  RESOURCE_MANAGEMENT: BarChart3,
  ENVIRONMENT: Settings,
  BEHAVIORAL: Brain,
  PRIVACY_COMPLIANCE: Lock,
};

// ============================================================================
// Status Colors (frontend-only)
// ============================================================================

/**
 * Color tokens for check status display.
 * Uses theme token names (not actual colors).
 */
export const DYNAMIC_STATUS_COLORS: Record<DynamicCheckStatus, string> = {
  passed: 'success',
  warning: 'warning',
  critical: 'error',
  analyzing: 'info',
};

/**
 * Status display labels.
 */
export const DYNAMIC_STATUS_LABELS: Record<DynamicCheckStatus, string> = {
  passed: 'Passed',
  warning: 'Warning',
  critical: 'Critical',
  analyzing: 'Analyzing',
};
