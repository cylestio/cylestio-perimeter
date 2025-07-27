"""Event manager for processing and storing events."""
import asyncio
import json
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional

from src.models.events import BaseEvent, EventData
from src.utils.logger import get_logger

logger = get_logger(__name__)


class EventManager:
    """Manages event processing and storage."""
    
    def __init__(self, config: Optional[Dict[str, Any]] = None):
        """Initialize event manager.
        
        Args:
            config: Event manager configuration
        """
        self.config = config or {}
        self.enabled = self.config.get("enabled", True)
        self.storage_dir = Path(self.config.get("directory", "./events"))
        self.max_file_size = self.config.get("max_file_size", 1048576)  # 1MB
        self.event_filters = self.config.get("event_filters", [])
        
        # Event queue and task - will be initialized when needed
        self._event_queue: Optional[asyncio.Queue] = None
        self._processing_task: Optional[asyncio.Task] = None
        
        # Create storage directory
        if self.enabled:
            self.storage_dir.mkdir(parents=True, exist_ok=True)
    
    def _ensure_initialized(self):
        """Ensure async components are initialized."""
        if self._event_queue is None:
            self._event_queue = asyncio.Queue()
        
        if self._processing_task is None or self._processing_task.done():
            self._processing_task = asyncio.create_task(self._process_events())
    
    async def emit(self, event: BaseEvent) -> None:
        """Emit an event for processing.
        
        Args:
            event: Event to emit
        """
        if not self.enabled:
            return
        
        # Apply filters
        if self._should_filter_event(event):
            return
        
        # Ensure async components are initialized
        self._ensure_initialized()
        
        # Add to queue for async processing
        await self._event_queue.put(event)
    
    async def emit_multiple(self, events: List[BaseEvent]) -> None:
        """Emit multiple events at once.
        
        Args:
            events: List of events to emit
        """
        for event in events:
            await self.emit(event)
    
    async def flush(self) -> None:
        """Flush all pending events."""
        if not self.enabled or self._event_queue is None:
            return
        
        # Wait for queue to be empty
        await self._event_queue.join()
    
    async def close(self) -> None:
        """Close event manager and cleanup."""
        if self._processing_task:
            self._processing_task.cancel()
            try:
                await self._processing_task
            except asyncio.CancelledError:
                pass
        
        await self.flush()
    
    async def _process_events(self) -> None:
        """Background task to process events."""
        try:
            while True:
                event = await self._event_queue.get()
                try:
                    await self._handle_event(event)
                except Exception as e:
                    logger.error(f"Failed to process event {event.event_type}: {e}", exc_info=True)
                finally:
                    self._event_queue.task_done()
        except asyncio.CancelledError:
            logger.debug("Event processing task cancelled")
    
    async def _handle_event(self, event: BaseEvent) -> None:
        """Handle a single event.
        
        Args:
            event: Event to handle
        """
        # Store to file
        await self._store_event(event)
        
        # Log event if configured
        if self.config.get("log_events", False):
            logger.info(f"Event: {event.event_type}", extra=event.model_dump())
    
    async def _store_event(self, event: BaseEvent) -> None:
        """Store event to file.
        
        Args:
            event: Event to store
        """
        try:
            # Generate filename with timestamp and event type
            timestamp = event.timestamp.strftime("%Y-%m-%dT%H-%M-%S-%f")[:-3] + "Z"
            filename = f"event-{event.event_type.value}-{timestamp}.json"
            filepath = self.storage_dir / filename
            
            # Convert event to dict for storage
            event_dict = event.model_dump()
            # Convert datetime to ISO format
            event_dict["timestamp"] = event.timestamp.isoformat()
            
            # Create event data wrapper
            event_data = EventData(
                events=[event],
                metadata={
                    "storage_version": "1.0",
                    "created_at": datetime.utcnow().isoformat()
                }
            )
            
            # Write to file asynchronously
            await asyncio.get_event_loop().run_in_executor(
                None,
                lambda: filepath.write_text(json.dumps(event_data.to_file_dict(), indent=2))
            )
            
            logger.debug(f"Event stored: {filename}")
            
        except Exception as e:
            logger.error(f"Failed to store event: {e}", exc_info=True)
    
    def _should_filter_event(self, event: BaseEvent) -> bool:
        """Check if event should be filtered out.
        
        Args:
            event: Event to check
            
        Returns:
            True if event should be filtered
        """
        if not self.event_filters:
            return False
        
        # Check if event type is in filter list
        event_type_str = event.event_type.value
        
        # Support include/exclude patterns
        include_filters = [f for f in self.event_filters if not f.startswith("!")]
        exclude_filters = [f[1:] for f in self.event_filters if f.startswith("!")]
        
        # If include filters exist, event must match one
        if include_filters:
            if not any(pattern in event_type_str for pattern in include_filters):
                return True
        
        # If exclude filters exist, event must not match any
        if exclude_filters:
            if any(pattern in event_type_str for pattern in exclude_filters):
                return True
        
        return False


# Global instance
event_manager = EventManager()