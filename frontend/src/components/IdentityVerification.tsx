import { useState, useRef, useEffect } from 'react';
import { Camera, Upload, CheckCircle, XCircle, AlertCircle, Loader2, FileText } from 'lucide-react';
import * as faceapi from 'face-api.js';
import { createWorker } from 'tesseract.js';
import axios from 'axios';

interface IdentityVerificationProps {
  invitationId: string;
  candidateName: string; // Name from interview invitation
  onVerificationComplete: (verified: boolean, idDocumentUrl?: string) => void;
}

export default function IdentityVerification({ invitationId, candidateName, onVerificationComplete }: IdentityVerificationProps) {
  const [step, setStep] = useState<'upload-id' | 'capture-selfie' | 'verifying' | 'complete'>('upload-id');
  const [idDocument, setIdDocument] = useState<File | null>(null);
  const [idPreview, setIdPreview] = useState<string | null>(null);
  const [selfieBlob, setSelfieBlob] = useState<Blob | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
  const [documentType, setDocumentType] = useState<'aadhaar' | 'pan' | 'passport' | 'drivers_license'>('aadhaar');
  const [documentNumber, setDocumentNumber] = useState('');
  const [extractedText, setExtractedText] = useState<string>('');
  const [extractedName, setExtractedName] = useState<string>('');
  const [extractedIdNumber, setExtractedIdNumber] = useState<string>('');
  const [ocrProcessing, setOcrProcessing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [idDocumentUrl, setIdDocumentUrl] = useState<string>('');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Load face-api.js models - Using SSD MobileNet for better accuracy
  useEffect(() => {
    const loadModels = async () => {
      try {
        const MODEL_URL = '/models';
        await Promise.all([
          faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL), // Better detector
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        ]);
        setModelsLoaded(true);
        console.log('✅ Face-API models loaded (SSD MobileNet v1)');
      } catch (error) {
        console.error('❌ Error loading face-api models:', error);
        setError('Failed to load face recognition models');
      }
    };
    loadModels();
  }, []);

  // Extract text from ID using OCR based on document type
  const extractTextFromID = async (file: File) => {
    setOcrProcessing(true);
    setError(null);
    
    try {
      console.log(`🔍 Starting OCR extraction for ${documentType}...`);
      const worker = await createWorker('eng');
      const { data: { text } } = await worker.recognize(file);
      await worker.terminate();
      
      console.log('📄 Extracted text:', text);
      setExtractedText(text);
      
      // Extract name and ID based on document type
      let extractedNameValue = '';
      let extractedIdValue = '';
      
      if (documentType === 'aadhaar') {
        // Aadhaar Card patterns
        // Name: Look for English name (usually appears after Hindi name or near DOB)
        const aadhaarNamePattern1 = /([A-Z][a-z]+\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s*(?:DOB|dob|Date|\/)/i;
        const nameMatch1 = text.match(aadhaarNamePattern1);
        
        // Pattern 2: Look for capitalized names (but filter out common words)
        const aadhaarNamePattern2 = /\b([A-Z][a-z]{2,}\s+[A-Z][a-z]{2,}(?:\s+[A-Z][a-z]{2,})?)\b/;
        const allMatches = text.match(new RegExp(aadhaarNamePattern2, 'g'));
        
        // Filter out common Aadhaar text
        const excludeWords = ['government', 'india', 'aadhaar', 'male', 'female', 'address', 'date', 'birth'];
        let nameMatch2 = null;
        if (allMatches) {
          for (const match of allMatches) {
            const lowerMatch = match.toLowerCase();
            if (!excludeWords.some(word => lowerMatch.includes(word))) {
              nameMatch2 = match;
              break;
            }
          }
        }
        
        if (nameMatch1) {
          extractedNameValue = nameMatch1[1].trim();
        } else if (nameMatch2) {
          extractedNameValue = nameMatch2.trim();
        }
        
        console.log('🔍 Aadhaar name extraction:', extractedNameValue);
        
        // Aadhaar Number: 12 digits
        const aadhaarPattern = /\b(\d{4}[\s\-]?\d{4}[\s\-]?\d{4})\b/;
        const idMatch = text.match(aadhaarPattern);
        if (idMatch) extractedIdValue = idMatch[1].replace(/[\s\-]/g, '');
        
      } else if (documentType === 'pan') {
        // PAN Card patterns - multi-line name extraction
        const panNamePattern = /(?:name)[:\s]+(.+?)(?:father|date|dob|\d{2}\/\d{2}\/\d{4})/is;
        let nameMatch = text.match(panNamePattern);
        
        if (!nameMatch) {
          const simplePanPattern = /(?:name)[:\s]+([A-Z\s]+?)(?:\n.*?father|\n.*?date)/is;
          nameMatch = text.match(simplePanPattern);
        }
        
        if (nameMatch) {
          let name = nameMatch[1]
            .replace(/\n/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
          
          // Remove everything after semicolon or pipe
          name = name.split(/[;|।]/)[0].trim();
          
          const words = name.split(/\s+/);
          const titleWords = ['mr', 'mrs', 'ms', 'dr', 'shri', 'smt', 'sri', 'shr', 'sr', 'te', 'srte', 'srl', 'sif', 'slf'];
          
          let startIndex = 0;
          for (let i = 0; i < words.length; i++) {
            if (titleWords.includes(words[i].toLowerCase()) || words[i].length <= 2) {
              startIndex = i + 1;
            } else {
              break;
            }
          }
          
          const cleanWords = words.slice(startIndex).filter(word => 
            /^[A-Za-z]+$/.test(word) && word.length >= 3
          );
          
          extractedNameValue = cleanWords.join(' ').trim();
        }
        
        // PAN Number: ABCDE1234F
        const panPattern = /\b([A-Z]{5}\d{4}[A-Z])\b/;
        const idMatch = text.match(panPattern);
        if (idMatch) extractedIdValue = idMatch[1];
        
      } else if (documentType === 'passport') {
        // Passport patterns
        const surnamePattern = /(?:surname|last\s*name)[:\s]+([a-zA-Z\s]+)/i;
        const givenNamePattern = /(?:given\s*names?|first\s*name)[:\s]+([a-zA-Z\s]+)/i;
        const surnameMatch = text.match(surnamePattern);
        const givenMatch = text.match(givenNamePattern);
        if (givenMatch && surnameMatch) {
          extractedNameValue = `${givenMatch[1].trim()} ${surnameMatch[1].trim()}`;
        } else if (givenMatch) {
          extractedNameValue = givenMatch[1].trim();
        }
        
        // Passport Number
        const passportPattern = /(?:passport\s*no|number)[:\s]*([A-Z0-9]{6,9})/i;
        const idMatch = text.match(passportPattern);
        if (idMatch) {
          extractedIdValue = idMatch[1];
        } else {
          const fallbackPattern = /\b([A-Z]\d{7,8})\b/;
          const fallbackMatch = text.match(fallbackPattern);
          if (fallbackMatch) extractedIdValue = fallbackMatch[1];
        }
        
      } else if (documentType === 'drivers_license') {
        // Driver's License patterns
        const namePattern1 = /(?:name)[:\s]+([a-zA-Z\s]+)/i;
        const namePattern2 = /\b([A-Z]{2,}\s+[A-Z]{2,}(?:\s+[A-Z]{2,})?)\b/;
        const nameMatch1 = text.match(namePattern1);
        const nameMatch2 = text.match(namePattern2);
        if (nameMatch1) {
          extractedNameValue = nameMatch1[1].trim();
        } else if (nameMatch2) {
          extractedNameValue = nameMatch2[1].trim();
        }
        
        // DL Number
        const dlPattern1 = /\b(\d{8,9})\b/;
        const dlPattern2 = /\b(\d{2}[\s\-]?\d{3}[\s\-]?\d{3,4})\b/;
        const dlPattern3 = /(?:dl|license|id)[:\s#]*([A-Z0-9\-\s]{6,})/i;
        
        const dlMatch2 = text.match(dlPattern2);
        const dlMatch1 = text.match(dlPattern1);
        const dlMatch3 = text.match(dlPattern3);
        
        if (dlMatch2) {
          extractedIdValue = dlMatch2[1].replace(/[\s\-]/g, '');
        } else if (dlMatch1) {
          extractedIdValue = dlMatch1[1];
        } else if (dlMatch3) {
          extractedIdValue = dlMatch3[1].trim().replace(/\s+/g, '');
        }
      }
      
      // Validate document type matches extracted data
      let documentTypeWarning = '';
      if (extractedIdValue) {
        if (documentType === 'pan' && !/^[A-Z]{5}\d{4}[A-Z]$/.test(extractedIdValue)) {
          documentTypeWarning = '⚠️ ID format doesn\'t match PAN card (should be ABCDE1234F)';
        } else if (documentType === 'aadhaar' && !/^\d{12}$/.test(extractedIdValue)) {
          documentTypeWarning = '⚠️ ID format doesn\'t match Aadhaar (should be 12 digits)';
        } else if (documentType === 'passport' && !/^[A-Z]\d{7,8}$/.test(extractedIdValue)) {
          documentTypeWarning = '⚠️ ID format doesn\'t match Passport format';
        }
      }
      
      // Set extracted values
      if (extractedNameValue) {
        setExtractedName(extractedNameValue);
        console.log('✅ Extracted name:', extractedNameValue);
      }
      
      if (extractedIdValue) {
        setExtractedIdNumber(extractedIdValue);
        // Don't auto-fill document number - user must enter manually
        console.log('✅ Extracted ID number:', extractedIdValue);
      }
      
      // Show warning if document type mismatch
      if (documentTypeWarning) {
        setError(documentTypeWarning);
        console.warn(documentTypeWarning);
      }
      
      setOcrProcessing(false);
    } catch (error) {
      console.error('❌ OCR extraction failed:', error);
      setOcrProcessing(false);
      // Don't show error - OCR is optional, user can still enter manually
    }
  };

  // Handle ID document upload
  const handleIDUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIdDocument(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setIdPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      
      // Extract text from ID
      extractTextFromID(file);
    }
  };

  // Validate name and ID number match
  const validateIDData = (): { valid: boolean; message: string } => {
    // Check if name matches (fuzzy match - allow some differences)
    if (extractedName && candidateName) {
      const nameSimilarity = calculateSimilarity(candidateName.toLowerCase(), extractedName.toLowerCase());
      if (nameSimilarity < 0.6) {
        return {
          valid: false,
          message: `Name doesn't match!\nExpected: ${candidateName}\nFound on ID: ${extractedName}`
        };
      }
    }

    // Check if ID number matches (require 90% similarity)
    if (extractedIdNumber && documentNumber) {
      const idSimilarity = calculateSimilarity(
        documentNumber.toLowerCase().replace(/[\s\-]/g, ''),
        extractedIdNumber.toLowerCase().replace(/[\s\-]/g, '')
      );
      
      console.log(`📊 ID similarity: ${(idSimilarity * 100).toFixed(2)}%`);
      console.log(`   Entered: "${documentNumber}"`);
      console.log(`   Extracted: "${extractedIdNumber}"`);
      
      if (idSimilarity < 0.95) {
        return {
          valid: false,
          message: `ID number doesn't match!\nPlease upload the correct ID document.`
        };
      }
    }

    return { valid: true, message: 'ID validation passed' };
  };

  // Simple string similarity calculator
  const calculateSimilarity = (str1: string, str2: string): number => {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = (s1: string, s2: string): number => {
      const costs: number[] = [];
      for (let i = 0; i <= s1.length; i++) {
        let lastValue = i;
        for (let j = 0; j <= s2.length; j++) {
          if (i === 0) {
            costs[j] = j;
          } else if (j > 0) {
            let newValue = costs[j - 1];
            if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
              newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
            }
            costs[j - 1] = lastValue;
            lastValue = newValue;
          }
        }
        if (i > 0) costs[s2.length] = lastValue;
      }
      return costs[s2.length];
    };
    
    return (longer.length - editDistance(longer, shorter)) / longer.length;
  };

  // Upload ID to Cloudinary and proceed to selfie capture
  const uploadIDDocument = async () => {
    if (!idDocument || !documentNumber) {
      setError('Please upload ID and enter document number');
      return;
    }

    // Validate ID data if OCR extracted anything
    if (extractedName || extractedIdNumber) {
      const validation = validateIDData();
      if (!validation.valid) {
        setError(validation.message);
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      // Upload ID document to Cloudinary with unique, meaningful filename
      const formData = new FormData();
      formData.append('file', idDocument);
      formData.append('upload_preset', 'w52wsu9f');
      formData.append('folder', 'id_documents');
      // Format: candidateName_documentType_timestamp_randomId
      const sanitizedName = candidateName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(2, 8);
      const uniqueFilename = `${sanitizedName}_${documentType}_${timestamp}_${randomId}`;
      formData.append('public_id', uniqueFilename);

      const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
      if (!cloudName) {
        throw new Error('Cloudinary configuration missing');
      }

      const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`;
      console.log('📤 Uploading ID document to Cloudinary...');
      console.log('☁️ Cloudinary cloud name:', cloudName);
      console.log('🌐 Uploading to:', CLOUDINARY_URL);
      
      const response = await axios.post(CLOUDINARY_URL, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      console.log('✅ ID document uploaded:', response.data.secure_url);
      
      // Store the URL for later submission
      setIdDocumentUrl(response.data.secure_url);

      // Proceed to selfie capture for face verification
      setStep('capture-selfie');
    } catch (error: any) {
      console.error('❌ Error uploading ID:', error);
      setError(error.message || 'Failed to upload ID document');
    } finally {
      setLoading(false);
    }
  };

  // Start camera for selfie
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: 640, 
          height: 480,
          facingMode: 'user'
        } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      setError('Failed to access camera. Please grant camera permissions.');
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  // Capture selfie
  const captureSelfie = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.drawImage(video, 0, 0);
    
    canvas.toBlob((blob) => {
      if (blob) {
        setSelfieBlob(blob);
        setSelfiePreview(canvas.toDataURL());
        stopCamera();
      }
    }, 'image/jpeg', 0.95);
  };

  // Retake selfie
  const retakeSelfie = () => {
    setSelfieBlob(null);
    setSelfiePreview(null);
    startCamera();
  };

  // Perform face matching using face-api.js with SSD MobileNet
  const performFaceMatching = async (): Promise<{ matchScore: number; livenessScore: number }> => {
    if (!idPreview || !selfiePreview) {
      throw new Error('Both images are required');
    }

    // Load images
    const idImg = await faceapi.fetchImage(idPreview);
    const selfieImg = await faceapi.fetchImage(selfiePreview);

    // Detect all faces in ID (for ID cards with multiple photos)
    const idDetections = await faceapi
      .detectAllFaces(idImg, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.3 }))
      .withFaceLandmarks()
      .withFaceDescriptors();

    // Detect face in selfie
    const selfieDetection = await faceapi
      .detectSingleFace(selfieImg, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
      .withFaceLandmarks()
      .withFaceDescriptor();

    // Pick largest face from ID (main photo)
    let idDetection = null;
    if (idDetections.length > 0) {
      idDetection = idDetections.reduce((largest, current) => {
        const largestArea = largest.detection.box.width * largest.detection.box.height;
        const currentArea = current.detection.box.width * current.detection.box.height;
        return currentArea > largestArea ? current : largest;
      });
    }

    if (!idDetection || !selfieDetection) {
      throw new Error('Could not detect faces in one or both images');
    }

    // Calculate face distance (lower = more similar)
    const distance = faceapi.euclideanDistance(
      idDetection.descriptor,
      selfieDetection.descriptor
    );

    // Convert distance to match score using optimized threshold for ID cards
    // Using 0.8 threshold for maximum tolerance with ID cards (same as TestVerification)
    const matchScore = Math.max(0, Math.min(100, (1 - distance / 0.8) * 100));

    // Liveness check based on face detection confidence
    const livenessScore = selfieDetection.detection.score * 100;

    console.log(`📊 Distance: ${distance.toFixed(4)}, Match: ${matchScore.toFixed(2)}%, Liveness: ${livenessScore.toFixed(2)}%`);

    return {
      matchScore: Math.round(matchScore * 100) / 100,
      livenessScore: Math.round(livenessScore * 100) / 100
    };
  };

  // Submit verification (client-side only with Face-API.js)
  const submitVerification = async () => {
    if (!selfieBlob) {
      setError('Please capture a selfie');
      return;
    }

    if (!modelsLoaded) {
      setError('Face recognition models are still loading. Please wait...');
      return;
    }

    setLoading(true);
    setError(null);
    setStep('verifying');

    try {
      // Perform face matching on client-side using Face-API.js
      console.log('🔍 Performing face matching with SSD MobileNet v1...');
      const { matchScore, livenessScore } = await performFaceMatching();
      console.log(`✅ Match Score: ${matchScore}%, Liveness: ${livenessScore}%`);

      // Determine if verification passed
      // Thresholds: Match ≥40%, Liveness ≥70%
      const verified = matchScore >= 40 && livenessScore >= 70;

      // Set result
      const result = {
        verified,
        matchScore,
        livenessScore,
        message: verified 
          ? '✅ Identity verified successfully!' 
          : '❌ Verification failed. Face does not match ID document.'
      };

      setVerificationResult(result);
      setStep('complete');
      
      console.log(verified ? '✅ Verification PASSED' : '❌ Verification FAILED');
      
      // If verified, wait 4 seconds to show success animation, then submit with ID URL
      if (verified) {
        setTimeout(() => {
          onVerificationComplete(verified, idDocumentUrl);
        }, 4000);
      } else {
        // If failed, notify immediately (no ID URL needed)
        onVerificationComplete(verified);
      }
    } catch (error: any) {
      console.error('❌ Error during verification:', error);
      setError(error.message || 'Verification failed. Please try again.');
      setStep('capture-selfie');
    } finally {
      setLoading(false);
    }
  };

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Start camera when step changes to capture-selfie
  useEffect(() => {
    if (step === 'capture-selfie' && !selfiePreview) {
      startCamera();
    }
  }, [step]);

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6">
      <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 md:p-8">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Identity Verification</h2>
          <p className="text-sm sm:text-base text-gray-600">Verify your identity to proceed with the interview</p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-6 sm:mb-8">
          <div className={`flex items-center ${step === 'upload-id' ? 'text-indigo-600' : 'text-green-600'}`}>
            <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center ${step === 'upload-id' ? 'bg-indigo-100' : 'bg-green-100'}`}>
              {step !== 'upload-id' ? <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6" /> : <Upload className="w-5 h-5 sm:w-6 sm:h-6" />}
            </div>
            <span className="ml-2 font-semibold text-sm sm:text-base hidden sm:inline">Upload ID</span>
          </div>
          
          <div className="w-8 sm:w-16 h-1 bg-gray-300 mx-2 sm:mx-4"></div>
          
          <div className={`flex items-center ${step === 'capture-selfie' || step === 'verifying' || step === 'complete' ? 'text-indigo-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center ${step === 'complete' ? 'bg-green-100' : step === 'capture-selfie' || step === 'verifying' ? 'bg-indigo-100' : 'bg-gray-100'}`}>
              {step === 'complete' ? <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" /> : <Camera className="w-5 h-5 sm:w-6 sm:h-6" />}
            </div>
            <span className="ml-2 font-semibold text-sm sm:text-base hidden sm:inline">Capture Selfie</span>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-5 bg-red-50 border-l-4 border-red-500 rounded-lg shadow-sm">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <AlertCircle className="w-6 h-6 text-red-500" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-semibold text-red-800 mb-1">Verification Failed</h3>
                <p className="text-sm text-red-700 whitespace-pre-line leading-relaxed">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Step 1: Upload ID */}
        {step === 'upload-id' && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Document Type
              </label>
              <select
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value as any)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="aadhaar">Aadhaar Card</option>
                <option value="pan">PAN Card</option>
                <option value="passport">Passport</option>
                <option value="drivers_license">Driver's License</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                {documentType === 'aadhaar' && '12-digit Aadhaar number'}
                {documentType === 'pan' && 'Format: ABCDE1234F'}
                {documentType === 'passport' && '8-9 alphanumeric characters'}
                {documentType === 'drivers_license' && 'State-specific format'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Document Number
              </label>
              <input
                type="text"
                value={documentNumber}
                onChange={(e) => setDocumentNumber(e.target.value)}
                placeholder="Enter your document number"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload ID Document
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-indigo-500 transition-colors cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleIDUpload}
                  className="hidden"
                  id="id-upload"
                />
                <label htmlFor="id-upload" className="cursor-pointer">
                  {idPreview ? (
                    <img src={idPreview} alt="ID Preview" className="max-h-64 mx-auto rounded-lg" />
                  ) : (
                    <>
                      <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">Click to upload your ID document</p>
                      <p className="text-sm text-gray-500 mt-2">PNG, JPG up to 5MB</p>
                    </>
                  )}
                </label>
              </div>
            </div>

            <button
              onClick={uploadIDDocument}
              disabled={!idDocument || !documentNumber || loading || ocrProcessing}
              className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              {ocrProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Processing ID...
                </>
              ) : loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                'Continue'
              )}
            </button>
          </div>
        )}

        {/* Step 2: Capture Selfie */}
        {step === 'capture-selfie' && (
          <div className="space-y-4 sm:space-y-6">
            <div className="text-center mb-4">
              <p className="text-sm sm:text-base text-gray-700">Position your face in the center and capture a clear selfie</p>
            </div>

            {!selfiePreview ? (
              <div className="relative">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full rounded-lg max-h-[60vh] object-cover"
                />
                <canvas ref={canvasRef} className="hidden" />
                
                <button
                  onClick={captureSelfie}
                  className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-indigo-600 text-white px-6 sm:px-8 py-2 sm:py-3 rounded-full font-semibold hover:bg-indigo-700 transition-colors flex items-center text-sm sm:text-base"
                >
                  <Camera className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  Capture Photo
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <img src={selfiePreview} alt="Selfie Preview" className="w-full rounded-lg max-h-[60vh] object-cover" />
                
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  <button
                    onClick={retakeSelfie}
                    className="flex-1 bg-gray-200 text-gray-700 py-2.5 sm:py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors text-sm sm:text-base"
                  >
                    Retake
                  </button>
                  <button
                    onClick={submitVerification}
                    disabled={loading || !modelsLoaded}
                    className="flex-1 bg-indigo-600 text-white py-2.5 sm:py-3 rounded-lg font-semibold hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center text-sm sm:text-base"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Verifying...
                      </>
                    ) : !modelsLoaded ? (
                      'Loading models...'
                    ) : (
                      'Verify Identity'
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Verifying */}
        {step === 'verifying' && (
          <div className="text-center py-12">
            <Loader2 className="w-16 h-16 text-indigo-600 mx-auto mb-4 animate-spin" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Verifying Your Identity</h3>
            <p className="text-gray-600">Please wait while we verify your identity...</p>
          </div>
        )}

        {/* Step 4: Complete */}
        {step === 'complete' && verificationResult && (
          <div className="text-center py-8">
            {verificationResult.verified ? (
              <>
                <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                  <CheckCircle className="w-16 h-16 text-green-600 animate-pulse" />
                </div>
                <h3 className="text-2xl font-bold text-green-600 mb-2 animate-fade-in">Verification Successful!</h3>
                <p className="text-gray-600 mb-6">Submitting your information...</p>
                
              </>
            ) : (
              <>
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <XCircle className="w-12 h-12 text-red-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Verification Failed</h3>
                <p className="text-gray-600 mb-6">We couldn't verify your identity. Please try again.</p>
                
                
                <button
                  onClick={() => {
                    setStep('upload-id');
                    setIdDocument(null);
                    setIdPreview(null);
                    setSelfieBlob(null);
                    setSelfiePreview(null);
                    setVerificationResult(null);
                  }}
                  className="bg-indigo-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
                >
                  Try Again
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
