"""Service for reading and parsing recorded HTTP traffic files."""

import asyncio
import json
from pathlib import Path
from typing import Any, Dict, List, Optional, AsyncIterator

from src.utils.logger import get_logger

logger = get_logger(__name__)


class RecordedEvent:
    """Container for a single recorded event."""

    def __init__(self, event_data: Dict[str, Any]):
        self.type = event_data.get("type")
        self.timestamp = event_data.get("timestamp")
        self.data = event_data

    @property
    def is_request(self) -> bool:
        return self.type == "request"

    @property
    def is_response(self) -> bool:
        return self.type == "response"

    @property
    def is_error(self) -> bool:
        return self.type == "error"


class RequestResponsePair:
    """Container for a paired request and response."""

    def __init__(self, request_event: RecordedEvent, response_event: Optional[RecordedEvent] = None, error_event: Optional[RecordedEvent] = None):
        self.request = request_event
        self.response = response_event
        self.error = error_event

    @property
    def has_response(self) -> bool:
        return self.response is not None

    @property
    def has_error(self) -> bool:
        return self.error is not None


class ReplayService:
    """Service for reading and parsing recorded HTTP traffic for replay."""

    def __init__(self):
        """Initialize replay service."""
        pass

    def read_recordings(self, input_path: str) -> List[RequestResponsePair]:
        """Read all recording files from input path and return paired request/responses.

        Args:
            input_path: Path to recording file or directory

        Returns:
            List of request/response pairs
        """
        path = Path(input_path)

        if not path.exists():
            raise ValueError(f"Input path does not exist: {input_path}")

        # Get all recording files
        if path.is_file():
            if path.suffix != '.jsonl':
                raise ValueError(f"Input file must be a .jsonl file: {input_path}")
            files = [path]
        else:
            files = list(path.glob("recording_*.jsonl"))
            if not files:
                raise ValueError(f"No recording files found in directory: {input_path}")
            files.sort()  # Process in order

        logger.info(f"Found {len(files)} recording files to replay")

        # Read all events from all files
        all_events = []
        for file_path in files:
            events = self._read_events_from_file(file_path)
            all_events.extend(events)
            logger.info(f"Read {len(events)} events from {file_path}")

        logger.info(f"Total events loaded: {len(all_events)}")

        # Pair requests with responses
        pairs = self._pair_requests_with_responses(all_events)
        logger.info(f"Created {len(pairs)} request/response pairs")

        return pairs

    def _read_events_from_file(self, file_path: Path) -> List[RecordedEvent]:
        """Read events from a single JSONL file.

        Args:
            file_path: Path to the JSONL file

        Returns:
            List of recorded events
        """
        events = []

        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                for line_num, line in enumerate(f, 1):
                    line = line.strip()
                    if not line:
                        continue

                    try:
                        event_data = json.loads(line)
                        events.append(RecordedEvent(event_data))
                    except json.JSONDecodeError as e:
                        logger.warning(f"Failed to parse line {line_num} in {file_path}: {e}")
                        continue

        except Exception as e:
            logger.error(f"Error reading file {file_path}: {e}")
            raise

        return events

    def _pair_requests_with_responses(self, events: List[RecordedEvent]) -> List[RequestResponsePair]:
        """Pair requests with their corresponding responses.

        Simple approach: assumes requests and responses are in sequential order.
        Each request is followed by either a response or an error.

        Args:
            events: List of all events in chronological order

        Returns:
            List of request/response pairs
        """
        pairs = []
        i = 0

        while i < len(events):
            event = events[i]

            if event.is_request:
                pair = RequestResponsePair(event)

                # Look for the next response or error
                j = i + 1
                while j < len(events):
                    next_event = events[j]

                    if next_event.is_response:
                        pair.response = next_event
                        break
                    elif next_event.is_error:
                        pair.error = next_event
                        break
                    elif next_event.is_request:
                        # Found another request before response, this request had no response
                        logger.warning(f"Request at position {i} has no corresponding response")
                        break

                    j += 1

                pairs.append(pair)
                # Move to the position after the response/error (or current position if no response found)
                i = j if j < len(events) and not events[j].is_request else i + 1
            else:
                # Skip non-request events that aren't paired
                logger.debug(f"Skipping non-request event: {event.type}")
                i += 1

        return pairs

    async def replay_with_delay(self, pairs: List[RequestResponsePair], delay_seconds: float = 0.0) -> AsyncIterator[RequestResponsePair]:
        """Replay request/response pairs with optional delay between them.

        Args:
            pairs: List of request/response pairs to replay
            delay_seconds: Delay between requests in seconds

        Yields:
            Request/response pairs for processing
        """
        logger.info(f"Starting replay of {len(pairs)} pairs with {delay_seconds}s delay")

        for i, pair in enumerate(pairs, 1):
            logger.info(f"Replaying pair {i}/{len(pairs)}")

            # Apply delay before processing (except for the first request)
            if i > 1 and delay_seconds > 0:
                logger.debug(f"Applying {delay_seconds}s delay")
                await asyncio.sleep(delay_seconds)

            # Yield the pair for processing
            yield pair