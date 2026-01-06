#!/usr/bin/env python3
"""Test script for validating Cylestio gateway headers functionality."""

import asyncio
import json
import httpx


async def test_prompt_id_header():
    """Test the x-cylestio-prompt-id header functionality."""

    base_url = "http://localhost:4000"
    test_headers = {
        "Content-Type": "application/json",
        "x-cylestio-prompt-id": "test-custom-prompt-123"
    }

    test_body = {
        "model": "gpt-4o-mini",
        "messages": [
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": "Hello! What's 2+2?"}
        ],
        "max_tokens": 100
    }

    print("Testing x-cylestio-prompt-id header functionality...")
    print(f"Sending request to: {base_url}/v1/chat/completions")
    print(f"Custom Prompt ID: {test_headers['x-cylestio-prompt-id']}")
    print(f"Request Body: {json.dumps(test_body, indent=2)}")
    print()

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{base_url}/v1/chat/completions",
                headers=test_headers,
                json=test_body,
                timeout=30.0
            )

            print(f"Response Status: {response.status_code}")
            print(f"Response Headers: {dict(response.headers)}")

            if response.status_code == 200:
                response_data = response.json()
                print(f"Response: {json.dumps(response_data, indent=2)}")
                print()
                print("Success! The custom prompt ID header was processed correctly.")
            else:
                print(f"Error Response: {response.text}")

    except httpx.ConnectError:
        print("Connection Error: Make sure the gateway is running on localhost:4000")
        print("Start the gateway with: python -m src.main --config examples/configs/openai-basic.yaml")
    except Exception as e:
        print(f"Unexpected Error: {e}")


async def test_fallback_behavior():
    """Test that the system falls back to computed prompt ID when header is not provided."""

    base_url = "http://localhost:4000"
    test_headers = {"Content-Type": "application/json"}

    test_body = {
        "model": "gpt-4o-mini",
        "messages": [
            {"role": "system", "content": "You are a math tutor."},
            {"role": "user", "content": "What's 5*5?"}
        ],
        "max_tokens": 100
    }

    print("\nTesting fallback behavior (no custom prompt ID)...")
    print(f"Sending request to: {base_url}/v1/chat/completions")
    print(f"No custom prompt ID header")
    print(f"Request Body: {json.dumps(test_body, indent=2)}")
    print()

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{base_url}/v1/chat/completions",
                headers=test_headers,
                json=test_body,
                timeout=30.0
            )

            print(f"Response Status: {response.status_code}")

            if response.status_code == 200:
                print("Success! The system fell back to computed prompt ID correctly.")
            else:
                print(f"Error Response: {response.text}")

    except httpx.ConnectError:
        print("Connection Error: Gateway not running")
    except Exception as e:
        print(f"Unexpected Error: {e}")


async def test_all_headers():
    """Test using all Cylestio headers together."""

    base_url = "http://localhost:4000"
    test_headers = {
        "Content-Type": "application/json",
        "x-cylestio-prompt-id": "test-prompt-456",
        "x-cylestio-conversation-id": "test-conversation-456",
        "x-cylestio-session-id": "test-workflow-run-789",
        "x-cylestio-tags": "user:alice,env:test,team:backend"
    }

    test_body = {
        "model": "gpt-4o-mini",
        "messages": [
            {"role": "system", "content": "You are a coding assistant."},
            {"role": "user", "content": "Write a hello world function in Python."}
        ],
        "max_tokens": 200
    }

    print("\nTesting all Cylestio headers together...")
    print(f"Sending request to: {base_url}/v1/chat/completions")
    print(f"Prompt ID: {test_headers['x-cylestio-prompt-id']}")
    print(f"Conversation ID: {test_headers['x-cylestio-conversation-id']}")
    print(f"Session ID: {test_headers['x-cylestio-session-id']}")
    print(f"Tags: {test_headers['x-cylestio-tags']}")
    print(f"Request Body: {json.dumps(test_body, indent=2)}")
    print()

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{base_url}/v1/chat/completions",
                headers=test_headers,
                json=test_body,
                timeout=30.0
            )

            print(f"Response Status: {response.status_code}")

            if response.status_code == 200:
                print("Success! All headers were processed correctly.")
            else:
                print(f"Error Response: {response.text}")

    except httpx.ConnectError:
        print("Connection Error: Gateway not running")
    except Exception as e:
        print(f"Unexpected Error: {e}")


async def test_session_grouping():
    """Test session ID header for grouping multiple workflow calls."""

    base_url = "http://localhost:4000"
    session_id = "workflow-run-test-123"

    print(f"\nTesting session grouping with session ID: {session_id}")
    print("Sending 3 requests with same session ID to simulate workflow...")
    print()

    prompts = [
        ("classifier", "Classify the following text: 'I want to buy a laptop'"),
        ("retriever", "Find information about laptops under $1000"),
        ("generator", "Write a recommendation for the user")
    ]

    try:
        async with httpx.AsyncClient() as client:
            for prompt_id, user_message in prompts:
                headers = {
                    "Content-Type": "application/json",
                    "x-cylestio-session-id": session_id,
                    "x-cylestio-prompt-id": f"workflow-{prompt_id}",
                    "x-cylestio-tags": "workflow:test,step:" + prompt_id
                }

                body = {
                    "model": "gpt-4o-mini",
                    "messages": [
                        {"role": "user", "content": user_message}
                    ],
                    "max_tokens": 50
                }

                print(f"  Step: {prompt_id}")
                response = await client.post(
                    f"{base_url}/v1/chat/completions",
                    headers=headers,
                    json=body,
                    timeout=30.0
                )
                print(f"    Status: {response.status_code}")

        print()
        print("Success! All workflow steps completed with same session ID.")
        print(f"Filter by session in UI: tag=session:{session_id}")

    except httpx.ConnectError:
        print("Connection Error: Gateway not running")
    except Exception as e:
        print(f"Unexpected Error: {e}")


async def main():
    """Run all tests."""
    print("Cylestio Gateway Headers Validation Tests")
    print("=" * 50)

    # Test 1: Custom prompt ID
    await test_prompt_id_header()

    # Test 2: Fallback behavior
    await test_fallback_behavior()

    # Test 3: All headers
    await test_all_headers()

    # Test 4: Session grouping
    await test_session_grouping()

    print("\n" + "=" * 50)
    print("All tests completed!")


if __name__ == "__main__":
    asyncio.run(main())
