"""
Kokoro TTS Persistent Server
Keeps Kokoro pipeline initialized and ready for fast audio generation.

This server runs continuously and accepts HTTP requests for audio generation.
It initializes Kokoro once at startup, then reuses the same pipeline for all requests.
"""

from flask import Flask, request, jsonify, Response
from flask_cors import CORS
import soundfile as sf
import torch
import os
import sys
import io
import warnings
from pathlib import Path

# Suppress warnings (they're just informational)
warnings.filterwarnings('ignore')

app = Flask(__name__)
CORS(app)

# Global pipeline instance (initialized once at startup)
pipeline = None
voice_tensors = {}

# Get backend directory (parent of this script)
BACKEND_DIR = Path(__file__).parent.resolve()
VOICES_DIR = BACKEND_DIR / 'voices'

def initialize_kokoro():
    """Initialize Kokoro pipeline once at startup"""
    global pipeline
    
    try:
        print("Initializing Kokoro TTS pipeline...", flush=True)
        from kokoro import KPipeline
        
        # Initialize pipeline (this takes 15-20 seconds)
        pipeline = KPipeline(lang_code='a')
        print("Kokoro pipeline initialized and ready!", flush=True)
        return True
    except Exception as e:
        print(f"ERROR: Failed to initialize Kokoro: {e}", flush=True)
        return False

def load_voice(voice_name: str):
    """Load voice tensor (cache it for reuse)"""
    global voice_tensors
    
    if voice_name in voice_tensors:
        return voice_tensors[voice_name]
    
    voice_path = VOICES_DIR / f"{voice_name}.pt"
    if not voice_path.exists():
        raise FileNotFoundError(f"Voice file not found: {voice_path}")
    
    # print(f"Loading voice: {voice_name}", flush=True)
    voice_tensor = torch.load(str(voice_path), weights_only=True)
    voice_tensors[voice_name] = voice_tensor
    # print(f"Voice loaded: {voice_name}", flush=True)
    return voice_tensor

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'ready' if pipeline is not None else 'not_ready',
        'kokoro_initialized': pipeline is not None
    })

@app.route('/generate', methods=['POST'])
def generate():
    """Generate speech from text"""
    global pipeline
    
    if pipeline is None:
        return jsonify({'error': 'Kokoro pipeline not initialized'}), 503
    
    try:
        # Get JSON data
        data = request.get_json(force=True, silent=True)
        if not data:
            return jsonify({'error': 'Invalid or missing JSON data'}), 400
        
        text = data.get('text', '')
        voice = data.get('voice', 'af_aoede')
        try:
            speed = float(data.get('speed', 0.9))
        except (ValueError, TypeError):
            speed = 0.9
        
        if not text:
            return jsonify({'error': 'Text is required'}), 400
        
        if voice not in ['af_aoede', 'af_kore']:
            return jsonify({'error': f'Invalid voice: {voice}. Use "af_aoede" or "af_kore"'}), 400
        
        # Process AIRA pronunciation - Kokoro uses special format
        # Format: [AIRA](/ˈaɪrə/) where the part in () is IPA pronunciation
        processed_text = text.replace('AIRA', '[AIRA](/ˈaɪrə/)')
        
        # Load voice (cached after first load)
        try:
            voice_tensor = load_voice(voice)
        except Exception as e:
            print(f"ERROR: Failed to load voice {voice}: {e}", flush=True)
            return jsonify({'error': f'Voice not found: {voice}'}), 404
        
        # Generate speech
        print(f"Generating: {text[:50]}...", flush=True)
        try:
            generator = pipeline(processed_text, voice=voice_tensor, speed=speed)
        except Exception as e:
            print(f"ERROR: Pipeline generation failed: {e}", flush=True)
            import traceback
            traceback.print_exc()
            return jsonify({'error': f'Generation failed: {str(e)}'}), 500
        
        # Process audio
        audio_segments = []
        try:
            for graphemes, phonemes, audio in generator:
                audio_segments.append(audio)
        except Exception as e:
            print(f"ERROR: Audio processing failed: {e}", flush=True)
            import traceback
            traceback.print_exc()
            return jsonify({'error': f'Audio processing failed: {str(e)}'}), 500
        
        if not audio_segments:
            return jsonify({'error': 'No audio generated'}), 500
        
        # Concatenate audio
        try:
            full_audio = torch.cat(audio_segments, dim=0).numpy()
        except Exception as e:
            print(f"ERROR: Audio concatenation failed: {e}", flush=True)
            return jsonify({'error': f'Audio concatenation failed: {str(e)}'}), 500
        
        # Convert to WAV bytes
        try:
            buffer = io.BytesIO()
            sf.write(buffer, full_audio, 24000, format='WAV')
            buffer.seek(0)
        except Exception as e:
            print(f"ERROR: WAV conversion failed: {e}", flush=True)
            import traceback
            traceback.print_exc()
            return jsonify({'error': f'WAV conversion failed: {str(e)}'}), 500
        
        audio_data = buffer.getvalue()
        print(f"Generated audio: {len(audio_data)} bytes", flush=True)
        
        # Return audio as binary response
        return Response(
            audio_data,
            mimetype='audio/wav',
            headers={
                'Content-Disposition': 'inline; filename=speech.wav',
                'Content-Length': str(len(audio_data))
            }
        )
        
    except Exception as e:
        error_msg = str(e)
        error_type = type(e).__name__
        print(f"ERROR: Generation error ({error_type}): {error_msg}", flush=True)
        import traceback
        print("Full traceback:", flush=True)
        traceback.print_exc()
        # Always return JSON, never let Flask return HTML
        return jsonify({
            'error': error_msg,
            'type': error_type
        }), 500

@app.route('/voices', methods=['GET'])
def list_voices():
    """List available voices"""
    try:
        if not VOICES_DIR.exists():
            return jsonify({'voices': []})
        
        voices = [f.stem for f in VOICES_DIR.glob('*.pt')]
        return jsonify({'voices': voices})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    # Initialize Kokoro on startup
    if not initialize_kokoro():
        print("ERROR: Failed to start Kokoro server - pipeline initialization failed", flush=True)
        sys.exit(1)
    
    # Load voices into cache
    print("Pre-loading voices...", flush=True)
    for voice_file in VOICES_DIR.glob('*.pt'):
        if voice_file.stem in ['af_aoede', 'af_kore']:
            try:
                load_voice(voice_file.stem)
            except Exception as e:
                print(f"WARNING: Failed to pre-load {voice_file.stem}: {e}", flush=True)
    
    print("Server ready on http://localhost:8765", flush=True)
    
    # Run server (bind to all interfaces for Docker/Render compatibility)
    app.run(host='0.0.0.0', port=8765, threaded=True, debug=False)

