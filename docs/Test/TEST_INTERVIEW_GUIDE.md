# 🧪 Test Interview Guide

## 🎯 Complete AI Interview Testing

This guide will help you test the complete AI interview system including:
- ✅ Resume parsing and analysis
- ✅ Personalized question generation based on resume
- ✅ Natural voice synthesis (Gemini TTS)
- ✅ Contextual follow-up questions
- ✅ Comprehensive interview scoring

---

## 🚀 Quick Test (Automated)

### **Windows:**
```bash
test-interview.bat
```

### **Mac/Linux:**
```bash
chmod +x test-interview.sh
./test-interview.sh
```

This will automatically:
1. Check if backend is running
2. Send test interview request
3. Display complete results

---

## 📝 Manual Test (Using curl)

```bash
curl -X POST http://localhost:5000/api/test-interview \
  -H "Content-Type: application/json" \
  -d @test-interview.json
```

---

## 🧪 Test Data

The `test-interview.json` file contains:

**Candidate:** Sarah Johnson  
**Position:** Senior Full Stack Developer  
**Experience:** 7+ years  
**Skills:** React, Node.js, TypeScript, AWS, Docker, MongoDB, etc.

**Role Requirements:**
- 5+ years React/Node.js
- TypeScript expertise
- Cloud experience (AWS)
- Microservices architecture
- Docker/Kubernetes
- Team leadership

---

## 📊 What Gets Tested

### 1. **Resume Analysis** ✅
- Extracts skills (React, Node.js, TypeScript, etc.)
- Identifies experience (7+ years, multiple companies)
- Parses education (MIT, Computer Science)
- Finds projects (E-commerce, Chat app, etc.)

### 2. **Question Generation** ✅
- **Question 1-2:** Behavioral questions
  - Based on candidate's background
  - References specific experience
  - Personalized to role requirements
  
- **Question 3-5:** Technical questions
  - Based on resume skills
  - Aligned with job description
  - Progressive difficulty

### 3. **Voice Synthesis** ✅
- Generates natural voice for each question
- Uses Gemini TTS (Google Neural2 voice)
- Professional female voice (AIRA)
- Audio size reported in KB

### 4. **Follow-up Context** ✅
- Each question considers previous answers
- Builds on candidate's responses
- Natural conversation flow
- Avoids repetition

### 5. **Interview Scoring** ✅
- **Overall Score** (0-100)
- **Technical Skills** (0-100)
- **Communication** (0-100)
- **Problem Solving** (0-100)
- **Code Quality** (0-100)
- **Confidence** (0-100)
- **Strengths** (list)
- **Improvements** (list)
- **Detailed Summary**

---

## 📋 Expected Output

### **Console Output (Backend):**

```
🎯 ========================================
🎯 TEST INTERVIEW STARTED
🎯 Candidate: Sarah Johnson
🎯 Position: Senior Full Stack Developer
🎯 Experience: senior
🎯 ========================================

📄 Parsing resume from text...
✅ Resume parsed: 15 skills found

🤖 Generating 5 personalized questions...

📝 Question 1/5 (behavioral)...

❓ AI Question: "Hello Sarah! I'm AIRA, your AI interviewer. I see you have 7+ years of experience with React and Node.js, and you've led teams at TechCorp. Can you tell me about a challenging project where you had to architect a scalable solution?"

🎤 Generating natural voice audio...
✅ Audio generated: 45231 bytes (44KB)

💬 Simulated Answer: "Based on my experience at TechCorp, I have worked extensively with React, Node.js, TypeScript. I believe my background aligns well with this role."

✅ Question 1 complete

[... continues for all 5 questions ...]

📊 Scoring interview...

✅ ========================================
✅ INTERVIEW SCORING COMPLETE
✅ ========================================
📊 Overall Score: 87/100
💻 Technical Skills: 90/100
💬 Communication: 85/100
🧩 Problem Solving: 88/100
📝 Code Quality: 86/100
💪 Confidence: 84/100

✨ Strengths:
   - Strong technical background in React and Node.js
   - Excellent problem-solving skills
   - Good communication and articulation

🎯 Areas for Improvement:
   - Could provide more specific examples
   - Consider discussing edge cases more thoroughly

📝 Summary: The candidate demonstrated strong technical knowledge and good communication skills. Their experience aligns well with the role requirements.

✅ ========================================
```

### **API Response (JSON):**

```json
{
  "success": true,
  "message": "Test interview completed successfully",
  "data": {
    "candidate": {
      "name": "Sarah Johnson",
      "position": "Senior Full Stack Developer",
      "experienceLevel": "senior"
    },
    "resume": {
      "skills": ["React", "TypeScript", "Node.js", "MongoDB", "AWS", ...],
      "experience": ["Senior Software Engineer | TechCorp Inc. | 2020 - Present", ...],
      "education": ["Bachelor of Technology in Computer Science | MIT | 2013 - 2017"],
      "projects": ["E-commerce Platform: Built a full-stack...", ...]
    },
    "interview": {
      "totalQuestions": 5,
      "questions": [
        {
          "number": 1,
          "phase": "behavioral",
          "question": "Hello Sarah! I'm AIRA...",
          "answer": "Based on my experience...",
          "audioGenerated": true,
          "audioSize": 45231
        },
        ...
      ]
    },
    "score": {
      "overall": 87,
      "breakdown": {
        "technicalSkills": 90,
        "communication": 85,
        "problemSolving": 88,
        "codeQuality": 86,
        "confidence": 84
      },
      "strengths": ["Strong technical background...", ...],
      "improvements": ["Could provide more specific examples...", ...],
      "summary": "The candidate demonstrated...",
      "detailedFeedback": {
        "technical": "...",
        "communication": "...",
        "problemSolving": "..."
      }
    },
    "aiServices": {
      "geminiAI": "Working ✅",
      "geminiTTS": "Working ✅",
      "resumeParser": "Working ✅",
      "scoring": "Working ✅"
    },
    "testResults": {
      "questionsPersonalized": true,
      "voiceGenerated": true,
      "resumeAnalyzed": true,
      "followUpContextual": true,
      "scoringDetailed": true
    }
  }
}
```

---

## ✅ Success Criteria

After running the test, verify:

- [ ] **Resume Parsed:** Skills, experience, education extracted
- [ ] **Questions Personalized:** References candidate's background
- [ ] **Voice Generated:** Audio size > 0 bytes for each question
- [ ] **Follow-ups Contextual:** Questions build on previous answers
- [ ] **Scoring Detailed:** All 6 metrics calculated
- [ ] **Natural Flow:** Questions sound conversational, not robotic

---

## 🎯 Custom Test

You can create your own test by modifying `test-interview.json`:

```json
{
  "candidateName": "Your Name",
  "position": "Your Target Position",
  "experienceLevel": "fresher|mid-level|senior",
  "numberOfQuestions": 5,
  "resumeText": "Your complete resume text here...",
  "roleDescription": "Job description and requirements..."
}
```

Then run:
```bash
curl -X POST http://localhost:5000/api/test-interview \
  -H "Content-Type: application/json" \
  -d @test-interview.json
```

---

## 🐛 Troubleshooting

### "Backend is not running"
**Solution:** Start backend first
```bash
cd backend
npm run dev
```

### "GEMINI_API_KEY not configured"
**Solution:** Add API key to `.env`
```env
GEMINI_API_KEY=your_key_here
```

### "Failed to generate speech"
**Solution:** Check Gemini API key or add ElevenLabs backup
```env
ELEVENLABS_API_KEY=your_key_here
```

### Questions are generic (not personalized)
**Solution:** Ensure resume has enough detail (skills, experience, projects)

---

## 📈 Performance Metrics

**Expected timing:**
- Resume parsing: ~1-2 seconds
- Question generation: ~2-3 seconds per question
- Voice synthesis: ~1-2 seconds per question
- Interview scoring: ~5-10 seconds
- **Total for 5 questions: ~30-40 seconds**

**Audio sizes:**
- Short question (20 words): ~15-20 KB
- Medium question (50 words): ~40-50 KB
- Long question (100 words): ~80-100 KB

---

## 🎉 What This Proves

✅ **AI Integration Works**
- Gemini Pro generates intelligent questions
- Questions are personalized to resume
- Follow-ups are contextual

✅ **Voice Synthesis Works**
- Gemini TTS generates natural voice
- Audio quality is professional
- No robotic sound

✅ **Resume Parsing Works**
- Extracts skills accurately
- Identifies experience and education
- Finds relevant projects

✅ **Scoring Works**
- Comprehensive 6-metric analysis
- Detailed strengths and improvements
- Actionable feedback

✅ **Everything is FREE**
- No API costs (within free tier)
- No credit card required
- Production-ready quality

---

## 🚀 Next Steps

After successful testing:

1. **Integrate with Frontend**
   - Replace hardcoded questions in `AIInterviewSystemV2.tsx`
   - Use `aiInterviewAPI.ts` service
   - Play audio from base64

2. **Add Real Resume Upload**
   - Allow PDF upload
   - Parse with `resumeParser` service
   - Store in Cloudinary

3. **Save Interview Results**
   - Store transcript in MongoDB
   - Save score and feedback
   - Generate report for HR

4. **Add Code Execution**
   - Integrate Piston API
   - Test candidate's code
   - Include in scoring

---

**Ready to test? Run `test-interview.bat` (Windows) or `./test-interview.sh` (Mac/Linux)!** 🚀

---

*Last Updated: October 26, 2025*
