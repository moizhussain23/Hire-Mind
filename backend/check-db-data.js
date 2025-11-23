// Quick script to check what data exists in MongoDB collections
// Run with: node check-db-data.js

const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hire-mind');
    console.log('✅ Connected to MongoDB');
    
    // Check collections
    await checkCollections();
    
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
  } finally {
    process.exit(0);
  }
};

const checkCollections = async () => {
  console.log('\n📊 DATABASE ANALYSIS:\n');
  
  try {
    // Get all collection names
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('📂 Available Collections:');
    collections.forEach(col => console.log(`   - ${col.name}`));
    console.log('');
    
    // Check Invitations collection
    console.log('🎫 INVITATIONS COLLECTION:');
    const invitations = await mongoose.connection.db.collection('invitations').find({}).toArray();
    console.log(`   Total invitations: ${invitations.length}`);
    
    if (invitations.length > 0) {
      console.log('   📋 Sample invitation structure:');
      const sample = invitations[0];
      console.log(`   - ID: ${sample._id}`);
      console.log(`   - Token: ${sample.token || 'NOT SET'}`);
      console.log(`   - Candidate Name: ${sample.candidateName || 'NOT SET'}`);
      console.log(`   - Candidate Email: ${sample.candidateEmail || 'NOT SET'}`);
      console.log(`   - Status: ${sample.status || 'NOT SET'}`);
      console.log(`   - Resume URL: ${sample.resumeUrl ? 'EXISTS' : 'NOT SET'}`);
      console.log(`   - Resume Data: ${sample.resumeData ? 'EXISTS' : 'NOT SET'}`);
      console.log(`   - Interview ID: ${sample.interviewId || 'NOT SET'}`);
      console.log(`   - Created: ${sample.createdAt || 'NOT SET'}`);
      
      // Show all invitation tokens
      console.log('\n   🔑 All invitation tokens:');
      invitations.forEach((inv, index) => {
        console.log(`   ${index + 1}. Token: ${inv.token} | Email: ${inv.candidateEmail} | Status: ${inv.status}`);
      });
    } else {
      console.log('   ❌ No invitations found');
    }
    
    console.log('\n📋 INTERVIEWS COLLECTION:');
    const interviews = await mongoose.connection.db.collection('interviews').find({}).toArray();
    console.log(`   Total interviews: ${interviews.length}`);
    
    if (interviews.length > 0) {
      console.log('   📋 Sample interview structure:');
      const sample = interviews[0];
      console.log(`   - ID: ${sample._id}`);
      console.log(`   - Job Title: ${sample.jobTitle || 'NOT SET'}`);
      console.log(`   - Skill Category: ${sample.skillCategory || 'NOT SET'}`);
      console.log(`   - Experience Level: ${sample.experienceLevel || 'NOT SET'}`);
      console.log(`   - Interview Type: ${sample.interviewType || 'NOT SET'}`);
      console.log(`   - HR ID: ${sample.hrId || 'NOT SET'}`);
      console.log(`   - Created: ${sample.createdAt || 'NOT SET'}`);
      
      // Show all interviews
      console.log('\n   🎯 All interviews:');
      interviews.forEach((interview, index) => {
        console.log(`   ${index + 1}. ${interview.jobTitle} | ${interview.skillCategory} | ${interview.experienceLevel}`);
      });
    } else {
      console.log('   ❌ No interviews found');
    }
    
    console.log('\n🔄 INTERVIEW SESSIONS COLLECTION:');
    const sessions = await mongoose.connection.db.collection('interviewsessions').find({}).toArray();
    console.log(`   Total sessions: ${sessions.length}`);
    
    if (sessions.length > 0) {
      console.log('   📋 Recent sessions:');
      sessions.slice(0, 3).forEach((session, index) => {
        console.log(`   ${index + 1}. Candidate: ${session.candidateName} | Status: ${session.status} | Created: ${session.createdAt}`);
      });
    } else {
      console.log('   ❌ No interview sessions found');
    }
    
    console.log('\n🔗 DATA RELATIONSHIPS:');
    if (invitations.length > 0 && interviews.length > 0) {
      let linkedCount = 0;
      invitations.forEach(invitation => {
        const linkedInterview = interviews.find(interview => 
          interview._id.toString() === invitation.interviewId?.toString()
        );
        if (linkedInterview) {
          linkedCount++;
          console.log(`   ✅ "${invitation.candidateEmail}" → "${linkedInterview.jobTitle}"`);
        } else {
          console.log(`   ❌ "${invitation.candidateEmail}" → NO LINKED INTERVIEW`);
        }
      });
      console.log(`\n   📊 ${linkedCount}/${invitations.length} invitations have linked interviews`);
    }
    
    console.log('\n🎯 READY FOR TESTING:');
    if (invitations.length > 0) {
      const testToken = invitations[0].token;
      console.log(`   Test URL: http://localhost:3000/interview?token=${testToken}`);
      console.log(`   API Test: curl -X POST http://localhost:8000/api/invitation/data -H "Content-Type: application/json" -d '{"token":"${testToken}"}'`);
    } else {
      console.log('   ⚠️  No invitations available for testing');
      console.log('   💡 Create an interview and send invitations through HR Dashboard first');
    }
    
  } catch (error) {
    console.error('❌ Error checking collections:', error);
  }
};

// Run the check
connectDB();