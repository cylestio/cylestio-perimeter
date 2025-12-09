#!/usr/bin/env python3
"""
Example script to test Anthropic Claude API through the proxy server.
Make sure your proxy server is running first.
"""
import asyncio
import json
import httpx


async def test_anthropic_proxy():
    """Test Anthropic Claude API through the proxy server."""
    proxy_url = "http://localhost:4000"
    
    async with httpx.AsyncClient() as client:
        print("🔄 Testing Anthropic Claude Completion...")
        
        # Test regular completion
        response = await client.post(
            f"{proxy_url}/v1/messages",
            json={
                "model": "claude-3-haiku-20240307",
                "max_tokens": 100,
                "messages": [
                    {"role": "user", "content": "Hello! Can you tell me a short joke?"}
                ]
            },
            timeout=30.0
        )
        
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Response: {result['content'][0]['text']}")
        else:
            print(f"❌ Error: {response.text}")
        
        print("\n" + "="*50 + "\n")
        
        # Test streaming completion
        print("🔄 Testing Anthropic Streaming...")
        
        async with client.stream(
            "POST",
            f"{proxy_url}/v1/messages",
            json={
                "model": "claude-3-haiku-20240307",
                "max_tokens": 50,
                "messages": [
                    {"role": "user", "content": "Count from 1 to 5"}
                ],
                "stream": True
            }
        ) as stream_response:
            print(f"Stream Status: {stream_response.status_code}")
            
            if stream_response.status_code == 200:
                print("✅ Streaming response:")
                async for chunk in stream_response.aiter_bytes():
                    chunk_str = chunk.decode('utf-8')
                    if chunk_str.strip():
                        print(chunk_str, end='', flush=True)
                print("\n✅ Streaming completed!")
            else:
                content = await stream_response.aread()
                print(f"❌ Streaming error: {content.decode()}")


if __name__ == "__main__":
    print("🚀 Testing LLM Proxy Server with Anthropic Claude")
    print("Make sure your proxy server is running on http://localhost:4000")
    print("And set your ANTHROPIC_API_KEY environment variable\n")
    
    try:
        asyncio.run(test_anthropic_proxy())
    except httpx.ConnectError:
        print("❌ Could not connect to proxy server. Is it running on http://localhost:4000?")
    except Exception as e:
        print(f"❌ Error: {e}")