// src/pages/api/admin/upload.js
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import adminAuth from '../../../middleware/adminAuth';
import fs from 'fs';

// Ensure upload directory exists
const ensureUploadDir = () => {
  const uploadDir = path.join(process.cwd(), 'public/uploads');
  
  // Create directory if it doesn't exist
  if (!fs.existsSync(uploadDir)) {
    console.log('📁 Creating upload directory:', uploadDir);
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log('✅ Upload directory created successfully');
  }
  
  return uploadDir;
};

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = ensureUploadDir();
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  },
});

// Helper to run multer with Promise
const runMiddleware = (req, res, fn) => {
  return new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
};

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false,
      error: 'Method not allowed' 
    });
  }

  try {
    // Ensure directory exists before processing upload
    ensureUploadDir();
    
    await runMiddleware(req, res, upload.single('image'));

    if (!req.file) {
      return res.status(400).json({ 
        success: false,
        error: 'No file uploaded' 
      });
    }

    // Verify file was actually saved
    if (!fs.existsSync(req.file.path)) {
      throw new Error('File was not saved properly');
    }

    // Return the image URL
    const imageUrl = `/uploads/${req.file.filename}`;
    console.log('✅ Image uploaded successfully:', {
      filename: req.file.filename,
      path: req.file.path,
      size: req.file.size,
      url: imageUrl
    });
    
    res.status(200).json({ 
      success: true,
      imageUrl 
    });
  } catch (error) {
    console.error('❌ Upload error:', error);
    
    // Clean up any partial uploads
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
        console.log('🧹 Cleaned up failed upload file');
      } catch (cleanupError) {
        console.error('Failed to clean up file:', cleanupError);
      }
    }
    
    res.status(400).json({ 
      success: false,
      error: error.message || 'Upload failed'
    });
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};

export default adminAuth(handler);