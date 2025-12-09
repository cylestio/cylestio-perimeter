# External Agent ID Support

## Overview

The Cylestio Gateway supports custom agent identification through the `x-cylestio-agent-id` header. This allows clients to override the auto-generated agent ID (currently `prompt-<hash>`) with a custom identifier of their choice.

## Header Details

### Header Name
```
x-cylestio-agent-id
```

### Format
- **Type**: String
- **Length**: No specific limit (reasonable length recommended)
- **Case**: Case-sensitive
- **Characters**: Any valid HTTP header characters

### Example
```http
x-cylestio-agent-id: my-custom-assistant-v1
```

## Usage

### Basic Usage
```bash
curl -X POST "http://localhost:4000/v1/chat/completions" \
  -H "Content-Type: application/json" \
  -H "x-cylestio-agent-id: math-tutor-v2" \
  -d '{
    "model": "gpt-4o-mini",
    "messages": [
      {"role": "system", "content": "You are a math tutor."},
      {"role": "user", "content": "What is 2+2?"}
    ]
  }'
```

### Python Example
```python
import httpx

async def chat_with_custom_agent():
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "http://localhost:4000/v1/chat/completions",
            headers={
                "Content-Type": "application/json",
                "x-cylestio-agent-id": "coding-assistant-v1"
            },
            json={
                "model": "gpt-4o-mini",
                "messages": [
                    {"role": "system", "content": "You are a coding assistant."},
                    {"role": "user", "content": "Write a Python function to calculate factorial."}
                ]
            }
        )
        return response.json()
```

### JavaScript Example
```javascript
const response = await fetch('http://localhost:4000/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-cylestio-agent-id': 'customer-support-bot'
  },
  body: JSON.stringify({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: 'You are a customer support representative.' },
      { role: 'user', content: 'How can I reset my password?' }
    ]
  })
});
```

## Behavior

### Agent ID Precedence
1. **External Agent ID**: If `x-cylestio-agent-id` header is provided, it takes precedence
2. **Computed Agent ID**: If no external agent ID is provided, the system falls back to the computed agent ID (`prompt-<hash>`)

### Fallback Logic
```python
# Simplified logic from the implementation
agent_id = external_agent_id if external_agent_id else self._get_agent_id(body)
```

### Event Consistency
- All events for a single request/response use the same agent ID
- The agent ID is consistent between:
  - Session start events
  - LLM call start events
  - Tool result events
  - LLM call finish events
  - Tool execution events

## Integration with Cylestio

### Event Flow
```
Request Header → Middleware → Provider → Events → Cylestio API
     ↓
x-cylestio-agent-id → external_agent_id → agent_id in events → trace data
```

### Cylestio Events
The custom agent ID is embedded in all events sent to the Cylestio API:
- **SessionStartEvent**: Contains the custom agent ID
- **LLMCallStartEvent**: Contains the custom agent ID
- **LLMCallFinishEvent**: Contains the custom agent ID
- **ToolResultEvent**: Contains the custom agent ID
- **ToolExecutionEvent**: Contains the custom agent ID

## Header Filtering

### Security
The `x-cylestio-agent-id` header is automatically filtered out before forwarding requests to LLM APIs. This ensures:
- No sensitive information is leaked to external services
- Clean request forwarding without internal headers
- Consistent behavior across all providers

### Filtering Logic
```python
# Headers are filtered in the proxy handler
headers = {
    k: v for k, v in request_headers.items() 
    if k.lower() not in excluded_headers and not k.lower().startswith("x-cylestio-")
}
```

## Testing

### Manual Testing
Use the provided test script to validate functionality:
```bash
./scripts/test-external-agent-id.py
```

### Test Scenarios
1. **Custom Agent ID**: Verify that custom agent ID is used in events
2. **Fallback Behavior**: Verify that computed agent ID is used when header is missing
3. **Combined Headers**: Test with both `x-cylestio-session-id` and `x-cylestio-agent-id`
4. **Header Filtering**: Verify that headers are not forwarded to LLM APIs

### Automated Tests
The functionality is covered by comprehensive tests in `tests/providers/test_external_ids.py`:
- External agent ID override
- Fallback behavior
- Header filtering
- Event generation
- Session management

## Configuration

### No Additional Configuration Required
The `x-cylestio-agent-id` header support is built into the core gateway and requires no additional configuration. It works with:
- All supported LLM providers (OpenAI, Anthropic)
- All interceptor types
- All session management modes

### Environment Variables
No specific environment variables are required for this feature.

## Best Practices

### Agent ID Naming
- Use descriptive, meaningful names
- Include version information when appropriate
- Use consistent naming conventions across your application
- Avoid sensitive information in agent IDs

### Examples of Good Agent IDs
```
math-tutor-v2
customer-support-bot
code-reviewer-v1
data-analyst-assistant
```

### Examples of Poor Agent IDs
```
test
user123
temp
debug
```

## Troubleshooting

### Common Issues

#### Header Not Recognized
- Ensure the header name is exactly `x-cylestio-agent-id` (case-sensitive)
- Check that the header is not being stripped by intermediate proxies
- Verify the gateway is running the latest version

#### Agent ID Not Overriding
- Check that the header value is not empty
- Ensure the request is reaching the gateway
- Verify that events are being generated correctly

#### Events Missing Agent ID
- Check the gateway logs for errors
- Verify that the Cylestio interceptor is enabled
- Ensure the provider is correctly processing the external agent ID

### Debug Information
Enable debug logging to see detailed information about agent ID processing:
```yaml
logging:
  level: "DEBUG"
  format: "text"
```

## Related Features

### External Session ID
The `x-cylestio-session-id` header works in conjunction with the agent ID header to provide complete control over session and agent identification.

### Session Management
Custom agent IDs integrate seamlessly with the gateway's session management system, maintaining consistency across conversation turns.

### Event Recording
All events are recorded with the custom agent ID, providing comprehensive tracing and analytics capabilities.

## Migration

### From Computed Agent IDs
If you're currently using computed agent IDs and want to migrate to custom agent IDs:

1. **Identify Current Usage**: Review your application to see where agent IDs are used
2. **Plan Naming Convention**: Design a consistent naming scheme for your agents
3. **Update Client Code**: Add the `x-cylestio-agent-id` header to your requests
4. **Test Thoroughly**: Verify that the new agent IDs appear correctly in Cylestio
5. **Monitor**: Watch for any issues in event generation or tracing

### Backward Compatibility
- The feature is fully backward compatible
- Existing code without the header continues to work unchanged
- Computed agent IDs are still generated when no external agent ID is provided

## Future Enhancements

### Planned Features
- Agent ID validation and sanitization
- Agent ID templates and patterns
- Agent ID metadata and descriptions
- Agent ID analytics and reporting

### Feedback and Requests
For feature requests or feedback related to external agent ID support, please contact the development team or submit an issue through the project's issue tracker.
