const AppError = require('../utils/appError');

const handleCastError = function (err) {
  const message = `invalid ${err.path}:${err.value}`;
  return new AppError(message, 400);
};

const handleDuplicateError = function (err) {
  const message = `duplicate name (${err.keyValue.name}), try another name :)`;
  return new AppError(message, 400);
};

const handleValidationError = function (err) {
  return new AppError(err.message, 400);
};

const sendErrorDev = function (err, req, res) {
  if (req.originalUrl.startsWith('/api')) {
    err.statesCode = err.statesCode || 500;
    err.states = err.states || 'error';
    return res.status(err.statesCode).json({
      states: err.states,
      message: err.message,
      stack: err.stack,
      error: err,
    });
  }

  err.statesCode = err.statesCode || 500;
  res.status(err.statesCode).render('error', {
    title: 'Oops!',
    msg: err.message,
  });
};

const sendErrorProd = function (err, req, res) {
  if (req.originalUrl.startsWith('/api')) {
    if (err.isOperational) {
      err.statesCode = err.statesCode || 500;
      err.states = err.states || 'error';
      return res.status(err.statesCode).json({
        states: err.states,
        message: err.message,
      });
    }
    console.error(`ERROR (¬_¬ ) ${err}`);
    return res.status(500).json({
      states: 'error',
      message: 'Something went wrong!!',
    });
  }

  if (err.isOperational) {
    err.statesCode = err.statesCode || 500;
    return res.status(err.statesCode).render('error', {
      title: 'Oops!',
      msg: err.message,
    });
  }
  console.error(`ERROR (¬_¬ ) ${err}`);
  res.status(500).json({
    title: 'Oops!',
    msg: 'Please try again later.',
  });
};

module.exports = (err, req, res, next) => {
  if (process.env.NODE_ENV === 'development') sendErrorDev(err, req, res);
  else if (process.env.NODE_ENV === 'production') {
    let error = Object.create(err); // deep copy
    if (error.name === 'CastError') error = handleCastError(error);
    if (error.code === 11000) error = handleDuplicateError(error);
    if (error.name === 'ValidationError') error = handleValidationError(error);
    sendErrorProd(error, req, res);
  }
  next();
};
