"""Printer interceptor for displaying request/response information."""
import json
from datetime import datetime
from typing import Any, Dict, List, Optional

from src.proxy.interceptor_base import BaseInterceptor, LLMRequestData, LLMResponseData
from src.utils.logger import get_logger
from src.events import (
    BaseEvent, EventName, LLMCallStartEvent, LLMCallFinishEvent, LLMCallErrorEvent,
    ToolExecutionEvent, ToolResultEvent, SessionStartEvent, SessionEndEvent
)

logger = get_logger(__name__)


class PrinterInterceptor(BaseInterceptor):
    """Interceptor for printing request/response information to console."""
    
    def __init__(self, config: Dict[str, Any]):
        """Initialize printer interceptor.
        
        Args:
            config: Interceptor configuration
        """
        super().__init__(config)
        self.log_requests = config.get("log_requests", True)
        self.log_responses = config.get("log_responses", True)
        self.log_body = config.get("log_body", False)
        self.show_sessions = config.get("show_sessions", True)
        self.show_llm_calls = config.get("show_llm_calls", True)
        self.show_tools = config.get("show_tools", True)
    
    @property
    def name(self) -> str:
        """Return the name of this interceptor."""
        return "printer"
    
    async def before_request(self, request_data: LLMRequestData) -> Optional[LLMRequestData]:
        """Print request information before sending to LLM.
        
        Args:
            request_data: Request data container
            
        Returns:
            None (doesn't modify request)
        """
        if not self.enabled or not self.log_requests:
            return None
        
        # Process all events from the request
        for event in request_data.events:
            self._process_event(event, request_data)
        
        return None
    
    async def after_response(
        self, 
        request_data: LLMRequestData, 
        response_data: LLMResponseData
    ) -> Optional[LLMResponseData]:
        """Print response information after receiving from LLM.
        
        Args:
            request_data: Original request data
            response_data: Response data container
            
        Returns:
            None (doesn't modify response)
        """
        if not self.enabled or not self.log_responses:
            return None
        
        # Process all events from the response
        for event in response_data.events:
            self._process_event(event, request_data, response_data)
        
        return None
    
    def _process_event(self, event: BaseEvent, request_data: LLMRequestData, response_data: Optional[LLMResponseData] = None) -> None:
        """Process a single event and print relevant information.
        
        Args:
            event: The event to process
            request_data: Request data container
            response_data: Response data container (optional)
        """
        if event.name == EventName.SESSION_START and self.show_sessions:
            self._print_session_start_event(event, request_data)
        elif event.name == EventName.LLM_CALL_START:
            self._print_llm_start_event(event, request_data)
        elif event.name == EventName.LLM_CALL_FINISH and response_data:
            self._print_llm_finish_event(event, request_data, response_data)
        elif event.name == EventName.TOOL_RESULT and self.show_tools:
            self._print_tool_result_event(event)
        elif event.name == EventName.TOOL_EXECUTION and self.show_tools:
            self._print_tool_execution_event(event)
        elif event.name == EventName.LLM_CALL_ERROR:
            self._print_llm_error_event(event, request_data)
    
    def _print_session_start_event(self, event: SessionStartEvent, request_data: LLMRequestData) -> None:
        """Print session start event information.
        
        Args:
            event: Session start event
            request_data: Request data with session info
        """
        session_short = event.session_id[:8] if event.session_id else "unknown"
        provider = request_data.provider or "unknown"
        model = request_data.model or "unknown"
        
        print(f"\n🚀 NEW SESSION: {session_short}")
        print(f"   Provider: {provider}")
        print(f"   Model: {model}")
        print(f"   Time: {datetime.now().strftime('%H:%M:%S')}")
        print("   " + "="*50)
    
    def _print_llm_start_event(self, event: LLMCallStartEvent, request_data: LLMRequestData) -> None:
        """Print LLM call start event information.
        
        Args:
            event: LLM call start event
            request_data: Request data container
        """
        session_short = event.session_id[:8] if event.session_id else "unknown"
        method = request_data.request.method
        path = request_data.request.url.path
        
        # Basic request info
        print(f"\n📤 REQUEST [{session_short}]")
        print(f"   {method} {path}")
        
        if request_data.is_streaming:
            print("   🔄 Streaming: Yes")
        
        # Extract request data from event attributes
        request_body = event.attributes.get("llm.request.data", {})
        
        # Print body if enabled
        if self.log_body and request_body:
            self._print_request_body_from_event(request_body)
    
    def _print_llm_finish_event(self, event: LLMCallFinishEvent, request_data: LLMRequestData, response_data: LLMResponseData) -> None:
        """Print LLM call finish event information.
        
        Args:
            event: LLM call finish event
            request_data: Original request data
            response_data: Response data container
        """
        session_short = event.session_id[:8] if event.session_id else "unknown"
        status = response_data.status_code
        duration = event.attributes.get("llm.response.duration_ms", response_data.duration_ms)
        
        # Basic response info
        status_emoji = "✅" if 200 <= status < 300 else "❌"
        print(f"\n📥 RESPONSE [{session_short}] {status_emoji}")
        print(f"   Status: {status}")
        print(f"   Duration: {duration:.0f}ms")
        
        # Print usage if available
        self._print_usage_from_event(event)
        
        # Print response content if enabled
        if self.log_body:
            response_content = event.attributes.get("llm.response.content", [])
            if response_content:
                self._print_response_content_from_event(response_content)
    
    def _print_tool_execution_event(self, event: ToolExecutionEvent) -> None:
        """Print tool execution event information.
        
        Args:
            event: Tool execution event
        """
        tool_name = event.attributes.get("tool.name", "unknown")
        tool_params = event.attributes.get("tool.params", {})
        tool_id = event.span_id[:8]  # Use span ID as short identifier
        
        print(f"   🔧 TOOL USE: {tool_name} [{tool_id}]")
        
        # Print input parameters in a compact format
        if tool_params:
            input_str = ", ".join([f"{k}={v}" for k, v in tool_params.items()])
            print(f"      Input: {input_str}")
        else:
            print(f"      Input: (no parameters)")
    
    def _print_tool_result_event(self, event: ToolResultEvent) -> None:
        """Print tool result event information.
        
        Args:
            event: Tool result event
        """
        tool_name = event.attributes.get("tool.name", "unknown")
        status = event.attributes.get("tool.status", "unknown")
        result = event.attributes.get("tool.result", "")
        error_message = event.attributes.get("error.message")
        tool_id = event.span_id[:8]  # Use span ID as short identifier
        
        status_emoji = "❌" if status == "error" or error_message else "✅"
        print(f"   🔧 TOOL RESULT [{tool_id}] {status_emoji}")
        
        # Print result content (truncated)
        content = error_message if error_message else result
        if content:
            content_preview = str(content)[:100] + "..." if len(str(content)) > 100 else str(content)
            print(f"      Result: {content_preview}")
    
    def _print_llm_error_event(self, event: LLMCallErrorEvent, request_data: LLMRequestData) -> None:
        """Print LLM call error event information.
        
        Args:
            event: LLM call error event
            request_data: Original request data
        """
        session_short = event.session_id[:8] if event.session_id else "unknown"
        error_message = event.attributes.get("error.message", "Unknown error")
        error_type = event.attributes.get("error.type", "Unknown")
        
        print(f"\n❌ ERROR [{session_short}]")
        print(f"   {error_type}: {error_message}")
    
    def _print_usage_from_event(self, event: LLMCallFinishEvent) -> None:
        """Print usage information from LLM finish event.
        
        Args:
            event: LLM call finish event
        """
        input_tokens = event.attributes.get("llm.usage.input_tokens")
        output_tokens = event.attributes.get("llm.usage.output_tokens")
        total_tokens = event.attributes.get("llm.usage.total_tokens")
        
        if input_tokens is not None and output_tokens is not None and total_tokens is not None:
            print(f"   Usage: {input_tokens}+{output_tokens}={total_tokens} tokens")
    
    def _print_request_body_from_event(self, request_body: Dict[str, Any]) -> None:
        """Print request body information from event data.
        
        Args:
            request_body: Request body dictionary from event
        """
        try:
            # Extract and display messages if present
            messages = request_body.get("messages", [])
            if messages:
                print(f"   Messages: {len(messages)}")
                for i, msg in enumerate(messages[-3:], 1):  # Show last 3 messages
                    role = msg.get("role", "unknown")
                    content = msg.get("content", "")
                    if isinstance(content, str):
                        preview = content[:100] + "..." if len(content) > 100 else content
                        print(f"     {i}. {role}: {preview}")
            
            # Show other relevant fields
            model = request_body.get("model")
            if model:
                print(f"   Model: {model}")
            
            max_tokens = request_body.get("max_tokens")
            if max_tokens:
                print(f"   Max tokens: {max_tokens}")
                
        except Exception as e:
            logger.debug(f"Error printing request body from event: {e}")
    
    def _print_response_content_from_event(self, response_content: List[Dict[str, Any]]) -> None:
        """Print response content from event data.
        
        Args:
            response_content: Response content list from event
        """
        try:
            if response_content:
                print(f"   Choices: {len(response_content)}")
                for i, content in enumerate(response_content[:2], 1):  # Show first 2 choices
                    # Handle different content formats
                    text_content = ""
                    if isinstance(content, dict):
                        text_content = content.get("text", content.get("content", ""))
                    elif isinstance(content, str):
                        text_content = content
                    
                    if text_content:
                        preview = text_content[:150] + "..." if len(text_content) > 150 else text_content
                        print(f"     {i}. {preview}")
                        
        except Exception as e:
            logger.debug(f"Error printing response content from event: {e}")
    
    async def on_error(self, request_data: LLMRequestData, error: Exception) -> None:
        """Print error information.
        
        Args:
            request_data: Original request data
            error: The exception that occurred
        """
        if not self.enabled:
            return
        
        # Check if there are error events to process
        error_events = [event for event in request_data.events if event.name == EventName.LLM_CALL_ERROR]
        
        if error_events:
            # Use event system if error events are available
            for event in error_events:
                self._print_llm_error_event(event, request_data)
        else:
            # Fallback to direct error printing
            session_short = request_data.session_id[:8] if request_data.session_id else "unknown"
            print(f"\n❌ ERROR [{session_short}]")
            print(f"   {type(error).__name__}: {str(error)}")