# Session Tracking Guide

Cylestio Gateway includes intelligent session detection that tracks conversations across multiple requests, enabling better analytics and user experience management.

## Overview

Session tracking automatically:
- Identifies unique conversations using message history hashing
- Groups related requests together
- Tracks conversation flow and context
- Enables per-session analytics and monitoring
- Handles conversation continuations and resets

## How It Works

### Hash-Based Tracking
```python
# Messages are hashed to create session identifiers
messages = [
  {"role": "user", "content": "Hello"},
  {"role": "assistant", "content": "Hi there!"}
]
# Creates session ID: sess_abc123
```

### LRU Cache
- Maintains up to 10,000 active sessions
- Automatically evicts oldest sessions when limit reached
- Configurable cache size and TTL

### Session TTL
- Sessions expire after 1 hour of inactivity by default
- Expired sessions are automatically cleaned up
- Configurable timeout values

## Configuration

### Basic Configuration
```yaml
session:
  enabled: true
  max_sessions: 10000
  session_ttl_seconds: 3600  # 1 hour
```

### Advanced Configuration
```yaml
session:
  enabled: true
  max_sessions: 50000
  session_ttl_seconds: 7200  # 2 hours
  fuzzy_matching: true
  reset_phrases: ["start over", "new conversation", "clear chat"]
  min_messages_for_new_session: 3
```

## Session Detection Heuristics

### New Session Detection
A new session is created when:
1. **First request** - No previous messages
2. **Reset phrases** - User says "start over", "new conversation"
3. **Message count reset** - Sudden drop in message history
4. **Context break** - Significant change in conversation topic

### Continued Session Detection
A session continues when:
1. **Hash match** - Exact message history match
2. **Fuzzy match** - Similar message history with minor variations
3. **Incremental** - New messages appended to existing conversation

### Examples

```json
// First request - creates new session
{
  "messages": [
    {"role": "user", "content": "Hello"}
  ]
}
// Session ID: sess_abc123

// Second request - continues session
{
  "messages": [
    {"role": "user", "content": "Hello"},
    {"role": "assistant", "content": "Hi there!"},
    {"role": "user", "content": "How are you?"}
  ]
}
// Session ID: sess_abc123 (same)

// Reset request - creates new session
{
  "messages": [
    {"role": "user", "content": "Start over. What's the weather?"}
  ]
}
// Session ID: sess_def456 (new)
```

## Session Metrics

### Metrics Endpoint
```bash
curl http://localhost:3000/metrics
```

### Sample Response
```json
{
  "sessions": {
    "active_count": 1247,
    "total_created": 5632,
    "cache_hit_rate": 0.847,
    "fuzzy_matches": 234,
    "average_session_length": 8.5,
    "longest_session": 45
  },
  "performance": {
    "session_lookup_ms": 1.2,
    "hash_computation_ms": 0.8
  }
}
```

### Metrics Explained
- **active_count** - Current sessions in cache
- **total_created** - Total sessions created since start
- **cache_hit_rate** - Percentage of requests matching existing sessions
- **fuzzy_matches** - Sessions matched using fuzzy logic
- **average_session_length** - Average messages per session
- **longest_session** - Most messages in a single session

## Using Session Data

### In Traces
Session IDs are included in all trace files:
```json
{
  "timestamp": "2024-01-20T10:30:45.123Z",
  "session_id": "sess_abc123",
  "request": {...},
  "response": {...}
}
```

### Filtering by Session
```bash
# Find all traces for a session
grep "sess_abc123" traces/*.json

# Count requests per session
jq -r '.session_id' traces/*.json | sort | uniq -c

# Average response time per session
jq -r '[.session_id, .response.duration_ms] | @tsv' traces/*.json | \
  awk '{sum[$1]+=$2; count[$1]++} END {for (s in sum) print s, sum[s]/count[s]}'
```

### Session Analytics
```bash
# Most active sessions
jq -r '.session_id' traces/*.json | sort | uniq -c | sort -nr | head -10

# Session duration analysis
jq -r '[.session_id, .timestamp] | @tsv' traces/*.json | \
  sort -k1,1 -k2,2 | awk '
    {
      if ($1 != prev_session) {
        if (prev_session) print prev_session, last_time - first_time
        prev_session = $1
        first_time = $2
      }
      last_time = $2
    }
    END { if (prev_session) print prev_session, last_time - first_time }
  '
```

## Performance Impact

### Memory Usage
- Each session uses ~1KB of memory
- 10,000 sessions ≈ 10MB RAM
- LRU eviction prevents unbounded growth

### Computation Overhead
- Hash computation: ~1ms per request
- Session lookup: ~0.1ms per request
- Minimal impact on request latency

### Optimization Tips
1. **Reduce session count** for memory-constrained environments
2. **Shorter TTL** for high-traffic scenarios
3. **Disable fuzzy matching** for better performance
4. **Monitor cache hit rates** to tune parameters

## Troubleshooting

### Sessions Not Being Tracked

```bash
# Check if session tracking is enabled
curl http://localhost:3000/config | jq '.session.enabled'

# View current session count
curl http://localhost:3000/metrics | jq '.sessions.active_count'

# Check logs for session debug info
tail -f logs/gateway.log | grep -i session
```

### High Memory Usage

```bash
# Check session count
curl http://localhost:3000/metrics | jq '.sessions.active_count'

# Reduce max sessions
# In config.yaml:
session:
  max_sessions: 5000  # Reduce from 10000
```

### Poor Cache Hit Rate

```bash
# Check hit rate
curl http://localhost:3000/metrics | jq '.sessions.cache_hit_rate'

# If < 0.5, consider:
# 1. Longer TTL
# 2. Enable fuzzy matching
# 3. Check for session reset patterns
```

### Sessions Expiring Too Quickly

```yaml
# Increase TTL
session:
  session_ttl_seconds: 7200  # 2 hours instead of 1
```

## Advanced Features

### Custom Reset Phrases
```yaml
session:
  reset_phrases: [
    "start over",
    "new conversation", 
    "clear chat",
    "reset",
    "begin again"
  ]
```

### Fuzzy Matching Tuning
```yaml
session:
  fuzzy_matching: true
  fuzzy_threshold: 0.8  # Similarity threshold (0.0-1.0)
  fuzzy_max_diff: 2     # Max message count difference
```

### Session Persistence
```yaml
# Future feature
session:
  persistence:
    enabled: true
    backend: "redis"  # or "file", "postgres"
    connection: "redis://localhost:6379"
```

## Best Practices

1. **Monitor metrics regularly** to understand session patterns
2. **Tune cache size** based on your traffic patterns
3. **Use session data** for analytics and debugging
4. **Set appropriate TTL** for your use case
5. **Enable fuzzy matching** for better user experience

## Integration Examples

### Custom Analytics
```python
import requests
import json

# Get session metrics
response = requests.get('http://localhost:3000/metrics')
metrics = response.json()

print(f"Active sessions: {metrics['sessions']['active_count']}")
print(f"Cache hit rate: {metrics['sessions']['cache_hit_rate']:.2%}")
```

### Session-based Rate Limiting
```yaml
# Future feature
rate_limiting:
  per_session:
    requests_per_minute: 60
    tokens_per_hour: 100000
```

## Next Steps

- Learn about [Interceptors](interceptors.md) to capture session data
- Check [API Reference](../api/endpoints.md) for metrics endpoint details
- Explore [Configuration Reference](../api/configuration.md) for all session options