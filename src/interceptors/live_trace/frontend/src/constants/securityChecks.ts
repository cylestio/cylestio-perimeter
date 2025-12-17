/**
 * Security check definitions for static and dynamic analysis.
 * Used by Reports page to evaluate findings against predefined security controls.
 */

export interface SecurityCheckDefinition {
  id: string;
  name: string;
  description: string;
  categories: string[]; // Maps to finding categories
  keywords: string[];   // Keywords to match in finding titles
}

/**
 * Predefined Static Analysis Checks (code pattern analysis)
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
 * Predefined Dynamic Analysis Checks (runtime behavior observation)
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
