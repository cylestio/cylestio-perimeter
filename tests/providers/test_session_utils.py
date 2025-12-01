"""Simple test for session detection utility."""
from src.providers.session_utils import SessionDetectionUtility


def broadcast_conversation(detector, conversation):
    """
    Broadcast a conversation step by step, yielding after each message.
    
    Args:
        detector: SessionDetectionUtility instance
        conversation: List of message dicts
        
    Yields:
        session_id after each message
        
    Returns:
        Final session_id
    """
    messages = []
    session_id = None
    
    for message in conversation:
        messages.append(message)
        session_id, is_new, is_fragmented, processed_tool_ids = detector.detect_session(messages)
        yield session_id
    
    return session_id


def run_full_conversation(detector, conversation):
    """
    Run a full conversation and return final session ID.
    
    Args:
        detector: SessionDetectionUtility instance
        conversation: List of message dicts
        
    Returns:
        Final session_id
    """
    session_ids = list(broadcast_conversation(detector, conversation))
    return session_ids[-1]


def assert_all_same_session(session_ids):
    """Assert all session IDs in list are identical."""
    if not session_ids:
        return
    first_session = session_ids[0]
    for i, session_id in enumerate(session_ids):
        assert session_id == first_session, f"Session ID at index {i} differs: {session_id} != {first_session}"


def test_single_conversation_session_consistency():
    """Test that a conversation maintains session consistency as requests are sent."""
    detector = SessionDetectionUtility()
    
    # Simulate real LLM requests as they would arrive
    # Request 1: User starts conversation
    request1 = [{"role": "user", "content": "Hello"}]
    session_id1, is_new1, is_fragmented1, _ = detector.detect_session(request1)
    assert is_new1 is True
    assert is_fragmented1 is False
    
    # Request 2: User continues after getting assistant response
    request2 = [
        {"role": "user", "content": "Hello"},
        {"role": "assistant", "content": "Hi there!"},
        {"role": "user", "content": "How are you?"}
    ]
    session_id2, is_new2, is_fragmented2, _ = detector.detect_session(request2)
    assert is_new2 is False  # Should continue existing session
    assert is_fragmented2 is False
    assert session_id2 == session_id1
    
    # Request 3: User continues conversation further
    request3 = [
        {"role": "user", "content": "Hello"},
        {"role": "assistant", "content": "Hi there!"},
        {"role": "user", "content": "How are you?"},
        {"role": "assistant", "content": "I'm good!"},
        {"role": "user", "content": "Great!"}
    ]
    session_id3, is_new3, is_fragmented3, _ = detector.detect_session(request3)
    assert is_new3 is False  # Should continue same session
    assert is_fragmented3 is False
    assert session_id3 == session_id1


def test_identical_conversations_sequential():
    """Test that identical conversations run sequentially create different sessions."""
    detector = SessionDetectionUtility()
    
    # Define identical conversation
    conversation = [
        {"role": "user", "content": "Hello"},
        {"role": "assistant", "content": "Hi there!"},
        {"role": "user", "content": "How are you?"}
    ]
    
    # Run first conversation
    session1_id = run_full_conversation(detector, conversation)
    
    # Run identical conversation again - should get different session
    session2_id = run_full_conversation(detector, conversation)
    
    # Verify different sessions
    assert session1_id != session2_id
    
    # Check metrics
    metrics = detector.get_metrics()
    assert metrics["sessions_created"] >= 2


def test_intertwined_conversations():
    """Test that intertwined conversations maintain separate sessions."""
    detector = SessionDetectionUtility()
    
    # Define two different conversations
    conv1 = [
        {"role": "user", "content": "Hi"},
        {"role": "assistant", "content": "Hello!"},
        {"role": "user", "content": "How are you?"}
    ]
    
    conv2 = [
        {"role": "user", "content": "What's math?"},
        {"role": "assistant", "content": "Numbers!"},
        {"role": "user", "content": "Cool!"}
    ]
    
    # Create generators for intertwining
    gen1 = broadcast_conversation(detector, conv1)
    gen2 = broadcast_conversation(detector, conv2)
    
    # Intertwine: start both conversations
    session1_step1 = next(gen1)  # conv1: "Hi"
    session2_step1 = next(gen2)  # conv2: "What's math?"
    
    # Verify different sessions
    assert session1_step1 != session2_step1
    
    # Continue both conversations and verify consistency
    session1_step2 = next(gen1)  # conv1: + "Hello!"
    session2_step2 = next(gen2)  # conv2: + "Numbers!"
    session1_step3 = next(gen1)  # conv1: + "How are you?"
    session2_step3 = next(gen2)  # conv2: + "Cool!"
    
    # Verify each conversation maintains its own session for user messages
    assert session1_step3 == session1_step1  # Same session for conv1 user messages
    assert session2_step3 == session2_step1  # Same session for conv2 user messages
    assert session1_step3 != session2_step3  # Different sessions between conversations


def test_conversation_with_tool_calls():
    """Test session detection when tool calls are involved - realistic API flow."""
    detector = SessionDetectionUtility()
    
    # Call 1: User asks for weather
    call1 = [{"role": "user", "content": "What's the weather in NYC?"}]
    session_id1, is_new1, is_fragmented1, _ = detector.detect_session(call1)
    assert is_new1 is True
    assert is_fragmented1 is False
    
    # Call 2: Client sends tool result after assistant's tool call
    call2 = [
        {"role": "user", "content": "What's the weather in NYC?"},
        {"role": "assistant", "content": "I'll check the weather for you.", "tool_calls": [{"id": "call_123", "function": {"name": "get_weather", "arguments": '{"city": "NYC"}'}}]},
        {"role": "tool", "tool_call_id": "call_123", "content": "Sunny, 75°F"}
    ]
    session_id2, is_new2, is_fragmented2, _ = detector.detect_session(call2)
    assert is_new2 is False  # Should continue existing session
    assert is_fragmented2 is False
    assert session_id2 == session_id1
    
    # Call 3: User asks about Boston
    call3 = [
        {"role": "user", "content": "What's the weather in NYC?"},
        {"role": "assistant", "content": "I'll check the weather for you.", "tool_calls": [{"id": "call_123", "function": {"name": "get_weather", "arguments": '{"city": "NYC"}'}}]},
        {"role": "tool", "tool_call_id": "call_123", "content": "Sunny, 75°F"},
        {"role": "assistant", "content": "It's sunny and 75°F in NYC today!"},
        {"role": "user", "content": "Thanks! What about Boston?"}
    ]
    session_id3, is_new3, is_fragmented3, _ = detector.detect_session(call3)
    assert is_new3 is False  # Should continue same session
    assert is_fragmented3 is False
    assert session_id3 == session_id1
    
    # Call 4: Client sends second tool result
    call4 = [
        {"role": "user", "content": "What's the weather in NYC?"},
        {"role": "assistant", "content": "I'll check the weather for you.", "tool_calls": [{"id": "call_123", "function": {"name": "get_weather", "arguments": '{"city": "NYC"}'}}]},
        {"role": "tool", "tool_call_id": "call_123", "content": "Sunny, 75°F"},
        {"role": "assistant", "content": "It's sunny and 75°F in NYC today!"},
        {"role": "user", "content": "Thanks! What about Boston?"},
        {"role": "assistant", "content": "Let me check Boston weather.", "tool_calls": [{"id": "call_456", "function": {"name": "get_weather", "arguments": '{"city": "Boston"}'}}]},
        {"role": "tool", "tool_call_id": "call_456", "content": "Cloudy, 68°F"}
    ]
    session_id4, is_new4, is_fragmented4, _ = detector.detect_session(call4)
    assert is_new4 is False  # Should continue same session
    assert is_fragmented4 is False
    assert session_id4 == session_id1


def test_multiple_consecutive_user_messages():
    """Test that consecutive user messages are handled correctly."""
    detector = SessionDetectionUtility()
    
    # Request 1: User starts
    request1 = [{"role": "user", "content": "Hello"}]
    session_id1, is_new1, is_fragmented1, _ = detector.detect_session(request1)
    assert is_new1 is True
    assert is_fragmented1 is False
    
    # Request 2: User continues with assistant response
    request2 = [
        {"role": "user", "content": "Hello"},
        {"role": "assistant", "content": "Hi!"},
        {"role": "user", "content": "How are you?"}
    ]
    session_id2, is_new2, is_fragmented2, _ = detector.detect_session(request2)
    assert is_new2 is False
    assert is_fragmented2 is False
    assert session_id2 == session_id1
    
    # Request 3: User sends another message immediately (consecutive user messages)
    # Algorithm should trim to last user message: [Hello, Hi!, How are you?]
    # This should match request2's signature and continue the same session
    request3 = [
        {"role": "user", "content": "Hello"},
        {"role": "assistant", "content": "Hi!"},
        {"role": "user", "content": "How are you?"},
        {"role": "user", "content": "Are you there?"}
    ]
    session_id3, is_new3, is_fragmented3, _ = detector.detect_session(request3)
    
    # Should continue the same session successfully
    assert is_new3 is False
    assert is_fragmented3 is False
    assert session_id3 == session_id1


def test_openai_chat_completions_format():
    """Test session consistency with OpenAI Chat Completions API format."""
    detector = SessionDetectionUtility()
    
    messages = [
        {"role": "user", "content": "What's the weather in Madrid?"},
        {
            "role": "assistant",
            "content": None,
            "tool_calls": [
                {
                    "id": "call_123",
                    "type": "function",
                    "function": {
                        "name": "get_weather",
                        "arguments": "{ \"location\": \"Madrid\" }"
                    }
                }
            ]
        },
        {
            "role": "tool",
            "tool_call_id": "call_123",
            "content": "{ \"temperature\": \"29°C\", \"condition\": \"Sunny\" }"
        },
        {"role": "assistant", "content": "The weather in Madrid is currently sunny and 29°C."},
        {"role": "user", "content": "And what about Barcelona?"}
    ]
    
    # Broadcast the conversation and check session consistency
    session_ids = list(broadcast_conversation(detector, messages))
    
    # Verify we got session IDs for each step
    assert len(session_ids) == 5
    
    # Check that user messages maintain session consistency
    user_session_ids = [session_ids[0], session_ids[4]]  # First and last user messages
    assert_all_same_session(user_session_ids)


def test_openai_responses_api_format():
    """Test session consistency with OpenAI Responses API format."""
    detector = SessionDetectionUtility()
    
    messages = [
        {"role": "user", "content": "What's the weather in Madrid?"},
        # assistant's tool call from the previous turn
        {
            "type": "function_call",
            "id": "call_123",
            "name": "get_weather",
            "arguments": "{ \"location\": \"Madrid\" }"
        },
        # tool's result paired to that call
        {
            "type": "function_call_output",
            "call_id": "call_123",
            "output": "{ \"temperature\": \"29°C\", \"condition\": \"Sunny\" }"
        },
        # assistant message shown to user
        {
            "role": "assistant",
            "content": [{"type": "output_text", "text": "The weather in Madrid is currently sunny and 29°C."}]
        },
        # new user turn
        {"role": "user", "content": "And what about Barcelona?"}
    ]
    
    # Broadcast the conversation and check session consistency
    session_ids = list(broadcast_conversation(detector, messages))
    
    # Verify we got session IDs for each step
    assert len(session_ids) == 5
    
    # Check that user messages maintain session consistency
    user_session_ids = [session_ids[0], session_ids[4]]  # First and last user messages
    assert_all_same_session(user_session_ids)


def test_anthropic_api_format():
    """Test session consistency with Anthropic API format."""
    detector = SessionDetectionUtility()
    
    messages = [
        {"role": "user", "content": "What's the weather in Madrid?"},
        {
            "role": "assistant",
            "content": [
                {
                    "type": "tool_use",
                    "id": "toolu_123",
                    "name": "get_weather",
                    "input": {"location": "Madrid"}
                }
            ]
        },
        {
            "role": "user",
            "content": [
                {
                    "type": "tool_result",
                    "tool_use_id": "toolu_123",
                    "content": "{ \"temperature\": \"29°C\", \"condition\": \"Sunny\" }"
                }
            ]
        },
        {
            "role": "assistant",
            "content": [
                {"type": "text", "text": "The weather in Madrid is currently sunny and 29°C."}
            ]
        },
        {"role": "user", "content": "And what about Barcelona?"}
    ]
    
    # Broadcast the conversation and check session consistency
    session_ids = list(broadcast_conversation(detector, messages))
    
    # Verify we got session IDs for each step
    assert len(session_ids) == 5
    
    # Check that user messages maintain session consistency
    user_session_ids = [session_ids[0], session_ids[2], session_ids[4]]  # All user messages
    assert_all_same_session(user_session_ids)


def test_math_assistant_conversation():
    """Test session consistency with math assistant conversation involving multiple tool calls."""
    detector = SessionDetectionUtility()
    
    # Test the exact sequence your API sends - simulate real world usage
    test_cases = [
        # Case 1: First user message with system prompt
        [
            {'role': 'system', 'content': 'You are a helpful math assistant. Use the math_calculator tool to perform calculations when needed. Be conversational and helpful in your responses. Remember previous calculations and can reference them in future conversations.'},
            {'role': 'user', 'content': 'What is 25 + 17?'}
        ],
        # Case 2: After tool call
        [
            {'role': 'system', 'content': 'You are a helpful math assistant. Use the math_calculator tool to perform calculations when needed. Be conversational and helpful in your responses. Remember previous calculations and can reference them in future conversations.'},
            {'role': 'user', 'content': 'What is 25 + 17?'},
            {'role': 'assistant', 'content': None, 'tool_calls': [{'id': 'call_2ZBIB4gicvMpy4QEnSrjm180', 'function': {'arguments': '{"operation":"add","a":25,"b":17}', 'name': 'math_calculator'}, 'type': 'function'}]},
            {'role': 'tool', 'tool_call_id': 'call_2ZBIB4gicvMpy4QEnSrjm180', 'content': '42'}
        ],
        # Case 3: After assistant response, new user message
        [
            {'role': 'system', 'content': 'You are a helpful math assistant. Use the math_calculator tool to perform calculations when needed. Be conversational and helpful in your responses. Remember previous calculations and can reference them in future conversations.'},
            {'role': 'user', 'content': 'What is 25 + 17?'},
            {'role': 'assistant', 'content': None, 'tool_calls': [{'id': 'call_2ZBIB4gicvMpy4QEnSrjm180', 'function': {'arguments': '{"operation":"add","a":25,"b":17}', 'name': 'math_calculator'}, 'type': 'function'}]},
            {'role': 'tool', 'tool_call_id': 'call_2ZBIB4gicvMpy4QEnSrjm180', 'content': '42'},
            {'role': 'assistant', 'content': '25 + 17 equals 42. If you have any more calculations or questions, feel free to ask!'},
            {'role': 'user', 'content': 'Now multiply that result by 2'}
        ]
    ]
    
    session_ids = []
    
    for i, test_case in enumerate(test_cases):
        session_id, is_new, is_fragmented, _ = detector.detect_session(test_case)
        session_ids.append(session_id)
        
        if i == 0:
            # First case should be new session, not fragmented
            assert is_new is True
            assert is_fragmented is False
        else:
            # All subsequent cases should continue same session
            assert is_new is False
            assert is_fragmented is False
            assert session_id == session_ids[0]
    
    # Verify all calls maintained same session
    assert_all_same_session(session_ids)
    
    # Test fragmentation detection doesn't happen for valid cases
    metrics = detector.get_metrics()
    assert metrics["sessions_fragmented"] == 0


def test_intermediate_states_multiple_tool_calls():
    """Test that intermediate conversation states don't break session continuity.
    
    This is a regression test for a bug where adding messages incrementally
    (like [user] -> [user, assistant] -> [user, assistant, tool]) would create
    new sessions at intermediate states instead of continuing the existing session.
    
    The bug was caused by:
    1. _is_first_message being checked before _find_existing_session
    2. Old signature mappings being deleted when updating session signatures
    3. Not recognizing OpenAI Responses API format (type: function_call)
    """
    detector = SessionDetectionUtility()
    
    # Simulate a conversation with multiple tool calls, adding messages incrementally
    # This mimics how broadcast_conversation works and tests intermediate states
    
    # Step 1: User asks a question
    messages = [{"role": "user", "content": "Calculate 25 + 17, then multiply by 2"}]
    session_id1, is_new1, is_fragmented1, _ = detector.detect_session(messages)
    assert is_new1 is True
    assert is_fragmented1 is False
    
    # Step 2: Assistant responds with first tool call
    # BUG FIX: This used to create a new session because is_first_message returned True
    messages = [
        {"role": "user", "content": "Calculate 25 + 17, then multiply by 2"},
        {"role": "assistant", "content": None, "tool_calls": [
            {"id": "call_add", "function": {"name": "add", "arguments": '{"a": 25, "b": 17}'}}
        ]}
    ]
    session_id2, is_new2, is_fragmented2, _ = detector.detect_session(messages)
    assert is_new2 is False, "Adding assistant message should continue existing session"
    assert is_fragmented2 is False
    assert session_id2 == session_id1, "Session should be same after assistant response"
    
    # Step 3: Tool result for first calculation
    messages = [
        {"role": "user", "content": "Calculate 25 + 17, then multiply by 2"},
        {"role": "assistant", "content": None, "tool_calls": [
            {"id": "call_add", "function": {"name": "add", "arguments": '{"a": 25, "b": 17}'}}
        ]},
        {"role": "tool", "tool_call_id": "call_add", "content": "42"}
    ]
    session_id3, is_new3, is_fragmented3, _ = detector.detect_session(messages)
    assert is_new3 is False
    assert is_fragmented3 is False
    assert session_id3 == session_id1, "Session should be same after tool result"
    
    # Step 4: Assistant responds with second tool call
    messages = [
        {"role": "user", "content": "Calculate 25 + 17, then multiply by 2"},
        {"role": "assistant", "content": None, "tool_calls": [
            {"id": "call_add", "function": {"name": "add", "arguments": '{"a": 25, "b": 17}'}}
        ]},
        {"role": "tool", "tool_call_id": "call_add", "content": "42"},
        {"role": "assistant", "content": None, "tool_calls": [
            {"id": "call_multiply", "function": {"name": "multiply", "arguments": '{"a": 42, "b": 2}'}}
        ]}
    ]
    session_id4, is_new4, is_fragmented4, _ = detector.detect_session(messages)
    assert is_new4 is False
    assert is_fragmented4 is False
    assert session_id4 == session_id1, "Session should be same after second tool call"
    
    # Step 5: Tool result for second calculation
    messages = [
        {"role": "user", "content": "Calculate 25 + 17, then multiply by 2"},
        {"role": "assistant", "content": None, "tool_calls": [
            {"id": "call_add", "function": {"name": "add", "arguments": '{"a": 25, "b": 17}'}}
        ]},
        {"role": "tool", "tool_call_id": "call_add", "content": "42"},
        {"role": "assistant", "content": None, "tool_calls": [
            {"id": "call_multiply", "function": {"name": "multiply", "arguments": '{"a": 42, "b": 2}'}}
        ]},
        {"role": "tool", "tool_call_id": "call_multiply", "content": "84"}
    ]
    session_id5, is_new5, is_fragmented5, _ = detector.detect_session(messages)
    assert is_new5 is False
    assert is_fragmented5 is False
    assert session_id5 == session_id1, "Session should be same after second tool result"
    
    # Step 6: Final assistant response
    messages = [
        {"role": "user", "content": "Calculate 25 + 17, then multiply by 2"},
        {"role": "assistant", "content": None, "tool_calls": [
            {"id": "call_add", "function": {"name": "add", "arguments": '{"a": 25, "b": 17}'}}
        ]},
        {"role": "tool", "tool_call_id": "call_add", "content": "42"},
        {"role": "assistant", "content": None, "tool_calls": [
            {"id": "call_multiply", "function": {"name": "multiply", "arguments": '{"a": 42, "b": 2}'}}
        ]},
        {"role": "tool", "tool_call_id": "call_multiply", "content": "84"},
        {"role": "assistant", "content": "25 + 17 = 42, and 42 × 2 = 84. The final answer is 84!"}
    ]
    session_id6, is_new6, is_fragmented6, _ = detector.detect_session(messages)
    assert is_new6 is False
    assert is_fragmented6 is False
    assert session_id6 == session_id1, "Session should be same after final response"
    
    # Step 7: User asks follow-up question
    messages = [
        {"role": "user", "content": "Calculate 25 + 17, then multiply by 2"},
        {"role": "assistant", "content": None, "tool_calls": [
            {"id": "call_add", "function": {"name": "add", "arguments": '{"a": 25, "b": 17}'}}
        ]},
        {"role": "tool", "tool_call_id": "call_add", "content": "42"},
        {"role": "assistant", "content": None, "tool_calls": [
            {"id": "call_multiply", "function": {"name": "multiply", "arguments": '{"a": 42, "b": 2}'}}
        ]},
        {"role": "tool", "tool_call_id": "call_multiply", "content": "84"},
        {"role": "assistant", "content": "25 + 17 = 42, and 42 × 2 = 84. The final answer is 84!"},
        {"role": "user", "content": "Now divide that by 4"}
    ]
    session_id7, is_new7, is_fragmented7, _ = detector.detect_session(messages)
    assert is_new7 is False
    assert is_fragmented7 is False
    assert session_id7 == session_id1, "Session should be same for follow-up question"
    
    # Verify no fragmentation occurred
    metrics = detector.get_metrics()
    assert metrics["sessions_fragmented"] == 0, "No sessions should be fragmented"
    assert metrics["sessions_created"] == 1, "Only one session should have been created"


def test_openai_responses_api_multiple_tool_calls():
    """Test session continuity with OpenAI Responses API format and multiple tool calls.
    
    This is a regression test for a bug where the Responses API format (using
    `type: "function_call"` instead of `role: "assistant"`) wasn't recognized
    as an LLM-initiated message, causing session continuity to break.
    
    The Responses API format differs from Chat Completions:
    - Tool calls use `type: "function_call"` with `id`, `name`, `arguments`
    - Tool results use `type: "function_call_output"` with `call_id`, `output`
    - Assistant messages may use content arrays with `type: "output_text"`
    """
    detector = SessionDetectionUtility()
    
    # Step 1: User asks a multi-step question
    messages = [{"role": "user", "content": "What's 25 + 17, then multiply by 2?"}]
    session_id1, is_new1, is_fragmented1, _ = detector.detect_session(messages)
    assert is_new1 is True
    assert is_fragmented1 is False
    
    # Step 2: First function call (Responses API format)
    messages = [
        {"role": "user", "content": "What's 25 + 17, then multiply by 2?"},
        {
            "type": "function_call",
            "id": "call_add_123",
            "name": "add",
            "arguments": '{"a": 25, "b": 17}'
        }
    ]
    session_id2, is_new2, is_fragmented2, _ = detector.detect_session(messages)
    assert is_new2 is False, "function_call should continue existing session"
    assert is_fragmented2 is False
    assert session_id2 == session_id1
    
    # Step 3: First function output
    messages = [
        {"role": "user", "content": "What's 25 + 17, then multiply by 2?"},
        {
            "type": "function_call",
            "id": "call_add_123",
            "name": "add",
            "arguments": '{"a": 25, "b": 17}'
        },
        {
            "type": "function_call_output",
            "call_id": "call_add_123",
            "output": "42"
        }
    ]
    session_id3, is_new3, is_fragmented3, _ = detector.detect_session(messages)
    assert is_new3 is False
    assert is_fragmented3 is False
    assert session_id3 == session_id1
    
    # Step 4: Second function call
    messages = [
        {"role": "user", "content": "What's 25 + 17, then multiply by 2?"},
        {
            "type": "function_call",
            "id": "call_add_123",
            "name": "add",
            "arguments": '{"a": 25, "b": 17}'
        },
        {
            "type": "function_call_output",
            "call_id": "call_add_123",
            "output": "42"
        },
        {
            "type": "function_call",
            "id": "call_multiply_456",
            "name": "multiply",
            "arguments": '{"a": 42, "b": 2}'
        }
    ]
    session_id4, is_new4, is_fragmented4, _ = detector.detect_session(messages)
    assert is_new4 is False, "Second function_call should continue session"
    assert is_fragmented4 is False
    assert session_id4 == session_id1
    
    # Step 5: Second function output
    messages = [
        {"role": "user", "content": "What's 25 + 17, then multiply by 2?"},
        {
            "type": "function_call",
            "id": "call_add_123",
            "name": "add",
            "arguments": '{"a": 25, "b": 17}'
        },
        {
            "type": "function_call_output",
            "call_id": "call_add_123",
            "output": "42"
        },
        {
            "type": "function_call",
            "id": "call_multiply_456",
            "name": "multiply",
            "arguments": '{"a": 42, "b": 2}'
        },
        {
            "type": "function_call_output",
            "call_id": "call_multiply_456",
            "output": "84"
        }
    ]
    session_id5, is_new5, is_fragmented5, _ = detector.detect_session(messages)
    assert is_new5 is False
    assert is_fragmented5 is False
    assert session_id5 == session_id1
    
    # Step 6: Final assistant response (Responses API style with content array)
    messages = [
        {"role": "user", "content": "What's 25 + 17, then multiply by 2?"},
        {
            "type": "function_call",
            "id": "call_add_123",
            "name": "add",
            "arguments": '{"a": 25, "b": 17}'
        },
        {
            "type": "function_call_output",
            "call_id": "call_add_123",
            "output": "42"
        },
        {
            "type": "function_call",
            "id": "call_multiply_456",
            "name": "multiply",
            "arguments": '{"a": 42, "b": 2}'
        },
        {
            "type": "function_call_output",
            "call_id": "call_multiply_456",
            "output": "84"
        },
        {
            "role": "assistant",
            "content": [{"type": "output_text", "text": "25 + 17 = 42, and 42 × 2 = 84!"}]
        }
    ]
    session_id6, is_new6, is_fragmented6, _ = detector.detect_session(messages)
    assert is_new6 is False
    assert is_fragmented6 is False
    assert session_id6 == session_id1
    
    # Step 7: User follow-up
    messages = [
        {"role": "user", "content": "What's 25 + 17, then multiply by 2?"},
        {
            "type": "function_call",
            "id": "call_add_123",
            "name": "add",
            "arguments": '{"a": 25, "b": 17}'
        },
        {
            "type": "function_call_output",
            "call_id": "call_add_123",
            "output": "42"
        },
        {
            "type": "function_call",
            "id": "call_multiply_456",
            "name": "multiply",
            "arguments": '{"a": 42, "b": 2}'
        },
        {
            "type": "function_call_output",
            "call_id": "call_multiply_456",
            "output": "84"
        },
        {
            "role": "assistant",
            "content": [{"type": "output_text", "text": "25 + 17 = 42, and 42 × 2 = 84!"}]
        },
        {"role": "user", "content": "Now divide that by 4"}
    ]
    session_id7, is_new7, is_fragmented7, _ = detector.detect_session(messages)
    assert is_new7 is False
    assert is_fragmented7 is False
    assert session_id7 == session_id1
    
    # Verify no fragmentation and only one session created
    metrics = detector.get_metrics()
    assert metrics["sessions_fragmented"] == 0, "No sessions should be fragmented"
    assert metrics["sessions_created"] == 1, "Only one session should have been created"


def test_concurrent_identical_sessions():
    """Test that concurrent sessions with identical initial messages stay separate.
    
    This is a regression test for a bug where two sessions starting with the exact
    same content would conflict:
    1. Session A starts with [system, user: "Calculate sqrt(144)"]
    2. Session B starts with [system, user: "Calculate sqrt(144)"] (identical!)
    3. Session B's signature overwrites Session A's mapping
    4. When Session A continues, it incorrectly finds Session B
    
    The fix uses multi-mapping (signature -> list of sessions) so both sessions
    can coexist with the same initial signature.
    """
    detector = SessionDetectionUtility()
    
    # Common system prompt
    system_prompt = "You are a math assistant."
    
    # Both sessions start with identical messages
    initial_messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": "Calculate the square root of 144"}
    ]
    
    # Session A starts
    session_a_id, is_new_a, _, _ = detector.detect_session(initial_messages, system_prompt)
    assert is_new_a is True, "Session A should be new"
    
    # Session B starts (identical content!)
    session_b_id, is_new_b, _, _ = detector.detect_session(initial_messages, system_prompt)
    assert is_new_b is True, "Session B should also be new"
    assert session_a_id != session_b_id, "Sessions should have different IDs"
    
    # Session A continues with tool result
    session_a_continued = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": "Calculate the square root of 144"},
        {"role": "assistant", "content": None, "tool_calls": [
            {"id": "call_a", "function": {"name": "sqrt", "arguments": '{"n": 144}'}}
        ]},
        {"role": "tool", "tool_call_id": "call_a", "content": "12.0"}
    ]
    session_a_id_2, is_new_a2, _, _ = detector.detect_session(session_a_continued, system_prompt)
    assert is_new_a2 is False, "Session A should continue"
    assert session_a_id_2 == session_a_id, "Should find Session A, not B"
    
    # Session B continues with its own tool result
    session_b_continued = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": "Calculate the square root of 144"},
        {"role": "assistant", "content": None, "tool_calls": [
            {"id": "call_b", "function": {"name": "sqrt", "arguments": '{"n": 144}'}}
        ]},
        {"role": "tool", "tool_call_id": "call_b", "content": "12.0"}
    ]
    session_b_id_2, is_new_b2, _, _ = detector.detect_session(session_b_continued, system_prompt)
    assert is_new_b2 is False, "Session B should continue"
    assert session_b_id_2 == session_b_id, "Should find Session B, not A"
    
    # Both sessions should still exist and be distinct
    assert session_a_id != session_b_id
    
    # Session A asks follow-up
    session_a_followup = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": "Calculate the square root of 144"},
        {"role": "assistant", "content": None, "tool_calls": [
            {"id": "call_a", "function": {"name": "sqrt", "arguments": '{"n": 144}'}}
        ]},
        {"role": "tool", "tool_call_id": "call_a", "content": "12.0"},
        {"role": "assistant", "content": "The square root of 144 is 12."},
        {"role": "user", "content": "Now calculate sqrt(36)"}
    ]
    session_a_id_3, is_new_a3, _, _ = detector.detect_session(session_a_followup, system_prompt)
    assert is_new_a3 is False, "Session A should continue for follow-up"
    assert session_a_id_3 == session_a_id, "Should still be Session A"
    
    # Session B asks different follow-up  
    session_b_followup = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": "Calculate the square root of 144"},
        {"role": "assistant", "content": None, "tool_calls": [
            {"id": "call_b", "function": {"name": "sqrt", "arguments": '{"n": 144}'}}
        ]},
        {"role": "tool", "tool_call_id": "call_b", "content": "12.0"},
        {"role": "assistant", "content": "The square root of 144 is 12."},
        {"role": "user", "content": "Now calculate sqrt(49)"}
    ]
    session_b_id_3, is_new_b3, _, _ = detector.detect_session(session_b_followup, system_prompt)
    assert is_new_b3 is False, "Session B should continue for follow-up"
    assert session_b_id_3 == session_b_id, "Should still be Session B"
    
    # Verify correct number of sessions created
    metrics = detector.get_metrics()
    assert metrics["sessions_created"] == 2, "Exactly 2 sessions should have been created"
    assert metrics["sessions_fragmented"] == 0, "No fragmentation should occur"