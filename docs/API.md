# API Documentation

## Base URL
- Development: `http://localhost:5000/api`
- Production: `https://your-backend-url.com/api`

## Authentication

All protected endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <clerk_jwt_token>
```

## Endpoints

### Authentication

#### POST /auth/webhook
Clerk webhook for user creation/updates.

**Request Body:**
```json
{
  "data": {
    "id": "user_123",
    "email_addresses": [{"email_address": "user@example.com"}],
    "first_name": "John",
    "last_name": "Doe",
    "image_url": "https://example.com/avatar.jpg"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "User created/updated successfully",
  "user": {
    "id": "user_id",
    "clerkId": "user_123",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "candidate"
  }
}
```

#### GET /auth/profile
Get current user profile.

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "user_id",
    "clerkId": "user_123",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "candidate",
    "profileImage": "https://example.com/avatar.jpg",
    "resumeUrl": "https://cloudinary.com/resume.pdf"
  }
}
```

### Interview Management

#### POST /interview/start
Start a new interview.

**Request Body:**
```json
{
  "position": "Frontend Developer"
}
```

**Response:**
```json
{
  "success": true,
  "interview": {
    "id": "interview_id",
    "position": "Frontend Developer",
    "status": "in-progress",
    "startTime": "2024-01-15T10:00:00Z",
    "currentQuestion": "Hello! Welcome to your interview. Can you please introduce yourself?"
  }
}
```

#### POST /interview/end/:interviewId
End an interview and generate evaluation.

**Response:**
```json
{
  "success": true,
  "interview": {
    "id": "interview_id",
    "status": "completed",
    "endTime": "2024-01-15T10:30:00Z",
    "duration": 30,
    "evaluation": {
      "overallScore": 85,
      "contentQuality": 80,
      "communicationSkills": 90,
      "confidence": 85,
      "technicalKnowledge": 80,
      "strengths": ["Good communication", "Relevant experience"],
      "areasForImprovement": ["Technical depth", "More examples"],
      "feedback": "Strong candidate with good potential."
    }
  }
}
```

#### GET /interview/status/:interviewId
Get interview status and details.

**Response:**
```json
{
  "success": true,
  "interview": {
    "id": "interview_id",
    "position": "Frontend Developer",
    "status": "in-progress",
    "startTime": "2024-01-15T10:00:00Z",
    "transcript": [
      {
        "question": "Can you introduce yourself?",
        "answer": "I'm a frontend developer with 3 years experience...",
        "timestamp": "2024-01-15T10:01:00Z"
      }
    ]
  }
}
```

#### POST /interview/audio
Process audio data and get AI response.

**Request Body:**
```json
{
  "audioData": "base64_encoded_audio",
  "interviewId": "interview_id"
}
```

**Response:**
```json
{
  "success": true,
  "transcript": "I have 3 years of experience in React development...",
  "aiResponse": "That's great! Can you tell me about a challenging project you worked on?",
  "audioResponse": "path_to_generated_audio_file"
}
```

#### GET /interview/history
Get user's interview history.

**Response:**
```json
{
  "success": true,
  "interviews": [
    {
      "id": "interview_id",
      "position": "Frontend Developer",
      "status": "completed",
      "startTime": "2024-01-15T10:00:00Z",
      "endTime": "2024-01-15T10:30:00Z",
      "duration": 30,
      "evaluation": {
        "overallScore": 85
      }
    }
  ]
}
```

### HR Dashboard

#### GET /hr/candidates
Get all candidates with their interviews.

**Response:**
```json
{
  "success": true,
  "candidates": [
    {
      "id": "interview_id",
      "candidateId": "user_id",
      "position": "Frontend Developer",
      "status": "completed",
      "startTime": "2024-01-15T10:00:00Z",
      "evaluation": {
        "overallScore": 85
      }
    }
  ]
}
```

#### GET /hr/candidates/:candidateId
Get detailed candidate information.

**Response:**
```json
{
  "success": true,
  "candidate": {
    "id": "user_id",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "role": "candidate",
    "profileImage": "https://example.com/avatar.jpg",
    "resumeUrl": "https://cloudinary.com/resume.pdf"
  },
  "interviews": [
    {
      "id": "interview_id",
      "position": "Frontend Developer",
      "status": "completed",
      "transcript": [...],
      "evaluation": {...}
    }
  ]
}
```

#### GET /hr/reports/:interviewId/download
Download interview report.

**Response:**
```json
{
  "success": true,
  "report": {
    "candidate": {...},
    "position": "Frontend Developer",
    "interviewDate": "2024-01-15T10:00:00Z",
    "duration": 30,
    "transcript": [...],
    "evaluation": {...}
  }
}
```

#### POST /hr/interviews/schedule
Schedule a new interview.

**Request Body:**
```json
{
  "candidateId": "user_id",
  "position": "Frontend Developer",
  "scheduledTime": "2024-01-20T14:00:00Z"
}
```

**Response:**
```json
{
  "success": true,
  "interview": {
    "id": "interview_id",
    "candidateId": "user_id",
    "position": "Frontend Developer",
    "status": "scheduled",
    "startTime": "2024-01-20T14:00:00Z"
  }
}
```

## Error Responses

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Error message description"
}
```

### Common HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `404` - Not Found
- `500` - Internal Server Error

## Rate Limiting

- 100 requests per 15 minutes per IP address
- Additional rate limits may apply based on free tier limits

## WebSocket Events

### Connection
- `join-interview` - Join an interview room
- `audio-data` - Send/receive audio data
- `disconnect` - Handle disconnection
