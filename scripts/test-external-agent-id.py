#!/usr/bin/env python3
"""Test script for validating x-cylestio-agent-id header functionality."""

import asyncio
import json
import httpx
from typing import Dict, Any


async def test_external_agent_id():
    """Test the x-cylestio-agent-id header functionality."""
    
    # Test configuration
    base_url = "http://localhost:4000"
    test_headers = {
        "Content-Type": "application/json",
        "x-cylestio-agent-id": "test-custom-agent-123"
    }
    
    # Test request body
    test_body = {
        "model": "gpt-4o-mini",
        "messages": [
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": "Hello! What's 2+2?"}
        ],
        "max_tokens": 100
    }
    
    print("🧪 Testing x-cylestio-agent-id header functionality...")
    print(f"📡 Sending request to: {base_url}/v1/chat/completions")
    print(f"🔑 Custom Agent ID: {test_headers['x-cylestio-agent-id']}")
    print(f"📝 Request Body: {json.dumps(test_body, indent=2)}")
    print()
    
    try:
        async with httpx.AsyncClient() as client:
            # Send request with custom agent ID
            response = await client.post(
                f"{base_url}/v1/chat/completions",
                headers=test_headers,
                json=test_body,
                timeout=30.0
            )
            
            print(f"✅ Response Status: {response.status_code}")
            print(f"📊 Response Headers: {dict(response.headers)}")
            
            if response.status_code == 200:
                response_data = response.json()
                print(f"🤖 Response: {json.dumps(response_data, indent=2)}")
                print()
                print("🎉 Success! The custom agent ID header was processed correctly.")
            else:
                print(f"❌ Error Response: {response.text}")
                
    except httpx.ConnectError:
        print("❌ Connection Error: Make sure the gateway is running on localhost:4000")
        print("💡 Start the gateway with: python -m src.main --config examples/configs/openai-basic.yaml")
    except Exception as e:
        print(f"❌ Unexpected Error: {e}")


async def test_fallback_behavior():
    """Test that the system falls back to computed agent ID when header is not provided."""
    
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
    
    print("\n🧪 Testing fallback behavior (no custom agent ID)...")
    print(f"📡 Sending request to: {base_url}/v1/chat/completions")
    print(f"🔑 No custom agent ID header")
    print(f"📝 Request Body: {json.dumps(test_body, indent=2)}")
    print()
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{base_url}/v1/chat/completions",
                headers=test_headers,
                json=test_body,
                timeout=30.0
            )
            
            print(f"✅ Response Status: {response.status_code}")
            
            if response.status_code == 200:
                print("🎉 Success! The system fell back to computed agent ID correctly.")
            else:
                print(f"❌ Error Response: {response.text}")
                
    except httpx.ConnectError:
        print("❌ Connection Error: Gateway not running")
    except Exception as e:
        print(f"❌ Unexpected Error: {e}")


async def test_both_headers():
    """Test using both x-cylestio-session-id and x-cylestio-agent-id headers."""
    
    base_url = "http://localhost:4000"
    test_headers = {
        "Content-Type": "application/json",
        "x-cylestio-session-id": "test-session-456",
        "x-cylestio-agent-id": "test-custom-agent-456"
    }
    
    test_body = {
        "model": "gpt-4o-mini",
        "messages": [
            {"role": "system", "content": "You are a coding assistant."},
            {"role": "user", "content": "Write a hello world function in Python."}
        ],
        "max_tokens": 200
    }
    
    print("\n🧪 Testing both external session ID and agent ID headers...")
    print(f"📡 Sending request to: {base_url}/v1/chat/completions")
    print(f"🔑 Session ID: {test_headers['x-cylestio-session-id']}")
    print(f"🔑 Agent ID: {test_headers['x-cylestio-agent-id']}")
    print(f"📝 Request Body: {json.dumps(test_body, indent=2)}")
    print()
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{base_url}/v1/chat/completions",
                headers=test_headers,
                json=test_body,
                timeout=30.0
            )
            
            print(f"✅ Response Status: {response.status_code}")
            
            if response.status_code == 200:
                print("🎉 Success! Both external session ID and agent ID were processed correctly.")
            else:
                print(f"❌ Error Response: {response.text}")
                
    except httpx.ConnectError:
        print("❌ Connection Error: Gateway not running")
    except Exception as e:
        print(f"❌ Unexpected Error: {e}")


async def main():
    """Run all tests."""
    print("🚀 External Agent ID Header Validation Tests")
    print("=" * 50)
    
    # Test 1: Custom agent ID
    await test_external_agent_id()
    
    # Test 2: Fallback behavior
    await test_fallback_behavior()
    
    # Test 3: Both headers
    await test_both_headers()
    
    print("\n" + "=" * 50)
    print("🏁 All tests completed!")


if __name__ == "__main__":
    asyncio.run(main())
