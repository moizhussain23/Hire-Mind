const https = require('https');
const fs = require('fs');
const path = require('path');

const MODEL_BASE_URL = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js-models/master/tiny_face_detector/';

const models = [
  // Tiny Face Detector
  'tiny_face_detector_model-weights_manifest.json',
  'tiny_face_detector_model-shard1',
  
  // Face Landmarks
  'face_landmark_68_model-weights_manifest.json',
  'face_landmark_68_model-shard1',
  
  // Face Recognition
  'face_recognition_model-weights_manifest.json',
  'face_recognition_model-shard1',
  'face_recognition_model-shard2',
  
  // Face Expression
  'face_expression_model-weights_manifest.json',
  'face_expression_model-shard1'
];

const modelsDir = path.join(__dirname, 'public', 'models');

// Create models directory if it doesn't exist
if (!fs.existsSync(modelsDir)) {
  fs.mkdirSync(modelsDir, { recursive: true });
  console.log('✅ Created models directory');
}

// Download each model file
let downloaded = 0;
models.forEach((model) => {
  const url = MODEL_BASE_URL + model;
  const filePath = path.join(modelsDir, model);
  
  console.log(`⬇️  Downloading ${model}...`);
  
  const file = fs.createWriteStream(filePath);
  https.get(url, (response) => {
    response.pipe(file);
    file.on('finish', () => {
      file.close();
      downloaded++;
      console.log(`✅ Downloaded ${model} (${downloaded}/${models.length})`);
      
      if (downloaded === models.length) {
        console.log('\n🎉 All models downloaded successfully!');
        console.log(`📁 Models location: ${modelsDir}`);
      }
    });
  }).on('error', (err) => {
    fs.unlink(filePath, () => {});
    console.error(`❌ Error downloading ${model}:`, err.message);
  });
});
