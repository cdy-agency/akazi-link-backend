import { Router } from 'express';
import uploadSingle from 'rod-fileupload';
import cloudinary from '../config/cloudinary';
import { uploadFile } from '../controllers/upload.controller';

const router = Router();

// Accept generic single file upload via field 'file' (or 'image'/'document')
router.post('/upload', uploadSingle('file', cloudinary), uploadFile);

export default router;

