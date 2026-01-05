/**
 * Types for simplified IDE activity status
 *
 * Activity is tracked automatically when any MCP tool with agent_workflow_id is called.
 * IDE metadata (type, workspace, model) is optional and provided via ide_heartbeat.
 */

/**
 * Optional IDE metadata - only available if ide_heartbeat was called
 */
export interface IDEMetadata {
  ide_type: 'cursor' | 'claude-code';
  workspace_path: string | null;
  model: string | null;
  host: string | null;
  user: string | null;
}

/**
 * Simplified IDE activity status
 */
export interface IDEConnectionStatus {
  /** Whether any MCP activity has been recorded for this workflow */
  has_activity: boolean;
  /** ISO timestamp of last activity, null if no activity */
  last_seen: string | null;
  /** IDE metadata, null if ide_heartbeat was never called */
  ide: IDEMetadata | null;
}
