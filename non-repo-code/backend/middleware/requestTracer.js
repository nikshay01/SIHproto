import crypto from "crypto";

export function requestTracer(req, res, next) {
  const requestId = req.headers["x-request-id"] || `req-${crypto.randomUUID().slice(0, 8)}`;
  req.id = requestId;
  res.setHeader("X-Request-Id", requestId);
  res.setHeader("X-Powered-By", "E-Cycle India Cluster Engine");

  const start = Date.now();

  // Override res.end or attach to res.locals for timing logging
  const originalEnd = res.end;
  res.end = function (...args) {
    const duration = Date.now() - start;
    if (!res.headersSent) {
      res.setHeader("X-Response-Time", `${duration}ms`);
    }
    return originalEnd.apply(this, args);
  };

  next();
}
