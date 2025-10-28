# 🚀 Run AI Interview Test

## ✅ Prerequisites

1. **Backend running** on http://localhost:5000
2. **GEMINI_API_KEY** configured in `.env`

---

## 🎯 Run Test (Choose One)

### **Option 1: PowerShell (Recommended for Windows)**
```powershell
powershell -ExecutionPolicy Bypass -File test-interview.ps1
```

### **Option 2: Batch File**
```cmd
test-interview.bat
```

### **Option 3: Manual curl**
```bash
curl -X POST http://localhost:5000/api/test-interview -H "Content-Type: application/json" -d @test-interview.json
```

---

## 📊 What Gets Tested

✅ **Resume Parsing** - Extracts skills, experience, education  
✅ **AI Questions** - 5 personalized questions based on resume  
✅ **Natural Voice** - Gemini TTS audio generation  
✅ **Follow-ups** - Contextual questions based on previous answers  
✅ **Scoring** - Comprehensive 6-metric analysis  

---

## 🎉 Expected Results

**Console Output:**
```
🎯 TEST INTERVIEW STARTED
📄 Parsing resume...
✅ Resume parsed: 15 skills found
🤖 Generating 5 personalized questions...
❓ AI Question: "Hello Sarah! I see you have 7+ years..."
🎤 Generating natural voice audio...
✅ Audio generated: 44KB
📊 Overall Score: 87/100
✅ INTERVIEW COMPLETE
```

**JSON Response:**
- Candidate info
- Parsed resume (skills, experience, education)
- 5 personalized questions with audio
- Simulated answers
- Complete scoring (6 metrics)
- AI services status

---

## ⏱️ Timing

- Resume parsing: ~1-2 seconds
- Per question: ~3-5 seconds (AI + voice)
- Scoring: ~5-10 seconds
- **Total: ~30-40 seconds**

---

## 🎯 Success Criteria

After test completes, verify:

- [ ] Questions mention candidate's name (Sarah)
- [ ] Questions reference resume skills (React, Node.js, etc.)
- [ ] Audio generated for each question (size > 0 KB)
- [ ] Follow-up questions are contextual
- [ ] Scoring includes all 6 metrics
- [ ] All AI services show "Working ✅"

---

## 🐛 If Test Fails

1. **Check backend is running:**
   ```bash
   curl http://localhost:5000/health
   ```

2. **Check GEMINI_API_KEY in `.env`:**
   ```env
   GEMINI_API_KEY=your_key_here
   ```

3. **Check backend logs** for errors

4. **Restart backend:**
   ```bash
   cd backend
   npm run dev
   ```

---

## 📝 Customize Test

Edit `test-interview.json` to test with your own:
- Resume text
- Position
- Role description
- Number of questions

---

**Ready? Run the test now!** 🚀

```powershell
powershell -ExecutionPolicy Bypass -File test-interview.ps1
```
