import Router from 'express'
import { PostFlyer, getFlyer,updateFlyer, deleteFlyer,likeFlyer} from "../controllers/publicFlyer.controller";
import uploadSingle from "rod-fileupload";
import cloudinary from "../config/cloudinary";
import { addComment, deleteComment,addReply, updateReply, deleteReply, getReplies } from '../controllers/comments.controller';
import { optionalUploadSingle } from '../middlewares/optionalUpload';
import { Request, Response, NextFunction } from 'express';

const conditionalImageUpload = (req: Request, res: Response, next: NextFunction) => {
  const contentType = req.headers['content-type'] || '';
  
  if (contentType.includes('multipart/form-data')) {
    return optionalUploadSingle('image')(req, res, next);
  }
  
  next();
};


const router = Router()

// Post Flyer with image upload(FLYER CRUD)
router.post('/', uploadSingle('image', cloudinary), PostFlyer)
router.get('/', getFlyer)
router.patch('/:id', conditionalImageUpload, updateFlyer);
router.delete('/:id', deleteFlyer)

// Like Flyer and add comments
router.post("/:flyerId/like", likeFlyer);
router.post("/:flyerId/comment", addComment);
router.delete("/:flyerId/comment/:commentId", deleteComment);

// Replies to comments
router.post("/:flyerId/comment/:commentId/reply", addReply);
router.get("/:flyerId/comment/:commentId/replies", getReplies);
router.put("/:flyerId/comment/:commentId/reply/:replyId", updateReply);
router.delete("/:flyerId/comment/:commentId/reply/:replyId", deleteReply);

export default router