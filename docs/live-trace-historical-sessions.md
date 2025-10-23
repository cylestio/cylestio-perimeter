# Live Trace: Historical Sessions

## Overview

When file persistence is enabled, the live_trace interceptor preserves session and agent metrics between gateway restarts. However, individual event details are only kept in memory for active sessions. This document explains how historical sessions are displayed in the dashboard.

## Session Types

### Active Session
Sessions with in-memory event data show full timeline details:

```
┌─────────────────────────────────────────────┐
│ Event Timeline (29 events)                  │
├─────────────────────────────────────────────┤
│                                             │
│  🟢 llm.call.start                          │
│     12:34:56 PM                             │
│                                             │
│  🔵 tool.execution                          │
│     12:35:02 PM                             │
│     Tool: lookup_customer                   │
│                                             │
│  🟢 llm.call.finish                         │
│     12:35:08 PM                             │
│     Tokens: 1,234                           │
│                                             │
└─────────────────────────────────────────────┘
```

### Historical Session (Restored from Persistence)
Sessions loaded from persistence file show informative message:

```
┌─────────────────────────────────────────────┐
│ Event Timeline (0 events)                   │
├─────────────────────────────────────────────┤
│                                             │
│  📦 Historical Session                      │
│                                             │
│  This session was restored from persistent  │
│  storage. Summary metrics are available,    │
│  but individual event details are only kept │
│  in memory for active sessions.             │
│                                             │
│  💡 Tip: For complete event details, check  │
│  the event_logs directory or view active    │
│  sessions in real-time.                     │
│                                             │
└─────────────────────────────────────────────┘
```

## Available Data

### Historical Sessions Include:
✅ Session metadata (ID, agent, timestamps)  
✅ Total event count  
✅ Message count  
✅ Token usage  
✅ Tool usage statistics  
✅ Response time metrics  
✅ Error rates  
✅ Duration  

### Historical Sessions Do NOT Include:
❌ Individual event payloads  
❌ Request/response content  
❌ Event timeline visualization  
❌ Detailed event attributes  

## Why This Design?

### File Size Management
- **With events**: 300 events × 10 KB = ~3 MB per session
- **Without events**: Summary only = ~2-5 KB per session
- **Result**: 600x smaller file size!

### Data Availability
Full event details are still available:
1. **Active sessions**: Full timeline in dashboard
2. **Historical sessions**: Check `event_logs/session_*.jsonl`

### Performance
- Fast startup (loads KB not MB)
- Efficient storage
- Long-term retention possible

## Configuration

Enable persistence in your config:

```yaml
interceptors:
  - type: live_trace
    enabled: true
    config:
      persist_to_file: true
      persistence_dir: "./live_trace_data"
      save_interval_events: 100
```

Also enable event_recorder for complete history:

```yaml
  - type: event_recorder
    enabled: true
    config:
      output_dir: "./event_logs"
      file_format: "jsonl"
```

## API Response

The session API includes these fields to help frontends display appropriate messages:

```json
{
  "session": {
    "id": "billing_11_1761143743",
    "agent_id": "next-rooms-concierge-agent",
    "total_events": 29,
    "message_count": 9,
    "total_tokens": 20072,
    "has_event_history": false,
    "history_message": "This session was restored from persistent storage..."
  },
  "events": [],
  "timeline": []
}
```

### Fields:
- `has_event_history`: `true` if events available, `false` if historical
- `history_message`: `null` if active, explanatory text if historical
- `events`: Array of event objects (empty for historical)
- `timeline`: Processed timeline (empty for historical)

## Best Practices

1. **Monitor active sessions** for real-time debugging with full event details
2. **Review historical sessions** for long-term metrics and trends
3. **Use event_logs** when you need complete event data for historical sessions
4. **Set appropriate retention** to balance memory usage vs. history depth

## Example Workflow

### Real-Time Debugging
1. Open dashboard while agent is running
2. View session with full event timeline
3. Inspect individual events and attributes

### Historical Analysis
1. Restart gateway (data loads from persistence)
2. View session metrics (tokens, tools, response times)
3. For event details, check `event_logs/session_*.jsonl`

## Related Documentation

- [Live Trace README](../src/interceptors/live_trace/README.md)
- [Persistence Summary](../LIVE_TRACE_PERSISTENCE_SUMMARY.md)
- [Event Recorder](../src/interceptors/event_recorder.py)

