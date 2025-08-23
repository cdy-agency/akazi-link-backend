import { Request, Response, NextFunction } from 'express';

export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error occurred:', err.message);
  console.error('Error stack:', err.stack);
  console.error('Request origin:', req.headers.origin);
  console.error('Request method:', req.method);
  console.error('Request path:', req.path);

  if (res.headersSent) {
    return next(err); // If headers already sent, delegate to default Express error handler
  }

  // Handle CORS errors specifically
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({
      message: 'CORS Error: Origin not allowed',
      error: err.message,
      origin: req.headers.origin,
      allowedOrigins: ['https://job-platform-lake.vercel.app', 'http://localhost:3000']
    });
  }

  // Generic error response
  res.status(500).json({
    message: 'An unexpected error occurred',
    error: err.message,
    timestamp: new Date().toISOString()
  });
};
