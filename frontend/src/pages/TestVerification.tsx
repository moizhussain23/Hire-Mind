import { useState, useRef, useEffect } from 'react';
import { Camera, Upload, CheckCircle, XCircle, Loader2, FileText } from 'lucide-react';
import * as faceapi from 'face-api.js';
import { createWorker } from 'tesseract.js';

export default function TestVerification() {
  const [step, setStep] = useState<'upload-id' | 'capture-selfie' | 'result'>('upload-id');
  const [idDocument, setIdDocument] = useState<File | null>(null);
  const [idPreview, setIdPreview] = useState<string | null>(null);
  const [selfieBlob, setSelfieBlob] = useState<Blob | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [matchResult, setMatchResult] = useState<any>(null);
  
  // OCR states
  const [candidateName, setCandidateName] = useState('');
  const [documentType, setDocumentType] = useState<'aadhaar' | 'pan' | 'passport' | 'drivers_license'>('drivers_license');
  const [documentNumber, setDocumentNumber] = useState('');
  const [extractedText, setExtractedText] = useState<string>('');
  const [extractedName, setExtractedName] = useState<string>('');
  const [extractedIdNumber, setExtractedIdNumber] = useState<string>('');
  const [ocrProcessing, setOcrProcessing] = useState(false);
  const [ocrComplete, setOcrComplete] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Load face-api.js models - Using SSD MobileNet for better accuracy
  useEffect(() => {
    const loadModels = async () => {
      try {
        const MODEL_URL = '/models';
        await Promise.all([
          faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL), // Better detector than Tiny
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
    setOcrComplete(false);
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
        // Pattern 1: Look for name near "DOB" or date pattern
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
        
        // Aadhaar Number: 12 digits (XXXX XXXX XXXX or XXXXXXXXXXXX)
        const aadhaarPattern = /\b(\d{4}[\s\-]?\d{4}[\s\-]?\d{4})\b/;
        const idMatch = text.match(aadhaarPattern);
        if (idMatch) extractedIdValue = idMatch[1].replace(/[\s\-]/g, '');
        
      } else if (documentType === 'pan') {
        // PAN Card patterns
        // Name: Extract from "Name" keyword, may span multiple lines
        const panNamePattern = /(?:name)[:\s]+(.+?)(?:father|date|dob|\d{2}\/\d{2}\/\d{4})/is;
        let nameMatch = text.match(panNamePattern);
        
        // Fallback: Try simpler pattern if first one fails
        if (!nameMatch) {
          const simplePanPattern = /(?:name)[:\s]+([A-Z\s]+?)(?:\n.*?father|\n.*?date)/is;
          nameMatch = text.match(simplePanPattern);
        }
        
        if (nameMatch) {
          // Get all text between "Name" and next field, clean up
          let name = nameMatch[1]
            .replace(/\n/g, ' ')  // Replace newlines with spaces
            .replace(/\s+/g, ' ')  // Normalize multiple spaces
            .trim();
          
          console.log('🔍 Raw extracted name:', name);
          
          // Remove everything after semicolon, pipe, or Hindi/special characters
          name = name.split(/[;|।]/)[0].trim();
          
          // Split by spaces and filter out OCR artifacts
          const words = name.split(/\s+/);
          const titleWords = ['mr', 'mrs', 'ms', 'dr', 'shri', 'smt', 'sri', 'shr', 'sr', 'te', 'srte', 'srl', 'sif', 'slf'];
          
          // Remove title words and short words from the beginning
          let startIndex = 0;
          for (let i = 0; i < words.length; i++) {
            if (titleWords.includes(words[i].toLowerCase()) || words[i].length <= 2) {
              startIndex = i + 1;
            } else {
              break; // Stop when we hit a real name word
            }
          }
          
          // Also remove non-alphabetic words and keep only valid name words
          const cleanWords = words.slice(startIndex).filter(word => {
            // Keep only words with mostly letters (allow some numbers but not pure numbers)
            return /^[A-Za-z]+$/.test(word) && word.length >= 3;
          });
          
          extractedNameValue = cleanWords.join(' ').trim();
          console.log('✅ Cleaned name:', extractedNameValue);
        }
        
        // PAN Number: Format ABCDE1234F (5 letters, 4 digits, 1 letter)
        const panPattern = /\b([A-Z]{5}\d{4}[A-Z])\b/;
        const idMatch = text.match(panPattern);
        if (idMatch) extractedIdValue = idMatch[1];
        
      } else if (documentType === 'passport') {
        // Passport patterns
        // Name: Look for "Surname" or "Given Names"
        const surnamePattern = /(?:surname|last\s*name)[:\s]+([a-zA-Z\s]+)/i;
        const givenNamePattern = /(?:given\s*names?|first\s*name)[:\s]+([a-zA-Z\s]+)/i;
        const surnameMatch = text.match(surnamePattern);
        const givenMatch = text.match(givenNamePattern);
        if (givenMatch && surnameMatch) {
          extractedNameValue = `${givenMatch[1].trim()} ${surnameMatch[1].trim()}`;
        } else if (givenMatch) {
          extractedNameValue = givenMatch[1].trim();
        }
        
        // Passport Number: Usually 8-9 alphanumeric characters
        const passportPattern = /(?:passport\s*no|number)[:\s]*([A-Z0-9]{6,9})/i;
        const idMatch = text.match(passportPattern);
        if (idMatch) {
          extractedIdValue = idMatch[1];
        } else {
          // Fallback: Look for 8-9 character alphanumeric
          const fallbackPattern = /\b([A-Z]\d{7,8})\b/;
          const fallbackMatch = text.match(fallbackPattern);
          if (fallbackMatch) extractedIdValue = fallbackMatch[1];
        }
        
      } else if (documentType === 'drivers_license') {
        // Driver's License patterns
        // Name: Look for capitalized names or after "NAME"
        const namePattern1 = /(?:name)[:\s]+([a-zA-Z\s]+)/i;
        const namePattern2 = /\b([A-Z]{2,}\s+[A-Z]{2,}(?:\s+[A-Z]{2,})?)\b/;
        const nameMatch1 = text.match(namePattern1);
        const nameMatch2 = text.match(namePattern2);
        if (nameMatch1) {
          extractedNameValue = nameMatch1[1].trim();
        } else if (nameMatch2) {
          extractedNameValue = nameMatch2[1].trim();
        }
        
        // DL Number: Various formats, try multiple patterns
        // Pattern 1: 8-9 digits
        const dlPattern1 = /\b(\d{8,9})\b/;
        // Pattern 2: Formatted (99 999 999)
        const dlPattern2 = /\b(\d{2}[\s\-]?\d{3}[\s\-]?\d{3,4})\b/;
        // Pattern 3: After DL/ID keyword
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
      
      // Check if extracted ID format matches selected document type
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
        setDocumentNumber(extractedIdValue); // Auto-fill
        console.log('✅ Extracted ID number:', extractedIdValue);
      }
      
      // Show warning if document type mismatch
      if (documentTypeWarning) {
        setError(documentTypeWarning);
        console.warn(documentTypeWarning);
      }
      
      setOcrProcessing(false);
      setOcrComplete(true);
    } catch (error) {
      console.error('❌ OCR extraction failed:', error);
      setOcrProcessing(false);
      setOcrComplete(true);
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

  // Start camera
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      setError('Failed to access camera. Please allow camera permissions.');
    }
  };

  // Capture selfie
  const captureSelfie = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        
        canvas.toBlob((blob) => {
          if (blob) {
            setSelfieBlob(blob);
            setSelfiePreview(URL.createObjectURL(blob));
            
            // Stop camera
            if (streamRef.current) {
              streamRef.current.getTracks().forEach(track => track.stop());
            }
          }
        }, 'image/jpeg', 0.95);
      }
    }
  };

  // Perform face matching
  const performFaceMatching = async () => {
    if (!idPreview || !selfiePreview || !modelsLoaded) {
      setError('Missing images or models not loaded');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Load images
      const idImg = await faceapi.fetchImage(idPreview);
      const selfieImg = await faceapi.fetchImage(selfiePreview);

      // Detect faces using SSD MobileNet with lower confidence for ID cards
      console.log('🔍 Detecting face in ID document...');
      const idDetections = await faceapi
        .detectAllFaces(idImg, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.3 })) // Lower threshold for ID cards
        .withFaceLandmarks()
        .withFaceDescriptors();

      console.log('🔍 Detecting face in selfie...');
      const selfieDetection = await faceapi
        .detectSingleFace(selfieImg, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
        .withFaceLandmarks()
        .withFaceDescriptor();

      // For ID cards, pick the largest face (usually the main photo)
      let idDetection = null;
      if (idDetections.length > 0) {
        idDetection = idDetections.reduce((largest, current) => {
          const largestArea = largest.detection.box.width * largest.detection.box.height;
          const currentArea = current.detection.box.width * current.detection.box.height;
          return currentArea > largestArea ? current : largest;
        });
        console.log(`✅ Found ${idDetections.length} faces in ID, using largest one`);
      }

      if (!idDetection) {
        setError('No face detected in ID document. Please upload a clear photo.');
        setLoading(false);
        return;
      }

      if (!selfieDetection) {
        setError('No face detected in selfie. Please try again.');
        setLoading(false);
        return;
      }

      // Calculate face match distance (lower = better match)
      const distance = faceapi.euclideanDistance(
        idDetection.descriptor,
        selfieDetection.descriptor
      );

      // Very lenient scoring for ID cards (low quality, small photos)
      // Using 0.8 threshold for maximum tolerance
      const matchScore = Math.max(0, Math.min(100, (1 - distance / 0.8) * 100));
      
      // Simple liveness check based on detection confidence
      const livenessScore = Math.round(selfieDetection.detection.score * 100);

      // Adjusted thresholds for ID card verification:
      // Match ≥40% (very lenient for small ID photos)
      // Liveness ≥70%
      // ID cards have small, low-quality photos that need lower thresholds
      const passed = matchScore >= 40 && livenessScore >= 70;

      setMatchResult({
        matchScore: Math.round(matchScore),
        livenessScore,
        passed,
        distance: distance.toFixed(4)
      });

      setStep('result');
      console.log(`✅ Match Score: ${matchScore.toFixed(2)}%`);
      console.log(`✅ Liveness Score: ${livenessScore}%`);
      console.log(`✅ Distance: ${distance.toFixed(4)}`);

    } catch (error: any) {
      console.error('Error during face matching:', error);
      setError('Face matching failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Simple string similarity calculator (Levenshtein distance)
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

  // Validate name matches
  const validateNameMatch = (): boolean => {
    if (!extractedName || !candidateName) {
      return true; // Skip validation if no OCR name
    }

    const similarity = calculateSimilarity(
      candidateName.toLowerCase().trim(),
      extractedName.toLowerCase().trim()
    );

    console.log(`📊 Name similarity: ${(similarity * 100).toFixed(2)}%`);
    console.log(`   Candidate: "${candidateName}"`);
    console.log(`   Extracted: "${extractedName}"`);

    // Require at least 60% similarity (allows for OCR errors)
    if (similarity < 0.6) {
      setError(`❌ Name mismatch!\nExpected: "${candidateName}"\nFound on ID: "${extractedName}"\n\nPlease upload the correct ID document.`);
      return false;
    }

    return true;
  };

  // Move to next step
  const handleContinue = () => {
    if (step === 'upload-id' && idDocument) {
      // Validate name before continuing
      if (!validateNameMatch()) {
        return; // Block if name doesn't match
      }
      
      setStep('capture-selfie');
      setTimeout(() => startCamera(), 100);
    } else if (step === 'capture-selfie' && selfieBlob) {
      performFaceMatching();
    }
  };

  // Reset test
  const resetTest = () => {
    setStep('upload-id');
    setIdDocument(null);
    setIdPreview(null);
    setSelfieBlob(null);
    setSelfiePreview(null);
    setMatchResult(null);
    setError(null);
    setExtractedText('');
    setExtractedName('');
    setExtractedIdNumber('');
    setDocumentNumber('');
    setOcrComplete(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
            <h1 className="text-3xl font-bold text-center">🔐 Face Verification Test</h1>
            <p className="text-center mt-2 text-blue-100">Test face matching without backend</p>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-center p-6 bg-gray-50 border-b">
            <div className={`flex items-center ${step === 'upload-id' ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'upload-id' ? 'bg-blue-600 text-white' : 'bg-gray-300'}`}>1</div>
              <span className="ml-2 font-medium">Upload ID</span>
            </div>
            <div className="w-16 h-1 mx-4 bg-gray-300"></div>
            <div className={`flex items-center ${step === 'capture-selfie' ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'capture-selfie' ? 'bg-blue-600 text-white' : 'bg-gray-300'}`}>2</div>
              <span className="ml-2 font-medium">Capture Selfie</span>
            </div>
            <div className="w-16 h-1 mx-4 bg-gray-300"></div>
            <div className={`flex items-center ${step === 'result' ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'result' ? 'bg-blue-600 text-white' : 'bg-gray-300'}`}>3</div>
              <span className="ml-2 font-medium">Result</span>
            </div>
          </div>

          {/* Content */}
          <div className="p-8">
            {!modelsLoaded && (
              <div className="text-center py-8">
                <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
                <p className="text-gray-600">Loading face recognition models...</p>
              </div>
            )}

            {modelsLoaded && (
              <>
                {/* Step 1: Upload ID */}
                {step === 'upload-id' && (
                  <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-gray-900">Step 1: Upload ID Document</h2>
                    
                    {/* Candidate Name Input */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Candidate Name (from invitation)
                      </label>
                      <input
                        type="text"
                        value={candidateName}
                        onChange={(e) => setCandidateName(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter candidate name"
                      />
                    </div>

                    {/* Document Type Selector */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Document Type
                      </label>
                      <select
                        value={documentType}
                        onChange={(e) => setDocumentType(e.target.value as any)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="aadhaar">Aadhaar Card (आधार कार्ड)</option>
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
                    
                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-500 transition-colors">
                      {idPreview ? (
                        <div>
                          <img src={idPreview} alt="ID Preview" className="max-w-md mx-auto rounded-lg shadow-lg mb-4" />
                          
                          {/* OCR Processing Indicator */}
                          {ocrProcessing && (
                            <div className="flex items-center justify-center text-blue-600 mb-4">
                              <Loader2 className="w-5 h-5 animate-spin mr-2" />
                              <span>Extracting text from ID...</span>
                            </div>
                          )}
                          
                          {/* OCR Results */}
                          {ocrComplete && (extractedName || extractedIdNumber) && (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4 text-left">
                              <div className="flex items-start">
                                <FileText className="w-5 h-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-green-800 mb-2">OCR Extraction Complete:</p>
                                  {extractedName && (
                                    <p className="text-sm text-green-700">• Name: {extractedName}</p>
                                  )}
                                  {extractedIdNumber && (
                                    <p className="text-sm text-green-700">• ID Number: {extractedIdNumber}</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                          
                          <button
                            onClick={() => {
                              setIdDocument(null);
                              setIdPreview(null);
                              setExtractedText('');
                              setExtractedName('');
                              setExtractedIdNumber('');
                              setOcrComplete(false);
                            }}
                            className="text-red-600 hover:text-red-700 font-medium"
                          >
                            Remove & Upload Different
                          </button>
                        </div>
                      ) : (
                        <label className="cursor-pointer">
                          <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                          <p className="text-lg font-medium text-gray-700 mb-2">Click to upload ID document</p>
                          <p className="text-sm text-gray-500">Passport, Driver's License, or National ID</p>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleIDUpload}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                    
                    {/* Document Number Input */}
                    {idDocument && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Document Number
                        </label>
                        <input
                          type="text"
                          value={documentNumber}
                          onChange={(e) => setDocumentNumber(e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Enter ID number"
                        />
                        {extractedIdNumber && documentNumber !== extractedIdNumber && (
                          <p className="text-sm text-amber-600 mt-1">⚠️ Entered number differs from extracted: {extractedIdNumber}</p>
                        )}
                      </div>
                    )}

                    {error && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
                        <XCircle className="w-5 h-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-red-700">{error}</p>
                      </div>
                    )}

                    <button
                      onClick={handleContinue}
                      disabled={!idDocument || !documentNumber || ocrProcessing}
                      className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                    >
                      {ocrProcessing ? 'Processing OCR...' : 'Continue to Selfie Capture'}
                    </button>
                  </div>
                )}

                {/* Step 2: Capture Selfie */}
                {step === 'capture-selfie' && (
                  <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-gray-900">Step 2: Capture Live Selfie</h2>
                    
                    {!selfiePreview ? (
                      <div className="space-y-4">
                        <div className="relative bg-black rounded-xl overflow-hidden">
                          <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            className="w-full h-auto"
                          />
                        </div>
                        <button
                          onClick={captureSelfie}
                          className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center"
                        >
                          <Camera className="w-5 h-5 mr-2" />
                          Capture Photo
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <img src={selfiePreview} alt="Selfie" className="max-w-md mx-auto rounded-lg shadow-lg" />
                        <div className="flex gap-4">
                          <button
                            onClick={() => {
                              setSelfieBlob(null);
                              setSelfiePreview(null);
                              startCamera();
                            }}
                            className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                          >
                            Retake
                          </button>
                          <button
                            onClick={handleContinue}
                            disabled={loading}
                            className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 transition-colors"
                          >
                            {loading ? 'Verifying...' : 'Verify Face Match'}
                          </button>
                        </div>
                      </div>
                    )}

                    {error && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
                        <XCircle className="w-5 h-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-red-700">{error}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Step 3: Result */}
                {step === 'result' && matchResult && (
                  <div className="space-y-6 text-center">
                    {matchResult.passed ? (
                      <>
                        <CheckCircle className="w-20 h-20 text-green-500 mx-auto" />
                        <h2 className="text-3xl font-bold text-green-600">✅ Verification Passed!</h2>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-20 h-20 text-red-500 mx-auto" />
                        <h2 className="text-3xl font-bold text-red-600">❌ Verification Failed</h2>
                      </>
                    )}

                    <div className="bg-gray-50 rounded-xl p-6 space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700 font-medium">Face Match Score:</span>
                        <span className={`text-2xl font-bold ${matchResult.matchScore >= 40 ? 'text-green-600' : 'text-red-600'}`}>
                          {matchResult.matchScore}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className={`h-3 rounded-full ${matchResult.matchScore >= 40 ? 'bg-green-500' : 'bg-red-500'}`}
                          style={{ width: `${matchResult.matchScore}%` }}
                        ></div>
                      </div>

                      <div className="flex justify-between items-center mt-4">
                        <span className="text-gray-700 font-medium">Liveness Score:</span>
                        <span className={`text-2xl font-bold ${matchResult.livenessScore >= 70 ? 'text-green-600' : 'text-red-600'}`}>
                          {matchResult.livenessScore}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className={`h-3 rounded-full ${matchResult.livenessScore >= 70 ? 'bg-green-500' : 'bg-red-500'}`}
                          style={{ width: `${matchResult.livenessScore}%` }}
                        ></div>
                      </div>

                      <div className="text-sm text-gray-500 mt-4">
                        <p>Euclidean Distance: {matchResult.distance}</p>
                        <p className="mt-2">Threshold: Match ≥40%, Liveness ≥70%</p>
                        <p className="text-xs mt-1 text-gray-400">⚠️ Optimized for ID cards with small, low-quality photos</p>
                        <p className="text-xs mt-1 text-gray-400">Accounts for printed photos, glare, and resolution loss</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-6">
                      <div>
                        <p className="text-sm text-gray-600 mb-2">ID Document</p>
                        <img src={idPreview!} alt="ID" className="rounded-lg shadow-md" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-2">Live Selfie</p>
                        <img src={selfiePreview!} alt="Selfie" className="rounded-lg shadow-md" />
                      </div>
                    </div>

                    <button
                      onClick={resetTest}
                      className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                    >
                      Test Again
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
