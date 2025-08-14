declare module 'rod-fileupload' {
  import { Request, Response, NextFunction } from 'express';
  import { StorageEngine } from 'multer';
  type Middleware = (req: Request, res: Response, next: NextFunction) => void;
  const uploadSingle: (fieldName: string, cloudinary: any, options?: any) => Middleware;
  export const uploadMultiple: (fieldName: string, cloudinary: any, options?: any) => Middleware;
  export default uploadSingle;
}