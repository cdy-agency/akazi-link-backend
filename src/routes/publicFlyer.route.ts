import Router from 'express'
import { PostFlyer, getFlyer,updateFlyer, deleteFlyer,likeFlyer} from "../controllers/publicFlyer.controller";
import uploadSingle from "rod-fileupload";
import cloudinary from "../config/cloudinary";
import { addComment, deleteComment,addReply, updateReply, deleteReply, getReplies } from '../controllers/comments.controller';

const router = Router()

const optionalImageUpload = (req: any, res: any, next: any) => {
  const upload = uploadSingle('image', cloudinary);
  upload(req, res, (err: any) => {
    if (err) {
      console.log('No image uploaded, continuing...');
    }
    next();
  });
};

// Post Flyer with image upload(FLYER CRUD)
router.post('/', uploadSingle('image', cloudinary), PostFlyer)
router.get('/', getFlyer)
router.put('/:id',optionalImageUpload, updateFlyer)
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