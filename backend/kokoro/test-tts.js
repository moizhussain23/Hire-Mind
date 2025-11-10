// Simple test script to verify Gemini TTS audio generation
require('dotenv').config();
const fs = require('fs');

async function testGeminiNativeTTS() {
  console.log('\n🧪 Testing Gemini Native TTS (gemini-2.5-flash-native-audio-preview-09-2025)...\n');
  
  try {
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    // Use the correct Gemini Native TTS model
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash-native-audio-preview-09-2025'
    });

    const result = await model.generateContent({
      contents: [{ 
        parts: [{ text: 'Say cheerfully: Hello! This is a test of Gemini text to speech.' }] 
      }],
      generationConfig: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' }
          }
        }
      }
    });

    // Extract audio data
    const audioData = result.response?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    
    if (!audioData) {
      throw new Error('No audio data in response');
    }

    const buffer = Buffer.from(audioData, 'base64');
    
    // Save to file
    fs.writeFileSync('test-gemini-tts.wav', buffer);
    
    console.log('✅ Gemini Native TTS SUCCESS!');
    console.log(`   Audio size: ${buffer.length} bytes`);
    console.log(`   Saved to: test-gemini-tts.wav`);
    console.log('   🎵 Play the file to hear the audio!\n');
    
    return true;
  } catch (error) {
    console.error('❌ Gemini Native TTS FAILED:', error.message);
    console.error('   Error details:', error.response?.data || error);
    return false;
  }
}

async function testGemini() {
  console.log('\n🧪 Testing Gemini Question Generation...\n');
  
  // Try multiple model names to find which one works
  const modelsToTry = [
    'gemini-1.5-pro',
    'gemini-1.5-flash', 
    'gemini-pro',
    'gemini-1.0-pro'
  ];

  for (const modelName of modelsToTry) {
    try {
      console.log(`   Trying model: ${modelName}...`);
      const { GoogleGenerativeAI } = require('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: modelName });

      const prompt = `Generate a professional interview question for a Senior React Developer position. 
The candidate's name is John Doe. Make it personalized and engaging.`;

      const result = await model.generateContent(prompt);
      const question = result.response.text();

      console.log(`✅ Gemini Question Generation SUCCESS with ${modelName}!`);
      console.log(`   Question: ${question.substring(0, 100)}...`);
      console.log(`   ✨ Use this model: ${modelName}\n`);
      
      return { success: true, model: modelName };
    } catch (error) {
      console.log(`   ❌ ${modelName} failed: ${error.message}`);
    }
  }
  
  console.error('\n❌ All Gemini models failed!');
  return { success: false, model: null };
}

async function main() {
  console.log('═══════════════════════════════════════════════════');
  console.log('🧪 GEMINI TTS & QUESTION TESTING');
  console.log('═══════════════════════════════════════════════════');

  // Check environment variables
  console.log('\n📋 Checking Environment Variables...\n');
  console.log(`   GEMINI_API_KEY: ${process.env.GEMINI_API_KEY ? '✅ Set' : '❌ Missing'}`);

  if (!process.env.GEMINI_API_KEY) {
    console.error('\n❌ GEMINI_API_KEY is not set in .env file!');
    process.exit(1);
  }

  // Test Gemini Native TTS
  const geminiTTSWorks = await testGeminiNativeTTS();

  // Test Gemini Question Generation
  const geminiResult = await testGemini();

  // Summary
  console.log('═══════════════════════════════════════════════════');
  console.log('📊 TEST RESULTS SUMMARY');
  console.log('═══════════════════════════════════════════════════\n');
  console.log(`   Gemini Native TTS: ${geminiTTSWorks ? '✅ WORKING' : '❌ NOT AVAILABLE'}`);
  console.log(`   Gemini Questions: ${geminiResult.success ? '✅ WORKING' : '❌ FAILED'}`);
  if (geminiResult.success) {
    console.log(`   Working Model: ${geminiResult.model}`);
  }
  console.log('');

  if (geminiResult.success) {
    console.log('🎉 GEMINI QUESTIONS WORKING!\n');
    console.log('📝 Next Steps:');
    console.log(`   1. Update geminiService.ts to use: ${geminiResult.model}`);
    console.log('   2. Continue using ElevenLabs for TTS (Gemini TTS not available)\n');
  } else {
    console.log('❌ Gemini is not working. Check your API key.\n');
  }
}

main();
