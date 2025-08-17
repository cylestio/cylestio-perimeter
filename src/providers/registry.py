"""Provider registry for managing LLM providers."""
from typing import Dict, List, Optional

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
    
    def get_provider_by_name(self, name: str) -> Optional[BaseProvider]:
        """Get a provider by its name.
        
        Args:
            name: Provider name
            
        Returns:
            Provider instance or None if not found
        """
        for provider in self._providers:
            if provider.name == name:
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