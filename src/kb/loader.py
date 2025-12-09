"""Knowledge Base loader for security patterns and fix templates."""
import logging
import os
from pathlib import Path
from typing import Dict, List, Optional

import yaml

logger = logging.getLogger(__name__)


class KnowledgeBaseLoader:
    """Load and cache YAML knowledge base files."""

    # Context to OWASP control mapping
    CONTEXT_MAPPING = {
        "prompt_injection": ["LLM01"],
        "data_exposure": ["LLM06"],
        "excessive_agency": ["LLM08"],
        "rate_limiting": ["LLM04"],
        "insecure_output": ["LLM02"],
        "training_data_poisoning": ["LLM03"],
        "model_denial_of_service": ["LLM04"],
        "supply_chain": ["LLM05"],
        "insecure_plugin": ["LLM07"],
        "overreliance": ["LLM09"],
        "model_theft": ["LLM10"],
    }

    # Severity ordering for filtering
    SEVERITY_ORDER = {
        "LOW": 0,
        "MEDIUM": 1,
        "HIGH": 2,
        "CRITICAL": 3,
    }

    def __init__(self, kb_path: Optional[str] = None):
        """Initialize the knowledge base loader.

        Args:
            kb_path: Path to knowledge base directory. Defaults to module directory.
        """
        if kb_path:
            self._kb_path = Path(kb_path)
        else:
            # Default to the kb directory (same as this module)
            self._kb_path = Path(__file__).parent

        self._cache: Dict[str, Dict] = {}
        self._loaded = False

    def _load_yaml(self, filename: str) -> Dict:
        """Load a single YAML file.

        Args:
            filename: Name of the YAML file to load

        Returns:
            Parsed YAML content as dictionary, empty dict if file not found
        """
        file_path = self._kb_path / filename
        try:
            with open(file_path, "r") as f:
                return yaml.safe_load(f) or {}
        except FileNotFoundError:
            logger.warning(f"Knowledge base file not found: {file_path}")
            return {}
        except yaml.YAMLError as e:
            logger.error(f"Error parsing YAML file {file_path}: {e}")
            return {}

    def _ensure_loaded(self) -> None:
        """Lazy load all KB files into cache."""
        if self._loaded:
            return

        logger.info(f"Loading knowledge base from {self._kb_path}")

        # Load OWASP LLM Top 10 patterns
        self._cache["owasp"] = self._load_yaml("owasp_llm_top10.yaml")

        # Load fix templates
        self._cache["fixes"] = self._load_yaml("fix_templates.yaml")

        self._loaded = True
        logger.info("Knowledge base loaded successfully")

    def reload(self) -> None:
        """Force reload of all knowledge base files."""
        logger.info("Reloading knowledge base")
        self._cache.clear()
        self._loaded = False
        self._ensure_loaded()

    def get_security_patterns(
        self, context: str = "all", min_severity: str = "LOW"
    ) -> Dict:
        """Get security patterns filtered by context and severity.

        Args:
            context: Security context (e.g., "prompt_injection", "data_exposure", "all")
            min_severity: Minimum severity level (LOW, MEDIUM, HIGH, CRITICAL)

        Returns:
            Dictionary of matching OWASP controls
        """
        self._ensure_loaded()

        owasp_data = self._cache.get("owasp", {})
        controls = owasp_data.get("controls", {})

        if not controls:
            return {}

        # Filter by context
        if context != "all" and context in self.CONTEXT_MAPPING:
            control_ids = self.CONTEXT_MAPPING[context]
            controls = {
                cid: control for cid, control in controls.items() if cid in control_ids
            }

        # Filter by severity
        min_severity_value = self.SEVERITY_ORDER.get(min_severity.upper(), 0)
        filtered_controls = {}
        for control_id, control in controls.items():
            control_severity = control.get("severity", "LOW").upper()
            severity_value = self.SEVERITY_ORDER.get(control_severity, 0)
            if severity_value >= min_severity_value:
                filtered_controls[control_id] = control

        return filtered_controls

    def get_owasp_control(self, control_id: str) -> Optional[Dict]:
        """Get a specific OWASP control by ID.

        Args:
            control_id: OWASP control ID (e.g., "LLM01")

        Returns:
            Control data dictionary or None if not found
        """
        self._ensure_loaded()

        owasp_data = self._cache.get("owasp", {})
        controls = owasp_data.get("controls", {})
        return controls.get(control_id)

    def get_fix_template(self, finding_type: str) -> Optional[Dict]:
        """Get a fix template by type.

        Args:
            finding_type: Fix template type (e.g., "PROMPT_INJECTION")

        Returns:
            Fix template dictionary or None if not found
        """
        self._ensure_loaded()

        fixes_data = self._cache.get("fixes", {})
        templates = fixes_data.get("templates", {})
        return templates.get(finding_type)

    def get_all_fix_types(self) -> List[str]:
        """Get all available fix template types.

        Returns:
            List of fix template type names
        """
        self._ensure_loaded()

        fixes_data = self._cache.get("fixes", {})
        templates = fixes_data.get("templates", {})
        return list(templates.keys())

    def get_all_owasp_controls(self) -> List[str]:
        """Get all available OWASP control IDs.

        Returns:
            List of OWASP control IDs
        """
        self._ensure_loaded()

        owasp_data = self._cache.get("owasp", {})
        controls = owasp_data.get("controls", {})
        return list(controls.keys())


# Singleton instance
_loader_instance: Optional[KnowledgeBaseLoader] = None


def get_kb_loader(kb_path: Optional[str] = None) -> KnowledgeBaseLoader:
    """Get the singleton knowledge base loader instance.

    Args:
        kb_path: Optional path to knowledge base directory.
                 Only used on first call. Subsequent calls ignore this parameter.

    Returns:
        KnowledgeBaseLoader instance
    """
    global _loader_instance
    if _loader_instance is None:
        # Check environment variable for KB path
        env_path = os.environ.get("INSPECTOR_KB_PATH")
        path = kb_path or env_path
        _loader_instance = KnowledgeBaseLoader(path)
    return _loader_instance
