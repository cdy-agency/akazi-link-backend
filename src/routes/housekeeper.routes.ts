import { Router } from 'express';
import {
  createHousekeeper,
  getAllHousekeepers,
  getHousekeeperById,
  updateHousekeeper,
  deleteHousekeeper,
  updateHousekeeperStatus,
  searchHousekeepersByLocation,
  uploadHousekeeperImage
} from '../controllers/housekeeper.controller';
import uploadSingle, { uploadMultiple } from "rod-fileupload";
import cloudinary from '../config/cloudinary';

const router = Router();

router.post('/upload-image', uploadSingle('image', cloudinary), uploadHousekeeperImage);
// Housekeeper CRUD routes
router.post('/', createHousekeeper);
router.get('/', getAllHousekeepers);
router.get('/search', searchHousekeepersByLocation);
router.get('/:id', getHousekeeperById);
router.put('/:id', updateHousekeeper);
router.delete('/:id', deleteHousekeeper);

// Housekeeper specific routes
router.put('/:id/status', updateHousekeeperStatus);

export default router;

