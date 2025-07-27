# TODOs for Cylestio Gateway

## Async Optimization for Cylestio Trace Interceptor

### Background
The current Cylestio trace interceptor implementation sends HTTP requests directly to the Cylestio API during request processing. This can potentially impact gateway performance if the Cylestio API is slow or unreachable.

### Optimization Tasks

#### 1. Background Task Queue Implementation
- [ ] Implement async task queue using `asyncio.create_task()`
- [ ] Replace direct API calls with fire-and-forget background tasks
- [ ] Ensure main request flow never waits for Cylestio API responses

**Implementation Pattern:**
```python
# Instead of: await client.send_event(event)
# Use: asyncio.create_task(self._send_event_background(event))
```

#### 2. Event Batching System
- [ ] Implement local event buffer/queue
- [ ] Batch multiple events before sending to API
- [ ] Configurable batch size and flush intervals
- [ ] Handle buffer overflow scenarios

#### 3. Circuit Breaker Pattern
- [ ] Implement circuit breaker for Cylestio API failures
- [ ] Auto-disable tracing when API is consistently failing
- [ ] Auto-recovery mechanism when API becomes healthy
- [ ] Configurable failure thresholds and recovery timeouts

#### 4. Retry Logic and Error Handling
- [ ] Exponential backoff for failed API calls
- [ ] Dead letter queue for permanently failed events
- [ ] Configurable retry attempts and timeouts
- [ ] Graceful degradation when API is unreachable

#### 5. Performance Monitoring
- [ ] Add metrics for event queue size
- [ ] Monitor API response times and success rates
- [ ] Add health check endpoint for Cylestio integration
- [ ] Log performance impact metrics

#### 6. Memory Management
- [ ] Implement bounded queues to prevent memory leaks
- [ ] Event TTL (time-to-live) to drop old events
- [ ] Periodic cleanup of failed events
- [ ] Memory usage monitoring and alerts

#### 7. Configuration Enhancements
- [ ] Add configuration options for:
  - Queue size limits
  - Batch sizes and intervals  
  - Circuit breaker thresholds
  - Retry policies
  - Enable/disable background processing

### Priority
- **High**: Background task queue (#1) - Critical for production performance
- **Medium**: Circuit breaker (#3) and retry logic (#4)
- **Low**: Batching (#2), monitoring (#5), and memory management (#6)

### Implementation Notes
- Use `asyncio.Queue` for thread-safe event queuing
- Consider using `aiofiles` for persistent queue storage if needed
- Maintain backward compatibility with current API
- Add comprehensive testing for async behavior
- Document performance characteristics and configuration options

### Performance Goals
- Zero impact on main request latency
- Handle API outages gracefully without affecting gateway functionality
- Process events with minimal memory footprint
- Recover automatically from transient failures