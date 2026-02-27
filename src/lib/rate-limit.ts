interface RateLimitEntry {
    count: number;
    resetAt: number;
}

const rateMap = new Map<string, RateLimitEntry>();

// Clean up stale entries every 5 minutes
setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateMap) {
        if (now > entry.resetAt) {
            rateMap.delete(key);
        }
    }
}, 5 * 60_000);

export function checkRateLimit(
    ip: string,
    maxRequests: number = 30,
    windowMs: number = 60_000
): { allowed: boolean; remaining: number; resetAt: number } {
    const now = Date.now();
    const entry = rateMap.get(ip);

    if (!entry || now > entry.resetAt) {
        const newEntry = { count: 1, resetAt: now + windowMs };
        rateMap.set(ip, newEntry);
        return { allowed: true, remaining: maxRequests - 1, resetAt: newEntry.resetAt };
    }

    if (entry.count >= maxRequests) {
        return { allowed: false, remaining: 0, resetAt: entry.resetAt };
    }

    entry.count++;
    return { allowed: true, remaining: maxRequests - entry.count, resetAt: entry.resetAt };
}
