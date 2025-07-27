"""Message logger interceptor for logging LLM conversations."""
import asyncio
import json
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional

from src.proxy.interceptor_base import BaseInterceptor, LLMRequestData, LLMResponseData
from src.utils.logger import get_logger

logger = get_logger(__name__)


class MessageLoggerInterceptor(BaseInterceptor):
    """Interceptor for logging LLM messages to dedicated log files."""
    
    def __init__(self, config: Dict[str, Any]):
        """Initialize message logger interceptor.
        
        Args:
            config: Interceptor configuration
        """
        super().__init__(config)
        self.log_dir = Path(config.get("directory", "./message_logs"))
        self.log_file = config.get("filename", "message_log.jsonl")
        self.include_system_prompts = config.get("include_system_prompts", True)
        self.include_metadata = config.get("include_metadata", True)
        self.buffer_size = config.get("buffer_size", 10)
        
        # Create log directory if it doesn't exist
        self.log_dir.mkdir(parents=True, exist_ok=True)
        self.log_file_path = self.log_dir / self.log_file
        
        # Message buffer for batch writing
        self._message_buffer = []
        self._buffer_lock = asyncio.Lock()
    
    @property
    def name(self) -> str:
        """Return the name of this interceptor."""
        return "message_logger"
    
    async def before_request(self, request_data: LLMRequestData) -> Optional[LLMRequestData]:
        """Log request messages before sending to LLM.
        
        Args:
            request_data: Request data container
            
        Returns:
            None (doesn't modify request)
        """
        if not request_data.body:
            return None
        
        await self._log_request_message(request_data)
        return None
    
    async def after_response(
        self, 
        request_data: LLMRequestData, 
        response_data: LLMResponseData
    ) -> Optional[LLMResponseData]:
        """Log response messages after receiving from LLM.
        
        Args:
            request_data: Original request data
            response_data: Response data container
            
        Returns:
            None (doesn't modify response)
        """
        await self._log_response_message(request_data, response_data)
        return None
    
    async def _log_request_message(self, request_data: LLMRequestData) -> None:
        """Log request message to buffer.
        
        Args:
            request_data: Request data container
        """
        try:
            messages = request_data.body.get("messages", [])
            if not messages:
                return
            
            # Filter messages based on configuration
            filtered_messages = self._filter_messages(messages)
            
            for message in filtered_messages:
                log_entry = {
                    "timestamp": datetime.utcnow().isoformat(),
                    "session_id": request_data.session_id,
                    "direction": "request",
                    "role": message.get("role", "unknown"),
                    "content": message.get("content", ""),
                    "model": request_data.model,
                    "provider": request_data.provider
                }
                
                if self.include_metadata:
                    log_entry["metadata"] = {
                        "path": request_data.request.url.path,
                        "method": request_data.request.method,
                        "is_streaming": request_data.is_streaming,
                        "model_params": self._extract_model_params(request_data.body)
                    }
                
                await self._add_to_buffer(log_entry)
            
        except Exception as e:
            logger.error(f"Error logging request message: {e}", exc_info=True)
    
    async def _log_response_message(
        self, 
        request_data: LLMRequestData, 
        response_data: LLMResponseData
    ) -> None:
        """Log response message to buffer.
        
        Args:
            request_data: Original request data
            response_data: Response data container
        """
        try:
            if not response_data.body:
                return
            
            choices = response_data.body.get("choices", [])
            if not choices:
                return
            
            for i, choice in enumerate(choices):
                message = choice.get("message", {})
                if not message:
                    continue
                
                log_entry = {
                    "timestamp": datetime.utcnow().isoformat(),
                    "session_id": request_data.session_id,
                    "direction": "response",
                    "role": message.get("role", "assistant"),
                    "content": message.get("content", ""),
                    "model": request_data.model,
                    "provider": request_data.provider,
                    "choice_index": i
                }
                
                if self.include_metadata:
                    log_entry["metadata"] = {
                        "status_code": response_data.status_code,
                        "duration_ms": response_data.duration_ms,
                        "finish_reason": choice.get("finish_reason"),
                        "usage": response_data.body.get("usage", {})
                    }
                
                await self._add_to_buffer(log_entry)
            
        except Exception as e:
            logger.error(f"Error logging response message: {e}", exc_info=True)
    
    def _filter_messages(self, messages: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Filter messages based on configuration.
        
        Args:
            messages: List of message dictionaries
            
        Returns:
            Filtered list of messages
        """
        if self.include_system_prompts:
            return messages
        
        return [msg for msg in messages if msg.get("role") != "system"]
    
    def _extract_model_params(self, body: Dict[str, Any]) -> Dict[str, Any]:
        """Extract relevant model parameters from request body.
        
        Args:
            body: Request body dictionary
            
        Returns:
            Dictionary of model parameters
        """
        params = {}
        
        # Common parameters to extract
        param_keys = [
            "temperature", "max_tokens", "top_p", "frequency_penalty", 
            "presence_penalty", "stop", "stream"
        ]
        
        for key in param_keys:
            if key in body:
                params[key] = body[key]
        
        return params
    
    async def _add_to_buffer(self, log_entry: Dict[str, Any]) -> None:
        """Add log entry to buffer and flush if needed.
        
        Args:
            log_entry: Log entry dictionary
        """
        async with self._buffer_lock:
            self._message_buffer.append(log_entry)
            
            if len(self._message_buffer) >= self.buffer_size:
                await self._flush_buffer()
    
    async def _flush_buffer(self) -> None:
        """Flush message buffer to file."""
        if not self._message_buffer:
            return
        
        try:
            with open(self.log_file_path, "a", encoding="utf-8") as f:
                for entry in self._message_buffer:
                    f.write(json.dumps(entry, ensure_ascii=False) + "\n")
            
            logger.debug(f"Flushed {len(self._message_buffer)} messages to {self.log_file_path}")
            self._message_buffer.clear()
            
        except Exception as e:
            logger.error(f"Error flushing message buffer: {e}", exc_info=True)
    
    async def close(self) -> None:
        """Close interceptor and flush remaining buffer."""
        async with self._buffer_lock:
            await self._flush_buffer()
    
    async def on_error(self, request_data: LLMRequestData, error: Exception) -> None:
        """Log error information.
        
        Args:
            request_data: Original request data
            error: The exception that occurred
        """
        try:
            log_entry = {
                "timestamp": datetime.utcnow().isoformat(),
                "session_id": request_data.session_id,
                "direction": "error",
                "error_type": type(error).__name__,
                "error_message": str(error),
                "model": request_data.model,
                "provider": request_data.provider
            }
            
            if self.include_metadata:
                log_entry["metadata"] = {
                    "path": request_data.request.url.path,
                    "method": request_data.request.method
                }
            
            await self._add_to_buffer(log_entry)
            
        except Exception as e:
            logger.error(f"Error logging error message: {e}", exc_info=True)