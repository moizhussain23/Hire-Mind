import { useState, useRef } from 'react';
import { Camera, Upload, CheckCircle, XCircle, Loader2, Zap } from 'lucide-react';

export default function TestVerificationDeepFace() {
  const [step, setStep] = useState<'upload-id' | 'capture-selfie' | 'result'>('upload-id');
  const [idDocument, setIdDocument] = useState<File | null>(null);
  const [idPreview, setIdPreview] = useState<string | null>(null);
  const [selfieBlob, setSelfieBlob] = useState<Blob | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [matchResult, setMatchResult] = useState<any>(null);
  const [useAdvanced, setUseAdvanced] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const DEEPFACE_API = 'http://localhost:5001';

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

  // Perform face matching using DeepFace backend
  const performFaceMatching = async () => {
    if (!idDocument || !selfieBlob) {
      setError('Missing images');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('idDocument', idDocument);
      formData.append('livePhoto', selfieBlob, 'selfie.jpg');

      const endpoint = useAdvanced ? '/verify-face-advanced' : '/verify-face';
      
      console.log(`🔍 Calling DeepFace API: ${DEEPFACE_API}${endpoint}`);
      
      const response = await fetch(`${DEEPFACE_API}${endpoint}`, {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        setMatchResult(data.data);
        setStep('result');
        console.log('✅ DeepFace verification result:', data.data);
      } else {
        setError(data.error || 'Verification failed');
      }

    } catch (error: any) {
      console.error('Error during face matching:', error);
      setError('Failed to connect to verification service. Make sure Python backend is running on port 5001.');
    } finally {
      setLoading(false);
    }
  };

  // Move to next step
  const handleContinue = () => {
    if (step === 'upload-id' && idDocument) {
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
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 text-white">
            <h1 className="text-3xl font-bold text-center flex items-center justify-center">
              <Zap className="w-8 h-8 mr-2" />
              DeepFace Verification
            </h1>
            <p className="text-center mt-2 text-purple-100">Powered by AI - 85-95% Accuracy</p>
          </div>

          {/* Mode Toggle */}
          <div className="p-4 bg-gray-50 border-b flex items-center justify-center gap-4">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={useAdvanced}
                onChange={(e) => setUseAdvanced(e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm font-medium text-gray-700">
                Use Advanced Mode (Multiple AI Models)
              </span>
            </label>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-center p-6 bg-gray-50 border-b">
            <div className={`flex items-center ${step === 'upload-id' ? 'text-purple-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'upload-id' ? 'bg-purple-600 text-white' : 'bg-gray-300'}`}>1</div>
              <span className="ml-2 font-medium">Upload ID</span>
            </div>
            <div className="w-16 h-1 mx-4 bg-gray-300"></div>
            <div className={`flex items-center ${step === 'capture-selfie' ? 'text-purple-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'capture-selfie' ? 'bg-purple-600 text-white' : 'bg-gray-300'}`}>2</div>
              <span className="ml-2 font-medium">Capture Selfie</span>
            </div>
            <div className="w-16 h-1 mx-4 bg-gray-300"></div>
            <div className={`flex items-center ${step === 'result' ? 'text-purple-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'result' ? 'bg-purple-600 text-white' : 'bg-gray-300'}`}>3</div>
              <span className="ml-2 font-medium">Result</span>
            </div>
          </div>

          {/* Content */}
          <div className="p-8">
            {/* Step 1: Upload ID */}
            {step === 'upload-id' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900">Step 1: Upload ID Document</h2>
                
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-purple-500 transition-colors">
                  {idPreview ? (
                    <div>
                      <img src={idPreview} alt="ID Preview" className="max-w-md mx-auto rounded-lg shadow-lg mb-4" />
                      <button
                        onClick={() => {
                          setIdDocument(null);
                          setIdPreview(null);
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
                      <p className="text-sm text-gray-500">Works great with ID cards, passports, driver's licenses</p>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleIDUpload}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
                    <XCircle className="w-5 h-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}

                <button
                  onClick={handleContinue}
                  disabled={!idDocument}
                  className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  Continue to Selfie Capture
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
                      className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors flex items-center justify-center"
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
                        className="flex-1 bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 disabled:bg-gray-300 transition-colors flex items-center justify-center"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            Verifying...
                          </>
                        ) : (
                          'Verify with DeepFace'
                        )}
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
                {matchResult.verified ? (
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
                    <span className="text-gray-700 font-medium">Match Score:</span>
                    <span className={`text-2xl font-bold ${matchResult.verified ? 'text-green-600' : 'text-red-600'}`}>
                      {matchResult.matchScore}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full ${matchResult.verified ? 'bg-green-500' : 'bg-red-500'}`}
                      style={{ width: `${matchResult.matchScore}%` }}
                    ></div>
                  </div>

                  <div className="text-sm text-gray-500 mt-4 space-y-2">
                    <p>Distance: {matchResult.distance}</p>
                    <p>Threshold: {matchResult.threshold}</p>
                    <p>Model: {matchResult.model || 'Multiple Models'}</p>
                    {matchResult.confidence && (
                      <p>Confidence: {matchResult.confidence}%</p>
                    )}
                    {matchResult.models_used && (
                      <p>Models Used: {matchResult.models_verified}/{matchResult.models_used}</p>
                    )}
                  </div>

                  {matchResult.individual_results && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <p className="text-sm font-semibold text-gray-700 mb-2">Individual Model Results:</p>
                      <div className="space-y-2">
                        {matchResult.individual_results.map((result: any, index: number) => (
                          <div key={index} className="flex justify-between text-sm">
                            <span className="text-gray-600">{result.model}:</span>
                            <span className={result.verified ? 'text-green-600' : 'text-red-600'}>
                              {result.matchScore}% {result.verified ? '✓' : '✗'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
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
                  className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors"
                >
                  Test Again
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
