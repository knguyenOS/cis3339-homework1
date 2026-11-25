const mongoose = require('mongoose');
const ApiError = require('../utils/ApiError');
const { isDatabaseReady } = require('../db');

const FIELD_LABELS = {
  studentId: 'student ID',
  courseId: 'course ID',
  'student,course': 'enrollment',
};

/** Reject API calls with 503 while MongoDB is unavailable. */
function requireDatabase(_req, _res, next) {
  if (isDatabaseReady()) return next();
  next(
    new ApiError(
      503,
      'The database is not available. Make sure MongoDB Community Edition is running on this computer, then try again.'
    )
  );
}

/** JSON 404 for unknown API routes. */
function apiNotFound(req, _res, next) {
  next(ApiError.notFound(`API route not found: ${req.method} ${req.originalUrl}`));
}

/** Convert every kind of error into a consistent `{ error, details? }` JSON response. */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);

  let status = 500;
  let body = { error: 'An unexpected server error occurred.' };

  if (err instanceof ApiError) {
    status = err.status;
    body = { error: err.message, ...(err.details && { details: err.details }) };
  } else if (err.type === 'entity.parse.failed') {
    status = 400;
    body = { error: 'The request body must be valid JSON.' };
  } else if (err instanceof mongoose.Error.ValidationError) {
    status = 400;
    const details = {};
    for (const [field, fieldError] of Object.entries(err.errors)) {
      details[field] =
        fieldError instanceof mongoose.Error.CastError ? `Invalid value for ${field}.` : fieldError.message;
    }
    body = { error: Object.values(details)[0] || 'Validation failed.', details };
  } else if (err instanceof mongoose.Error.CastError) {
    status = 400;
    body = { error: `Invalid value for ${err.path}.` };
  } else if (err.code === 11000) {
    status = 409;
    const fields = Object.keys(err.keyPattern || {}).join(',');
    const label = FIELD_LABELS[fields] || fields || 'record';
    body = { error: `A record with this ${label} already exists.` };
  } else if (
    err.name === 'MongoServerSelectionError' ||
    err.name === 'MongoNetworkError' ||
    err.name === 'MongoNotConnectedError'
  ) {
    status = 503;
    body = { error: 'The database is not available. Please try again in a moment.' };
  } else if (Number.isInteger(err.status) && err.status >= 400 && err.status < 500) {
    // Errors raised by Express/body-parser such as "payload too large".
    status = err.status;
    body = { error: err.expose ? err.message : 'Bad request.' };
  }

  if (status >= 500 && status !== 503) {
    console.error(`Unhandled error for ${req.method} ${req.originalUrl}:`, err);
  }

  res.status(status).json(body);
}

module.exports = { requireDatabase, apiNotFound, errorHandler };
