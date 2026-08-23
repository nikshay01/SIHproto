const requestMap = new Map();

/**
 * Sliding window in-memory rate limiter
 * @param {number} maxRequests 
 * @param {number} windowMs 
 */
export function rateLimiter(maxRequests = 120, windowMs = 60000) {
  return (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress || "127.0.0.1";
    const now = Date.now();
    
    let clientRecord = requestMap.get(ip);
    if (!clientRecord) {
      clientRecord = { timestamps: [] };
      requestMap.set(ip, clientRecord);
    }

    // Filter out old timestamps
    clientRecord.timestamps = clientRecord.timestamps.filter(ts => now - ts < windowMs);

    if (clientRecord.timestamps.length >= maxRequests) {
      return res.status(429).json({
        ok: false,
        error: "Too Many Requests",
        message: `Rate limit exceeded (${maxRequests} requests per minute). Please slow down.`,
        retryAfterSec: Math.ceil((clientRecord.timestamps[0] + windowMs - now) / 1000)
      });
    }

    clientRecord.timestamps.push(now);
    next();
  };
}
