"""Event recorder interceptor for saving raw events to disk."""
import json
import os
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional

from src.proxy.interceptor_base import BaseInterceptor, LLMRequestData, LLMResponseData
from src.utils.logger import get_logger
from src.events import BaseEvent

logger = get_logger(__name__)


class EventRecorderInterceptor(BaseInterceptor):
    """Interceptor for recording raw events to disk, organized by session."""
    
    def __init__(self, config: Dict[str, Any]):
        """Initialize event recorder interceptor.
        
        Args:
            config: Interceptor configuration with the following options:
                - output_dir: Directory to save event files (default: "./event_logs")
                - file_format: File format, either "json" or "jsonl" (default: "jsonl")
                - pretty_print: Whether to pretty-print JSON (default: False, only applies to "json" format)
                - include_metadata: Whether to include file metadata (default: True)
        """
        super().__init__(config)
        self.output_dir = Path(config.get("output_dir", "./event_logs"))
        self.file_format = config.get("file_format", "jsonl")  # "json" or "jsonl"
        self.pretty_print = config.get("pretty_print", False)
        self.include_metadata = config.get("include_metadata", True)
        
        # Validate file format
        if self.file_format not in ["json", "jsonl"]:
            raise ValueError(f"Invalid file_format '{self.file_format}'. Must be 'json' or 'jsonl'")
        
        # Create output directory if it doesn't exist
        if self.enabled:
            self.output_dir.mkdir(parents=True, exist_ok=True)
            logger.info(f"Event recorder initialized. Output directory: {self.output_dir}")
    
    @property
    def name(self) -> str:
        """Return the name of this interceptor."""
        return "event_recorder"
    
    async def before_request(self, request_data: LLMRequestData) -> Optional[LLMRequestData]:
        """Record events from the request.
        
        Args:
            request_data: Request data container
            
        Returns:
            None (doesn't modify request)
        """
        if not self.enabled:
            return None
        
        # Process all events from the request
        try:
            logger.debug(f"EventRecorder.before_request: session_id={request_data.session_id}, events={len(request_data.events)}")
        except Exception:
            pass
        for event in request_data.events:
            await self._record_event(event, request_data.session_id)
        
        return None
    
    async def after_response(
        self, 
        request_data: LLMRequestData, 
        response_data: LLMResponseData
    ) -> Optional[LLMResponseData]:
        """Record events from the response.
        
        Args:
            request_data: Original request data
            response_data: Response data container
            
        Returns:
            None (doesn't modify response)
        """
        if not self.enabled:
            return None
        
        # Process all events from the response
        try:
            logger.debug(
                f"EventRecorder.after_response: session_id={response_data.session_id or request_data.session_id}, events={len(response_data.events)}"
            )
        except Exception:
            pass
        for event in response_data.events:
            await self._record_event(event, response_data.session_id or request_data.session_id)
        
        return None
    
    async def on_error(self, request_data: LLMRequestData, error: Exception) -> None:
        """Record error events if any are present.
        
        Args:
            request_data: Original request data
            error: The exception that occurred
        """
        if not self.enabled:
            return
        
        # Record any error events that might be present in the request data
        for event in request_data.events:
            if event.name.value.endswith(".error"):
                await self._record_event(event, request_data.session_id)
    
    async def _record_event(self, event: BaseEvent, session_id: Optional[str]) -> None:
        """Record a single event to the appropriate session file.
        
        Args:
            event: The event to record
            session_id: Session identifier (falls back to event's session_id if None)
        """
        try:
            # Use session_id from parameter or fall back to event's session_id
            effective_session_id = session_id or event.session_id or "unknown"
            
            # Get the file path for this session
            file_path = self._get_session_file_path(effective_session_id)
            
            # Convert event to dictionary
            event_data = event.model_dump()
            
            # Record the event based on file format
            if self.file_format == "jsonl":
                await self._append_jsonl_event(file_path, event_data)
            else:  # json
                await self._append_json_event(file_path, event_data, effective_session_id)
                
        except Exception as e:
            logger.error(f"Failed to record event: {e}")
    
    def _get_session_file_path(self, session_id: str) -> Path:
        """Get the file path for a given session.
        
        Args:
            session_id: Session identifier
            
        Returns:
            Path to the session file
        """
        # Sanitize session ID for filename
        safe_session_id = "".join(c for c in session_id if c.isalnum() or c in ('-', '_'))
        if not safe_session_id:
            safe_session_id = "unknown"
        
        # Create filename with session ID and extension
        extension = "jsonl" if self.file_format == "jsonl" else "json"
        filename = f"session_{safe_session_id}.{extension}"
        
        return self.output_dir / filename
    
    async def _append_jsonl_event(self, file_path: Path, event_data: Dict[str, Any]) -> None:
        """Append an event to a JSONL file.
        
        Args:
            file_path: Path to the JSONL file
            event_data: Event data dictionary
        """
        # Create metadata on first write
        if not file_path.exists() and self.include_metadata:
            metadata = {
                "_metadata": {
                    "format": "jsonl",
                    "session_id": event_data.get("session_id"),
                    "created_at": datetime.now().isoformat(),
                    "interceptor": self.name
                }
            }
            
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(json.dumps(metadata, ensure_ascii=False) + '\n')
        
        # Append the event
        with open(file_path, 'a', encoding='utf-8') as f:
            f.write(json.dumps(event_data, ensure_ascii=False) + '\n')
    
    async def _append_json_event(self, file_path: Path, event_data: Dict[str, Any], session_id: str) -> None:
        """Append an event to a JSON file (maintaining a list of events).
        
        Args:
            file_path: Path to the JSON file
            event_data: Event data dictionary
            session_id: Session identifier
        """
        # Read existing data or create new structure
        if file_path.exists():
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
            except (json.JSONDecodeError, OSError) as e:
                logger.error(f"Failed to read existing file {file_path}: {e}")
                data = self._create_json_structure(session_id)
        else:
            data = self._create_json_structure(session_id)
        
        # Append the new event
        data["events"].append(event_data)
        data["metadata"]["events_count"] = len(data["events"])
        data["metadata"]["last_updated"] = datetime.now().isoformat()
        
        # Write the updated data
        try:
            with open(file_path, 'w', encoding='utf-8') as f:
                if self.pretty_print:
                    json.dump(data, f, ensure_ascii=False, indent=2)
                else:
                    json.dump(data, f, ensure_ascii=False)
        except OSError as e:
            logger.error(f"Failed to write to file {file_path}: {e}")
    
    def _create_json_structure(self, session_id: str) -> Dict[str, Any]:
        """Create the initial JSON structure for a session file.
        
        Args:
            session_id: Session identifier
            
        Returns:
            Initial JSON structure
        """
        structure = {
            "events": []
        }
        
        if self.include_metadata:
            structure["metadata"] = {
                "format": "json",
                "session_id": session_id,
                "created_at": datetime.now().isoformat(),
                "last_updated": datetime.now().isoformat(),
                "events_count": 0,
                "interceptor": self.name
            }
        
        return structure
