# Installation Guide

This guide covers different ways to install and set up Cylestio Gateway.

## Prerequisites

- Python 3.8 or higher
- pip (Python package manager)
- Git (for cloning the repository)

## Installation Methods

### 1. Local Installation

#### Clone the Repository
```bash
git clone https://github.com/cylestio/cylestio-gateway.git
cd cylestio-gateway
```

#### Set Up Python Environment
```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate

# On Windows:
venv\Scripts\activate
```

#### Install Dependencies
```bash
pip install -r requirements.txt
```

#### Install Development Dependencies (Optional)
```bash
pip install -r requirements-dev.txt
```

### 2. Docker Installation

If you prefer using Docker, see our [Docker Deployment Guide](../guides/docker.md).

```bash
# Quick Docker setup
docker pull cylestio/gateway:latest
docker run -p 3000:3000 cylestio/gateway:latest
```

### 3. Docker Compose Installation

For production deployments with all features:

```bash
# Clone the repository
git clone https://github.com/cylestio/cylestio-gateway.git
cd cylestio-gateway

# Start with docker-compose
docker-compose up -d
```

## Verify Installation

### Check Python Installation
```bash
python --version  # Should be 3.8+
pip --version
```

### Test the Installation
```bash
# Run the gateway
python -m src.main --help

# You should see the help output with available options
```

### Run Health Check
```bash
# Start the server
python -m src.main --base-url https://api.openai.com --type openai

# In another terminal, check health
curl http://localhost:3000/health
```

## Environment Setup

### Required Environment Variables

For OpenAI:
```bash
export OPENAI_API_KEY=sk-your-key-here
```

For Anthropic:
```bash
export ANTHROPIC_API_KEY=your-key-here
```

### Optional Environment Variables
```bash
export LOG_LEVEL=INFO
export SERVER_PORT=3000
export SERVER_HOST=0.0.0.0
```

## Common Installation Issues

### Python Version Error
If you see "Python 3.8+ required":
```bash
# Check your Python version
python --version

# Install Python 3.8+ using your system package manager
# macOS: brew install python@3.11
# Ubuntu: sudo apt-get install python3.11
```

### Missing Dependencies
If modules are not found:
```bash
# Ensure virtual environment is activated
which python  # Should point to venv/bin/python

# Reinstall dependencies
pip install -r requirements.txt
```

### Permission Errors
If you encounter permission errors:
```bash
# Use virtual environment (recommended)
# OR install with user flag
pip install --user -r requirements.txt
```

## Next Steps

- Continue to the [Quick Start Guide](quick-start.md)
- Learn about [Configuration](configuration.md)
- Explore [Example Configurations](../../examples/)