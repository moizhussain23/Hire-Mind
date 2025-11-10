"""
Generate AIRA voice samples with proper name pronunciation
Creates nested folder structure: voices/samples/
"""

import os
from kokoro import KPipeline
import soundfile as sf
import torch

VOICES_DIR = "voices"
SAMPLES_DIR = "voices/samples"
SPEED = 0.9

def setup_folders():
    """Create nested samples folder"""
    os.makedirs(SAMPLES_DIR, exist_ok=True)
    print(f"[SETUP] Samples folder: {os.path.abspath(SAMPLES_DIR)}")

def list_voices():
    """Get all voice files"""
    voices = []
    if os.path.exists(VOICES_DIR):
        for file in os.listdir(VOICES_DIR):
            if file.endswith('.pt') and not file.startswith('.'):
                voice_name = file.replace('.pt', '')
                voice_path = os.path.join(VOICES_DIR, file)
                voices.append({'name': voice_name, 'path': voice_path})
    return sorted(voices, key=lambda x: x['name'])

def get_aira_texts():
    """Get different text variations to ensure proper AIRA pronunciation"""
    return {
        # Kokoro phonetic guide format: [Word](/phonetic/)
        # /ˈaɪrə/ = EYE-rah pronunciation
        'phonetic': "Hello! Welcome to your interview. My name is [AIRA](/ˈaɪrə/), your AI interviewer. Please tell me about yourself.",
        
        # Alternative: spelled phonetically in text
        'phonetic_spelled': "Hello! Welcome to your interview. My name is EYE-rah, your AI interviewer. Please tell me about yourself.",
        
        # Simple text (may spell out as A-I-R-A)
        'simple': "Hello! Welcome to your interview. My name is AIRA, your AI interviewer. Please tell me about yourself.",
        
        # With context (sometimes helps)
        'context': "Hello! Welcome to your interview. I'm [AIRA](/ˈaɪrə/), your AI interviewer today. Please introduce yourself and tell me about your background."
    }

def generate_with_voice(pipeline, text, voice_tensor, voice_name, version_name=""):
    """Generate audio sample"""
    try:
        generator = pipeline(text, voice=voice_tensor, speed=SPEED)
        
        audio_segments = []
        for graphemes, phonemes, audio in generator:
            audio_segments.append(audio)
        
        if audio_segments:
            full_audio = torch.cat(audio_segments, dim=0).numpy()
            
            # Save with version suffix if provided
            filename = f"{voice_name}_aira_only1.wav" if not version_name else f"{voice_name}_aira_{version_name}.wav"
            filepath = os.path.join(SAMPLES_DIR, filename)
            
            sf.write(filepath, full_audio, 24000)
            
            duration = len(full_audio) / 24000
            size_kb = os.path.getsize(filepath) / 1024
            
            return {
                'success': True,
                'file': filename,
                'path': filepath,
                'duration': duration,
                'size': size_kb
            }
    except Exception as e:
        return {'success': False, 'error': str(e)}
    
    return {'success': False, 'error': 'No audio generated'}

print("=" * 70)
print("AIRA Voice Sample Generator")
print("=" * 70)

try:
    # Setup
    setup_folders()
    
    # Initialize pipeline
    print("\n[1/4] Initializing Kokoro...")
    pipeline = KPipeline(lang_code='a')
    print("[OK] Pipeline ready")
    
    # Get voices - only use aoede and kore
    print("\n[2/4] Loading voices...")
    all_voices = list_voices()
    
    # Filter to only use af_aoede and af_kore
    SELECTED_VOICES = ['af_aoede', 'af_kore']
    voices = [v for v in all_voices if v['name'] in SELECTED_VOICES]
    
    print(f"[OK] Found {len(all_voices)} total voice(s)")
    print(f"[OK] Using selected voices: {', '.join(SELECTED_VOICES)}")
    
    if not voices:
        print(f"[ERROR] Selected voices not found! Looking for: {SELECTED_VOICES}")
        print(f"Available voices: {[v['name'] for v in all_voices]}")
        exit(1)
    
    # Get text variations
    texts = get_aira_texts()
    
    print("\n[3/4] Generating samples...")
    print(f"Text: 'Hello! Welcome to your interview. My name is AIRA...'")
    print(f"Speed: {SPEED}")
    
    # Use phonetic pronunciation guide to ensure AIRA is pronounced as name, not spelled
    # Kokoro format: [Word](/phonetic/) - This forces proper pronunciation
    text_to_use = texts['phonetic']  # Uses [AIRA](/ˈaɪrə/) format
    
    print("\n[INFO] Using phonetic pronunciation guide: [AIRA](/ˈaɪrə/)")
    print("[INFO] This ensures AIRA is pronounced as 'EYE-rah', not spelled out.")
    
    results = []
    for voice_info in voices:
        voice_name = voice_info['name']
        voice_path = voice_info['path']
        
        print(f"\n  [{voice_name}] Processing...")
        
        # Load voice tensor
        try:
            voice_tensor = torch.load(voice_path, weights_only=True)
        except Exception as e:
            print(f"    [SKIP] Failed to load: {e}")
            continue
        
        # Try simple text first
        result = generate_with_voice(pipeline, text_to_use, voice_tensor, voice_name)
        
        if result['success']:
            print(f"    [OK] {result['file']} ({result['duration']:.2f}s, {result['size']:.1f}KB)")
            results.append(result)
        else:
            print(f"    [FAIL] {result.get('error', 'Unknown error')}")
    
    # Summary
    print("\n" + "=" * 70)
    print(f"[4/4] COMPLETE: {len(results)}/{len(voices)} samples generated")
    print(f"\nSamples saved to:")
    print(f"  {os.path.abspath(SAMPLES_DIR)}")
    print("=" * 70)
    
    # Pronunciation info
    print("\n[PRONUNCIATION] Using phonetic guide: [AIRA](/ˈaɪrə/)")
    print("  This should pronounce AIRA as 'EYE-rah' (like 'Ira' with an A)")
    print("\n  If it still spells out, you can:")
    print("    - Edit script: Change text_to_use to texts['phonetic_spelled']")
    print("    - Or manually replace AIRA with 'EYE-rah' in the text")
    
except Exception as e:
    print(f"\n[ERROR] {e}")
    import traceback
    traceback.print_exc()

