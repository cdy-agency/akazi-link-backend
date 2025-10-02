import { Router } from 'express';
import {
  createHousekeeper,
  getAllHousekeepers,
  getHousekeeperById,
  updateHousekeeper,
  deleteHousekeeper,
  updateHousekeeperStatus,
  searchHousekeepersByLocation
} from '../controllers/housekeeper.controller';
import { uploadMultiple } from "rod-fileupload";
import cloudinary from '../config/cloudinary';

const router = Router();

// Housekeeper CRUD routes
router.post('/', uploadMultiple('images', cloudinary), createHousekeeper);
router.get('/', getAllHousekeepers);
router.get('/search', searchHousekeepersByLocation);
router.get('/:id', getHousekeeperById);
router.put('/:id', updateHousekeeper);
router.delete('/:id', deleteHousekeeper);

// Housekeeper specific routes
router.put('/:id/status', updateHousekeeperStatus);

export default router;

