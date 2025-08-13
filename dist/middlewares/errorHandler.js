"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const errorHandler = (err, req, res, next) => {
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
exports.errorHandler = errorHandler;
