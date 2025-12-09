#!/bin/bash
# Example curl commands to test the LLM proxy server
# Make sure your proxy server is running on http://localhost:4000

echo "🚀 LLM Proxy Server - cURL Examples"
echo "=================================="
echo ""

PROXY_URL="http://localhost:4000"

echo "1. Health Check"
echo "curl -X GET $PROXY_URL/health"
curl -X GET $PROXY_URL/health
echo -e "\n"

echo "2. OpenAI Chat Completion (non-streaming)"
echo "curl -X POST $PROXY_URL/v1/chat/completions \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -d '{\"model\": \"gpt-3.5-turbo\", \"messages\": [{\"role\": \"user\", \"content\": \"Hello!\"}]}'"

curl -X POST $PROXY_URL/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-3.5-turbo",
    "messages": [{"role": "user", "content": "Hello! Tell me a short joke."}],
    "max_tokens": 100
  }'
echo -e "\n"

echo "3. OpenAI Chat Completion (streaming)"
echo "curl -X POST $PROXY_URL/v1/chat/completions \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -d '{\"model\": \"gpt-3.5-turbo\", \"messages\": [{\"role\": \"user\", \"content\": \"Count 1 to 3\"}], \"stream\": true}'"

curl -X POST $PROXY_URL/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-3.5-turbo",
    "messages": [{"role": "user", "content": "Count from 1 to 3"}],
    "stream": true,
    "max_tokens": 50
  }'
echo -e "\n"

echo "4. Anthropic Messages (non-streaming)"
echo "curl -X POST $PROXY_URL/v1/messages \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -d '{\"model\": \"claude-3-haiku-20240307\", \"max_tokens\": 100, \"messages\": [{\"role\": \"user\", \"content\": \"Hello!\"}]}'"

curl -X POST $PROXY_URL/v1/messages \
  -H "Content-Type: application/json" \
  -d '{
    "model": "claude-3-haiku-20240307",
    "max_tokens": 100,
    "messages": [{"role": "user", "content": "Hello! Tell me a short fact about space."}]
  }'
echo -e "\n"

echo "5. Anthropic Messages (streaming)"
echo "curl -X POST $PROXY_URL/v1/messages \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -d '{\"model\": \"claude-3-haiku-20240307\", \"max_tokens\": 50, \"messages\": [{\"role\": \"user\", \"content\": \"Count 1 to 3\"}], \"stream\": true}'"

curl -X POST $PROXY_URL/v1/messages \
  -H "Content-Type: application/json" \
  -d '{
    "model": "claude-3-haiku-20240307",
    "max_tokens": 50,
    "messages": [{"role": "user", "content": "Count from 1 to 3"}],
    "stream": true
  }'
echo -e "\n"

echo "✅ Examples completed!"
echo ""
echo "Note: Make sure to:"
echo "1. Set your API keys as environment variables (OPENAI_API_KEY, ANTHROPIC_API_KEY)"
echo "2. Configure your proxy server with the appropriate LLM provider"
echo "3. Check the traces/ directory for captured requests (if tracing is enabled)"