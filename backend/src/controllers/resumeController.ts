import { Request, Response } from 'express';
import { parseResume, validateResumeFile, calculateMatchScore } from '../services/resumeParser';
import { v2 as cloudinary } from 'cloudinary';

// Initialize Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * Upload and parse resume
 * POST /api/resume/upload
 */
export async function uploadResume(req: Request, res: Response): Promise<void> {
  try {
    if (!req.file) {
      res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
      return;
    }

    // Validate file
    const validation = validateResumeFile(req.file);
    if (!validation.valid) {
      res.status(400).json({
        success: false,
        error: validation.error
      });
      return;
    }

    console.log(`📄 Processing resume: ${req.file.originalname}`);

    // Parse resume
    const parsedResume = await parseResume(req.file.buffer);

    // Upload to Cloudinary for storage (optional - skip if credentials missing)
    let resumeUrl = '';
    
    try {
      if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY) {
        const uploadResult = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder: 'resumes',
              resource_type: 'raw',
              format: 'pdf',
              public_id: `resume_${Date.now()}`
            },
            (error: any, result: any) => {
              if (error) reject(error);
              else resolve(result);
            }
          );
          uploadStream.end(req.file!.buffer);
        });
        resumeUrl = (uploadResult as any).secure_url;
        console.log('✅ Resume uploaded to Cloudinary');
      } else {
        console.log('⚠️ Cloudinary credentials not found, skipping upload');
        resumeUrl = 'local-file'; // Placeholder for test mode
      }
    } catch (cloudinaryError) {
      console.warn('⚠️ Cloudinary upload failed, continuing without URL:', cloudinaryError);
      resumeUrl = 'local-file'; // Fallback
    }

    res.json({
      success: true,
      data: {
        resumeUrl,
        parsed: parsedResume,
        fileName: req.file.originalname,
        fileSize: req.file.size
      }
    });

  } catch (error: any) {
    console.error('❌ Error uploading resume:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload and parse resume',
      message: error.message
    });
  }
}

/**
 * Parse existing resume from URL
 * POST /api/resume/parse
 */
export async function parseResumeFromUrl(req: Request, res: Response): Promise<void> {
  try {
    const { resumeUrl } = req.body;

    if (!resumeUrl) {
      res.status(400).json({
        success: false,
        error: 'Resume URL is required'
      });
      return;
    }

    console.log(`📄 Parsing resume from URL: ${resumeUrl}`);

    // Fetch PDF from URL
    const response = await fetch(resumeUrl);
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Parse resume
    const parsedResume = await parseResume(buffer);

    res.json({
      success: true,
      data: parsedResume
    });

  } catch (error: any) {
    console.error('❌ Error parsing resume from URL:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to parse resume',
      message: error.message
    });
  }
}

/**
 * Calculate match score between resume and job requirements
 * POST /api/resume/match-score
 */
export async function getMatchScore(req: Request, res: Response): Promise<void> {
  try {
    const { resumeSkills, requiredSkills } = req.body;

    if (!resumeSkills || !requiredSkills) {
      res.status(400).json({
        success: false,
        error: 'resumeSkills and requiredSkills are required'
      });
      return;
    }

    const matchResult = calculateMatchScore(resumeSkills, requiredSkills);

    res.json({
      success: true,
      data: matchResult
    });

  } catch (error: any) {
    console.error('❌ Error calculating match score:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to calculate match score',
      message: error.message
    });
  }
}

export default {
  uploadResume,
  parseResumeFromUrl,
  getMatchScore
};
