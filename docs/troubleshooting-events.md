### Troubleshooting: Missing OpenAI LLM content and tool events in event_logs

This guide explains why some OpenAI events in `event_logs/` may appear incomplete (e.g., missing LLM response content) and why tool result events might be missing, plus how to fix and validate.

---

## Symptoms

- Missing or empty `llm.response.content` in OpenAI events.
- Missing `tool.result` events in sessions that used tools.

## Root causes (code behavior)

✅ **LLM content capture: RESOLVED** - `OpenAIProvider.extract_response_events` now properly populates `llm.response.content` for both Chat Completions and Responses API formats. The `_extract_response_content` method has been enhanced to handle:
  - **Chat Completions**: Reads `choices[].message` (existing behavior)
  - **Responses API**: Reads `output[]` blocks with `type: "message"` and extracts text from `content[].text` where `type: "output_text"`
  
  Remaining possible causes for missing content:
  - Non-JSON responses (streaming or non-standard content type) skip JSON parsing in `LLMMiddleware`, producing no response events to record.

- Tool result events: Providers intentionally parse tool results only from the new segment of messages per request:
  - OpenAI (Chat Completions): looks for `role: "tool"` in the new `messages` slice only.
  - OpenAI (Responses API): looks for `input` blocks of `type: "function_call_output"` in the new `input` slice only.
  - If tool outputs were sent in a previous turn or not included in the current request body slice, the gateway won’t emit a new `tool.result` event.

Relevant code:

```291:560:src/providers/openai.py
def _extract_response_content(self, response_body: Optional[Dict[str, Any]]) -> Optional[List[Dict[str, Any]]]:
    choices = response_body.get("choices", [])
    ...
    if message:
        content.append(message)
```

```377:405:src/providers/openai.py
# Parse tool results using only the new segment per request
if is_responses_api:
    new_body_for_tools = {"input": new_messages}
else:
    new_body_for_tools = {"messages": new_messages}
tool_results = self.tool_parser.parse_tool_results(new_body_for_tools, self.name)
for tool_result in tool_results:
    ToolResultEvent.create(..., result=tool_result.get("result"), ...)
```

```49:97:src/proxy/tools/parser.py
# OpenAI tool results
# Chat Completions: role=="tool" messages
# Responses API: input[] with type=="function_call_output"
```

## Fixes

1) Ensure you run with a config that records events and prints responses

- Use `examples/configs/openai-with-event-recording.yaml` (includes `printer` and `event_recorder` interceptors):

```bash
python3 -m src.main run --config examples/configs/openai-with-event-recording.yaml
```

- Or keep `openai-basic.yaml` but confirm it includes the `event_recorder` block and points to `./event_logs`.

2) Capture LLM content for Responses API

✅ **COMPLETED**: `_extract_response_content` now handles both Chat Completions and Responses API formats:

- **Chat Completions**: Reads `choices[].message` (existing behavior)  
- **Responses API**: Extracts text from `output[]` blocks with `type=="message"` and processes `content[].text` where `type=="output_text"`

The implementation automatically detects the API format and extracts content appropriately. **Verification**: Both API types now populate `llm.response.content` in event logs.

3) Ensure tool result events are emitted for your turn

Tool result events are generated from only the new request segment. Verify your agent sends tool outputs in the same request turn being analyzed:

- Chat Completions: include `{"role":"tool", "content": ...}` in the current `messages` you submit.
- Responses API: send `input` items with `{"type":"function_call_output", "call_id": ..., "output": ...}` in the current request. The example agent `examples/agents/openai_session_with_response_id.py` does this in its follow-up request after a function call.

If you still need historical tool results to appear when they were sent in previous turns, you can change providers to scan the full conversation instead of only the new slice. Note: This will duplicate events across requests if not deduplicated.

Suggested change (optional, with caution): in `src/providers/openai.py` inside `extract_request_events`, set `new_body_for_tools` to the entire `body` rather than the sliced segment to capture past tool outputs. Prefer keeping the current behavior to avoid duplicates.

## How to validate

1) Run the gateway

```bash
export CYLESTIO_ACCESS_KEY=...  # required by cylestio_trace if enabled
python3 -m src.main run --config examples/configs/openai-with-event-recording.yaml
```

2) Run the OpenAI agent against the local proxy

```bash
export OPENAI_BASE_URL=http://0.0.0.0:3000
export OPENAI_API_KEY=sk-...  # any non-empty string for local proxy
python3 examples/agents/openai_session_with_response_id.py
```

3) Inspect event logs

- Check `event_logs/session_*.jsonl` for: 
  - `llm.call.finish` events with `attributes.llm.response.content` populated.
  - `tool.result` events with `attributes.tool.result` populated when your agent submitted tool outputs in the same turn.

4) Compare across sessions

- Run multiple times and diff the latest `session_*.jsonl` with others. Differences should reflect your prompts, function calls, and outputs. If some runs still lack content, confirm whether the request used Chat Completions vs Responses API and whether `_extract_response_content` was extended.

## Quick reference: Which fields get recorded

- LLM finish event: `llm.vendor`, `llm.model`, `llm.response.duration_ms`, token usage, and `llm.response.content` (if extracted by provider).
- Tool result event: `tool.name`, `tool.status`, `tool.execution_time_ms`, optional `tool.result`.

## Appendix: Implementation details

✅ **IMPLEMENTED**: The `OpenAIProvider._extract_response_content` method now handles both API formats:

- **Helper functions**: `_is_responses_api_request()` and `_is_responses_api_response()` detect API type
- **Content extraction**: Automatically extracts from `choices[].message` (Chat Completions) or `output[]` blocks (Responses API)
- **Unified format**: Both formats return content as `[{"role": "assistant", "content": "..."}]` for consistent event recording


