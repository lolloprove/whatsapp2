/**
 * Global Express Error Handler Middleware
 */
export function errorHandler(err, req, res, next) {
  // Senza parentesi, `a || b >= 400 ? ...` valuterebbe `(a || b) >= 400`: quasi sempre 500
  const statusCode = err.statusCode || (res.statusCode >= 400 ? res.statusCode : 500);
  
  // Clean, structured error log
  console.error(`[ERROR ${statusCode}] ${req.method} ${req.originalUrl}:`, err.message);
  if (process.env.NODE_ENV === 'development' && err.stack) {
    console.error(err.stack);
  }

  res.status(statusCode).json({
    success: false,
    error: err.message || 'Errore interno del server',
    ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {})
  });
}

/**
 * 404 Route Not Found Middleware
 */
export function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    error: `Endpoint '${req.method} ${req.originalUrl}' non trovato`
  });
}
