const https = require('https');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js-models/master';

const models = [
  // SSD MobileNet v1 (Better accuracy than Tiny Face Detector)
  { folder: 'ssd_mobilenetv1', file: 'ssd_mobilenetv1_model-weights_manifest.json' },
  { folder: 'ssd_mobilenetv1', file: 'ssd_mobilenetv1_model-shard1' },
  { folder: 'ssd_mobilenetv1', file: 'ssd_mobilenetv1_model-shard2' },
  
  // Tiny Face Detector (backup)
  { folder: 'tiny_face_detector', file: 'tiny_face_detector_model-weights_manifest.json' },
  { folder: 'tiny_face_detector', file: 'tiny_face_detector_model-shard1' },
  
  // Face Landmarks
  { folder: 'face_landmark_68', file: 'face_landmark_68_model-weights_manifest.json' },
  { folder: 'face_landmark_68', file: 'face_landmark_68_model-shard1' },
  
  // Face Recognition
  { folder: 'face_recognition', file: 'face_recognition_model-weights_manifest.json' },
  { folder: 'face_recognition', file: 'face_recognition_model-shard1' },
  { folder: 'face_recognition', file: 'face_recognition_model-shard2' },
  
  // Face Expression
  { folder: 'face_expression', file: 'face_expression_model-weights_manifest.json' },
  { folder: 'face_expression', file: 'face_expression_model-shard1' }
];

const modelsDir = path.join(__dirname, 'public', 'models');

// Create models directory if it doesn't exist
if (!fs.existsSync(modelsDir)) {
  fs.mkdirSync(modelsDir, { recursive: true });
  console.log('✅ Created models directory');
}

// Download each model file
let downloaded = 0;
let failed = 0;

models.forEach(({ folder, file }) => {
  const url = `${BASE_URL}/${folder}/${file}`;
  const filePath = path.join(modelsDir, file);
  
  console.log(`⬇️  Downloading ${file}...`);
  console.log(`   URL: ${url}`);
  
  const fileStream = fs.createWriteStream(filePath);
  
  https.get(url, (response) => {
    if (response.statusCode === 200) {
      response.pipe(fileStream);
      
      fileStream.on('finish', () => {
        fileStream.close();
        downloaded++;
        
        // Check file size
        const stats = fs.statSync(filePath);
        const fileSizeInBytes = stats.size;
        const fileSizeInKB = (fileSizeInBytes / 1024).toFixed(2);
        
        console.log(`✅ Downloaded ${file} (${fileSizeInKB} KB) - ${downloaded}/${models.length}`);
        
        if (downloaded + failed === models.length) {
          console.log('\n🎉 All downloads completed!');
          console.log(`✅ Successful: ${downloaded}`);
          console.log(`❌ Failed: ${failed}`);
          console.log(`📁 Models location: ${modelsDir}`);
        }
      });
    } else {
      failed++;
      fs.unlink(filePath, () => {});
      console.error(`❌ Failed to download ${file}: HTTP ${response.statusCode}`);
      
      if (downloaded + failed === models.length) {
        console.log('\n⚠️  Downloads completed with errors!');
        console.log(`✅ Successful: ${downloaded}`);
        console.log(`❌ Failed: ${failed}`);
      }
    }
  }).on('error', (err) => {
    failed++;
    fs.unlink(filePath, () => {});
    console.error(`❌ Error downloading ${file}:`, err.message);
    
    if (downloaded + failed === models.length) {
      console.log('\n⚠️  Downloads completed with errors!');
      console.log(`✅ Successful: ${downloaded}`);
      console.log(`❌ Failed: ${failed}`);
    }
  });
});
