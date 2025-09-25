import { Request, Response, NextFunction } from 'express'
import uploadSingle from 'rod-fileupload'
import cloudinary from '../config/cloudinary'

/**
 * Wraps rod-fileupload single upload and ignores "no file uploaded" errors,
 * allowing the route to proceed when the file is optional.
 */
export const optionalUploadSingle = (fieldName: string) => {
  const inner = uploadSingle(fieldName, cloudinary)
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      inner(req, res, (err?: any) => {
        if (err) {
          const msg: string = String(err?.message || '').toLowerCase()
          if (msg.includes('no file uploaded') || msg.includes('no files uploaded')) {
            return next()
          }
          return next(err)
        }
        next()
      })
    } catch (e: any) {
      const msg: string = String(e?.message || '').toLowerCase()
      if (msg.includes('no file uploaded') || msg.includes('no files uploaded')) {
        return next()
      }
      return next(e)
    }
  }
}


