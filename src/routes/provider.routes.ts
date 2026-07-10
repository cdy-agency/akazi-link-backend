import { Router } from 'express';
import { authenticateToken, authorizeRoles } from '../middlewares/authMiddleware';
import {
  getProviderServiceRequestById,
  listProviderServiceRequestsHandler,
  updateProviderServiceRequestStatus,
} from '../controllers/provider-marketplace.controller';

const router = Router();

const providerAuth = [authenticateToken, authorizeRoles(['service_provider'])];

router.get('/service-requests', ...providerAuth, listProviderServiceRequestsHandler);
router.get('/service-requests/:id', ...providerAuth, getProviderServiceRequestById);
router.patch(
  '/service-requests/:id/status',
  ...providerAuth,
  updateProviderServiceRequestStatus
);

export default router;
