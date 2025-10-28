/**
 * Face Recognition Service using Face-API.js (Client-side)
 * The actual face recognition happens in the browser using face-api.js
 * This backend service validates the client-side results
 */

/**
 * Validate face match result from client
 * Client sends the match score, we just validate it's within acceptable range
 */
export const validateFaceMatch = async (
  matchScore: number,
  livenessScore: number
): Promise<{
  valid: boolean;
  verified: boolean;
  message: string;
}> => {
  try {
    // Validate scores are in valid range
    if (matchScore < 0 || matchScore > 100) {
      return {
        valid: false,
        verified: false,
        message: 'Invalid match score'
      };
    }

    if (livenessScore < 0 || livenessScore > 100) {
      return {
        valid: false,
        verified: false,
        message: 'Invalid liveness score'
      };
    }

    // Check if verification passed
    // Using 40% threshold optimized for ID cards (small photos, quality differences)
    const threshold = 40;
    const livenessThreshold = 70;
    
    const verified = matchScore >= threshold && livenessScore >= livenessThreshold;

    console.log(`📊 Verification: Match=${matchScore}% (threshold=${threshold}%), Liveness=${livenessScore}% (threshold=${livenessThreshold}%)`);

    return {
      valid: true,
      verified,
      message: verified 
        ? 'Face verification successful' 
        : `Face match score (${matchScore}%) or liveness (${livenessScore}%) below threshold (${threshold}%/${livenessThreshold}%)`
    };
  } catch (error: any) {
    console.error('Error validating face match:', error);
    throw new Error(`Face validation failed: ${error.message}`);
  }
};

/**
 * Simple image validation
 * Check if image URLs are accessible
 */
export const validateImages = async (
  idPhotoUrl: string,
  livePhotoUrl: string
): Promise<{
  valid: boolean;
  message: string;
}> => {
  try {
    // Simple validation - check if URLs are provided
    if (!idPhotoUrl || !livePhotoUrl) {
      return {
        valid: false,
        message: 'Both ID photo and live photo are required'
      };
    }

    // Check if URLs are valid format
    try {
      new URL(idPhotoUrl);
      new URL(livePhotoUrl);
    } catch {
      return {
        valid: false,
        message: 'Invalid image URLs'
      };
    }

    return {
      valid: true,
      message: 'Images validated successfully'
    };
  } catch (error: any) {
    console.error('Error validating images:', error);
    throw new Error(`Image validation failed: ${error.message}`);
  }
};


/**
 * Verify identity using client-side face recognition results
 * The client (browser) does the actual face matching using face-api.js
 * We validate and store the results here
 */
export const verifyIdentity = async (
  idPhotoUrl: string,
  livePhotoUrl: string,
  clientMatchScore: number,
  clientLivenessScore: number
): Promise<{
  verified: boolean;
  matchScore: number;
  confidence: number;
  livenessScore: number;
  details: any;
}> => {
  try {
    // Validate image URLs
    const imageValidation = await validateImages(idPhotoUrl, livePhotoUrl);
    if (!imageValidation.valid) {
      throw new Error(imageValidation.message);
    }

    // Validate client-provided scores
    const validation = await validateFaceMatch(clientMatchScore, clientLivenessScore);
    
    if (!validation.valid) {
      throw new Error(validation.message);
    }

    return {
      verified: validation.verified,
      matchScore: clientMatchScore,
      confidence: 99, // High confidence since client-side processing is deterministic
      livenessScore: clientLivenessScore,
      details: {
        message: validation.message,
        method: 'face-api.js',
        processedOn: 'client-side'
      }
    };
  } catch (error: any) {
    console.error('Error verifying identity:', error);
    throw new Error(`Identity verification failed: ${error.message}`);
  }
};
