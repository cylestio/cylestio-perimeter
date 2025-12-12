/**
 * Types for IDE connection status
 */

export interface IDEConnection {
  connection_id: string;
  ide_type: 'cursor' | 'claude-code';
  workflow_id: string | null;
  mcp_session_id: string | null;
  host: string | null;
  user: string | null;
  workspace_path: string | null;
  model: string | null;
  connected_at: string;
  last_heartbeat: string;
  last_seen_relative: string;
  is_active: boolean;
  is_developing: boolean;
  disconnected_at: string | null;
  metadata: Record<string, unknown> | null;
}

export interface IDEConnectionStatus {
  is_connected: boolean;
  is_developing: boolean;
  has_ever_connected: boolean;
  connected_ide: IDEConnection | null;
  active_connections: IDEConnection[];
  recent_connections: IDEConnection[];
  connection_count: number;
}

export interface IDEConnectionsResponse {
  connections: IDEConnection[];
  total_count: number;
}
