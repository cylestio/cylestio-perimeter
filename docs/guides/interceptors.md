# Interceptors Guide

Interceptors (also called middleware) allow you to add custom logic to process requests and responses flowing through the gateway.

## Overview

Interceptors can:
- Log requests and responses
- Capture traces for debugging
- Modify headers
- Add authentication
- Rate limit requests
- Transform payloads
- And much more!

## Built-in Interceptors

### Printer Interceptor

Logs request/response information to the console.

```yaml
interceptors:
  - type: "printer"
    enabled: true
    config:
      log_requests: true      # Log incoming requests
      log_responses: true     # Log outgoing responses
      log_body: false        # Include body in logs
      max_body_length: 1000  # Truncate body if needed
```

Example output:
```
INFO: [PRINTER] Request: POST /v1/chat/completions
INFO: [PRINTER] Headers: {'content-type': 'application/json'}
INFO: [PRINTER] Response: 200 OK
```

### Trace Interceptor

Captures detailed request/response data to JSON files for analysis.

```yaml
interceptors:
  - type: "trace"
    enabled: true
    config:
      directory: "./traces"      # Where to save traces
      include_headers: true      # Capture headers
      include_body: true         # Capture body
      max_body_size: 1048576    # Max body size (1MB)
      file_prefix: "trace"      # File naming prefix
```

Trace files are saved as:
```
traces/
├── trace-2024-01-20T10-30-45-123Z.json
├── trace-2024-01-20T10-31-02-456Z.json
└── trace-2024-01-20T10-31-15-789Z.json
```

### Message Logger Interceptor

Logs message content from LLM conversations to JSONL files.

```yaml
interceptors:
  - type: "message_logger"
    enabled: true
    config:
      log_file: "message_logs/messages.jsonl"
      include_metadata: true
```

### Cylestio Trace Interceptor

Sends traces to Cylestio API for centralized monitoring.

```yaml
interceptors:
  - type: "cylestio_trace"
    enabled: true
    config:
      api_key: "${CYLESTIO_API_KEY}"
      api_url: "https://api.cylestio.com"
      project_id: "your-project-id"
```

## Using Multiple Interceptors

Interceptors are executed in the order they're defined:

```yaml
interceptors:
  # First: Log to console
  - type: "printer"
    enabled: true
  
  # Second: Save traces
  - type: "trace"
    enabled: true
    config:
      directory: "./traces"
  
  # Third: Send to Cylestio
  - type: "cylestio_trace"
    enabled: true
    config:
      api_key: "${CYLESTIO_API_KEY}"
```

## Configuring Interceptors

### Enable/Disable Interceptors

```yaml
interceptors:
  - type: "trace"
    enabled: true  # Set to false to disable
```

### Environment Variables

Use environment variables for sensitive config:

```yaml
interceptors:
  - type: "cylestio_trace"
    config:
      api_key: "${CYLESTIO_API_KEY}"
      api_url: "${CYLESTIO_URL:-https://api.cylestio.com}"
```

### Per-Environment Configuration

```yaml
# development.yaml
interceptors:
  - type: "printer"
    enabled: true
    config:
      log_body: true  # Verbose in dev

# production.yaml
interceptors:
  - type: "printer"
    enabled: true
    config:
      log_body: false  # Minimal in prod
  - type: "trace"
    enabled: true
```

## Interceptor Examples

### Debug Everything

```yaml
interceptors:
  - type: "printer"
    enabled: true
    config:
      log_requests: true
      log_responses: true
      log_body: true
      max_body_length: 10000
```

### Production Tracing

```yaml
interceptors:
  - type: "trace"
    enabled: true
    config:
      directory: "/var/log/cylestio/traces"
      include_headers: false  # Exclude sensitive headers
      include_body: true
      max_body_size: 5242880  # 5MB limit
```

### Minimal Logging

```yaml
interceptors:
  - type: "printer"
    enabled: true
    config:
      log_requests: true
      log_responses: false
      log_body: false
```

## Analyzing Traces

### View Trace Files

```bash
# List recent traces
ls -lt traces/ | head -10

# View a trace
cat traces/trace-2024-01-20T10-30-45-123Z.json | jq .

# Search traces
grep -r "gpt-4" traces/

# Count traces by status
jq -r '.response.status' traces/*.json | sort | uniq -c
```

### Trace File Format

```json
{
  "timestamp": "2024-01-20T10:30:45.123Z",
  "request": {
    "method": "POST",
    "path": "/v1/chat/completions",
    "headers": {
      "content-type": "application/json"
    },
    "body": {
      "model": "gpt-3.5-turbo",
      "messages": [...]
    }
  },
  "response": {
    "status": 200,
    "headers": {
      "content-type": "application/json"
    },
    "body": {
      "choices": [...]
    },
    "duration_ms": 1234
  },
  "session_id": "sess_abc123",
  "provider": "openai"
}
```

## Performance Considerations

### Trace Interceptor

- **Disk I/O**: Traces are written to disk, which can impact performance
- **File Size**: Large bodies can create big trace files
- **Directory Size**: Clean up old traces periodically

```bash
# Clean traces older than 7 days
find traces/ -name "*.json" -mtime +7 -delete
```

### Printer Interceptor

- **Console Output**: Excessive logging can slow down the gateway
- **Body Logging**: Avoid logging large bodies in production

### Best Practices

1. **Development**: Enable verbose logging
   ```yaml
   interceptors:
     - type: "printer"
       config:
         log_body: true
   ```

2. **Production**: Minimize logging, use traces
   ```yaml
   interceptors:
     - type: "trace"
       enabled: true
     - type: "printer"
       config:
         log_body: false
   ```

3. **Debugging**: Enable all interceptors temporarily
   ```yaml
   interceptors:
     - type: "printer"
       enabled: true
     - type: "trace"
       enabled: true
     - type: "message_logger"
       enabled: true
   ```

## Creating Custom Interceptors

See the [Development Guide](../development/contributing.md) for information on creating custom interceptors.

Basic structure:
```python
from src.proxy.interceptor_base import Interceptor

class CustomInterceptor(Interceptor):
    async def process_request(self, request):
        # Modify or log request
        return request
    
    async def process_response(self, response):
        # Modify or log response
        return response
```

## Troubleshooting

### Traces Not Being Created

```bash
# Check directory permissions
ls -la traces/

# Check configuration
python -m src.main --config config.yaml --validate-config

# Check logs for errors
tail -f logs/gateway.log | grep -i trace
```

### High Disk Usage

```bash
# Check trace directory size
du -sh traces/

# Find large traces
find traces/ -size +10M -ls

# Set up rotation
# Add to crontab:
0 2 * * * find /path/to/traces -name "*.json" -mtime +7 -delete
```

### Performance Impact

If interceptors are slowing down requests:

1. Disable body logging in production
2. Use async operations in custom interceptors
3. Consider sampling (only trace X% of requests)
4. Use background processing for heavy operations

## Next Steps

- Learn about [LLM Providers](providers.md)
- Explore [Session Tracking](session-tracking.md)
- Check [API Reference](../api/configuration.md#interceptors)