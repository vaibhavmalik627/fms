const errorHandler = (err, req, res, next) => {
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;

  if (err.name === 'ValidationError' || err.name === 'CastError') {
    statusCode = 400;
  }
  if (err.code === 11000) {
    statusCode = 409;
  }
  if (err.name === 'MulterError') {
    statusCode = 400;
  }

  res.status(statusCode);
  res.json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};

module.exports = errorHandler;
