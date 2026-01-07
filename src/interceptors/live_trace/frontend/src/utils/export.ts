import type { TimelineEvent } from '@api/types/session';

export interface ConversationMessage {
  role: 'user' | 'assistant' | 'tool_use' | 'tool_result';
  content?: string;
  tool?: string;
  input?: unknown;
  output?: unknown;
  timestamp: string;
}

/**
 * Session data formatted for export.
 * Uses real timestamps instead of relative time.
 */
export interface ExportedSession {
  id: string;
  agent_id: string;
  agent_workflow_id: string | null;
  status: string;
  created_at: string;
  last_activity: string;
  duration_minutes: number;
  message_count: number;
  tool_uses: number;
  total_tokens: number;
  errors: number;
  error_rate: number;
  tags: Record<string, string> | undefined;
}

/**
 * Extract text content from various message content formats.
 * Handles string, array of content blocks, and nested structures.
 */
function extractMessageContent(content: unknown): string | null {
  if (typeof content === 'string') return content;
  if (!content) return null;

  if (Array.isArray(content)) {
    const textParts: string[] = [];
    for (const block of content) {
      if (!block) continue;
      if (block.type === 'text' && block.text) {
        textParts.push(block.text);
      } else if (block.text) {
        textParts.push(block.text);
      }
    }
    return textParts.length > 0 ? textParts.join('\n') : null;
  }

  if (typeof content === 'object' && 'text' in content) {
    return (content as { text: string }).text;
  }

  return null;
}

/**
 * Parse timeline events into a linear conversation format.
 */
export function parseConversation(events: TimelineEvent[]): ConversationMessage[] {
  const messages: ConversationMessage[] = [];

  for (const event of events) {
    const details = event.details || {};

    switch (event.event_type) {
      case 'llm.call.start': {
        const requestData = (details['llm.request.data'] || {}) as Record<string, unknown>;
        const messagesList = (requestData.messages || []) as Array<{
          role: string;
          content: unknown;
        }>;
        if (messagesList.length > 0) {
          const lastMsg = messagesList[messagesList.length - 1];
          const content = extractMessageContent(lastMsg.content);
          if (content) {
            messages.push({
              role: 'user',
              content,
              timestamp: event.timestamp,
            });
          }
        }
        break;
      }

      case 'llm.call.finish': {
        // Only extract text content from llm.call.finish
        // Skip tool_use blocks as they are captured by tool.execution events
        const responseContent = (details['llm.response.content'] || []) as Array<{
          type?: string;
          text?: string;
          content?: string;
        }>;

        for (const item of responseContent) {
          if (item.type === 'text' && item.text) {
            messages.push({
              role: 'assistant',
              content: item.text,
              timestamp: event.timestamp,
            });
          } else if (item.type !== 'tool_use' && (item.text || item.content)) {
            // Include other text content but skip tool_use blocks
            messages.push({
              role: 'assistant',
              content: item.text || item.content,
              timestamp: event.timestamp,
            });
          }
        }
        break;
      }

      case 'tool.execution': {
        const toolName = (details['tool.name'] || 'unknown') as string;
        const toolParams = details['tool.params'];
        messages.push({
          role: 'tool_use',
          tool: toolName,
          input: toolParams,
          timestamp: event.timestamp,
        });
        break;
      }

      case 'tool.result': {
        const toolResult = details['tool.result'];
        messages.push({
          role: 'tool_result',
          output: toolResult,
          timestamp: event.timestamp,
        });
        break;
      }
    }
  }

  return messages;
}

/**
 * Trigger a browser download of JSON data.
 */
export function downloadJSON(data: unknown, filename: string): void {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Escape a value for CSV format.
 * Wraps in quotes if contains comma, quote, or newline.
 */
function escapeCSVValue(value: unknown): string {
  if (value === null || value === undefined) return '';

  const str = typeof value === 'object' ? JSON.stringify(value) : String(value);

  // If contains special chars, wrap in quotes and escape existing quotes
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Convert sessions list to CSV format.
 */
export function convertSessionsToCSV(sessions: ExportedSession[]): string {
  const headers = [
    'id',
    'agent_id',
    'agent_workflow_id',
    'status',
    'created_at',
    'last_activity',
    'duration_minutes',
    'message_count',
    'tool_uses',
    'total_tokens',
    'errors',
    'error_rate',
    'tags',
  ];

  const rows = sessions.map((session) =>
    headers.map((header) => escapeCSVValue(session[header as keyof ExportedSession])).join(',')
  );

  return [headers.join(','), ...rows].join('\n');
}

/**
 * Trigger a browser download of CSV data.
 */
export function downloadCSV(data: string, filename: string): void {
  const blob = new Blob([data], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
