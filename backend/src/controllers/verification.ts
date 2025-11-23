import { Request, Response } from 'express';
import { Invitation } from '../models/Invitation';
import { uploadToCloudinary } from '../utils/cloudinary';
import { verifyIdentity } from '../services/faceRecognition';

/**
 * Upload ID document for verification
 */
export const uploadIDDocument = async (req: Request, res: Response): Promise<void> => {
  try {
    const { invitationId } = req.params;
    const { documentType, documentNumber } = req.body;

    // Find invitation
    const invitation = await Invitation.findById(invitationId);
    if (!invitation) {
      res.status(404).json({
        success: false,
        error: 'Invitation not found'
      });
      return;
    }

    // Check if already verified
    if (invitation.identityVerification?.status === 'verified') {
      res.status(400).json({
        success: false,
        error: 'Already verified'
      });
      return;
    }

    // Check if file uploaded
    if (!req.file) {
      res.status(400).json({
        success: false,
        error: 'ID document image required'
      });
      return;
    }

    // Upload to Cloudinary
    const uploadResult = await uploadToCloudinary(req.file.buffer, 'id-documents');

    // Initialize verification object if not exists
    if (!invitation.identityVerification) {
      invitation.identityVerification = {
        status: 'pending',
        faceMatch: {
          threshold: 85
        }
      };
    }

    // Save ID document info
    invitation.identityVerification.idDocument = {
      type: documentType,
      documentNumber: documentNumber,
      documentPhotoUrl: uploadResult.secure_url,
      uploadedAt: new Date()
    };

    // Extract name and photo from ID using OCR and AI analysis
    try {
      // Use Gemini Vision for OCR and data extraction
      const { analyzeIDDocument } = await import('../services/geminiService');
      
      // Convert buffer to base64 for Gemini Vision
      const base64Image = req.file!.buffer.toString('base64');
      const mimeType = req.file!.mimetype;
      
      console.log('🔍 Analyzing ID document using Gemini Vision...');
      
      const extractedData = await analyzeIDDocument(base64Image, mimeType);
      
      // Update invitation with extracted data
      if (!invitation.identityVerification) {
        invitation.identityVerification = {
          status: 'pending'
        };
      }
      
      if (!invitation.identityVerification.idDocument) {
        invitation.identityVerification.idDocument = {
          type: 'other' // Default type, can be updated later
        };
      }
      
      // Determine document type from extracted data or default to 'other'
      let documentType: 'passport' | 'drivers_license' | 'national_id' | 'other' = 'other';
      if (extractedData.documentType) {
        const docType = extractedData.documentType.toLowerCase();
        if (docType.includes('passport')) documentType = 'passport';
        else if (docType.includes('driver')) documentType = 'drivers_license';
        else if (docType.includes('national') || docType.includes('id')) documentType = 'national_id';
      }
      
      invitation.identityVerification.idDocument = {
        ...invitation.identityVerification.idDocument,
        type: documentType,
        extractedName: extractedData.name || undefined,
        documentNumber: extractedData.dateOfBirth || undefined, // Store DOB in documentNumber for now
        documentPhotoUrl: uploadResult.secure_url,
        uploadedAt: new Date()
      };
      
      console.log('✅ ID document analysis completed:', {
        extractedName: extractedData.name,
        documentType: extractedData.documentType,
        confidence: extractedData.confidence
      });
      
    } catch (ocrError) {
      console.warn('⚠️ OCR extraction failed, proceeding without extracted data:', ocrError);
      // Don't fail the upload if OCR fails - manual verification can still proceed
    }
    // For now, we'll do this in a separate step

    await invitation.save();

    res.status(200).json({
      success: true,
      message: 'ID document uploaded successfully',
      data: {
        documentUrl: uploadResult.secure_url
      }
    });
  } catch (error: any) {
    console.error('Error uploading ID document:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload ID document'
    });
  }
};

/**
 * Capture live photo and verify face
 */
export const verifyFace = async (req: Request, res: Response): Promise<void> => {
  try {
    const { invitationId } = req.params;
    const { matchScore, livenessScore } = req.body; // Client sends these scores

    // Find invitation
    const invitation = await Invitation.findById(invitationId);
    if (!invitation) {
      res.status(404).json({
        success: false,
        error: 'Invitation not found'
      });
      return;
    }

    // Check if ID document uploaded
    if (!invitation.identityVerification?.idDocument?.documentPhotoUrl) {
      res.status(400).json({
        success: false,
        error: 'Please upload ID document first'
      });
      return;
    }

    // Check if file uploaded
    if (!req.file) {
      res.status(400).json({
        success: false,
        error: 'Live photo required'
      });
      return;
    }

    // Validate client scores
    if (typeof matchScore !== 'number' || typeof livenessScore !== 'number') {
      res.status(400).json({
        success: false,
        error: 'Match score and liveness score are required'
      });
      return;
    }

    // Upload live photo to Cloudinary
    const uploadResult = await uploadToCloudinary(req.file.buffer, 'live-photos');

    // Save live photo
    if (!invitation.identityVerification.livePhoto) {
      invitation.identityVerification.livePhoto = {};
    }
    invitation.identityVerification.livePhoto.photoUrl = uploadResult.secure_url;
    invitation.identityVerification.livePhoto.capturedAt = new Date();

    // Verify using client-side face recognition results
    console.log('🔍 Validating face verification results from client...');
    
    const idPhotoUrl = invitation.identityVerification.idDocument.documentPhotoUrl;
    const livePhotoUrl = uploadResult.secure_url;

    let verificationResult;
    try {
      verificationResult = await verifyIdentity(
        idPhotoUrl, 
        livePhotoUrl,
        matchScore,
        livenessScore
      );
      console.log('✅ Face verification result:', verificationResult);
    } catch (error: any) {
      console.error('❌ Face verification error:', error);
      
      res.status(500).json({
        success: false,
        error: 'Face verification failed. Please try again.',
        details: error.message
      });
      return;
    }

    // Save liveness score
    invitation.identityVerification.livePhoto.livenessScore = verificationResult.livenessScore;

    // Save face match result
    if (!invitation.identityVerification.faceMatch) {
      invitation.identityVerification.faceMatch = {
        threshold: 85
      };
    }
    invitation.identityVerification.faceMatch.score = verificationResult.matchScore;
    invitation.identityVerification.faceMatch.passed = verificationResult.verified;
    invitation.identityVerification.faceMatch.verifiedAt = new Date();
    invitation.identityVerification.faceMatch.provider = 'face-api.js';

    // Update verification status
    invitation.identityVerification.status = verificationResult.verified ? 'verified' : 'failed';

    // Log attempt
    if (!invitation.identityVerification.attempts) {
      invitation.identityVerification.attempts = [];
    }
    invitation.identityVerification.attempts.push({
      attemptedAt: new Date(),
      matchScore: verificationResult.matchScore,
      passed: verificationResult.verified,
      reason: verificationResult.verified 
        ? 'Face match successful' 
        : `Face match failed - Score: ${verificationResult.matchScore}%, Required: 85%`
    });

    await invitation.save();

    res.status(200).json({
      success: true,
      message: invitation.identityVerification.faceMatch.passed ? 'Face verification successful' : 'Face verification failed',
      data: {
        verified: verificationResult.verified,
        matchScore: verificationResult.matchScore,
        confidence: verificationResult.confidence,
        livenessScore: verificationResult.livenessScore,
        threshold: invitation.identityVerification.faceMatch.threshold,
        livePhotoUrl: uploadResult.secure_url,
        details: verificationResult.details
      }
    });
  } catch (error: any) {
    console.error('Error verifying face:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify face'
    });
  }
};

/**
 * Get verification status
 */
export const getVerificationStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { invitationId } = req.params;

    const invitation = await Invitation.findById(invitationId);
    if (!invitation) {
      res.status(404).json({
        success: false,
        error: 'Invitation not found'
      });
      return;
    }

    const verification = invitation.identityVerification;

    res.status(200).json({
      success: true,
      data: {
        status: verification?.status || 'pending',
        idDocumentUploaded: !!verification?.idDocument?.documentPhotoUrl,
        livePhotoUploaded: !!verification?.livePhoto?.photoUrl,
        faceMatchScore: verification?.faceMatch?.score,
        verified: verification?.status === 'verified',
        attempts: verification?.attempts?.length || 0
      }
    });
  } catch (error: any) {
    console.error('Error getting verification status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get verification status'
    });
  }
};

/**
 * Retry verification (if failed)
 */
export const retryVerification = async (req: Request, res: Response): Promise<void> => {
  try {
    const { invitationId } = req.params;

    const invitation = await Invitation.findById(invitationId);
    if (!invitation) {
      res.status(404).json({
        success: false,
        error: 'Invitation not found'
      });
      return;
    }

    // Check attempts limit
    const attempts = invitation.identityVerification?.attempts?.length || 0;
    if (attempts >= 3) {
      res.status(400).json({
        success: false,
        error: 'Maximum verification attempts reached. Please contact HR.'
      });
      return;
    }

    // Reset verification status to allow retry
    if (invitation.identityVerification) {
      invitation.identityVerification.status = 'pending';
      await invitation.save();
    }

    res.status(200).json({
      success: true,
      message: 'Verification reset. You can try again.',
      data: {
        attemptsRemaining: 3 - attempts
      }
    });
  } catch (error: any) {
    console.error('Error retrying verification:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retry verification'
    });
  }
};
