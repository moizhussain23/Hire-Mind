import express from 'express';
import multer from 'multer';
import { authenticateToken } from '../middleware/auth';
import {
  uploadResume,
  parseResumeFromUrl,
  getMatchScore
} from '../controllers/resumeController';

const router = express.Router();

// Configure multer for file upload (memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  }
});

// All routes require authentication
router.use(authenticateToken);

// Upload and parse resume
router.post('/upload', upload.single('resume'), uploadResume);

// Parse resume from existing URL
router.post('/parse', parseResumeFromUrl);

// Calculate match score
router.post('/match-score', getMatchScore);

export default router;
