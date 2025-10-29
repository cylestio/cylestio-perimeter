"""Interceptor manager for coordinating multiple interceptors."""
from typing import Any, Dict, List, Type

from src.proxy.interceptor_base import BaseInterceptor
from src.utils.logger import get_logger

logger = get_logger(__name__)


class InterceptorManager:
    """Manages registration and creation of interceptors."""
    
    def __init__(self):
        """Initialize interceptor manager."""
        self._interceptor_types: Dict[str, Type[BaseInterceptor]] = {}
    
    def register_interceptor(self, name: str, interceptor_class: Type[BaseInterceptor]) -> None:
        """Register an interceptor type.
        
        Args:
            name: Name to register interceptor under
            interceptor_class: Interceptor class
        """
        self._interceptor_types[name] = interceptor_class
        logger.debug(f"Registered interceptor: {name}")
    
    def create_interceptors(self, interceptor_configs, provider_name: str = None, provider_config: Dict[str, Any] = None, global_config: Dict[str, Any] = None) -> List[BaseInterceptor]:
        """Create interceptor instances from configuration.
        
        Args:
            interceptor_configs: List of interceptor configurations (Pydantic models or dicts)
            provider_name: Name of the LLM provider (e.g., 'openai', 'anthropic')
            provider_config: Provider configuration dict (including base_url, etc.)
            global_config: Global configuration dict (e.g., live_trace settings)
            
        Returns:
            List of created interceptor instances
        """
        interceptors = []
        
        for config in interceptor_configs:
            # Handle both Pydantic models and plain dicts
            if hasattr(config, 'type'):
                # Pydantic model
                interceptor_type = config.type
                enabled = config.enabled
                interceptor_config = config.config or {}
            else:
                # Plain dict
                interceptor_type = config.get("type")
                enabled = config.get("enabled", True)
                interceptor_config = config.get("config", {})
            
            if not interceptor_type:
                logger.warning("Interceptor config missing 'type' field, skipping")
                continue
                
            if interceptor_type not in self._interceptor_types:
                logger.warning(f"Unknown interceptor type: {interceptor_type}")
                continue
            
            interceptor_class = self._interceptor_types[interceptor_type]
            
            try:
                # Add enabled flag to config
                interceptor_config = dict(interceptor_config)  # Convert to dict if needed
                interceptor_config["enabled"] = enabled
                
                # Add provider name for interceptors that need it
                if provider_name:
                    interceptor_config["provider_name"] = provider_name
                
                # LiveTraceInterceptor needs special handling
                if interceptor_type == "live_trace":
                    # Merge global live_trace config if available
                    if global_config and "live_trace" in global_config:
                        global_live_trace_config = global_config["live_trace"]
                        # Interceptor config takes precedence over global config
                        for key, value in global_live_trace_config.items():
                            if key not in interceptor_config:
                                interceptor_config[key] = value
                    
                    if provider_config:
                        interceptor = interceptor_class(interceptor_config, provider_name, provider_config)
                    else:
                        interceptor = interceptor_class(interceptor_config, provider_name)
                else:
                    interceptor = interceptor_class(interceptor_config)
                interceptors.append(interceptor)
                
                status = "enabled" if interceptor.enabled else "disabled"
                logger.info(f"Created interceptor: {interceptor.name} ({status})")
                
            except Exception as e:
                logger.error(f"Failed to create interceptor {interceptor_type}: {e}", exc_info=True)
        
        return interceptors
    
    def get_registered_types(self) -> List[str]:
        """Get list of registered interceptor type names.
        
        Returns:
            List of interceptor type names
        """
        return list(self._interceptor_types.keys())


# Global interceptor manager instance
interceptor_manager = InterceptorManager()