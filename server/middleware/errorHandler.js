const errorHandler = (err, req, res, next) => {
  console.error(`[API Error]:`, err.stack || err.message);

  // Body-parser (malformed JSON → 400, body over the size limit → 413) and
  // http-errors attach the intended status to the error itself. Ignoring it
  // turned a client mistake into a "500 Internal Server Error", which told
  // callers the API was broken and buried real faults in the logs.
  const declared = Number(err?.status || err?.statusCode);
  const statusCode =
    Number.isInteger(declared) && declared >= 400 && declared < 600
      ? declared
      : res.statusCode === 200
        ? 500
        : res.statusCode;

  // A 5xx message can carry internals (driver text, stack hints); 4xx messages
  // are written for the caller and are safe to return.
  const message =
    statusCode >= 500 ? (err.message || 'Internal Server Error') : err.message || 'Request could not be processed.';

  return res.status(statusCode).json({
    success: false,
    message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};

module.exports = errorHandler;
