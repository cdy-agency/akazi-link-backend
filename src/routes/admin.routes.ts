import { Router } from 'express';

import {

adminLogin,

updateAdminPassword,

getEmployees,

getAdminNotifications,

markAdminNotificationRead,

deleteAdminNotification,

getLoggedInAdmin

} from '../controllers/admin.controller';

import {

  listAdminJobs,

  getAdminJobById,

  createAdminJob,

  updateAdminJob,

  updateAdminJobStatus,

  deleteAdminJob,

} from '../controllers/admin-jobs.controller';

import {

  listAdminApplications,

  listAdminJobApplications,

  getAdminApplicationById,

  updateAdminApplicationStatus,

} from '../controllers/admin-applications.controller';

import {

  listAdminCvs,

  getAdminCvById,

  retryAdminCv,

  reprocessAdminCv,

} from '../controllers/admin-cv.controller';

import {

  listAdminCandidates,

  getAdminCandidateById,

} from '../controllers/admin-candidates.controller';

import { getAdminRecommendedCandidates } from '../controllers/admin-matching.controller';

import {

  listAdminInterviews,

  getAdminInterviewById,

  createAdminInterview,

  updateAdminInterview,

  cancelAdminInterview,

  completeAdminInterview,

} from '../controllers/admin-interviews.controller';

import {

  listAdminOffers,

  getAdminOfferById,

  createAdminOffer,

  sendAdminOffer,

} from '../controllers/admin-offers.controller';

import { getAdminPipelineMetrics } from '../controllers/admin-pipeline.controller';

import { legacyGoneHandler } from './legacy-deprecation.routes';

import { authenticateToken, authorizeRoles } from '../middlewares/authMiddleware';

import uploadSingle from 'rod-fileupload';

import cloudinary from '../config/cloudinary';



const router = Router();



router.post('/login', adminLogin);



router.use(authenticateToken);

router.use(authorizeRoles(['superadmin']));

router.patch('/update-password',uploadSingle('image', cloudinary), updateAdminPassword);

router.get('/employees', getEmployees);

router.get('/me', getLoggedInAdmin);



// Legacy company management — removed

router.get('/companies', legacyGoneHandler);

router.get('/companies/pending-review', legacyGoneHandler);

router.get('/company/:id', legacyGoneHandler);

router.patch('/company/:id/approve', legacyGoneHandler);

router.patch('/company/:id/reject', legacyGoneHandler);

router.patch('/company/:id/disable', legacyGoneHandler);

router.patch('/company/:id/enable', legacyGoneHandler);

router.delete('/company/:id/delete', legacyGoneHandler);

router.patch('/company/:id/approve-profile', legacyGoneHandler);

router.patch('/company/:id/reject-profile', legacyGoneHandler);

router.get('/users-all', legacyGoneHandler);



router.get('/notifications', getAdminNotifications);

router.patch('/notifications/:notificationId/read', markAdminNotificationRead);

router.delete('/notifications/:notificationId', deleteAdminNotification);



router.get('/jobs', listAdminJobs);

router.get('/jobs/:jobId/applications', listAdminJobApplications);

router.get('/jobs/:id/recommended-candidates', getAdminRecommendedCandidates);

router.get('/jobs/:id', getAdminJobById);

router.post('/jobs', createAdminJob);

router.patch('/jobs/:id', updateAdminJob);

router.patch('/jobs/:id/status', updateAdminJobStatus);

router.delete('/jobs/:id', deleteAdminJob);



router.get('/applications', listAdminApplications);

router.get('/applications/:id', getAdminApplicationById);

router.patch('/applications/:id/status', updateAdminApplicationStatus);



router.get('/cv', listAdminCvs);

router.get('/cv/:id', getAdminCvById);

router.post('/cv/:id/retry', retryAdminCv);

router.post('/cv/:id/reprocess', reprocessAdminCv);



router.get('/candidates', listAdminCandidates);

router.get('/candidates/:id', getAdminCandidateById);



router.get('/pipeline/metrics', getAdminPipelineMetrics);

router.get('/interviews', listAdminInterviews);

router.get('/interviews/:id', getAdminInterviewById);

router.post('/interviews', createAdminInterview);

router.patch('/interviews/:id', updateAdminInterview);

router.post('/interviews/:id/cancel', cancelAdminInterview);

router.post('/interviews/:id/complete', completeAdminInterview);

router.get('/offers', listAdminOffers);

router.get('/offers/:id', getAdminOfferById);

router.post('/offers', createAdminOffer);

router.post('/offers/:id/send', sendAdminOffer);



export default router;

