# 📦 Required Packages to Install

## AWS Rekognition for Face Recognition

Run this command in the backend directory:

```bash
npm install @aws-sdk/client-rekognition
```

## Environment Variables Needed

Add these to your `.env` file:

```env
# AWS Rekognition Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key_here
AWS_SECRET_ACCESS_KEY=your_secret_key_here

# Cloudinary Configuration (if not already added)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

## How to Get AWS Credentials

1. Go to AWS Console: https://console.aws.amazon.com/
2. Navigate to IAM (Identity and Access Management)
3. Create a new user with programmatic access
4. Attach policy: `AmazonRekognitionFullAccess`
5. Copy Access Key ID and Secret Access Key
6. Add to `.env` file

## Alternative: Use Face-API.js (Client-side, No AWS needed)

If you don't want to use AWS, we can use face-api.js which runs in the browser:
- No server costs
- Privacy-friendly (processing on client)
- Good accuracy for basic face matching

Let me know which approach you prefer!
