# 🤖 AI Services Documentation

## Overview

This directory contains all AI-powered services for the Hire Mind interview platform.

---

## 📁 Services

### 1. **geminiService.ts** - AI Question Generation & Scoring

**Purpose:** Generate personalized interview questions and score interviews using Google Gemini Pro.

**Key Functions:**

#### `generateInterviewQuestion(context)`
Generates a personalized interview question based on context.

```typescript
const question = await generateInterviewQuestion({
  candidateName: 'John Doe',
  position: 'Senior Software Engineer',
  skillCategory: 'technical',
  experienceLevel: 'senior',
  resumeData: {
    skills: ['React', 'Node.js', 'TypeScript'],
    experience: ['5 years at Google'],
    education: ['BS Computer Science'],
    projects: ['E-commerce platform']
  },
  previousAnswers: ['I have 5 years of experience...'],
  questionNumber: 1,
  interviewPhase: 'behavioral'
});

// Returns: "Based on your experience at Google, can you tell me about..."
```

#### `scoreInterview(context)`
Scores a completed interview with detailed feedback.

```typescript
const score = await scoreInterview({
  transcript: [
    { sender: 'ai', text: 'Tell me about yourself', timestamp: '...' },
    { sender: 'candidate', text: 'I am a software engineer...', timestamp: '...' }
  ],
  codeSubmissions: [
    { code: 'function hello() {...}', language: 'javascript', timestamp: 123 }
  ],
  position: 'Software Engineer',
  skillCategory: 'technical',
  problemSolved: true
});

// Returns:
// {
//   technicalSkills: 85,
//   communication: 90,
//   problemSolving: 88,
//   codeQuality: 82,
//   confidence: 87,
//   overallScore: 86,
//   strengths: ['Strong communication', 'Good problem-solving'],
//   improvements: ['Code optimization', 'Edge case handling'],
//   summary: 'Candidate demonstrated strong technical skills...',
//   detailedFeedback: { ... }
// }
```

#### `analyzeResume(resumeText)`
Analyzes resume text and extracts structured information.

```typescript
const analysis = await analyzeResume(resumeText);

// Returns:
// {
//   skills: ['JavaScript', 'React', 'Node.js'],
//   experience: ['Software Engineer at Google (2020-2023)'],
//   education: ['BS Computer Science, MIT'],
//   projects: ['Built e-commerce platform'],
//   summary: 'Experienced software engineer with 5 years...'
// }
```

**Cost:** FREE (1M tokens/month)  
**Speed:** ~2-3 seconds per request  
**Quality:** High (comparable to GPT-4)

---

### 2. **ttsService.ts** - Text-to-Speech

**Purpose:** Convert text to natural-sounding speech using Google Cloud TTS.

**Key Functions:**

#### `generateSpeech(options)`
Generate speech audio from text.

```typescript
const audioBuffer = await generateSpeech({
  text: 'Hello! I am AIRA, your AI interviewer.',
  languageCode: 'en-US',
  voiceName: 'en-US-Neural2-F',
  speakingRate: 0.95,
  pitch: 1.0,
  volumeGainDb: 0.0
});

// Returns: Buffer (MP3 audio)
```

#### `generateSpeechWithPreset(text, preset)`
Generate speech using a voice preset.

```typescript
const audioBuffer = await generateSpeechWithPreset(
  'Welcome to your interview!',
  'AIRA_PROFESSIONAL'
);

// Available presets:
// - AIRA_PROFESSIONAL (default)
// - AIRA_FRIENDLY
// - AIRA_FORMAL
// - MALE_PROFESSIONAL
```

#### `batchGenerateSpeech(texts, preset)`
Generate speech for multiple texts at once.

```typescript
const audioBuffers = await batchGenerateSpeech([
  'Question 1: Tell me about yourself',
  'Question 2: What are your strengths?',
  'Question 3: Why this position?'
], 'AIRA_PROFESSIONAL');

// Returns: Buffer[] (array of audio buffers)
```

#### `estimateTTSCost(characterCount)`
Estimate cost for TTS usage.

```typescript
const estimate = estimateTTSCost(500000);

// Returns:
// {
//   characters: 500000,
//   cost: 0, // Within free tier
//   withinFreeTier: true
// }
```

**Cost:** FREE (1M characters/month)  
**Speed:** ~1-2 seconds per request  
**Quality:** Very natural (Google Neural2 voices)

---

### 3. **resumeParser.ts** - Resume Parsing

**Purpose:** Parse PDF resumes and extract structured information.

**Key Functions:**

#### `parseResume(pdfBuffer)`
Parse a PDF resume and extract all information.

```typescript
const parsed = await parseResume(pdfBuffer);

// Returns:
// {
//   rawText: 'Full resume text...',
//   skills: ['JavaScript', 'React', 'Node.js', ...],
//   experience: ['Software Engineer at Google (2020-2023)', ...],
//   education: ['BS Computer Science, MIT', ...],
//   projects: ['E-commerce platform', ...],
//   summary: 'Experienced software engineer...',
//   contactInfo: {
//     email: 'john@example.com',
//     phone: '+1-555-0123',
//     linkedin: 'https://linkedin.com/in/johndoe',
//     github: 'https://github.com/johndoe'
//   },
//   metadata: {
//     totalExperience: '5 years',
//     currentRole: 'Software Engineer',
//     education: 'BS Computer Science'
//   }
// }
```

#### `validateResumeFile(file)`
Validate uploaded resume file.

```typescript
const validation = validateResumeFile(file);

// Returns:
// {
//   valid: true,
//   error: null
// }
// or
// {
//   valid: false,
//   error: 'Only PDF files are allowed'
// }
```

#### `calculateMatchScore(resumeSkills, requiredSkills)`
Calculate how well resume matches job requirements.

```typescript
const match = calculateMatchScore(
  ['JavaScript', 'React', 'Node.js', 'MongoDB'],
  ['JavaScript', 'React', 'TypeScript', 'PostgreSQL']
);

// Returns:
// {
//   score: 50, // 2 out of 4 skills matched
//   matchedSkills: ['JavaScript', 'React'],
//   missingSkills: ['TypeScript', 'PostgreSQL']
// }
```

**Cost:** FREE  
**Speed:** ~3-5 seconds per resume  
**Accuracy:** 85-95%

---

## 🔧 Configuration

### Environment Variables

```env
# Google Gemini Pro
GEMINI_API_KEY=your_gemini_api_key

# Google Cloud TTS
GOOGLE_APPLICATION_CREDENTIALS=./google-credentials.json

# Groq (Fallback)
GROQ_API_KEY=your_groq_api_key

# Cloudinary (Storage)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

---

## 📊 Usage Limits (FREE Tier)

| Service | Free Limit | Estimated Interviews |
|---------|-----------|---------------------|
| Gemini Pro | 1M tokens/month | ~5000 interviews |
| Google TTS | 1M chars/month | ~2000 interviews |
| Groq | 14.4K req/day | ~400K/month |
| Cloudinary | 25GB storage | ~500 videos |

---

## 🚀 Quick Start

```typescript
// 1. Generate interview question
import { generateInterviewQuestion } from './services/geminiService';

const question = await generateInterviewQuestion({
  candidateName: 'John',
  position: 'Software Engineer',
  skillCategory: 'technical',
  experienceLevel: 'mid',
  previousAnswers: [],
  questionNumber: 0,
  interviewPhase: 'behavioral'
});

// 2. Convert to speech
import { generateSpeechWithPreset } from './services/ttsService';

const audio = await generateSpeechWithPreset(question, 'AIRA_PROFESSIONAL');

// 3. Parse resume
import { parseResume } from './services/resumeParser';

const parsed = await parseResume(pdfBuffer);

// 4. Score interview
import { scoreInterview } from './services/geminiService';

const score = await scoreInterview({
  transcript,
  codeSubmissions,
  position: 'Software Engineer',
  skillCategory: 'technical',
  problemSolved: true
});
```

---

## 🐛 Error Handling

All services include fallback mechanisms:

```typescript
try {
  const question = await generateInterviewQuestion(context);
} catch (error) {
  // Automatically falls back to hardcoded questions
  console.error('AI service error:', error);
}
```

---

## 📈 Performance Tips

1. **Batch requests** when possible (TTS batch generation)
2. **Cache common questions** to reduce API calls
3. **Use Groq as fallback** for high-volume scenarios
4. **Monitor API quotas** regularly

---

## 🔒 Security

- ✅ API keys stored in `.env` (not committed)
- ✅ File validation (PDF only, max 5MB)
- ✅ Rate limiting on all endpoints
- ✅ Error messages don't expose sensitive data

---

## 📚 Additional Resources

- [Google Gemini Docs](https://ai.google.dev/docs)
- [Google Cloud TTS Docs](https://cloud.google.com/text-to-speech/docs)
- [Groq API Docs](https://console.groq.com/docs)

---

*Last Updated: October 24, 2025*
