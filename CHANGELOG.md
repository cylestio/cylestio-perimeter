# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.0] - 2025-09-27

### Added
- **Tools Support**: Enhanced tool execution tracking and result processing
  - Added `ToolExecutionEvent` and `ToolResultEvent` for comprehensive tool monitoring
  - Enhanced OpenAI and Anthropic providers with tool parsing capabilities
  - Improved tool metadata extraction and session tracking
- **Replay Service**: New service for replaying recorded HTTP traffic
  - Added `ReplayService` for reading and parsing recorded HTTP traffic files
  - Implemented `ReplayPipeline` for processing recorded requests through interceptors
  - Support for replaying traffic with configurable delays between requests
- **Enhanced Async Event Reporting**: Improved Cylestio tracing with background event processing
  - Async background event reporting for better performance
  - Enhanced tracing interceptor with improved error handling
- **Agent Versioning Support**: Enhanced agent identification and versioning capabilities
  - Improved agent ID management and session tracking
  - Better support for external agent identification

### Enhanced
- **Provider Improvements**: Enhanced OpenAI and Anthropic providers with better tool support
- **Session Management**: Improved session detection and management with tool awareness
- **Event System**: Expanded event types for comprehensive tool and agent tracking

### Technical Improvements
- Enhanced middleware system for tool execution tracking
- Improved error handling in replay and tracing systems
- Better session detection with tool-aware capabilities
- Enhanced configuration management for replay functionality

## [1.1.0] - 2025-09-04

### Added
- **Enhanced Telemetry Collection**: Comprehensive telemetry fields collection for both OpenAI and Anthropic providers
  - System message extraction for OpenAI provider
  - Enhanced response field collection for both providers
  - Optional fields collection for OpenAI and Anthropic
- **Improved Session Management**: Better handling of agent IDs and short session scenarios
- **Enhanced Testing Infrastructure**: 
  - Fixed test configuration and proxy handler authentication headers
  - Added test execution to CI pipeline with coverage reporting
  - Improved test reliability and coverage

### Fixed
- **OpenAI Events and Session Handling**: 
  - Fixed OpenAI events processing
  - Resolved span ID generation issues
  - Improved session handling reliability
- **Agent ID Management**: Fixed agent ID handling and short session issues
- **Configuration Updates**: Updated default configurations for better reliability

### Changed
- **Project Rename**: Updated project references and configurations following project rename
- **Code Quality**: Improved code organization and test coverage

### Technical Improvements
- Enhanced middleware system for better telemetry collection
- Improved error handling and logging
- Better session detection and management
- Enhanced proxy handler authentication

## [1.0.1] - 2025-08-xx

### Fixed
- Minor bug fixes and stability improvements
- Configuration optimizations

## [1.0.0] - 2025-08-xx

### Added
- Initial release of Cylestio Gateway
- Core proxy functionality for LLM API requests
- Support for OpenAI and Anthropic providers
- Streaming support with Server-Sent Events (SSE)
- Request tracing and session management
- External ID support via custom headers
- Extensible middleware system
- CLI interface with configuration file support
- Docker support
- Metrics endpoint for monitoring

### Features
- **LLM Provider Support**: Proxy requests to multiple LLM providers
- **Session Management**: Intelligent session detection using message history hashing
- **Request Tracing**: Capture and save request/response data
- **Middleware System**: Extensible architecture for cross-cutting concerns
- **Docker Ready**: Ready-to-use Docker containers
- **Monitoring**: Built-in metrics and health endpoints

---

## Release Notes Format

Each release includes:
- **Added**: New features and capabilities
- **Changed**: Changes to existing functionality
- **Fixed**: Bug fixes and issue resolutions
- **Removed**: Features or functionality that was removed
- **Security**: Security-related changes and improvements
