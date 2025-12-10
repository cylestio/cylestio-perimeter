"""PII detection and analysis using Microsoft Presidio."""
import logging
from collections import Counter, defaultdict
from typing import Any, Dict, List, Optional, Tuple

from .models import PIIAnalysisResult, PIIFinding
from ..store.store import SessionData

logger = logging.getLogger(__name__)

# Default entity types to detect
DEFAULT_ENTITY_TYPES = [
    # Global entities
    "PERSON",
    "EMAIL_ADDRESS",
    "PHONE_NUMBER",
    "LOCATION",
    "URL",
    "IP_ADDRESS",
    "CREDIT_CARD",
    "CRYPTO",
    "IBAN_CODE",
    "MEDICAL_LICENSE",
    # US-specific
    "US_SSN",
    "US_PASSPORT",
    "US_DRIVER_LICENSE",
    "US_BANK_NUMBER",
]

# Confidence thresholds
HIGH_CONFIDENCE_THRESHOLD = 0.8
MEDIUM_CONFIDENCE_THRESHOLD = 0.5

# Maximum findings to store in detailed results
MAX_DETAILED_FINDINGS = 50

# SpaCy model to use for PII detection
SPACY_MODEL = "en_core_web_md"


def is_pii_available() -> Tuple[bool, Optional[str]]:
    """Check if PII analysis is available by checking model download status.
    
    Returns:
        Tuple of (is_available, disabled_reason)
        - (True, None) if PII analysis is available
        - (False, reason_string) if PII analysis is disabled or downloading
    """
    from ..model_downloader import get_model_status
    
    status, error = get_model_status()
    
    if status == "available":
        # Also verify Presidio is installed
        try:
            from presidio_analyzer import AnalyzerEngine
            logger.debug("PII analysis is available")
            return (True, None)
        except ImportError as e:
            reason = f"Presidio library not installed: {e}"
            logger.warning(f"PII analysis disabled: {reason}")
            return (False, reason)
    elif status == "downloading":
        return (False, "Language model download in progress")
    else:  # unavailable
        return (False, error or "Language model download failed")


def ensure_spacy_model(model_name: str = SPACY_MODEL) -> Optional[Any]:
    """Try to load spaCy model if available.
    
    Args:
        model_name: Name of the spaCy model to load
        
    Returns:
        Loaded spaCy model, or None if not available
    """
    # Import spaCy only when needed (defer heavy import)
    try:
        import spacy
        logger.debug("Attempting to load spaCy model: %s", model_name)
        return spacy.load(model_name)
    except (OSError, ImportError) as exc:
        logger.warning("SpaCy model '%s' not available: %s", model_name, exc)
        logger.warning("Model will be downloaded in the background when live trace starts")
        return None


class PresidioAnalyzer:
    """Wrapper for Microsoft Presidio Analyzer with lazy initialization."""

    _instance = None
    _analyzer = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def get_analyzer(self) -> Any:
        """Get or create the Presidio analyzer instance.
        
        Automatically downloads en_core_web_md spaCy model if not present.
        
        Returns:
            Initialized AnalyzerEngine instance
            
        Raises:
            ImportError: If presidio_analyzer cannot be imported
            Exception: If analyzer initialization fails
        """
        if self._analyzer is None:
            try:
                from presidio_analyzer import AnalyzerEngine
                from presidio_analyzer.nlp_engine import NlpEngineProvider
                
                # Ensure the spaCy model is available
                logger.info("Loading spaCy model: %s", SPACY_MODEL)
                model = ensure_spacy_model(SPACY_MODEL)
                if model is None:
                    raise RuntimeError(f"SpaCy model '{SPACY_MODEL}' not installed")
                
                # Configure Presidio with our model and suppress unwanted entity warnings
                nlp_configuration = {
                    "nlp_engine_name": "spacy",
                    "models": [{
                        "lang_code": "en",
                        "model_name": SPACY_MODEL,
                    }],
                    "ner_model_configuration": {
                        "labels_to_ignore": [
                            "CARDINAL",
                            "ORDINAL",
                            "QUANTITY",
                            "MONEY",
                            "PERCENT",
                            "WORK_OF_ART",
                            "DATE",
                            "TIME",
                            "EVENT",
                            "FAC",
                            "LANGUAGE",
                            "LAW",
                            "PRODUCT",
                            "NORP",
                        ]
                    },
                }
                
                provider = NlpEngineProvider(nlp_configuration=nlp_configuration)
                nlp_engine = provider.create_engine()

                # Only support English to avoid warnings about non-English recognizers
                self._analyzer = AnalyzerEngine(
                    nlp_engine=nlp_engine,
                    supported_languages=["en"]
                )
                logger.info("Presidio AnalyzerEngine initialized with %s", SPACY_MODEL)
                
            except ImportError as e:
                logger.error(f"Failed to import presidio_analyzer: {e}")
                logger.error("Install with: pip install presidio-analyzer spacy")
                raise
            except Exception as e:
                logger.error(f"Failed to initialize Presidio AnalyzerEngine: {e}")
                raise
        return self._analyzer


def extract_text_from_message(message: Dict[str, Any]) -> str:
    """Extract text content from a message object.

    Args:
        message: Message dictionary with 'role' and 'content'

    Returns:
        Concatenated text content
    """
    content = message.get("content", "")

    # Handle string content
    if isinstance(content, str):
        return content

    # Handle list of content blocks (multimodal messages)
    if isinstance(content, list):
        text_parts = []
        for block in content:
            if isinstance(block, dict) and block.get("type") == "text":
                text_parts.append(block.get("text", ""))
            elif isinstance(block, str):
                text_parts.append(block)
        return " ".join(text_parts)

    return ""


def extract_message_content(sessions: List[SessionData]) -> List[Tuple[str, str, str]]:
    """Extract all text content from LLM messages across sessions.

    Args:
        sessions: List of SessionData objects

    Returns:
        List of (session_id, location, text) tuples where location is one of:
        - "user_message"
        - "assistant_message"
        - "system_prompt"
        - "tool_input"
    """
    content_items = []

    for session in sessions:
        for event in session.events:
            event_name = event.name.value

            # Extract from LLM call start events
            if event_name == "llm.call.start":
                request_data = event.attributes.get("llm.request.data", {})

                # Extract system prompt
                system = request_data.get("system", "")
                if system and isinstance(system, str):
                    content_items.append((session.session_id, "system_prompt", system))

                # Extract messages
                messages = request_data.get("messages", [])
                for message in messages:
                    if not isinstance(message, dict):
                        continue

                    role = message.get("role", "")
                    text = extract_text_from_message(message)

                    if text:
                        if role == "user":
                            content_items.append((session.session_id, "user_message", text))
                        elif role == "assistant":
                            content_items.append((session.session_id, "assistant_message", text))
                        elif role == "system":
                            content_items.append((session.session_id, "system_prompt", text))

            # Extract from tool execution events
            elif event_name == "tool.execution":
                tool_input = event.attributes.get("tool.input", "")
                if tool_input and isinstance(tool_input, str):
                    content_items.append((session.session_id, "tool_input", tool_input))

    return content_items


def analyze_pii(
    text: str,
    entities: Optional[List[str]] = None,
    language: str = "en",
    threshold: float = MEDIUM_CONFIDENCE_THRESHOLD
) -> List[Any]:
    """Analyze text for PII using Presidio.

    Args:
        text: Text to analyze
        entities: List of entity types to detect (None = all)
        language: Language code
        threshold: Minimum confidence score

    Returns:
        List of RecognizerResult objects from Presidio
    """
    if not text or not text.strip():
        return []

    try:
        analyzer = PresidioAnalyzer().get_analyzer()
        results = analyzer.analyze(
            text=text,
            entities=entities or DEFAULT_ENTITY_TYPES,
            language=language,
            score_threshold=threshold
        )
        return results
    except Exception as e:
        logger.error(f"PII analysis failed: {e}")
        return []


def analyze_sessions_for_pii(
    sessions: List[SessionData],
    entities: Optional[List[str]] = None,
    threshold: float = MEDIUM_CONFIDENCE_THRESHOLD,
    enable_presidio: bool = True
) -> PIIAnalysisResult:
    """Analyze all sessions for PII content.

    Args:
        sessions: List of SessionData objects
        entities: Entity types to detect (None = default set)
        threshold: Minimum confidence score
        enable_presidio: Enable PII detection using Presidio (default: True)

    Returns:
        PIIAnalysisResult with aggregated findings (or disabled result if unavailable)
    """
    # Check if PII analysis is disabled by configuration
    if not enable_presidio:
        logger.info("PII analysis disabled by configuration (enable_presidio: false)")
        return PIIAnalysisResult(
            total_findings=0,
            sessions_without_pii=len(sessions) if sessions else 0,
            disabled=True,
            disabled_reason="PII analysis disabled by configuration (enable_presidio: false)"
        )
    
    # Check if PII analysis is available
    available, disabled_reason = is_pii_available()
    if not available:
        logger.warning(f"PII analysis disabled: {disabled_reason}")
        return PIIAnalysisResult(
            total_findings=0,
            sessions_without_pii=len(sessions) if sessions else 0,
            disabled=True,
            disabled_reason=disabled_reason
        )
    
    if not sessions:
        return PIIAnalysisResult(
            total_findings=0,
            sessions_without_pii=0
        )

    # Extract all content
    content_items = extract_message_content(sessions)

    # Analyze each content item
    all_findings: List[PIIFinding] = []
    findings_by_session: Dict[str, int] = defaultdict(int)
    findings_by_type: Dict[str, int] = defaultdict(int)

    high_confidence = 0
    medium_confidence = 0
    low_confidence = 0

    for session_id, location, text in content_items:
        results = analyze_pii(text, entities=entities, threshold=threshold)

        for result in results:
            # Extract the actual PII text
            pii_text = text[result.start:result.end]

            # Create finding
            finding = PIIFinding(
                entity_type=result.entity_type,
                text=pii_text,
                start=result.start,
                end=result.end,
                score=result.score,
                session_id=session_id,
                event_location=location
            )

            all_findings.append(finding)
            findings_by_session[session_id] += 1
            findings_by_type[result.entity_type] += 1

            # Track confidence levels
            if result.score >= HIGH_CONFIDENCE_THRESHOLD:
                high_confidence += 1
            elif result.score >= MEDIUM_CONFIDENCE_THRESHOLD:
                medium_confidence += 1
            else:
                low_confidence += 1

    # Calculate sessions with/without PII
    sessions_with_pii_set = set(findings_by_session.keys())
    all_session_ids = {s.session_id for s in sessions}
    sessions_without_pii = len(all_session_ids - sessions_with_pii_set)

    # Get most common entity types (top 5)
    entity_counter = Counter(findings_by_type)
    most_common_entities = [entity for entity, _ in entity_counter.most_common(5)]

    # Limit detailed findings (highest confidence first)
    detailed_findings = sorted(all_findings, key=lambda x: x.score, reverse=True)[:MAX_DETAILED_FINDINGS]

    return PIIAnalysisResult(
        total_findings=len(all_findings),
        findings_by_type=dict(findings_by_type),
        findings_by_session=dict(findings_by_session),
        high_confidence_count=high_confidence,
        medium_confidence_count=medium_confidence,
        low_confidence_count=low_confidence,
        detailed_findings=detailed_findings,
        sessions_with_pii=len(sessions_with_pii_set),
        sessions_without_pii=sessions_without_pii,
        most_common_entities=most_common_entities
    )
