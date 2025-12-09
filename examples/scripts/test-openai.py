#!/usr/bin/env python3
"""
Example script to test OpenAI API through the proxy server.
Make sure your proxy server is running first.
"""
import asyncio
import json
import httpx


async def test_openai_proxy():
    """Test OpenAI API through the proxy server."""
    proxy_url = "http://localhost:4000"
    
    async with httpx.AsyncClient() as client:
        print("🔄 Testing OpenAI Chat Completion...")
        
        # Test regular chat completion
        response = await client.post(
            f"{proxy_url}/v1/chat/completions",
            json={
                "model": "gpt-3.5-turbo",
                "messages": [
                    {"role": "user", "content": "Hello! Can you tell me a short joke?"}
                ],
                "max_tokens": 100
            },
            timeout=30.0
        )
        
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Response: {result['choices'][0]['message']['content']}")
        else:
            print(f"❌ Error: {response.text}")
        
        print("\n" + "="*50 + "\n")
        
        # Test streaming chat completion
        print("🔄 Testing OpenAI Streaming...")
        
        async with client.stream(
            "POST",
            f"{proxy_url}/v1/chat/completions",
            json={
                "model": "gpt-3.5-turbo",
                "messages": [
                    {"role": "user", "content": "Count from 1 to 5"}
                ],
                "stream": True,
                "max_tokens": 50
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
    print("🚀 Testing LLM Proxy Server with OpenAI")
    print("Make sure your proxy server is running on http://localhost:4000")
    print("And set your OPENAI_API_KEY environment variable\n")
    
    try:
        asyncio.run(test_openai_proxy())
    except httpx.ConnectError:
        print("❌ Could not connect to proxy server. Is it running on http://localhost:4000?")
    except Exception as e:
        print(f"❌ Error: {e}")