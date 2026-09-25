/**
 * Consistent error responses for controller catch blocks.
 *
 * The controllers used to answer every caught error with
 * `res.status(500).json({ success: false, message: error.message })`, so a
 * client sending an incomplete or malformed body got a 500 "Internal Server
 * Error" with driver text in it. Three things went wrong with that:
 *
 *   1. a caller mistake was reported as a server fault (and paged whoever
 *      watches 5xx rates),
 *   2. the admin UI showed a scary server error for a fixable form mistake,
 *   3. the raw Mongo/driver message leaked internals to the browser.
 *
 * `sendError` maps the error to the status the caller actually earned, and
 * keeps the detail in the server log for 5xx.
 */

/** The HTTP status an error deserves. */
const statusForError = (error) => {
  if (!error) return 500;
  // Mongoose: schema validation (missing/invalid field) and bad ObjectId casts
  // are caller mistakes, not server faults.
  if (error.name === 'ValidationError') return 400;
  if (error.name === 'CastError') return 400;
  if (error.name === 'StrictModeError') return 400;
  // Unique index violation.
  if (error.code === 11000) return 409;
  const declared = Number(error.status || error.statusCode);
  if (Number.isInteger(declared) && declared >= 400 && declared < 600) return declared;
  return 500;
};

/**
 * Send `{ success: false, message }` with the right status.
 *
 * @param {object} res Express response
 * @param {Error}  error the caught error
 * @param {string} [fallback] message to use when the error carries none
 */
const sendError = (res, error, fallback = 'Request could not be processed.') => {
  const status = statusForError(error);
  if (status >= 500) {
    // Log everything, return nothing internal.
    console.error(`[API Error] ${status}:`, error?.stack || error?.message || error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }

  // A CastError's own message names the mongoose model and the schema path
  // (`Cast to ObjectId failed for value "x" (type string) at path "targetCourse"
  // for model "Lead"`), which tells a stranger what our collections look like.
  // The path is the caller's own field name, so that much is safe to echo.
  if (error?.name === 'CastError') {
    return res.status(400).json({
      success: false,
      code: 'VALIDATION_ERROR',
      message: `Invalid ${error.path || 'value'}.`,
    });
  }

  // A duplicate-key error carries the collection and index names the same way.
  if (error?.code === 11000) {
    return res.status(409).json({
      success: false,
      code: 'DUPLICATE',
      message: 'That value is already in use.',
    });
  }

  const body = { success: false, message: error?.message || fallback };
  if (error?.name === 'ValidationError' && error.errors) {
    body.code = 'VALIDATION_ERROR';
    body.errors = Object.values(error.errors).map((e) => e.message);
  }
  return res.status(status).json(body);
};

module.exports = { sendError, statusForError };
