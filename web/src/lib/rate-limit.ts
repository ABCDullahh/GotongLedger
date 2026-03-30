/**
 * Simple in-memory rate limiter for API routes.
 * Tracks requests per IP with configurable window and max requests.
 */

const ipRequests = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(
  ip: string,
  maxRequests: number = 30,
  windowMs: number = 60_000
): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = ipRequests.get(ip);

  if (!entry || now >= entry.resetAt) {
    ipRequests.set(ip, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1 };
  }

  if (entry.count >= maxRequests) {
    return { allowed: false, remaining: 0 };
  }

  entry.count++;
  return { allowed: true, remaining: maxRequests - entry.count };
}

// Cleanup stale entries periodically (every 5 minutes)
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [ip, entry] of ipRequests.entries()) {
      if (now >= entry.resetAt) ipRequests.delete(ip);
    }
  }, 300_000);
}
