import os
import sys
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

# Ensure project root is on sys.path so `import src...` works when pytest sets testpaths
PROJECT_ROOT = Path(__file__).resolve().parents[2]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from src.config.settings import Settings
from src.main import create_app


@pytest.fixture
def settings() -> Settings:
    return Settings(
        llm={
            "base_url": "https://api.openai.com",
            "type": "openai",
            "api_key": "sk-test",
        }
    )


@pytest.fixture
def app(settings: Settings):
    return create_app(settings)


@pytest.fixture
def client(app) -> TestClient:
    return TestClient(app)