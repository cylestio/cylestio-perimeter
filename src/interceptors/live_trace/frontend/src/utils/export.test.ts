import { describe, it, expect } from 'vitest';
import { parseConversation, convertSessionsToCSV } from './export';
import type { TimelineEvent } from '@api/types/session';
import type { ExportedSession } from './export';

describe('parseConversation', () => {
  it('should return empty array for empty events', () => {
    const result = parseConversation([]);
    expect(result).toEqual([]);
  });

  it('should extract user message from llm.call.start', () => {
    const events: TimelineEvent[] = [
      {
        id: '1',
        event_type: 'llm.call.start',
        timestamp: '2024-01-01T00:00:00Z',
        level: 'INFO',
        details: {
          'llm.request.data': {
            messages: [
              { role: 'system', content: 'You are a helpful assistant' },
              { role: 'user', content: 'Hello, how are you?' },
            ],
          },
        },
      },
    ];

    const result = parseConversation(events);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      role: 'user',
      content: 'Hello, how are you?',
      timestamp: '2024-01-01T00:00:00Z',
    });
  });

  it('should extract assistant text response from llm.call.finish', () => {
    const events: TimelineEvent[] = [
      {
        id: '1',
        event_type: 'llm.call.finish',
        timestamp: '2024-01-01T00:00:01Z',
        level: 'INFO',
        details: {
          'llm.response.content': [
            { type: 'text', text: 'I am doing well, thank you!' },
          ],
        },
      },
    ];

    const result = parseConversation(events);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      role: 'assistant',
      content: 'I am doing well, thank you!',
      timestamp: '2024-01-01T00:00:01Z',
    });
  });

  it('should skip tool_use blocks from llm.call.finish (captured by tool.execution)', () => {
    const events: TimelineEvent[] = [
      {
        id: '1',
        event_type: 'llm.call.finish',
        timestamp: '2024-01-01T00:00:01Z',
        level: 'INFO',
        details: {
          'llm.response.content': [
            { type: 'text', text: 'Let me check that for you.' },
            { type: 'tool_use', name: 'read_file', input: { path: '/test.txt' } },
          ],
        },
      },
    ];

    const result = parseConversation(events);

    // Should only have the text message, not the tool_use
    expect(result).toHaveLength(1);
    expect(result[0].role).toBe('assistant');
    expect(result[0].content).toBe('Let me check that for you.');
  });

  it('should extract tool execution from tool.execution event', () => {
    const events: TimelineEvent[] = [
      {
        id: '1',
        event_type: 'tool.execution',
        timestamp: '2024-01-01T00:00:02Z',
        level: 'INFO',
        details: {
          'tool.name': 'read_file',
          'tool.params': { path: '/test.txt' },
        },
      },
    ];

    const result = parseConversation(events);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      role: 'tool_use',
      tool: 'read_file',
      input: { path: '/test.txt' },
      timestamp: '2024-01-01T00:00:02Z',
    });
  });

  it('should extract tool result from tool.result event', () => {
    const events: TimelineEvent[] = [
      {
        id: '1',
        event_type: 'tool.result',
        timestamp: '2024-01-01T00:00:03Z',
        level: 'INFO',
        details: {
          'tool.result': { content: 'File contents here' },
        },
      },
    ];

    const result = parseConversation(events);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      role: 'tool_result',
      output: { content: 'File contents here' },
      timestamp: '2024-01-01T00:00:03Z',
    });
  });

  it('should handle a full conversation flow', () => {
    const events: TimelineEvent[] = [
      {
        id: '1',
        event_type: 'llm.call.start',
        timestamp: '2024-01-01T00:00:00Z',
        level: 'INFO',
        details: {
          'llm.request.data': {
            messages: [{ role: 'user', content: 'Read /test.txt' }],
          },
        },
      },
      {
        id: '2',
        event_type: 'llm.call.finish',
        timestamp: '2024-01-01T00:00:01Z',
        level: 'INFO',
        details: {
          'llm.response.content': [
            { type: 'tool_use', name: 'read_file', input: { path: '/test.txt' } },
          ],
        },
      },
      {
        id: '3',
        event_type: 'tool.execution',
        timestamp: '2024-01-01T00:00:02Z',
        level: 'INFO',
        details: {
          'tool.name': 'read_file',
          'tool.params': { path: '/test.txt' },
        },
      },
      {
        id: '4',
        event_type: 'tool.result',
        timestamp: '2024-01-01T00:00:03Z',
        level: 'INFO',
        details: {
          'tool.result': 'Hello World',
        },
      },
      {
        id: '5',
        event_type: 'llm.call.start',
        timestamp: '2024-01-01T00:00:04Z',
        level: 'INFO',
        details: {
          'llm.request.data': {
            messages: [
              { role: 'user', content: 'Read /test.txt' },
              { role: 'assistant', content: '', tool_calls: [] },
              { role: 'tool', content: 'Hello World' },
              { role: 'user', content: 'What does it say?' },
            ],
          },
        },
      },
      {
        id: '6',
        event_type: 'llm.call.finish',
        timestamp: '2024-01-01T00:00:05Z',
        level: 'INFO',
        details: {
          'llm.response.content': [
            { type: 'text', text: 'The file contains "Hello World".' },
          ],
        },
      },
    ];

    const result = parseConversation(events);

    // Expected flow:
    // 1. user: "Read /test.txt"
    // 2. (tool_use from llm.call.finish skipped - captured by tool.execution)
    // 3. tool_use: read_file
    // 4. tool_result: "Hello World"
    // 5. user: "What does it say?"
    // 6. assistant: "The file contains..."
    expect(result).toHaveLength(5);
    expect(result.map((m) => m.role)).toEqual([
      'user',
      'tool_use',
      'tool_result',
      'user',
      'assistant',
    ]);
  });

  it('should handle array content blocks in user messages', () => {
    const events: TimelineEvent[] = [
      {
        id: '1',
        event_type: 'llm.call.start',
        timestamp: '2024-01-01T00:00:00Z',
        level: 'INFO',
        details: {
          'llm.request.data': {
            messages: [
              {
                role: 'user',
                content: [
                  { type: 'text', text: 'First part.' },
                  { type: 'text', text: 'Second part.' },
                ],
              },
            ],
          },
        },
      },
    ];

    const result = parseConversation(events);

    expect(result).toHaveLength(1);
    expect(result[0].content).toBe('First part.\nSecond part.');
  });

  it('should handle missing details gracefully', () => {
    const events: TimelineEvent[] = [
      {
        id: '1',
        event_type: 'llm.call.start',
        timestamp: '2024-01-01T00:00:00Z',
        level: 'INFO',
        details: {},
      },
      {
        id: '2',
        event_type: 'llm.call.finish',
        timestamp: '2024-01-01T00:00:01Z',
        level: 'INFO',
        // No details at all
      },
    ];

    const result = parseConversation(events);

    // Should return empty - no extractable content
    expect(result).toEqual([]);
  });

  it('should handle unknown event types gracefully', () => {
    const events: TimelineEvent[] = [
      {
        id: '1',
        event_type: 'unknown.event',
        timestamp: '2024-01-01T00:00:00Z',
        level: 'INFO',
        details: { some: 'data' },
      },
    ];

    const result = parseConversation(events);

    expect(result).toEqual([]);
  });
});

describe('convertSessionsToCSV', () => {
  it('should return header row for empty array', () => {
    const result = convertSessionsToCSV([]);
    expect(result).toBe(
      'id,agent_id,agent_workflow_id,status,created_at,last_activity,duration_minutes,message_count,tool_uses,total_tokens,errors,error_rate,tags'
    );
  });

  it('should convert single session to CSV', () => {
    const sessions: ExportedSession[] = [
      {
        id: 'session-123',
        agent_id: 'agent-456',
        agent_workflow_id: 'workflow-789',
        status: 'COMPLETED',
        created_at: '2024-01-01T00:00:00Z',
        last_activity: '2024-01-01T01:00:00Z',
        duration_minutes: 60,
        message_count: 10,
        tool_uses: 5,
        total_tokens: 1000,
        errors: 0,
        error_rate: 0,
        tags: undefined,
      },
    ];

    const result = convertSessionsToCSV(sessions);
    const lines = result.split('\n');

    expect(lines).toHaveLength(2);
    expect(lines[0]).toBe(
      'id,agent_id,agent_workflow_id,status,created_at,last_activity,duration_minutes,message_count,tool_uses,total_tokens,errors,error_rate,tags'
    );
    expect(lines[1]).toBe(
      'session-123,agent-456,workflow-789,COMPLETED,2024-01-01T00:00:00Z,2024-01-01T01:00:00Z,60,10,5,1000,0,0,'
    );
  });

  it('should escape values containing commas', () => {
    const sessions: ExportedSession[] = [
      {
        id: 'session,with,commas',
        agent_id: 'agent-456',
        agent_workflow_id: null,
        status: 'COMPLETED',
        created_at: '2024-01-01T00:00:00Z',
        last_activity: '2024-01-01T01:00:00Z',
        duration_minutes: 60,
        message_count: 10,
        tool_uses: 5,
        total_tokens: 1000,
        errors: 0,
        error_rate: 0,
        tags: undefined,
      },
    ];

    const result = convertSessionsToCSV(sessions);
    expect(result).toContain('"session,with,commas"');
  });

  it('should escape values containing quotes', () => {
    const sessions: ExportedSession[] = [
      {
        id: 'session"with"quotes',
        agent_id: 'agent-456',
        agent_workflow_id: null,
        status: 'COMPLETED',
        created_at: '2024-01-01T00:00:00Z',
        last_activity: '2024-01-01T01:00:00Z',
        duration_minutes: 60,
        message_count: 10,
        tool_uses: 5,
        total_tokens: 1000,
        errors: 0,
        error_rate: 0,
        tags: undefined,
      },
    ];

    const result = convertSessionsToCSV(sessions);
    expect(result).toContain('"session""with""quotes"');
  });

  it('should handle tags object', () => {
    const sessions: ExportedSession[] = [
      {
        id: 'session-123',
        agent_id: 'agent-456',
        agent_workflow_id: 'workflow-789',
        status: 'COMPLETED',
        created_at: '2024-01-01T00:00:00Z',
        last_activity: '2024-01-01T01:00:00Z',
        duration_minutes: 60,
        message_count: 10,
        tool_uses: 5,
        total_tokens: 1000,
        errors: 0,
        error_rate: 0,
        tags: { env: 'prod', user: 'alice' },
      },
    ];

    const result = convertSessionsToCSV(sessions);
    // Tags should be JSON stringified and escaped since it contains quotes
    expect(result).toContain('"{""env"":""prod"",""user"":""alice""}"');
  });

  it('should handle null agent_workflow_id', () => {
    const sessions: ExportedSession[] = [
      {
        id: 'session-123',
        agent_id: 'agent-456',
        agent_workflow_id: null,
        status: 'ACTIVE',
        created_at: '2024-01-01T00:00:00Z',
        last_activity: '2024-01-01T00:30:00Z',
        duration_minutes: 30,
        message_count: 5,
        tool_uses: 2,
        total_tokens: 500,
        errors: 1,
        error_rate: 20,
        tags: undefined,
      },
    ];

    const result = convertSessionsToCSV(sessions);
    const lines = result.split('\n');
    // null should become empty string
    expect(lines[1]).toContain('agent-456,,ACTIVE');
  });
});
