FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY src/ ./src/

# Create traces directory
RUN mkdir -p /app/traces

# Expose port
EXPOSE 4000

# Run the application
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "4000"]