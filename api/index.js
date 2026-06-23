// Vercel serverless entry point — re-exports the Express app.
// Wrapped defensively so any load-time error is surfaced in the response
// instead of an opaque FUNCTION_INVOCATION_FAILED.
let handler;
try {
  handler = require('../index.js');
} catch (err) {
  handler = (req, res) => {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ initError: err.message, stack: err.stack }));
  };
}

module.exports = handler;
