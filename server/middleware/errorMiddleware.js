/**
 * SAIOF errorMiddleware
 * Global error handler to catch exceptions and return unified JSON errors.
 * 
 * FUTURE INTEGRATION POSSIBILITIES:
 * - Logging detailed stacks to files or reporting engines (e.g. Sentry, Datadog).
 * - Distinguishing database constraints, validation errors, and network timeouts.
 * - Dynamic error masking depending on NODE_ENV (development vs. production).
 */
const errorHandler = (err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  
  // Log error stack internally
  console.error(`[Error Handler] Error occurred: ${err.message}`);
  if (err.stack) {
    console.error(err.stack);
  }

  // Detect MongoDB/Mongoose connection errors, timeouts, or socket disconnects
  const isDatabaseError = 
    err.name === 'MongoNetworkError' || 
    err.name === 'MongooseError' ||
    err.message.includes('buffering timed out') ||
    err.message.includes('connection') ||
    err.message.includes('topology') ||
    err.message.includes('database') ||
    err.code === 'ENOTFOUND';

  if (isDatabaseError) {
    return res.status(503).json({
      success: false,
      message: "Database temporarily unavailable"
    });
  }

  res.status(statusCode).json({
    success: false,
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? '🥞' : err.stack
  });
};


module.exports = errorHandler;
