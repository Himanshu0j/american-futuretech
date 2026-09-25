const errorHandler = (err, req, res, next) => {
  console.error(`[API Error]:`, err.stack || err.message);

  // A malformed ObjectId in a URL (`/api/leads/not-an-id`) throws a mongoose
  // CastError whose message names the model and the schema path. It is a caller
  // mistake, so answer 400 and keep the internals in the log.
  const castPath = err?.name === 'CastError' ? err.path : null;
  const duplicate = err?.code === 11000;

  // Body-parser (malformed JSON → 400, body over the size limit → 413) and
  // http-errors attach the intended status to the error itself. Ignoring it
  // turned a client mistake into a "500 Internal Server Error", which told
  // callers the API was broken and buried real faults in the logs.
  const declared = Number(err?.status || err?.statusCode);
  const statusCode = castPath
    ? 400
    : Number.isInteger(declared) && declared >= 400 && declared < 600
      ? declared
      : duplicate
        ? 409
        : res.statusCode === 200
          ? 500
          : res.statusCode;

  // 5xx messages can carry internals (driver text, filesystem paths, stack
  // hints); 4xx messages are written for the caller and are safe to return.
  const message = castPath
    ? `Invalid ${castPath}.`
    : duplicate
      ? 'That value is already in use.'
      : statusCode >= 500
        ? 'Internal Server Error'
        : err.message || 'Request could not be processed.';

  return res.status(statusCode).json({
    success: false,
    ...(castPath || err?.name === 'ValidationError' ? { code: 'VALIDATION_ERROR' } : {}),
    ...(duplicate ? { code: 'DUPLICATE' } : {}),
    message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};

module.exports = errorHandler;
