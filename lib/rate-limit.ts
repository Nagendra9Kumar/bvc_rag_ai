import { NextRequest } from 'next/server';
import { headers } from 'next/headers';

interface RateLimitConfig {
  maxRequests: number; // Number of requests
  windowMs: number;    // Time window in milliseconds
}

// In-memory store for rate limiting
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now();
  Array.from(rateLimitStore.entries()).forEach(([key, value]) => {
    if (value.resetTime <= now) {
      rateLimitStore.delete(key);
    }
  });
}, 60000); // Clean up every minute

export function rateLimit(config: RateLimitConfig) {
  return async function rateLimitMiddleware(request: NextRequest) {
    // Get IP address from Vercel's forwarded header or fall back to request
    const forwardedFor = request.headers.get('x-forwarded-for');
    const ip = forwardedFor ? forwardedFor.split(',')[0] : 'unknown';
    
    const now = Date.now();
    const key = `${ip}:${request.nextUrl.pathname}`;
    const currentLimit = rateLimitStore.get(key);

    if (!currentLimit) {
      // First request from this IP
      rateLimitStore.set(key, {
        count: 1,
        resetTime: now + config.windowMs,
      });
      return null;
    }

    if (currentLimit.resetTime <= now) {
      // Window has expired, reset the counter
      rateLimitStore.set(key, {
        count: 1,
        resetTime: now + config.windowMs,
      });
      return null;
    }

    if (currentLimit.count >= config.maxRequests) {
      // Rate limit exceeded
      return {
        error: 'Too many requests',
        resetTime: currentLimit.resetTime,
      };
    }

    // Increment the counter
    currentLimit.count += 1;
    rateLimitStore.set(key, currentLimit);
    return null;
  };
}