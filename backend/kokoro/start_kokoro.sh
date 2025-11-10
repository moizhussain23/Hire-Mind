#!/bin/bash

# Start Kokoro TTS Server
# This script starts the Kokoro server manually

cd "$(dirname "$0")"

# Activate virtual environment
if [ -d "venv" ]; then
    if [ -f "venv/bin/activate" ]; then
        source venv/bin/activate
    elif [ -f "venv/Scripts/activate" ]; then
        source venv/Scripts/activate
    fi
fi

# Start the server
python kokoro_server.py

