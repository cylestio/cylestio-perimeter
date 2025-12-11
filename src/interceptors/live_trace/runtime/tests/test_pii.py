"""Unit tests for PII analysis module."""
from unittest.mock import Mock, patch
from collections import deque

from ..pii import (
    extract_text_from_message,
    extract_message_content,
    analyze_sessions_for_pii,
)
from ...store.store import SessionData
from ..models import PIIAnalysisResult


class MockEvent:
    """Mock event for testing."""
    def __init__(self, name: str, attributes: dict):
        self.name = Mock()
        self.name.value = name
        self.attributes = attributes


class TestExtractTextFromMessage:
    """Test extract_text_from_message function."""

    def test_string_content(self):
        """Test extracting text from string content."""
        message = {"role": "user", "content": "Hello world"}
        result = extract_text_from_message(message)
        assert result == "Hello world"

    def test_list_content_with_text_blocks(self):
        """Test extracting text from list of content blocks."""
        message = {
            "role": "user",
            "content": [
                {"type": "text", "text": "Part 1"},
                {"type": "text", "text": "Part 2"}
            ]
        }
        result = extract_text_from_message(message)
        assert result == "Part 1 Part 2"

    def test_list_content_with_mixed_blocks(self):
        """Test extracting text from list with non-text blocks."""
        message = {
            "role": "user",
            "content": [
                {"type": "text", "text": "Text part"},
                {"type": "image", "url": "https://example.com/image.jpg"}
            ]
        }
        result = extract_text_from_message(message)
        assert result == "Text part"

    def test_empty_content(self):
        """Test extracting text from empty content."""
        message = {"role": "user", "content": ""}
        result = extract_text_from_message(message)
        assert result == ""

    def test_missing_content(self):
        """Test extracting text when content is missing."""
        message = {"role": "user"}
        result = extract_text_from_message(message)
        assert result == ""


class TestExtractMessageContent:
    """Test extract_message_content function."""

    def test_extract_user_messages(self):
        """Test extracting user messages from sessions."""
        session = SessionData("session-1", "agent-1")
        session.events = deque([
            MockEvent("llm.call.start", {
                "llm.request.data": {
                    "messages": [
                        {"role": "user", "content": "Hello"}
                    ]
                }
            })
        ])

        result = extract_message_content([session])
        assert len(result) == 1
        assert result[0] == ("session-1", "user_message", "Hello")

    def test_extract_system_prompts(self):
        """Test extracting system prompts."""
        session = SessionData("session-1", "agent-1")
        session.events = deque([
            MockEvent("llm.call.start", {
                "llm.request.data": {
                    "system": "You are a helpful assistant",
                    "messages": []
                }
            })
        ])

        result = extract_message_content([session])
        assert len(result) == 1
        assert result[0] == ("session-1", "system_prompt", "You are a helpful assistant")

    def test_extract_tool_inputs(self):
        """Test extracting tool inputs."""
        session = SessionData("session-1", "agent-1")
        session.events = deque([
            MockEvent("tool.execution", {
                "tool.input": "Search for John Doe"
            })
        ])

        result = extract_message_content([session])
        assert len(result) == 1
        assert result[0] == ("session-1", "tool_input", "Search for John Doe")

    def test_extract_multiple_messages(self):
        """Test extracting multiple messages from multiple sessions."""
        session1 = SessionData("session-1", "agent-1")
        session1.events = deque([
            MockEvent("llm.call.start", {
                "llm.request.data": {
                    "messages": [
                        {"role": "user", "content": "Message 1"}
                    ]
                }
            })
        ])

        session2 = SessionData("session-2", "agent-1")
        session2.events = deque([
            MockEvent("llm.call.start", {
                "llm.request.data": {
                    "messages": [
                        {"role": "user", "content": "Message 2"}
                    ]
                }
            })
        ])

        result = extract_message_content([session1, session2])
        assert len(result) == 2

    def test_skip_empty_messages(self):
        """Test that empty messages are skipped."""
        session = SessionData("session-1", "agent-1")
        session.events = deque([
            MockEvent("llm.call.start", {
                "llm.request.data": {
                    "messages": [
                        {"role": "user", "content": ""},
                        {"role": "user", "content": "Valid message"}
                    ]
                }
            })
        ])

        result = extract_message_content([session])
        assert len(result) == 1
        assert result[0][2] == "Valid message"


class TestAnalyzeSessionsForPII:
    """Test analyze_sessions_for_pii function."""

    @patch('src.interceptors.live_trace.runtime.pii.PresidioAnalyzer')
    def test_no_pii_found(self, mock_presidio_class):
        """Test when no PII is found."""
        # Mock analyzer to return no findings
        mock_analyzer = Mock()
        mock_analyzer.analyze.return_value = []
        mock_presidio_class.return_value.get_analyzer.return_value = mock_analyzer

        session = SessionData("session-1", "agent-1")
        session.events = deque([
            MockEvent("llm.call.start", {
                "llm.request.data": {
                    "messages": [
                        {"role": "user", "content": "Hello world"}
                    ]
                }
            })
        ])

        result = analyze_sessions_for_pii([session])

        assert isinstance(result, PIIAnalysisResult)
        assert result.total_findings == 0
        assert result.sessions_with_pii == 0
        assert result.sessions_without_pii == 1

    @patch('src.interceptors.live_trace.runtime.pii.is_pii_available')
    @patch('src.interceptors.live_trace.runtime.pii.PresidioAnalyzer')
    def test_pii_detected(self, mock_presidio_class, mock_is_pii_available):
        """Test when PII is detected."""
        # Mock PII availability check
        mock_is_pii_available.return_value = (True, None)

        # Mock analyzer to return findings
        mock_result = Mock()
        mock_result.entity_type = "EMAIL_ADDRESS"
        mock_result.start = 11
        mock_result.end = 30
        mock_result.score = 0.95

        mock_analyzer = Mock()
        mock_analyzer.analyze.return_value = [mock_result]
        mock_presidio_class.return_value.get_analyzer.return_value = mock_analyzer

        session = SessionData("session-1", "agent-1")
        session.events = deque([
            MockEvent("llm.call.start", {
                "llm.request.data": {
                    "messages": [
                        {"role": "user", "content": "Contact me at john@example.com"}
                    ]
                }
            })
        ])

        result = analyze_sessions_for_pii([session])

        assert result.total_findings == 1
        assert result.high_confidence_count == 1
        assert result.sessions_with_pii == 1
        assert result.sessions_without_pii == 0
        assert "EMAIL_ADDRESS" in result.findings_by_type
        assert result.findings_by_type["EMAIL_ADDRESS"] == 1

    @patch('src.interceptors.live_trace.runtime.pii.is_pii_available')
    @patch('src.interceptors.live_trace.runtime.pii.PresidioAnalyzer')
    def test_multiple_pii_types(self, mock_presidio_class, mock_is_pii_available):
        """Test detection of multiple PII types."""
        # Mock PII availability check
        mock_is_pii_available.return_value = (True, None)

        # Mock analyzer to return multiple findings
        mock_email = Mock()
        mock_email.entity_type = "EMAIL_ADDRESS"
        mock_email.start = 0
        mock_email.end = 19
        mock_email.score = 0.95

        mock_phone = Mock()
        mock_phone.entity_type = "PHONE_NUMBER"
        mock_phone.start = 24
        mock_phone.end = 36
        mock_phone.score = 0.85

        mock_analyzer = Mock()
        mock_analyzer.analyze.return_value = [mock_email, mock_phone]
        mock_presidio_class.return_value.get_analyzer.return_value = mock_analyzer

        session = SessionData("session-1", "agent-1")
        session.events = deque([
            MockEvent("llm.call.start", {
                "llm.request.data": {
                    "messages": [
                        {"role": "user", "content": "john@example.com and 555-123-4567"}
                    ]
                }
            })
        ])

        result = analyze_sessions_for_pii([session])

        assert result.total_findings == 2
        assert result.high_confidence_count == 2
        assert len(result.findings_by_type) == 2
        assert "EMAIL_ADDRESS" in result.findings_by_type
        assert "PHONE_NUMBER" in result.findings_by_type

    @patch('src.interceptors.live_trace.runtime.pii.is_pii_available')
    @patch('src.interceptors.live_trace.runtime.pii.PresidioAnalyzer')
    def test_confidence_level_classification(self, mock_presidio_class, mock_is_pii_available):
        """Test that findings are classified by confidence level."""
        # Mock PII availability check
        mock_is_pii_available.return_value = (True, None)

        # Mock findings with different confidence levels
        high_conf = Mock()
        high_conf.entity_type = "EMAIL_ADDRESS"
        high_conf.start = 0
        high_conf.end = 10
        high_conf.score = 0.9  # High confidence

        med_conf = Mock()
        med_conf.entity_type = "PERSON"
        med_conf.start = 11
        med_conf.end = 20
        med_conf.score = 0.6  # Medium confidence

        low_conf = Mock()
        low_conf.entity_type = "LOCATION"
        low_conf.start = 21
        low_conf.end = 30
        low_conf.score = 0.3  # Low confidence

        mock_analyzer = Mock()
        # Note: analyze_pii filters by threshold (default 0.5), so low_conf won't appear
        mock_analyzer.analyze.return_value = [high_conf, med_conf]
        mock_presidio_class.return_value.get_analyzer.return_value = mock_analyzer

        session = SessionData("session-1", "agent-1")
        session.events = deque([
            MockEvent("llm.call.start", {
                "llm.request.data": {
                    "messages": [
                        {"role": "user", "content": "Test message with multiple confidence levels"}
                    ]
                }
            })
        ])

        result = analyze_sessions_for_pii([session])

        assert result.total_findings == 2
        assert result.high_confidence_count == 1
        assert result.medium_confidence_count == 1

    def test_empty_sessions(self):
        """Test with empty session list."""
        result = analyze_sessions_for_pii([])

        assert result.total_findings == 0
        assert result.sessions_with_pii == 0
        assert result.sessions_without_pii == 0

    @patch('src.interceptors.live_trace.runtime.pii.is_pii_available')
    @patch('src.interceptors.live_trace.runtime.pii.PresidioAnalyzer')
    def test_most_common_entities(self, mock_presidio_class, mock_is_pii_available):
        """Test that most common entities are tracked."""
        # Mock PII availability check
        mock_is_pii_available.return_value = (True, None)

        # Mock multiple email findings
        mock_findings = []
        for i in range(3):
            finding = Mock()
            finding.entity_type = "EMAIL_ADDRESS"
            finding.start = i * 20
            finding.end = i * 20 + 19
            finding.score = 0.9
            mock_findings.append(finding)

        # Add one phone number
        phone = Mock()
        phone.entity_type = "PHONE_NUMBER"
        phone.start = 60
        phone.end = 72
        phone.score = 0.85
        mock_findings.append(phone)

        mock_analyzer = Mock()
        mock_analyzer.analyze.return_value = mock_findings
        mock_presidio_class.return_value.get_analyzer.return_value = mock_analyzer

        session = SessionData("session-1", "agent-1")
        session.events = deque([
            MockEvent("llm.call.start", {
                "llm.request.data": {
                    "messages": [
                        {"role": "user", "content": "a@b.com c@d.com e@f.com 555-1234"}
                    ]
                }
            })
        ])

        result = analyze_sessions_for_pii([session])

        assert len(result.most_common_entities) > 0
        assert result.most_common_entities[0] == "EMAIL_ADDRESS"  # Most common
