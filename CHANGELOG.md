# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **Live Trace Persistence**: Optional file-based persistence for live_trace interceptor
  - Added `persist_to_file` configuration option to enable long-term data storage
  - Auto-save functionality that persists session, agent, and metrics data to JSON
  - Automatic data restoration on gateway restart
  - Configurable save intervals and persistence directory
  - Preserves historical session and agent metrics between executions
  - Atomic file writes to prevent data corruption
  - Graceful handling of corrupt persistence files
  - Note: Individual event details are not persisted to keep file sizes manageable

### Enhanced
- **Live Trace Dashboard UX**: Improved user experience for historical sessions
  - Automatically loads full event timeline from event_logs if event_recorder is enabled
  - Behavioral analysis now includes historical sessions by loading events from event_logs
  - Shows historical session indicator only when event logs are not available
  - Clear, simple messaging without unnecessary icons
  - Helpful tips pointing users to event_logs directory for complete event data
  - Distinguishes between active sessions (with events) and historical sessions (metrics only)
  - All 32 sessions now included in behavioral clustering and outlier detection (if event_recorder is enabled)

### Technical Details
- Added serialization methods (`to_dict`, `from_dict`) to `SessionData` and `AgentData` classes
- Implemented `_save_to_file` and `_load_from_file` methods in `TraceStore`
- Auto-save triggers every N events (configurable via `save_interval_events`)
- Data persisted to `{persistence_dir}/trace_store.json`
- Added `has_event_history` and `history_message` fields to session API response
- Added `_load_events_from_log_file` method to automatically load events from event_recorder logs
- InsightsEngine now accepts optional `event_logs_dir` parameter for loading historical events
- Risk analysis (`perform_risk_analysis`) now loads events from event_logs for historical sessions
- Behavioral analysis can now analyze all sessions (including historical) if event_recorder is enabled
- Reconstructs BaseEvent objects from logged JSON data for feature extraction
- **Behavioral feature caching**: Extracted features AND MinHash signatures are now cached in persistence file
- First analysis extracts features + computes signatures from event_logs, subsequent analyses use cached data (much faster!)
- Only new sessions need feature extraction and signature computation, historical sessions use cached values
- MinHash signatures (512-element arrays) are cached to avoid 16,384+ hash operations on every restart
- **MinHash configuration validation**: Hash function configuration (num_hashes=512, seed_multiplier=12345, hash_algorithm=md5) is saved and validated
- Hardcoded constants (`MINHASH_NUM_HASHES`, `MINHASH_SEED_MULTIPLIER`, `MINHASH_HASH_ALGORITHM`) ensure configuration consistency
- Hash values computed directly from seeds (no dynamic lambda generation) for simplicity and clarity
- Cached signatures automatically invalidated if configuration changes
- Comprehensive test suite with 16 test cases covering serialization, persistence, event loading, and UX indicators

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
