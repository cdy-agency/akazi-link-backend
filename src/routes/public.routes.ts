import { Router } from 'express';
import { listPublicJobs, listPublicUsers, getPublicJobById, getPublicUserById } from '../controllers/public.controller';
import uploadSingle, { uploadMultiple } from 'rod-fileupload';
import cloudinary from '../config/cloudinary';

const router = Router();

router.get('/jobs', listPublicJobs);


router.get('/jobs/:id', getPublicJobById);

router.get('/users', listPublicUsers);
router.get('/users/:id', getPublicUserById)

router.get('/health', (req, res) => {
  res.status(200).json({ 
    message: 'Server is healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Upload routes
router.post('/upload', uploadSingle('file', cloudinary), (req, res) => {
  try {
    const file = req.body.file;
    if (!file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    res.status(200).json({ 
      message: 'File uploaded successfully', 
      file: {
        url: file.url,
        public_id: file.public_id,
        format: file.format,
        size: file.size,
        name: file.name,
        type: file.type
      }
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/upload-multiple', uploadMultiple('files', cloudinary), (req, res) => {
  try {
    const files = req.body.files;
    if (!files || !Array.isArray(files) || files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }
    res.status(200).json({ 
      message: 'Files uploaded successfully', 
      files: files.map(file => ({
        url: file.url,
        public_id: file.public_id,
        format: file.format,
        size: file.size,
        name: file.name,
        type: file.type
      }))
    });
  } catch (error) {
    console.error('Error uploading files:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;

