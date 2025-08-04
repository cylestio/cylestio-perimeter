# Configuration Basics

Learn how to configure Cylestio Gateway for your needs.

## Configuration Methods

### 1. Command Line Arguments
Quick and simple for basic setups:
```bash
python -m src.main \
  --base-url https://api.openai.com \
  --type openai \
  --api-key sk-your-key \
  --port 3000
```

### 2. Configuration File (Recommended)
More powerful and maintainable:
```bash
python -m src.main --config config.yaml
```

### 3. Environment Variables
Secure and deployment-friendly:
```bash
export OPENAI_API_KEY=sk-your-key
export LOG_LEVEL=DEBUG
python -m src.main --config config.yaml
```

**Priority**: CLI args > Config file > Environment variables > Defaults

## Basic Configuration File

### Minimal Config
```yaml
# config.yaml
llm:
  base_url: "https://api.openai.com"
  type: "openai"
  api_key: "${OPENAI_API_KEY}"  # Read from environment
```

### Standard Config
```yaml
# config.yaml
server:
  host: "0.0.0.0"
  port: 3000
  workers: 1

llm:
  base_url: "https://api.openai.com"
  type: "openai"
  api_key: "${OPENAI_API_KEY}"
  timeout: 30

logging:
  level: "INFO"
  format: "console"  # or "json"

interceptors:
  - type: "printer"
    enabled: true
```

## Key Configuration Sections

### Server Configuration
```yaml
server:
  host: "0.0.0.0"      # Bind address
  port: 3000           # Listen port
  workers: 4           # Number of workers (production)
  reload: false        # Auto-reload on changes
```

### LLM Provider Configuration
```yaml
llm:
  base_url: "https://api.openai.com"  # Provider URL
  type: "openai"                      # Provider type
  api_key: "${OPENAI_API_KEY}"       # API key
  timeout: 30                         # Request timeout
  retry_attempts: 3                   # Retry failed requests
```

### Logging Configuration
```yaml
logging:
  level: "INFO"        # DEBUG, INFO, WARNING, ERROR
  format: "console"    # console or json
  file: null          # Optional log file path
```

### Interceptors Configuration
```yaml
interceptors:
  # Request/Response printer
  - type: "printer"
    enabled: true
    config:
      log_body: false
  
  # Request tracing
  - type: "trace"
    enabled: true
    config:
      directory: "./traces"
      include_headers: true
```

## Environment Variables

### In Configuration Files
Use `${VAR_NAME}` syntax:
```yaml
llm:
  api_key: "${OPENAI_API_KEY}"
  base_url: "${LLM_BASE_URL:-https://api.openai.com}"  # With default
```

### Common Variables
```bash
# API Keys
export OPENAI_API_KEY=sk-...
export ANTHROPIC_API_KEY=...

# Server settings
export SERVER_PORT=3000
export SERVER_HOST=0.0.0.0

# Logging
export LOG_LEVEL=DEBUG
```

## Configuration Examples

### Development Setup
```yaml
# dev-config.yaml
server:
  host: "127.0.0.1"
  port: 3001
  reload: true

llm:
  base_url: "https://api.openai.com"
  type: "openai"
  api_key: "${OPENAI_API_KEY}"

logging:
  level: "DEBUG"
  format: "console"

interceptors:
  - type: "printer"
    enabled: true
    config:
      log_body: true
```

### Production Setup
```yaml
# prod-config.yaml
server:
  host: "0.0.0.0"
  port: 3000
  workers: 4

llm:
  base_url: "https://api.openai.com"
  type: "openai"
  api_key: "${OPENAI_API_KEY}"
  timeout: 60
  retry_attempts: 3

logging:
  level: "INFO"
  format: "json"
  file: "/var/log/cylestio/gateway.log"

interceptors:
  - type: "trace"
    enabled: true
    config:
      directory: "/var/log/cylestio/traces"
      max_body_size: 1048576
```

## Config File Management

### Generate Example Config
```bash
python -m src.main --generate-config example.yaml
```

### Validate Config
```bash
python -m src.main --validate-config config.yaml
```

### Multiple Configs
```bash
# Development
python -m src.main --config configs/dev.yaml

# Staging
python -m src.main --config configs/staging.yaml

# Production
python -m src.main --config configs/prod.yaml
```

## Best Practices

1. **Use Environment Variables for Secrets**
   ```yaml
   api_key: "${OPENAI_API_KEY}"  # Good
   api_key: "sk-abc123..."        # Bad
   ```

2. **Separate Configs by Environment**
   ```
   configs/
   ├── development.yaml
   ├── staging.yaml
   └── production.yaml
   ```

3. **Version Control Configs (without secrets)**
   ```yaml
   # config.yaml.template
   llm:
     api_key: "${OPENAI_API_KEY}"  # Set in environment
   ```

4. **Use Descriptive Names**
   ```yaml
   interceptors:
     - type: "trace"
       enabled: true
       config:
         directory: "./traces"  # Clear purpose
   ```

## Next Steps

- See [Full Configuration Reference](../api/configuration.md) for all options
- Learn about [Interceptors](../guides/interceptors.md)
- Explore [Example Configurations](../../examples/configs/)
- Set up [Docker Deployment](../guides/docker.md)