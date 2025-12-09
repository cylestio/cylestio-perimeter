# GooseAgent Examples

Simple Python examples for OpenAI and Anthropic clients with optional base URL support.

## Setup

```bash
pip install -r requirements.txt
```

## Environment variables

- OPENAI_API_KEY (required for OpenAI examples)
- ANTHROPIC_API_KEY (required for Anthropic example)
- OPENAI_BASE_URL (optional; override OpenAI API base)
- ANTHROPIC_BASE_URL (optional; override Anthropic API base)

Examples for base URLs (OpenAI-compatible proxies, self-hosted, etc.):

```bash
export OPENAI_API_KEY=sk-...
export OPENAI_BASE_URL=http://0.0.0.0:4000

export ANTHROPIC_API_KEY=sk-ant-...
export ANTHROPIC_BASE_URL=http://0.0.0.0:4000
```

## Run

```bash
python openai_math_agent.py
python openai_session_with_message_history.py
python openai_session_with_response_id.py
python math_agent.py
```


