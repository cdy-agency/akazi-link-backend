import Router from 'express'
import { PostFlyer, getFlyer, updateFlyer, deleteFlyer, likeFlyer, getFlyerById } from "../controllers/publicFlyer.controller";
import uploadSingle from "rod-fileupload";
import cloudinary from "../config/cloudinary";
import { addComment, deleteComment, addReply, updateReply, deleteReply, getReplies } from '../controllers/comments.controller';
import { optionalUploadSingle } from '../middlewares/optionalUpload';
import { authenticateToken, authorizeRoles } from '../middlewares/authMiddleware';
import { Request, Response, NextFunction } from 'express';

const conditionalImageUpload = (req: Request, res: Response, next: NextFunction) => {
  const contentType = req.headers['content-type'] || '';

  if (contentType.includes('multipart/form-data')) {
    return optionalUploadSingle('image')(req, res, next);
  }

  next();
};

const superadminOnly = [
  authenticateToken,
  authorizeRoles(['superadmin']),
];

const authenticatedSocialRoles = [
  authenticateToken,
  authorizeRoles(['employee', 'company', 'superadmin']),
];

const router = Router()

// --- Public read routes (no auth) ---
router.get('/', getFlyer)
router.get('/:id', getFlyerById);
router.get("/:flyerId/comment/:commentId/replies", getReplies);

// --- Superadmin flyer CRUD ---
router.post('/', ...superadminOnly, uploadSingle('image', cloudinary), PostFlyer)
router.patch('/:id', ...superadminOnly, conditionalImageUpload, updateFlyer);
router.delete('/:id', ...superadminOnly, deleteFlyer)

// --- Authenticated social actions (employee, company, superadmin) ---
router.post("/:flyerId/like", ...authenticatedSocialRoles, likeFlyer);
router.post("/:flyerId/comment", ...authenticatedSocialRoles, addComment);
router.delete("/:flyerId/comment/:commentId", ...authenticatedSocialRoles, deleteComment);

// --- Replies to comments ---
router.post("/:flyerId/comment/:commentId/reply", ...authenticatedSocialRoles, addReply);
router.put("/:flyerId/comment/:commentId/reply/:replyId", ...authenticatedSocialRoles, updateReply);
router.delete("/:flyerId/comment/:commentId/reply/:replyId", ...authenticatedSocialRoles, deleteReply);

export default router
