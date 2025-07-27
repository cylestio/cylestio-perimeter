"""Printer interceptor for displaying request/response information."""
import json
from datetime import datetime
from typing import Any, Dict, Optional

from src.proxy.interceptor_base import BaseInterceptor, LLMRequestData, LLMResponseData
from src.utils.logger import get_logger

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
        if not self.log_requests:
            return None
        
        # Print new session header if this is a new session
        if request_data.is_new_session and self.show_sessions:
            self._print_new_session(request_data)
        
        # Print request info
        self._print_request(request_data)
        
        # Print tool results if present
        if request_data.has_tool_results and self.show_tools:
            self._print_tool_results(request_data)
        
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
        if not self.log_responses:
            return None
        
        self._print_response(request_data, response_data)
        
        # Print tool uses if present
        if response_data.has_tool_requests and self.show_tools:
            self._print_tool_uses(response_data)
        
        return None
    
    def _print_new_session(self, request_data: LLMRequestData) -> None:
        """Print new session header.
        
        Args:
            request_data: Request data with session info
        """
        if not self.show_sessions:
            return
        
        session_short = request_data.session_id[:8] if request_data.session_id else "unknown"
        provider = request_data.provider or "unknown"
        model = request_data.model or "unknown"
        
        print(f"\n🚀 NEW SESSION: {session_short}")
        print(f"   Provider: {provider}")
        print(f"   Model: {model}")
        print(f"   Time: {datetime.now().strftime('%H:%M:%S')}")
        print("   " + "="*50)
    
    def _print_request(self, request_data: LLMRequestData) -> None:
        """Print request information.
        
        Args:
            request_data: Request data container
        """
        session_short = request_data.session_id[:8] if request_data.session_id else "unknown"
        method = request_data.request.method
        path = request_data.request.url.path
        
        # Basic request info
        print(f"\n📤 REQUEST [{session_short}]")
        print(f"   {method} {path}")
        
        if request_data.is_streaming:
            print("   🔄 Streaming: Yes")
        
        # Print body if enabled
        if self.log_body and request_data.body:
            self._print_request_body(request_data.body)
    
    def _print_response(self, request_data: LLMRequestData, response_data: LLMResponseData) -> None:
        """Print response information.
        
        Args:
            request_data: Original request data
            response_data: Response data container
        """
        session_short = request_data.session_id[:8] if request_data.session_id else "unknown"
        status = response_data.status_code
        duration = response_data.duration_ms
        
        # Basic response info
        status_emoji = "✅" if 200 <= status < 300 else "❌"
        print(f"\n📥 RESPONSE [{session_short}] {status_emoji}")
        print(f"   Status: {status}")
        print(f"   Duration: {duration:.0f}ms")
        
        # Print body if enabled
        if self.log_body and response_data.body:
            self._print_response_body(response_data.body)
    
    def _print_request_body(self, body: Dict[str, Any]) -> None:
        """Print request body with formatting.
        
        Args:
            body: Request body dictionary
        """
        try:
            # Extract and display messages if present
            messages = body.get("messages", [])
            if messages:
                print(f"   Messages: {len(messages)}")
                for i, msg in enumerate(messages[-3:], 1):  # Show last 3 messages
                    role = msg.get("role", "unknown")
                    content = msg.get("content", "")
                    if isinstance(content, str):
                        preview = content[:100] + "..." if len(content) > 100 else content
                        print(f"     {i}. {role}: {preview}")
            
            # Show other relevant fields
            model = body.get("model")
            if model:
                print(f"   Model: {model}")
            
            max_tokens = body.get("max_tokens")
            if max_tokens:
                print(f"   Max tokens: {max_tokens}")
                
        except Exception as e:
            logger.debug(f"Error printing request body: {e}")
    
    def _print_response_body(self, body: Dict[str, Any]) -> None:
        """Print response body with formatting.
        
        Args:
            body: Response body dictionary
        """
        try:
            # Extract choices if present
            choices = body.get("choices", [])
            if choices:
                print(f"   Choices: {len(choices)}")
                for i, choice in enumerate(choices[:2], 1):  # Show first 2 choices
                    message = choice.get("message", {})
                    content = message.get("content", "")
                    if content:
                        preview = content[:150] + "..." if len(content) > 150 else content
                        print(f"     {i}. {preview}")
            
            # Show usage if present
            usage = body.get("usage", {})
            if usage:
                prompt_tokens = usage.get("prompt_tokens", 0)
                completion_tokens = usage.get("completion_tokens", 0)
                total_tokens = usage.get("total_tokens", 0)
                print(f"   Usage: {prompt_tokens}+{completion_tokens}={total_tokens} tokens")
                
        except Exception as e:
            logger.debug(f"Error printing response body: {e}")
    
    def _print_tool_uses(self, response_data: LLMResponseData) -> None:
        """Print tool uses from LLM response.
        
        Args:
            response_data: Response data container
        """
        try:
            for tool_use in response_data.tool_uses_request:
                tool_name = tool_use.get("name", "unknown")
                tool_id = tool_use.get("id", "")[:8]  # Short ID
                tool_input = tool_use.get("input", {})
                
                print(f"   🔧 TOOL USE: {tool_name} [{tool_id}]")
                
                # Print input parameters in a compact format
                if tool_input:
                    input_str = ", ".join([f"{k}={v}" for k, v in tool_input.items()])
                    print(f"      Input: {input_str}")
                    
        except Exception as e:
            logger.debug(f"Error printing tool uses: {e}")
    
    def _print_tool_results(self, request_data: LLMRequestData) -> None:
        """Print tool results from user request.
        
        Args:
            request_data: Request data container
        """
        try:
            for tool_result in request_data.tool_results:
                tool_id = tool_result.get("tool_use_id", "")[:8]  # Short ID
                content = tool_result.get("content", "")
                is_error = tool_result.get("is_error", False)
                
                status_emoji = "❌" if is_error else "✅"
                print(f"   🔧 TOOL RESULT [{tool_id}] {status_emoji}")
                
                # Print result content (truncated)
                if content:
                    content_preview = str(content)[:100] + "..." if len(str(content)) > 100 else str(content)
                    print(f"      Result: {content_preview}")
                    
        except Exception as e:
            logger.debug(f"Error printing tool results: {e}")
    
    async def on_error(self, request_data: LLMRequestData, error: Exception) -> None:
        """Print error information.
        
        Args:
            request_data: Original request data
            error: The exception that occurred
        """
        session_short = request_data.session_id[:8] if request_data.session_id else "unknown"
        print(f"\n❌ ERROR [{session_short}]")
        print(f"   {type(error).__name__}: {str(error)}")