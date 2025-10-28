import { Router } from 'express';
import multer from 'multer';
import {
  uploadIDDocument,
  verifyFace,
  getVerificationStatus,
  retryVerification
} from '../controllers/verification';

const router = Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept images only
    if (!file.mimetype.startsWith('image/')) {
      cb(new Error('Only image files are allowed'));
      return;
    }
    cb(null, true);
  }
});

// Identity verification routes
router.post('/invitations/:invitationId/upload-id', upload.single('idDocument'), uploadIDDocument);
router.post('/invitations/:invitationId/verify-face', upload.single('livePhoto'), verifyFace);
router.get('/invitations/:invitationId/verification-status', getVerificationStatus);
router.post('/invitations/:invitationId/retry-verification', retryVerification);

export default router;
