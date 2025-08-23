import { Request, Response, NextFunction } from 'express';

export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
console.error(err.stack); // Log the error stack for debugging

if (res.headersSent) {
  return next(err); // If headers already sent, delegate to default Express error handler
}

// Generic error response
res.status(500).json({
  message: 'An unexpected error occurred',
  error: err.message,
});
};
