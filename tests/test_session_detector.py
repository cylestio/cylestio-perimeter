"""Test suite for session detector using real session data."""
import json
import pytest
import pytest_asyncio

# Unit tests are currently disabled; focusing on integration coverage
pytestmark = pytest.mark.skip(reason="Unit tests temporarily disabled")
from unittest.mock import AsyncMock, MagicMock
from fastapi import Request

from src.proxy.session.detector import SessionDetector, initialize_session_detector
from src.proxy.session.manager import SessionManager
from src.providers.anthropic import AnthropicProvider
from src.providers.registry import registry


class TestSessionDetector:
    """Test session detection with real session data."""
    
    @pytest.fixture
    def session_detector(self):
        """Create a session detector instance."""
        session_manager = SessionManager(
            max_sessions=10000,
            session_ttl_seconds=3600
        )
        return SessionDetector(session_manager=session_manager)
    
    @pytest.fixture
    def mock_anthropic_provider(self):
        """Create a mock Anthropic provider."""
        provider = AnthropicProvider()
        # Mock the registry to return our provider
        registry.get_provider = MagicMock(return_value=provider)
        return provider
    
    def load_session_requests(self, filepath: str):
        """Load request data from jsonl file."""
        requests = []
        with open(filepath, 'r') as f:
            for line in f:
                data = json.loads(line.strip())
                if data.get("direction") == "request":
                    requests.append(data)
        return requests
    
    async def create_mock_request(self, request_data: dict) -> Request:
        """Create a mock FastAPI Request from session data."""
        request_body = request_data["request"]
        
        # Create mock request
        mock_request = MagicMock(spec=Request)
        mock_request.method = request_data["metadata"]["method"]
        mock_request.url = MagicMock()
        mock_request.url.path = request_data["metadata"]["path"]
        mock_request.url.__str__.return_value = f"https://api.anthropic.com{request_data['metadata']['path']}"
        
        # Mock headers
        mock_request.headers = {
            "content-type": "application/json",
            "authorization": "Bearer sk-test-key",
            "user-agent": "test-client/1.0"
        }
        
        # Mock client info
        mock_request.client = MagicMock()
        mock_request.client.host = "127.0.0.1"
        mock_request.client.port = 12345
        
        # Mock body method
        body_bytes = json.dumps(request_body).encode('utf-8')
        mock_request.body = AsyncMock(return_value=body_bytes)
        
        return mock_request
    
    @pytest.mark.asyncio
    async def test_session_one_identification(self, session_detector, mock_anthropic_provider):
        """Test that session one properly groups related requests."""
        # Load requests from session one
        requests = self.load_session_requests("/Users/eyalben/Projects/cylestio/cylestio-gateway/message_logs/one.jsonl")
        
        # First request should create a new session (single message)
        first_request = await self.create_mock_request(requests[0])
        result1 = await session_detector.analyze_request(first_request)
        
        assert result1 is not None
        assert result1["is_new_session"] is True
        assert result1["provider"] == "anthropic"
        assert result1["model"] == "claude-3-5-sonnet-20241022"
        assert result1["message_count"] == 1
        session1_id = result1["session_id"]
        
        # Second request should continue session 1 (builds on first message)
        second_request = await self.create_mock_request(requests[1])
        result2 = await session_detector.analyze_request(second_request)
        
        assert result2 is not None
        assert result2["is_new_session"] is False  # Continuing existing session
        assert result2["provider"] == "anthropic"
        assert result2["model"] == "claude-3-5-sonnet-20241022"
        assert result2["message_count"] == 3
        assert result2["session_id"] == session1_id  # Same session
        
        # Third request continues the same session
        third_request = await self.create_mock_request(requests[2])
        result3 = await session_detector.analyze_request(third_request)
        
        assert result3 is not None
        assert result3["is_new_session"] is False  # Continuing existing session
        assert result3["session_id"] == session1_id  # Same session
        assert result3["message_count"] == 5
    
    @pytest.mark.asyncio
    async def test_session_two_identification(self, session_detector, mock_anthropic_provider):
        """Test that session two properly groups related requests."""
        # Load requests from session two
        requests = self.load_session_requests("/Users/eyalben/Projects/cylestio/cylestio-gateway/message_logs/two.jsonl")
        
        # First request should create a new session (single message)
        first_request = await self.create_mock_request(requests[0])
        result1 = await session_detector.analyze_request(first_request)
        
        assert result1 is not None
        assert result1["is_new_session"] is True
        assert result1["provider"] == "anthropic"
        assert result1["model"] == "claude-3-5-sonnet-20241022"
        assert result1["message_count"] == 1
        session1_id = result1["session_id"]
        
        # Second request should continue session 1 (builds on first message)
        second_request = await self.create_mock_request(requests[1])
        result2 = await session_detector.analyze_request(second_request)
        
        assert result2 is not None
        assert result2["is_new_session"] is False  # Continuing existing session
        assert result2["provider"] == "anthropic"
        assert result2["model"] == "claude-3-5-sonnet-20241022"
        assert result2["message_count"] == 3
        assert result2["session_id"] == session1_id  # Same session
        
        # Third request continues the same session
        third_request = await self.create_mock_request(requests[2])
        result3 = await session_detector.analyze_request(third_request)
        
        assert result3 is not None
        assert result3["is_new_session"] is False  # Continuing existing session
        assert result3["session_id"] == session1_id  # Same session
        assert result3["message_count"] == 5
        
        # Fourth request continues the same session
        fourth_request = await self.create_mock_request(requests[3])
        result4 = await session_detector.analyze_request(fourth_request)
        
        assert result4 is not None
        assert result4["is_new_session"] is False  # Continuing existing session
        assert result4["session_id"] == session1_id  # Same session
        assert result4["message_count"] == 7
    
    @pytest.mark.asyncio
    async def test_different_sessions_not_mixed(self, session_detector, mock_anthropic_provider):
        """Test that sessions from different files remain separate."""
        # Load requests from both sessions
        requests1 = self.load_session_requests("/Users/eyalben/Projects/cylestio/cylestio-gateway/message_logs/one.jsonl")
        requests2 = self.load_session_requests("/Users/eyalben/Projects/cylestio/cylestio-gateway/message_logs/two.jsonl")
        
        # Create session from file one
        req1 = await self.create_mock_request(requests1[0])
        result1 = await session_detector.analyze_request(req1)
        session1_id = result1["session_id"]
        
        # Create session from file two
        req2 = await self.create_mock_request(requests2[0])
        result2 = await session_detector.analyze_request(req2)
        session2_id = result2["session_id"]
        
        # They should be different sessions (different content)
        assert session1_id != session2_id
        
        # Continue session from file one
        req1_cont = await self.create_mock_request(requests1[1])
        result1_cont = await session_detector.analyze_request(req1_cont)
        
        # Should continue the same session as session1
        assert result1_cont["is_new_session"] is False
        assert result1_cont["session_id"] == session1_id
        
        # Continue session from file two
        req2_cont = await self.create_mock_request(requests2[1])
        result2_cont = await session_detector.analyze_request(req2_cont)
        
        # Should continue the same session as session2
        assert result2_cont["is_new_session"] is False
        assert result2_cont["session_id"] == session2_id
    
    @pytest.mark.asyncio
    async def test_session_metrics(self, session_detector, mock_anthropic_provider):
        """Test session metrics tracking."""
        # Load and process some requests
        requests = self.load_session_requests("/Users/eyalben/Projects/cylestio/cylestio-gateway/message_logs/one.jsonl")
        
        for req_data in requests[:2]:
            request = await self.create_mock_request(req_data)
            await session_detector.analyze_request(request)
        
        # Get metrics
        metrics = session_detector.get_session_metrics()
        
        assert "active_sessions" in metrics
        assert "sessions_created" in metrics
        assert metrics["sessions_created"] == 1  # Only one session created (requests are grouped)
        assert metrics["active_sessions"] == 1
        assert metrics["cache_hits"] == 1  # Second request found first session
    
    @pytest.mark.asyncio
    async def test_client_info_extraction(self, session_detector, mock_anthropic_provider):
        """Test client info is properly extracted."""
        requests = self.load_session_requests("/Users/eyalben/Projects/cylestio/cylestio-gateway/message_logs/one.jsonl")
        
        request = await self.create_mock_request(requests[0])
        result = await session_detector.analyze_request(request)
        
        assert result is not None
        assert "client_info" in result
        assert result["client_info"]["ip"] == "127.0.0.1"
        assert result["client_info"]["port"] == 12345
        assert result["client_info"]["user_agent"] == "test-client/1.0"
        assert "api_key_hint" in result["client_info"]
    
    @pytest.mark.asyncio
    async def test_session_id_consistency(self, session_detector, mock_anthropic_provider):
        """Test that session IDs remain consistent for the same conversation."""
        # Test data with exact message progression from logs
        system_prompt = """# Count messages agent

You are an agent that counts how many messages the users sends you

## Instructions

Any message you receive, it doesn't matter the message - you answer with a number.

On every message you receive, the number increases by 1."""
        
        # First conversation progression
        messages_seq1 = [
            [{"role": "user", "content": "hey"}],
            [{"role": "user", "content": "hey"}, {"role": "assistant", "content": "1"}, {"role": "user", "content": "one"}],
            [{"role": "user", "content": "hey"}, {"role": "assistant", "content": "1"}, {"role": "user", "content": "one"}, {"role": "assistant", "content": "2"}, {"role": "user", "content": "two"}]
        ]
        
        session_ids = []
        for i, messages in enumerate(messages_seq1):
            request_data = {
                "request": {
                    "model": "claude-3-5-sonnet-20241022",
                    "max_tokens": 2000,
                    "temperature": 0.7,
                    "system": system_prompt,
                    "messages": messages
                },
                "metadata": {
                    "method": "POST",
                    "path": "/v1/messages",
                    "is_streaming": False
                }
            }
            
            request = await self.create_mock_request(request_data)
            result = await session_detector.analyze_request(request)
            session_ids.append(result["session_id"])
        
        # First message creates new session, subsequent messages continue it
        assert session_ids[1] == session_ids[0]  # Second continues first session
        assert session_ids[2] == session_ids[0]  # Third continues same session
        assert len(set(session_ids)) == 1  # All messages belong to the same session
    
    @pytest.mark.asyncio
    async def test_longer_conversation_grouping(self, session_detector, mock_anthropic_provider):
        """Test session grouping with a longer conversation from three.jsonl."""
        # Load requests from session three (longer conversation)
        requests = self.load_session_requests("/Users/eyalben/Projects/cylestio/cylestio-gateway/message_logs/three.jsonl")
        
        session_ids = []
        for i, req_data in enumerate(requests):
            request = await self.create_mock_request(req_data)
            result = await session_detector.analyze_request(request)
            session_ids.append(result["session_id"])
            
            if i == 0:
                # First request creates new session
                assert result["is_new_session"] is True
                assert result["message_count"] == 1
            else:
                # All subsequent requests continue the same session
                assert result["is_new_session"] is False
                assert result["session_id"] == session_ids[0]
                # Message count increases by 2 each time (user + assistant)
                expected_count = 1 + (i * 2)
                assert result["message_count"] == expected_count
        
        # All requests should belong to the same session
        assert len(set(session_ids)) == 1
        
        # Verify we have the expected number of requests (6 requests in three.jsonl)
        assert len(session_ids) == 6