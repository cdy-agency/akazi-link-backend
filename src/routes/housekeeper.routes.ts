import { Router } from 'express';
import uploadSingle from 'rod-fileupload';
import cloudinary from '../config/cloudinary';
import {
  registerHousekeeper,
  listHousekeepers,
  getHousekeeperById,
  updateHousekeeper,
  deleteHousekeeper,
} from '../controllers/housekeeper.controller';

const router = Router();

// Registration with images handled by upload service (accept both passportImage and fullBodyImage)
router.post(
  '/housekeepers',
  uploadSingle('passportImage', cloudinary),
  uploadSingle('fullBodyImage', cloudinary),
  registerHousekeeper
);
// For full body image, clients can send both files with the same field name multiple times
// or make a separate request using PUT with both fields allowed.

router.get('/housekeepers', listHousekeepers);
router.get('/housekeepers/:id', getHousekeeperById);
router.put(
  '/housekeepers/:id',
  uploadSingle('passportImage', cloudinary),
  uploadSingle('fullBodyImage', cloudinary),
  updateHousekeeper
);
router.delete('/housekeepers/:id', deleteHousekeeper);

export default router;

