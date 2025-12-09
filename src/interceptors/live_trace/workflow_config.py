"""Load workflow configuration from cylestio.yaml."""
import os
from pathlib import Path
from typing import Any, Dict, Optional

import yaml

from src.utils.logger import get_logger

logger = get_logger(__name__)

# Default config file name
CONFIG_FILE_NAME = "cylestio.yaml"


def find_config_file(start_path: Optional[str] = None) -> Optional[Path]:
    """Find cylestio.yaml by walking up from start_path.
    
    Args:
        start_path: Directory to start searching from. Defaults to cwd.
        
    Returns:
        Path to config file if found, None otherwise.
    """
    current = Path(start_path or os.getcwd()).resolve()
    
    # Walk up to find config file (max 10 levels)
    for _ in range(10):
        config_path = current / CONFIG_FILE_NAME
        if config_path.exists():
            return config_path
        
        parent = current.parent
        if parent == current:  # reached root
            break
        current = parent
    
    return None


def load_workflow_config(config_path: Optional[str] = None) -> Optional[Dict[str, Any]]:
    """Load workflow configuration from file.
    
    Args:
        config_path: Path to config file. If not provided, searches for it.
        
    Returns:
        Parsed config dict or None if not found.
    """
    if config_path:
        path = Path(config_path)
    else:
        path = find_config_file()
    
    if not path or not path.exists():
        return None
    
    try:
        with open(path) as f:
            config = yaml.safe_load(f)
        
        logger.debug(f"Loaded workflow config from {path}")
        return config
    except Exception as e:
        logger.warning(f"Failed to load workflow config from {path}: {e}")
        return None


def get_workflow_id(config_path: Optional[str] = None) -> Optional[str]:
    """Get workflow_id from config file.
    
    Args:
        config_path: Path to config file. If not provided, searches for it.
        
    Returns:
        workflow_id string or None if not found.
    """
    config = load_workflow_config(config_path)
    if config:
        return config.get("workflow_id")
    return None


def get_workflow_info(config_path: Optional[str] = None) -> Dict[str, Any]:
    """Get full workflow info from config.
    
    Returns dict with:
        - workflow_id: str or None
        - workflow_name: str or None  
        - agents: list of agent configs
        - config_found: bool
        - config_path: str or None
    """
    path = Path(config_path) if config_path else find_config_file()
    config = load_workflow_config(str(path)) if path else None
    
    return {
        "workflow_id": config.get("workflow_id") if config else None,
        "workflow_name": config.get("workflow_name") if config else None,
        "agents": config.get("agents", []) if config else [],
        "config_found": config is not None,
        "config_path": str(path) if path else None,
    }

