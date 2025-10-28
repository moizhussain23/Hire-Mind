// Direct API test for Gemini
require('dotenv').config();

async function testGeminiDirect() {
  const API_KEY = process.env.GEMINI_API_KEY;
  
  console.log('🧪 Testing Gemini API directly...\n');
  console.log(`API Key: ${API_KEY ? API_KEY.substring(0, 20) + '...' : 'NOT SET'}\n`);

  // Test with v1 API (not v1beta)
  const url = `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: 'Generate a professional interview question for a Senior React Developer named John Doe.'
          }]
        }]
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('❌ API Error:', response.status, response.statusText);
      console.error('Error details:', error);
      return false;
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    console.log('✅ Gemini API SUCCESS!\n');
    console.log('Question:', text?.substring(0, 150) + '...\n');
    console.log('✨ Working model: gemini-2.0-flash');
    console.log('✨ API version: v1 (not v1beta)\n');

    return true;
  } catch (error) {
    console.error('❌ Request failed:', error.message);
    return false;
  }
}

async function testGeminiTTSWithSDK() {
  console.log('🧪 Testing Gemini Native TTS with @google/genai SDK...\n');

  try {
    const { GoogleGenAI } = require('@google/genai');
    
    // Initialize client with API key
    const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const prompt = "Say this in a cheerful and professional voice: 'Hello! I'm AIRA, your AI interviewer. Let's start with some questions about your background.'";

    console.log('   Generating audio...');
    
    // Use the models.generateContent method
    const result = await client.models.generateContent({
      model: 'gemini-2.5-flash-preview-tts',
      contents: [{
        parts: [{ text: prompt }]
      }],
      config: {
        responseModalities: ['AUDIO']
      }
    });

    // Debug: Log the entire response structure
    console.log('   Response structure:', JSON.stringify(result, null, 2));

    // Try different possible response structures
    let audioData = null;
    
    // Try: result.response.parts[0].audio.data
    if (result.response?.parts?.[0]?.audio?.data) {
      audioData = result.response.parts[0].audio.data;
    }
    // Try: result.candidates[0].content.parts[0].inlineData.data
    else if (result.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data) {
      audioData = result.candidates[0].content.parts[0].inlineData.data;
    }
    // Try: result.response.candidates[0].content.parts[0].inlineData.data
    else if (result.response?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data) {
      audioData = result.response.candidates[0].content.parts[0].inlineData.data;
    }
    
    if (!audioData) {
      throw new Error('No audio data in response - check console for response structure');
    }

    const pcmData = Buffer.from(audioData, 'base64');

    // Check the first few bytes to identify format
    const header = pcmData.slice(0, 12).toString('hex');
    console.log('   Audio header (hex):', header);
    
    // Gemini returns raw PCM data (16-bit, 24000 Hz, mono)
    // We need to wrap it in a WAV header
    console.log('   Format: Raw PCM (needs WAV header)');
    
    // Create WAV header
    const sampleRate = 24000;
    const numChannels = 1;
    const bitsPerSample = 16;
    const byteRate = sampleRate * numChannels * bitsPerSample / 8;
    const blockAlign = numChannels * bitsPerSample / 8;
    const dataSize = pcmData.length;
    
    const wavHeader = Buffer.alloc(44);
    
    // RIFF header
    wavHeader.write('RIFF', 0);
    wavHeader.writeUInt32LE(36 + dataSize, 4);
    wavHeader.write('WAVE', 8);
    
    // fmt chunk
    wavHeader.write('fmt ', 12);
    wavHeader.writeUInt32LE(16, 16); // fmt chunk size
    wavHeader.writeUInt16LE(1, 20); // audio format (1 = PCM)
    wavHeader.writeUInt16LE(numChannels, 22);
    wavHeader.writeUInt32LE(sampleRate, 24);
    wavHeader.writeUInt32LE(byteRate, 28);
    wavHeader.writeUInt16LE(blockAlign, 32);
    wavHeader.writeUInt16LE(bitsPerSample, 34);
    
    // data chunk
    wavHeader.write('data', 36);
    wavHeader.writeUInt32LE(dataSize, 40);
    
    // Combine header and PCM data
    const wavBuffer = Buffer.concat([wavHeader, pcmData]);

    // Save to file
    const fs = require('fs');
    const filename = 'test-gemini-tts.wav';
    fs.writeFileSync(filename, wavBuffer);

    console.log('✅ Gemini TTS SUCCESS!\n');
    console.log(`   PCM data size: ${pcmData.length} bytes`);
    console.log(`   WAV file size: ${wavBuffer.length} bytes`);
    console.log(`   Sample rate: ${sampleRate} Hz`);
    console.log(`   Channels: ${numChannels} (mono)`);
    console.log(`   Bits per sample: ${bitsPerSample}`);
    console.log(`   Saved to: ${filename}`);
    console.log('   🎵 Play the WAV file now!\n');
    
    return true;
  } catch (error) {
    console.error('❌ Gemini TTS failed:', error.message);
    console.error('   Full error:', error);
    return false;
  }
}

async function main() {
  console.log('═══════════════════════════════════════════════════');
  console.log('🧪 GEMINI DIRECT API TEST');
  console.log('═══════════════════════════════════════════════════\n');

  const questionsWork = await testGeminiDirect();
  const ttsWorks = await testGeminiTTSWithSDK();

  console.log('═══════════════════════════════════════════════════');
  console.log('📊 RESULTS');
  console.log('═══════════════════════════════════════════════════\n');
  console.log(`Gemini Questions: ${questionsWork ? '✅ WORKING' : '❌ FAILED'}`);
  console.log(`Gemini Native TTS: ${ttsWorks ? '✅ WORKING' : '❌ FAILED'}\n`);

  if (questionsWork) {
    console.log('📝 Use API version: v1 (not v1beta)');
    console.log('📝 Use model: gemini-2.0-flash\n');
  }
}

main().catch(console.error);
