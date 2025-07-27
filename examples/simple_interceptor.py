"""Example of creating a simple custom interceptor."""
from typing import Any, Dict, Optional

from src.proxy.interceptor_base import BaseInterceptor, LLMRequestData, LLMResponseData


class SimpleLoggingInterceptor(BaseInterceptor):
    """A simple interceptor that logs basic request/response info."""
    
    @property
    def name(self) -> str:
        return "simple_logger"
    
    async def before_request(self, request_data: LLMRequestData) -> Optional[LLMRequestData]:
        """Log basic request info."""
        print(f"🔵 Request to {request_data.provider} ({request_data.model})")
        
        if request_data.body and "messages" in request_data.body:
            msg_count = len(request_data.body["messages"])
            print(f"   Messages: {msg_count}")
        
        # You could modify the request here if needed
        # For example, add metadata:
        request_data.metadata["custom_field"] = "example_value"
        
        return request_data  # Return modified data
    
    async def after_response(
        self, 
        request_data: LLMRequestData, 
        response_data: LLMResponseData
    ) -> Optional[LLMResponseData]:
        """Log basic response info."""
        print(f"🟢 Response from {request_data.provider} ({response_data.duration_ms:.0f}ms)")
        
        if response_data.body and "usage" in response_data.body:
            usage = response_data.body["usage"]
            tokens = usage.get("total_tokens", 0)
            print(f"   Tokens used: {tokens}")
        
        # You could modify the response here if needed
        # For example, add custom headers:
        response_data.response.headers["X-Custom-Header"] = "processed"
        
        return response_data  # Return modified data
    
    async def on_error(self, request_data: LLMRequestData, error: Exception) -> None:
        """Log error info."""
        print(f"🔴 Error: {type(error).__name__} - {str(error)}")


# Example usage:
if __name__ == "__main__":
    # To use this interceptor, you would:
    # 1. Register it with the interceptor manager
    # 2. Add it to your configuration
    
    config = {
        "enabled": True,
        "custom_setting": "example"
    }
    
    interceptor = SimpleLoggingInterceptor(config)
    print(f"Created interceptor: {interceptor.name}")
    print(f"Enabled: {interceptor.enabled}")