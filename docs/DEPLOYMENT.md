# Deployment Guide

This guide covers deploying the Hire Mind to production using free-tier services.

## 🚀 Deployment Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Database      │
│   (Vercel)      │◄──►│   (Render)      │◄──►│   (MongoDB)     │
│   React App     │    │   Express API   │    │   Atlas M0      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   File Storage  │    │   AI Services   │    │   Email Service │
│   (Cloudinary)  │    │   (Groq/OpenAI) │    │   (Brevo)       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 📋 Prerequisites

Before deploying, ensure you have:

1. **GitHub Repository** - Push your code to GitHub
2. **MongoDB Atlas Account** - Free tier cluster
3. **Clerk Account** - Authentication service
4. **Groq API Key** - AI service
5. **OpenAI API Key** - Speech-to-text
6. **Cloudinary Account** - File storage
7. **Brevo Account** - Email service
8. **Vercel Account** - Frontend hosting
9. **Render Account** - Backend hosting

## 🗄️ Database Setup (MongoDB Atlas)

### 1. Create Cluster
1. Go to [MongoDB Atlas](https://cloud.mongodb.com/)
2. Create a new project
3. Build a cluster (choose M0 Sandbox - FREE)
4. Choose a cloud provider and region
5. Create cluster

### 2. Database Access
1. Go to "Database Access"
2. Add new database user
3. Set username and password
4. Grant "Read and write to any database" permission

### 3. Network Access
1. Go to "Network Access"
2. Add IP address (0.0.0.0/0 for all IPs - not recommended for production)
3. Or add specific IP addresses

### 4. Get Connection String
1. Go to "Clusters"
2. Click "Connect"
3. Choose "Connect your application"
4. Copy the connection string
5. Replace `<password>` with your database user password

## 🔐 Authentication Setup (Clerk)

### 1. Create Application
1. Go to [Clerk Dashboard](https://dashboard.clerk.com/)
2. Create new application
3. Choose "React" for frontend
4. Choose "Node.js" for backend

### 2. Configure Settings
1. Go to "API Keys"
2. Copy "Publishable key" and "Secret key"
3. Go to "Webhooks"
4. Add webhook endpoint: `https://your-backend-url.com/api/auth/webhook`
5. Select events: `user.created`, `user.updated`

### 3. Environment Variables
- `CLERK_PUBLISHABLE_KEY` - Frontend key
- `CLERK_SECRET_KEY` - Backend key

## 🤖 AI Services Setup

### Groq (Primary AI)
1. Go to [Groq Console](https://console.groq.com/)
2. Sign up/login
3. Go to "API Keys"
4. Create new API key
5. Copy the key

### OpenAI (Whisper STT)
1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign up/login
3. Go to "API Keys"
4. Create new secret key
5. Copy the key

## 📁 File Storage Setup (Cloudinary)

### 1. Create Account
1. Go to [Cloudinary](https://cloudinary.com/)
2. Sign up for free account
3. Go to Dashboard

### 2. Get Credentials
1. Copy "Cloud name"
2. Copy "API Key"
3. Copy "API Secret"

## 📧 Email Service Setup (Brevo)

### 1. Create Account
1. Go to [Brevo](https://www.brevo.com/)
2. Sign up for free account
3. Verify email address

### 2. Get API Key
1. Go to "SMTP & API"
2. Create new API key
3. Copy the key

## 🌐 Frontend Deployment (Vercel)

### 1. Connect Repository
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your GitHub repository
4. Select the repository

### 2. Configure Build Settings
- **Framework Preset**: Vite
- **Root Directory**: `frontend`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### 3. Environment Variables
Add these environment variables in Vercel dashboard:

```
VITE_CLERK_PUBLISHABLE_KEY=pk_live_your_clerk_publishable_key
VITE_API_URL=https://your-backend-url.com/api
```

### 4. Deploy
1. Click "Deploy"
2. Wait for deployment to complete
3. Note the deployment URL

## ⚙️ Backend Deployment (Render)

### 1. Connect Repository
1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click "New +"
3. Select "Web Service"
4. Connect your GitHub repository

### 2. Configure Service
- **Name**: `ai-interview-backend`
- **Root Directory**: `backend`
- **Environment**: `Node`
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`

### 3. Environment Variables
Add these environment variables in Render dashboard:

```bash
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/ai-interview-platform

# Authentication
CLERK_PUBLISHABLE_KEY=pk_live_your_clerk_publishable_key
CLERK_SECRET_KEY=sk_live_your_clerk_secret_key

# AI Services
GROQ_API_KEY=your_groq_api_key
OPENAI_API_KEY=your_openai_api_key

# File Storage
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Email Service
BREVO_API_KEY=your_brevo_api_key

# Server Configuration
PORT=10000
NODE_ENV=production
FRONTEND_URL=https://your-frontend-url.vercel.app
```

### 4. Deploy
1. Click "Create Web Service"
2. Wait for deployment to complete
3. Note the service URL

## 🔄 Update Webhook URLs

After deployment, update webhook URLs:

### Clerk Webhook
1. Go to Clerk Dashboard
2. Go to "Webhooks"
3. Update endpoint URL to: `https://your-backend-url.com/api/auth/webhook`

## 🧪 Testing Deployment

### 1. Health Check
```bash
curl https://your-backend-url.com/health
```

Expected response:
```json
{
  "status": "OK",
  "timestamp": "2024-01-15T10:00:00Z",
  "uptime": 123.45
}
```

### 2. Frontend Access
1. Go to your Vercel deployment URL
2. Test user registration/login
3. Test interview flow

### 3. Backend API
```bash
curl https://your-backend-url.com/api/auth/profile \
  -H "Authorization: Bearer your_jwt_token"
```

## 📊 Monitoring

### 1. Vercel Analytics
- Built-in analytics in Vercel dashboard
- Monitor performance and usage

### 2. Render Logs
- View logs in Render dashboard
- Monitor errors and performance

### 3. MongoDB Atlas
- Monitor database performance
- Set up alerts for usage limits

## 🔧 Troubleshooting

### Common Issues

#### 1. CORS Errors
- Ensure `FRONTEND_URL` is set correctly in backend
- Check CORS configuration in `app.ts`

#### 2. Database Connection Issues
- Verify MongoDB connection string
- Check network access settings
- Ensure database user has correct permissions

#### 3. Authentication Issues
- Verify Clerk keys are correct
- Check webhook URL is accessible
- Ensure JWT tokens are valid

#### 4. AI Service Errors
- Check API keys are valid
- Monitor rate limits
- Verify service availability

### Debug Commands

```bash
# Check backend logs
curl https://your-backend-url.com/health

# Test database connection
# Check MongoDB Atlas dashboard

# Test AI services
# Check Groq/OpenAI API status
```

## 📈 Scaling Considerations

### Free Tier Limits
- **Vercel**: 100GB bandwidth/month
- **Render**: 750 hours/month, 512MB RAM
- **MongoDB Atlas**: 512MB storage
- **Groq**: Rate limits apply
- **Cloudinary**: 25GB storage, 25GB bandwidth

### Upgrade Path
1. **Vercel Pro**: $20/month for more bandwidth
2. **Render Paid**: $7/month for more resources
3. **MongoDB Atlas M2**: $9/month for more storage
4. **Groq Pro**: Pay-per-use for higher limits

## 🔒 Security Best Practices

1. **Environment Variables**: Never commit secrets to Git
2. **HTTPS**: All services use HTTPS by default
3. **CORS**: Configured for specific origins
4. **Rate Limiting**: Implemented to prevent abuse
5. **Input Validation**: Validate all user inputs
6. **Error Handling**: Don't expose sensitive information

## 📝 Maintenance

### Regular Tasks
1. Monitor free tier usage
2. Update dependencies
3. Review logs for errors
4. Backup important data
5. Test all functionality

### Updates
1. Update frontend dependencies
2. Update backend dependencies
3. Test in staging environment
4. Deploy to production
5. Monitor for issues
