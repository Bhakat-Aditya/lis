export const errorHandler = (err, req, res, next) => {
  console.error('[Error Handler]', err);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    STATUS: 'FAILED',
    StatusCode: err.customCode || '9999',
    Message: message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
};
