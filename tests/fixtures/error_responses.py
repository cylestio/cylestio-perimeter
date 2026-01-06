"""Error response fixtures for testing error detection."""

# =============================================================================
# OpenAI Error Responses
# =============================================================================

OPENAI_QUOTA_ERROR = {
    "status_code": 429,
    "body": {
        "error": {
            "message": "You exceeded your current quota, please check your plan and billing details.",
            "type": "insufficient_quota",
            "code": "insufficient_quota"
        }
    }
}

OPENAI_RATE_LIMIT_ERROR = {
    "status_code": 429,
    "body": {
        "error": {
            "message": "Rate limit reached for requests",
            "type": "rate_limit_exceeded",
            "code": "rate_limit_exceeded"
        }
    }
}

OPENAI_INVALID_KEY_ERROR = {
    "status_code": 401,
    "body": {
        "error": {
            "message": "Incorrect API key provided",
            "type": "invalid_api_key",
            "code": "invalid_api_key"
        }
    }
}

OPENAI_SERVER_ERROR = {
    "status_code": 500,
    "body": {
        "error": {
            "message": "The server had an error while processing your request.",
            "type": "server_error",
            "code": None
        }
    }
}

OPENAI_BAD_REQUEST_ERROR = {
    "status_code": 400,
    "body": {
        "error": {
            "message": "Invalid request: messages is required",
            "type": "invalid_request_error",
            "code": "invalid_request_error"
        }
    }
}

# Unexpected formats - test fallback handling
OPENAI_UNEXPECTED_STRING_ERROR = {
    "status_code": 500,
    "body": {
        "error": "Something went wrong"  # String instead of dict
    }
}

OPENAI_UNEXPECTED_EMPTY_ERROR = {
    "status_code": 502,
    "body": {
        "error": {}  # Empty dict
    }
}

OPENAI_NO_BODY_ERROR = {
    "status_code": 503,
    "body": None
}

# Success response for comparison
OPENAI_SUCCESS_RESPONSE = {
    "status_code": 200,
    "body": {
        "id": "chatcmpl-123",
        "object": "chat.completion",
        "created": 1677652288,
        "model": "gpt-4",
        "choices": [
            {
                "index": 0,
                "message": {
                    "role": "assistant",
                    "content": "Hello! How can I help you today?"
                },
                "finish_reason": "stop"
            }
        ],
        "usage": {
            "prompt_tokens": 10,
            "completion_tokens": 12,
            "total_tokens": 22
        }
    }
}

# =============================================================================
# Anthropic Error Responses
# =============================================================================

ANTHROPIC_OVERLOADED_ERROR = {
    "status_code": 529,
    "body": {
        "type": "error",
        "error": {
            "type": "overloaded_error",
            "message": "Overloaded"
        }
    }
}

ANTHROPIC_RATE_LIMIT_ERROR = {
    "status_code": 429,
    "body": {
        "type": "error",
        "error": {
            "type": "rate_limit_error",
            "message": "Rate limit exceeded"
        }
    }
}

ANTHROPIC_INVALID_REQUEST_ERROR = {
    "status_code": 400,
    "body": {
        "type": "error",
        "error": {
            "type": "invalid_request_error",
            "message": "messages: text content blocks must be non-empty"
        }
    }
}

ANTHROPIC_AUTH_ERROR = {
    "status_code": 401,
    "body": {
        "type": "error",
        "error": {
            "type": "authentication_error",
            "message": "Invalid API key"
        }
    }
}

ANTHROPIC_PERMISSION_ERROR = {
    "status_code": 403,
    "body": {
        "type": "error",
        "error": {
            "type": "permission_error",
            "message": "Your API key does not have permission to use the specified model"
        }
    }
}

ANTHROPIC_API_ERROR = {
    "status_code": 500,
    "body": {
        "type": "error",
        "error": {
            "type": "api_error",
            "message": "An unexpected error occurred"
        }
    }
}

# Special case: streaming 200 OK with error in body
ANTHROPIC_STREAMING_ERROR = {
    "status_code": 200,
    "body": {
        "type": "error",
        "error": {
            "type": "overloaded_error",
            "message": "Overloaded"
        }
    }
}

# Unexpected formats - test fallback handling
ANTHROPIC_UNEXPECTED_FORMAT_ERROR = {
    "status_code": 500,
    "body": {
        "error": {"detail": "Internal error"}  # Missing 'type' field at root
    }
}

ANTHROPIC_UNEXPECTED_STRING_ERROR = {
    "status_code": 500,
    "body": {
        "type": "error",
        "error": "Something went wrong"  # String instead of dict
    }
}

ANTHROPIC_NO_BODY_ERROR = {
    "status_code": 500,
    "body": None
}

# Success response for comparison
ANTHROPIC_SUCCESS_RESPONSE = {
    "status_code": 200,
    "body": {
        "id": "msg_123",
        "type": "message",
        "role": "assistant",
        "content": [
            {
                "type": "text",
                "text": "Hello! How can I help you today?"
            }
        ],
        "model": "claude-3-opus-20240229",
        "stop_reason": "end_turn",
        "stop_sequence": None,
        "usage": {
            "input_tokens": 10,
            "output_tokens": 12
        }
    }
}

# =============================================================================
# Streaming SSE Data
# =============================================================================

ANTHROPIC_STREAMING_ERROR_SSE = b'data: {"type":"error","error":{"type":"overloaded_error","message":"Overloaded"}}\n\n'

ANTHROPIC_STREAMING_SUCCESS_SSE = b'''event: message_start
data: {"type":"message_start","message":{"id":"msg_123","type":"message","role":"assistant","content":[],"model":"claude-3-opus-20240229","stop_reason":null,"stop_sequence":null,"usage":{"input_tokens":10,"output_tokens":1}}}

event: content_block_start
data: {"type":"content_block_start","index":0,"content_block":{"type":"text","text":""}}

event: content_block_delta
data: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":"Hello!"}}

event: content_block_stop
data: {"type":"content_block_stop","index":0}

event: message_delta
data: {"type":"message_delta","delta":{"stop_reason":"end_turn","stop_sequence":null},"usage":{"output_tokens":12}}

event: message_stop
data: {"type":"message_stop"}

'''

# =============================================================================
# Request Metadata Fixture
# =============================================================================

def create_request_metadata(
    trace_id: str = "trace-123",
    agent_id: str = "agent-456",
    model: str = "gpt-4",
    agent_workflow_id: str = None
) -> dict:
    """Create request metadata dict for testing."""
    metadata = {
        "cylestio_trace_id": trace_id,
        "agent_id": agent_id,
        "model": model,
    }
    if agent_workflow_id:
        metadata["agent_workflow_id"] = agent_workflow_id
    return metadata
