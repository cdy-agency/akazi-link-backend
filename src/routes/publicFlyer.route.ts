import Router from 'express'
import { PostFlyer, getFlyer,updateFlyer, deleteFlyer,likeFlyer,addComment,deleteComment } from "../controllers/publicFlyer.controller";
import uploadSingle from "rod-fileupload";
import cloudinary from "../config/cloudinary";

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

router.post('/', uploadSingle('image', cloudinary), PostFlyer)
router.get('/', getFlyer)

router.post("/:flyerId/like", likeFlyer);
router.post("/:flyerId/comment", addComment);
router.delete("/:flyerId/comment/:commentId", deleteComment);

router.put('/:id',optionalImageUpload, updateFlyer)
router.delete('/:id', deleteFlyer)

export default router