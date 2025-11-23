# 🧠 Hire Mind - AI Agent Commands

This file contains custom commands and configuration for AI agents working on the Hire Mind AI-powered interview platform.

## 🤖 Model Configuration Command

Use this command to configure the AI model for optimal performance with this project:

```
/model gemini-2.0-flash "You are an expert AI developer working on Hire Mind, an advanced AI-powered interview platform. This system integrates multiple AI services and technologies:

## Project Architecture:
- **Frontend**: React 18 + TypeScript, Tailwind CSS, WebRTC, Monaco Editor, Face-api.js
- **Backend**: Node.js + Express, MongoDB + Mongoose, Socket.io, JWT + Clerk auth
- **AI Services**: Google Gemini Pro (primary), Groq Llama3-8b (fallback), OpenAI GPT (optional)
- **TTS Services**: Kokoro TTS (primary), Google Cloud TTS, ElevenLabs, local TTS models
- **Computer Vision**: Face-api.js for identity verification
- **Cloud Services**: Cloudinary for media storage

## Key AI Components:
1. **Gemini Service** (geminiService.ts):
   - Primary: gemini-2.0-flash (faster, newer)
   - Fallback: gemini-1.5-flash (more stable)
   - Question generation with creativity (higher temperature)
   - Answer evaluation with consistency (lower temperature)

2. **Groq Service** (ai.ts):
   - Model: llama3-8b-8192
   - Used for backup AI operations and analysis

3. **TTS Pipeline**:
   - Kokoro TTS (via Python server) - High quality natural speech
   - Google Gemini TTS (gemini-2.5-flash-preview-tts)
   - ElevenLabs API with multiple voice models
   - Local TTS models (Coqui TTS)

## Development Guidelines:
- Handle model failures gracefully with fallbacks
- Implement proper error handling for AI service timeouts
- Optimize for real-time interview scenarios
- Ensure GDPR compliance for AI-generated content
- Test AI responses for bias and fairness
- Maintain conversation context for dynamic interviews
- Implement proper rate limiting for AI APIs

## Interview AI Features:
- Dynamic question generation based on candidate profiles
- Real-time answer evaluation and scoring
- Adaptive conversation flow
- Multi-dimensional assessment (technical, behavioral, communication)
- Voice synthesis for natural interview experience
- Transcript analysis and sentiment detection

Focus on creating robust, scalable AI solutions that enhance the interview experience while maintaining fairness and accuracy."
```

## 🎯 Project-Specific Context

When working on this codebase, consider:

### AI Service Integration
- Multiple AI providers with automatic failover
- Real-time processing requirements for live interviews
- Voice synthesis quality and latency optimization
- Evaluation scoring consistency and bias prevention

### Interview Domain Knowledge
- Technical interview question generation
- Behavioral assessment criteria
- Code evaluation and execution
- Resume parsing and analysis
- Identity verification workflows

### Performance Considerations
- Sub-second AI response times required
- Concurrent interview support (1000+)
- Audio processing and streaming
- Real-time transcription accuracy
- WebRTC integration for video calls

### Security & Compliance
- GDPR compliance for AI-generated content
- Secure handling of candidate data
- End-to-end encryption for communications
- Audit trails for AI decisions
- Bias detection and mitigation

## 🔧 Development Commands

### AI Service Testing
```bash
# Test Gemini service
npm run test -- geminiService.test.ts

# Test TTS services
python backend/kokoro/test_kokoro_request.py
node backend/kokoro/test-tts.js

# Check AI service health
curl http://localhost:8000/health
```

### Model Performance Monitoring
```bash
# Check interview completion rates
npm run check-interviews

# Monitor AI response times
npm run check-simple

# Verify TTS pipeline
npm run test -- tts
```

## 📋 Common Tasks

1. **Adding New AI Models**: Update service configs in `/backend/src/services/`
2. **TTS Voice Management**: Modify voice presets in `ttsService.ts`
3. **Question Bank Updates**: Edit question generation prompts in `geminiService.ts`
4. **Evaluation Criteria**: Adjust scoring algorithms in evaluation functions
5. **Fallback Logic**: Implement graceful degradation for service failures

## 🚀 Quick Start for AI Development

1. Set up environment variables for all AI services
2. Test individual services before integration
3. Implement proper error handling and logging
4. Monitor API usage and rate limits
5. Validate AI outputs for bias and accuracy

---
*This configuration optimizes AI agent performance for Hire Mind's complex interview platform requirements.*