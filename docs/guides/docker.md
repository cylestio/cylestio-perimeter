# Docker Deployment Guide

Deploy Cylestio Gateway using Docker for production-ready environments.

## Quick Start

### Using Docker Compose (Recommended)

```bash
# Clone the repository
git clone https://github.com/cylestio/cylestio-gateway.git
cd cylestio-gateway

# Set environment variables
export OPENAI_API_KEY=sk-your-key-here

# Start the service
docker-compose up -d

# Check logs
docker-compose logs -f

# Stop the service
docker-compose down
```

### Using Docker CLI

```bash
# Build the image
docker build -t cylestio-gateway .

# Run the container
docker run -d \
  --name cylestio-gateway \
  -p 3000:3000 \
  -e OPENAI_API_KEY=sk-your-key \
  -e LLM_BASE_URL=https://api.openai.com \
  -e LLM_TYPE=openai \
  cylestio-gateway
```

## Docker Compose Configuration

### Basic Setup

```yaml
# docker-compose.yml
version: '3.8'

services:
  gateway:
    build: .
    ports:
      - "3000:3000"
    environment:
      - LLM_BASE_URL=https://api.openai.com
      - LLM_TYPE=openai
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - LOG_LEVEL=INFO
    volumes:
      - ./traces:/app/traces
      - ./logs:/app/logs
```

### Production Setup

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  gateway:
    image: cylestio/gateway:latest
    ports:
      - "3000:3000"
    environment:
      - LLM_BASE_URL=https://api.openai.com
      - LLM_TYPE=openai
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - LOG_LEVEL=INFO
    volumes:
      - traces:/app/traces
      - logs:/app/logs
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  traces:
  logs:
```

## Environment Variables

### Required Variables

```bash
# For OpenAI
OPENAI_API_KEY=sk-your-key-here
LLM_BASE_URL=https://api.openai.com
LLM_TYPE=openai

# For Anthropic
ANTHROPIC_API_KEY=your-key-here
LLM_BASE_URL=https://api.anthropic.com
LLM_TYPE=anthropic
```

### Optional Variables

```bash
# Server Configuration
SERVER_HOST=0.0.0.0
SERVER_PORT=3000

# Logging
LOG_LEVEL=INFO  # DEBUG, INFO, WARNING, ERROR

# Performance
WORKERS=4  # Number of worker processes
```

## Volume Mounts

### Traces Directory
```yaml
volumes:
  - ./traces:/app/traces  # Persist request traces
```

### Logs Directory
```yaml
volumes:
  - ./logs:/app/logs  # Persist application logs
```

### Configuration File
```yaml
volumes:
  - ./config.yaml:/app/config.yaml  # Custom configuration
command: ["--config", "/app/config.yaml"]
```

## Docker Examples

### OpenAI Proxy
```bash
cd examples/docker
docker-compose -f docker-compose.openai.yml up -d
```

### Anthropic Proxy
```bash
cd examples/docker
docker-compose -f docker-compose.anthropic.yml up -d
```

### Development Mode
```yaml
# docker-compose.dev.yml
version: '3.8'

services:
  gateway:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - LOG_LEVEL=DEBUG
    volumes:
      - .:/app  # Mount source code
      - /app/venv  # Exclude venv
    command: ["python", "-m", "src.main", "--reload"]
```

## Health Checks

### Docker Health Check
```dockerfile
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1
```

### Manual Health Check
```bash
# Check if container is healthy
docker inspect cylestio-gateway --format='{{.State.Health.Status}}'

# View health check logs
docker inspect cylestio-gateway --format='{{json .State.Health}}' | jq
```

## Networking

### Custom Network
```yaml
# docker-compose.yml
version: '3.8'

networks:
  app-network:
    driver: bridge

services:
  gateway:
    networks:
      - app-network
```

### External Access
```yaml
services:
  gateway:
    ports:
      - "0.0.0.0:3000:3000"  # Listen on all interfaces
```

### Internal Only
```yaml
services:
  gateway:
    expose:
      - "3000"  # Only accessible within Docker network
```

## Performance Tuning

### Multi-Worker Setup
```yaml
services:
  gateway:
    environment:
      - WORKERS=4
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 1G
```

### Resource Limits
```yaml
services:
  gateway:
    mem_limit: 2g
    cpus: 2
    ulimits:
      nofile:
        soft: 65536
        hard: 65536
```

## Monitoring

### Logs
```bash
# View logs
docker-compose logs -f gateway

# View last 100 lines
docker-compose logs --tail=100 gateway

# Save logs to file
docker-compose logs gateway > gateway.log
```

### Metrics
```bash
# Container stats
docker stats cylestio-gateway

# Detailed inspection
docker inspect cylestio-gateway
```

## Troubleshooting

### Container Won't Start
```bash
# Check logs
docker-compose logs gateway

# Run interactively
docker run -it --rm \
  -e OPENAI_API_KEY=$OPENAI_API_KEY \
  cylestio-gateway bash
```

### Permission Issues
```bash
# Fix volume permissions
docker-compose exec gateway chown -R app:app /app/traces /app/logs
```

### Network Issues
```bash
# Test connectivity
docker-compose exec gateway curl https://api.openai.com

# Check DNS
docker-compose exec gateway nslookup api.openai.com
```

## Security Best Practices

1. **Use Secrets Management**
   ```yaml
   services:
     gateway:
       secrets:
         - openai_key
   
   secrets:
     openai_key:
       external: true
   ```

2. **Non-Root User**
   ```dockerfile
   USER app:app
   ```

3. **Read-Only Filesystem**
   ```yaml
   services:
     gateway:
       read_only: true
       tmpfs:
         - /tmp
   ```

4. **Network Isolation**
   ```yaml
   services:
     gateway:
       networks:
         - internal
   ```

## Production Checklist

- [ ] Use specific image tags (not `latest`)
- [ ] Configure health checks
- [ ] Set resource limits
- [ ] Use volumes for persistent data
- [ ] Configure logging
- [ ] Set up monitoring
- [ ] Use secrets for sensitive data
- [ ] Configure restart policies
- [ ] Test backup/restore procedures

## Next Steps

- Learn about [Interceptors](interceptors.md)
- Configure [LLM Providers](providers.md)
- Set up [Monitoring](../api/endpoints.md#metrics)