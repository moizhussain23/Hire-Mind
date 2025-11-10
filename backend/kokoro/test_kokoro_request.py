"""
Test script to send a request to Kokoro server and see the actual error
"""

import requests
import json

url = "http://localhost:8765/generate"

payload = {
    "text": "hello test",
    "voice": "af_aoede",
    "speed": 0.9
}

try:
    print("Sending request to Kokoro server...")
    print(f"URL: {url}")
    print(f"Payload: {json.dumps(payload, indent=2)}")
    
    response = requests.post(
        url,
        json=payload,
        headers={'Content-Type': 'application/json'},
        timeout=30
    )
    
    print(f"\nStatus Code: {response.status_code}")
    print(f"Content-Type: {response.headers.get('Content-Type', 'unknown')}")
    
    if response.status_code == 200:
        print(f"✅ Success! Audio size: {len(response.content)} bytes")
        with open("test_audio_output.wav", "wb") as f:
            f.write(response.content)
        print("Audio saved to test_audio_output.wav")
    else:
        print(f"\nError Response:")
        try:
            error_json = response.json()
            print(json.dumps(error_json, indent=2))
        except:
            print(f"Response text (first 1000 chars):")
            print(response.text[:1000])
            
except requests.exceptions.RequestException as e:
    print(f"Request failed: {e}")
except Exception as e:
    print(f"Unexpected error: {e}")
    import traceback
    traceback.print_exc()

