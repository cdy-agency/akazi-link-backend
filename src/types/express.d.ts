import { Multer } from "multer";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: string;
        isApproved?: boolean;
      };
      file?: Multer.File;
      files?: Multer.File[];
    }
  }
}

export {};
