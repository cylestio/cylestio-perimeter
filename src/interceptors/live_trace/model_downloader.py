"""Background downloader for spaCy models using httpx."""
import sysconfig
import threading
import zipfile
from pathlib import Path
from typing import Optional

import httpx

from src.utils.logger import get_logger

logger = get_logger(__name__)

# Model configuration
SPACY_MODEL = "en_core_web_md"
SPACY_MODEL_VERSION = "3.8.0"
SPACY_MODEL_URL = (
    f"https://github.com/explosion/spacy-models/releases/download/"
    f"{SPACY_MODEL}-{SPACY_MODEL_VERSION}/"
    f"{SPACY_MODEL}-{SPACY_MODEL_VERSION}-py3-none-any.whl"
)

_download_in_progress = False
_download_complete = False
_download_failed = False
_download_error: Optional[str] = None


def get_model_status() -> tuple[str, Optional[str]]:
    """Get the current status of the spaCy model.
    
    Returns:
        Tuple of (status, error_message) where status is one of:
        - "available": Model is ready to use
        - "downloading": Download in progress
        - "unavailable": Download failed or model not installed
    """
    if _download_complete:
        return ("available", None)
    elif _download_in_progress:
        return ("downloading", None)
    elif _download_failed:
        return ("unavailable", _download_error)
    else:
        # Not yet checked - try to load the model
        try:
            import spacy
            spacy.load(SPACY_MODEL)
            return ("available", None)
        except (OSError, ImportError):
            return ("unavailable", "Model not yet downloaded")


def download_model_async(callback: Optional[callable] = None) -> threading.Thread:
    """Start background download of spaCy model.
    
    Args:
        callback: Optional callback function to call when download completes
        
    Returns:
        The download thread
    """
    thread = threading.Thread(
        target=_download_model,
        args=(callback,),
        daemon=True,
        name="spacy-model-downloader"
    )
    thread.start()
    return thread


def _download_model(callback: Optional[callable] = None) -> None:
    """Download and install spaCy model using httpx.
    
    Args:
        callback: Optional callback function to call when complete
    """
    global _download_in_progress, _download_complete, _download_failed, _download_error
    
    if _download_in_progress or _download_complete:
        return
    
    # Check if model exists (happens in background thread, doesn't block)
    try:
        import spacy
        spacy.load(SPACY_MODEL)
        logger.debug("SpaCy model '%s' is already installed", SPACY_MODEL)
        _download_complete = True
        if callback:
            callback(success=True)
        return
    except (OSError, ImportError):
        pass  # Model doesn't exist, continue with download
    
    _download_in_progress = True
    
    try:
        logger.info("=" * 70)
        logger.info("Downloading spaCy model: %s (~40MB)", SPACY_MODEL)
        logger.info("This happens in the background and won't block the server")
        logger.info("=" * 70)
        
        # Download the wheel file using httpx
        with httpx.Client(follow_redirects=True, timeout=300.0) as client:
            response = client.get(SPACY_MODEL_URL)
            response.raise_for_status()
            
            # Save to temporary location
            import tempfile
            with tempfile.NamedTemporaryFile(suffix=".whl", delete=False) as tmp_file:
                tmp_file.write(response.content)
                wheel_path = Path(tmp_file.name)
        
        # Extract to site-packages
        target_dir = Path(sysconfig.get_path("purelib"))
        logger.info("Extracting model to: %s", target_dir)
        
        with zipfile.ZipFile(wheel_path, "r") as zip_ref:
            zip_ref.extractall(target_dir)
        
        # Clean up temporary file
        wheel_path.unlink()
        
        _download_complete = True
        logger.info("=" * 70)
        logger.info("SpaCy model downloaded and installed successfully!")
        logger.info("=" * 70)
        
        if callback:
            callback(success=True)
            
    except httpx.HTTPError as e:
        _download_failed = True
        _download_error = f"HTTP error downloading model: {e}"
        logger.error("=" * 70)
        logger.error(_download_error)
        logger.error("Install manually: python -m spacy download %s", SPACY_MODEL)
        logger.error("=" * 70)
        if callback:
            callback(success=False, error=str(e))
    except zipfile.BadZipFile as e:
        _download_failed = True
        _download_error = f"Downloaded file is corrupted: {e}"
        logger.error("=" * 70)
        logger.error(_download_error)
        logger.error("=" * 70)
        if callback:
            callback(success=False, error=str(e))
    except Exception as e:
        _download_failed = True
        _download_error = f"Unexpected error downloading model: {e}"
        logger.error("=" * 70)
        logger.error(_download_error)
        logger.error("Install manually: python -m spacy download %s", SPACY_MODEL)
        logger.error("=" * 70)
        if callback:
            callback(success=False, error=str(e))
    finally:
        _download_in_progress = False

