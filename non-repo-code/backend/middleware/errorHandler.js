export function errorHandler(err, req, res, next) {
  console.error(`[Error] [${req.id || "no-req-id"}] ${req.method} ${req.originalUrl}:`, err);

  const statusCode = err.statusCode || (res.statusCode >= 400 ? res.statusCode : 500);

  res.status(statusCode).json({
    ok: false,
    error: err.name || "InternalServerError",
    message: err.message || "An unexpected error occurred processing your request.",
    requestId: req.id,
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV === "development" ? { stack: err.stack } : {})
  });
}
