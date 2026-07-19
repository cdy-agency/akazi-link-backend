import { Router } from 'express';
import { authenticateToken, authorizeRoles } from '../middlewares/authMiddleware';
import {
  changeProviderPassword,
  getProviderServiceRequestById,
  listProviderNotificationsHandler,
  listProviderServiceRequestsHandler,
  markProviderNotificationReadHandler,
  updateProviderServiceRequestStatus,
} from '../controllers/provider-marketplace.controller';

const router = Router();

const providerAuth = [authenticateToken, authorizeRoles(['service_provider'])];

router.patch('/change-password', ...providerAuth, changeProviderPassword);
router.get('/notifications', ...providerAuth, listProviderNotificationsHandler);
router.patch(
  '/notifications/:id/read',
  ...providerAuth,
  markProviderNotificationReadHandler
);
router.get('/service-requests', ...providerAuth, listProviderServiceRequestsHandler);
router.get('/service-requests/:id', ...providerAuth, getProviderServiceRequestById);
router.patch(
  '/service-requests/:id/status',
  ...providerAuth,
  updateProviderServiceRequestStatus
);

export default router;
