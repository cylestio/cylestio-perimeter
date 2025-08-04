# Cylestio Events API Documentation

This document describes the event structure and API endpoint for sending telemetry events to the Cylestio platform.

## API Specification

### Endpoint

**URL**: `POST {api_url}/v1/telemetry`  
**Default API URL**: `https://api.cylestio.com`  
**Content-Type**: `application/json`  
**Authentication**: Bearer token (JWT)

### Authentication
The API uses JWT bearer token authentication. The access key is exchanged for a JWT token which is then included in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

**Note**: The access key can be obtained from the Cylestio management UI.

### Response Codes

- **200/201**: Event successfully received
- **400**: Bad request (invalid event format)
- **401**: Authentication failed (invalid/expired JWT token)
- **403**: Forbidden (insufficient permissions)
- **500**: Internal server error

## Event Structure

All events follow a common base structure with event-specific attributes:

### Base Event Schema

```json
{
  "schema_version": "1.0",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "trace_id": "32-character-hex-string",
  "span_id": "16-character-hex-string", 
  "name": "event.name",
  "level": "INFO|DEBUG|WARNING|ERROR",
  "agent_id": "agent-id",
  "session_id": "session-id",
  "attributes": {
    // Event-specific attributes
    // System information automatically added
  }
}
```

#### System Information Attributes
The following system information is automatically added to all events:
- `host.name`: Hostname
- `host.arch`: System architecture
- `host.cpu_count`: Number of CPUs
- `os.name`: Operating system name
- `os.version`: OS version
- `process.runtime.name`: Runtime name (e.g., "python")
- `process.runtime.version`: Runtime version

## Event Types Overview

The following event types are supported:

1. **Session Events**
   - `session.start` - Marks the beginning of a new session
   - `session.end` - Marks the end of a session with summary metrics

2. **LLM Events**
   - `llm.call.start` - Sent when an LLM API call begins
   - `llm.call.finish` - Sent when an LLM API call completes successfully
   - `llm.call.error` - Sent when an LLM API call fails

3. **Tool Events**
   - `tool.execution` - Sent when a tool/function is invoked
   - `tool.result` - Sent when a tool execution completes

## Event Types Details

### 1. Session Start (`session.start`)

Sent when a new session begins.

```json
{
  "schema_version": "1.0",
  "timestamp": "2024-01-15T10:25:00.000Z",
  "trace_id": "session1234567890123456789012345678901234",
  "span_id": "sess1234567890ab",
  "name": "session.start",
  "level": "INFO",
  "agent_id": "my-agent",
  "session_id": "session-xyz789",
  "attributes": {
    "session.id": "session-xyz789",
    "user.id": "user-456",
    "client.type": "gateway"
  }
}
```

**Required Attributes:**
- `session.id`: Session identifier

**Optional Attributes:**
- `user.id`: User identifier
- `client.type`: Client type (e.g., "web", "mobile", "gateway")

### 2. Session End (`session.end`)

Sent when a session ends.

```json
{
  "schema_version": "1.0",
  "timestamp": "2024-01-15T10:45:00.000Z",
  "trace_id": "session1234567890123456789012345678901234",
  "span_id": "sess1234567890ab",
  "name": "session.end",
  "level": "INFO",
  "agent_id": "my-agent",
  "session_id": "session-xyz789",
  "attributes": {
    "session.id": "session-xyz789",
    "session.duration_ms": 1200000,
    "session.events_count": 25
  }
}
```

**Required Attributes:**
- `session.id`: Session identifier
- `session.duration_ms`: Session duration in milliseconds
- `session.events_count`: Number of events in the session

### 3. LLM Call Start (`llm.call.start`)

Sent when an LLM API call begins.

```json
{
  "schema_version": "1.0",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "trace_id": "abc123def456789012345678901234567890abcd",
  "span_id": "1234567890abcdef",
  "name": "llm.call.start",
  "level": "INFO",
  "agent_id": "my-agent",
  "session_id": "session-xyz789",
  "attributes": {
    "llm.vendor": "openai",
    "llm.model": "gpt-4",
    "llm.request.data": {
      "messages": [
        {"role": "user", "content": "Hello"}
      ],
      "temperature": 0.7,
      "max_tokens": 150
    },
    "session.id": "session-xyz789"
  }
}
```

**Required Attributes:**
- `llm.vendor`: LLM provider (e.g., "openai", "anthropic")
- `llm.model`: Model identifier
- `llm.request.data`: Complete request payload (PII data can be omitted)

### 4. LLM Call Finish (`llm.call.finish`)

Sent when an LLM API call completes successfully.

```json
{
  "schema_version": "1.0",
  "timestamp": "2024-01-15T10:30:02.500Z",
  "trace_id": "abc123def456789012345678901234567890abcd",
  "span_id": "1234567890abcdef",
  "name": "llm.call.finish",
  "level": "INFO",
  "agent_id": "my-agent",
  "session_id": "session-xyz789",
  "attributes": {
    "llm.vendor": "openai",
    "llm.model": "gpt-4",
    "llm.response.duration_ms": 2500,
    "llm.usage.input_tokens": 25,
    "llm.usage.output_tokens": 8,
    "llm.usage.total_tokens": 33,
    "llm.response.content": [
      {"text": "Hello! How can I help you?"}
    ],
    "session.id": "session-xyz789"
  }
}
```

**Required Attributes:**
- `llm.vendor`: LLM provider
- `llm.model`: Model identifier
- `llm.response.duration_ms`: Response time in milliseconds

**Optional Attributes:**
- `llm.usage.input_tokens`: Input token count
- `llm.usage.output_tokens`: Output token count
- `llm.usage.total_tokens`: Total token count
- `llm.response.content`: Response content array

### 5. LLM Call Error (`llm.call.error`)

Sent when an LLM API call fails.

```json
{
  "schema_version": "1.0",
  "timestamp": "2024-01-15T10:30:01.000Z",
  "trace_id": "abc123def456789012345678901234567890abcd",
  "span_id": "1234567890abcdef",
  "name": "llm.call.error",
  "level": "ERROR",
  "agent_id": "my-agent",
  "session_id": "session-xyz789",
  "attributes": {
    "llm.vendor": "openai",
    "llm.model": "gpt-4",
    "error.message": "Rate limit exceeded",
    "error.type": "RateLimitError",
    "session.id": "session-xyz789"
  }
}
```

**Required Attributes:**
- `llm.vendor`: LLM provider
- `llm.model`: Model identifier
- `error.message`: Error description

**Optional Attributes:**
- `error.type`: Error type/class name

### 6. Tool Execution (`tool.execution`)

Sent when a tool/function is invoked.

```json
{
  "schema_version": "1.0",
  "timestamp": "2024-01-15T10:31:00.000Z",
  "trace_id": "abc123def456789012345678901234567890abcd",
  "span_id": "tool1234567890ab",
  "name": "tool.execution",
  "level": "INFO",
  "agent_id": "my-agent",
  "session_id": "session-xyz789",
  "attributes": {
    "tool.name": "web_search",
    "tool.params": {
      "query": "AI developments 2024",
      "max_results": 5
    },
    "framework.name": "langchain",
    "session.id": "session-xyz789"
  }
}
```

**Required Attributes:**
- `tool.name`: Tool/function name
- `tool.params`: Tool parameters

**Optional Attributes:**
- `framework.name`: Framework name (e.g., "langchain", "llamaindex")

### 7. Tool Result (`tool.result`)

Sent when a tool execution completes.

```json
{
  "schema_version": "1.0",
  "timestamp": "2024-01-15T10:31:03.200Z",
  "trace_id": "abc123def456789012345678901234567890abcd",
  "span_id": "tool1234567890ab",
  "name": "tool.result",
  "level": "INFO",
  "agent_id": "my-agent",
  "session_id": "session-xyz789",
  "attributes": {
    "tool.name": "web_search",
    "tool.status": "success",
    "tool.execution_time_ms": 3200,
    "tool.result": {
      "results": [
        {"title": "AI News", "url": "https://example.com"}
      ]
    },
    "session.id": "session-xyz789"
  }
}
```

**Required Attributes:**
- `tool.name`: Tool/function name
- `tool.status`: Execution status ("success" or "error")
- `tool.execution_time_ms`: Execution time in milliseconds

**Optional Attributes:**
- `tool.result`: Tool execution result
- `error.message`: Error message (if status is "error")

## Notes

1. **Trace and Span IDs**: Must be OpenTelemetry-compatible (32 and 16 character hex strings respectively)
2. **Timestamps**: ISO 8601 format with timezone (typically UTC with 'Z' suffix)
3. **Session Management**: Sessions are automatically tracked when the same session_id is provided
4. **Error Handling**: The gateway continues operation even if event sending fails
5. **Async Processing**: Events are sent asynchronously to avoid impacting proxy performance