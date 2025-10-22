import { v2 as cloudinary } from 'cloudinary';
import adminAuth from '../../../middleware/adminAuth';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Helper to handle stream upload
const streamUpload = (buffer, folder = 'product_uploads') => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }
    );
    uploadStream.end(buffer);
  });
};

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
    });
  }

  try {
    // Parse multipart form data manually (since bodyParser is false)
    const contentType = req.headers['content-type'];
    if (!contentType || !contentType.includes('multipart/form-data')) {
      return res.status(400).json({
        success: false,
        error: 'Content-Type must be multipart/form-data',
      });
    }

    // Use busboy to parse file (lightweight alternative to multer)
    const busboy = require('busboy');
    const bb = busboy({ headers: req.headers });

    let fileBuffer = null;
    let mimeType = '';

    bb.on('file', (name, file, info) => {
      const { filename, encoding, mimeType: type } = info;
      if (name !== 'image') {
        file.resume();
        return;
      }

      if (!type.startsWith('image/')) {
        file.resume();
        return res.status(400).json({
          success: false,
          error: 'Only image files are allowed!',
        });
      }

      mimeType = type;
      const chunks = [];
      file.on('data', (chunk) => chunks.push(chunk));
      file.on('end', () => {
        fileBuffer = Buffer.concat(chunks);
      });
    });

    bb.on('close', async () => {
      if (!fileBuffer) {
        return res.status(400).json({
          success: false,
          error: 'No image file provided',
        });
      }

      if (fileBuffer.length > 5 * 1024 * 1024) {
        return res.status(400).json({
          success: false,
          error: 'File size exceeds 5MB limit',
        });
      }

      try {
        // Upload to Cloudinary
        const result = await streamUpload(fileBuffer, 'product_uploads');
        
        console.log('✅ Image uploaded to Cloudinary:', result.secure_url);
        
        return res.status(200).json({
          success: true,
          imageUrl: result.secure_url,
        });
      } catch (uploadError) {
        console.error('❌ Cloudinary upload error:', uploadError);
        return res.status(500).json({
          success: false,
          error: 'Failed to upload image to Cloudinary',
        });
      }
    });

    bb.on('error', (err) => {
      console.error('❌ Busboy error:', err);
      return res.status(500).json({
        success: false,
        error: 'File parsing failed',
      });
    });

    req.pipe(bb);
  } catch (error) {
    console.error('❌ Upload handler error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error during upload',
    });
  }
}

// Disable body parser to handle multipart
export const config = {
  api: {
    bodyParser: false,
  },
};

export default adminAuth(handler);