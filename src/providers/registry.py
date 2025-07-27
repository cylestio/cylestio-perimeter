"""Provider registry for managing LLM providers."""
from typing import Dict, List, Optional

from fastapi import Request

from .base import BaseProvider
from .anthropic import AnthropicProvider
from .openai import OpenAIProvider


class ProviderRegistry:
    """Registry for managing LLM providers."""
    
    def __init__(self):
        self._providers: List[BaseProvider] = []
        self._setup_default_providers()
    
    def _setup_default_providers(self):
        """Set up default providers."""
        self.register(OpenAIProvider())
        self.register(AnthropicProvider())
    
    def register(self, provider: BaseProvider) -> None:
        """Register a new provider.
        
        Args:
            provider: Provider instance to register
        """
        self._providers.append(provider)
    
    def get_provider(self, request: Request) -> Optional[BaseProvider]:
        """Get the appropriate provider for a request.
        
        Args:
            request: FastAPI request object
            
        Returns:
            Provider instance that can handle the request, or None
        """
        for provider in self._providers:
            if provider.can_handle(request):
                return provider
        return None
    
    def list_providers(self) -> List[str]:
        """List all registered provider names.
        
        Returns:
            List of provider names
        """
        return [provider.name for provider in self._providers]


# Global instance
registry = ProviderRegistry()