import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

describe('Rate Limiting', () => {
    let checkRateLimit: (key: string) => { allowed: boolean; remaining: number };

    beforeEach(async () => {
        vi.resetModules();
        // Re-import to get fresh state
        const mod = await import('@/lib/rate-limit');
        checkRateLimit = mod.checkRateLimit;
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('allows initial requests', () => {
        const result = checkRateLimit('test-ip-1');
        expect(result.allowed).toBe(true);
        expect(result.remaining).toBeGreaterThan(0);
    });

    it('tracks per-key limits independently', () => {
        const r1 = checkRateLimit('ip-a');
        const r2 = checkRateLimit('ip-b');
        expect(r1.allowed).toBe(true);
        expect(r2.allowed).toBe(true);
        // Both should have roughly the same remaining count
        expect(r1.remaining).toBe(r2.remaining);
    });

    it('decrements remaining on each call', () => {
        const r1 = checkRateLimit('ip-decrement');
        const r2 = checkRateLimit('ip-decrement');
        expect(r2.remaining).toBeLessThan(r1.remaining);
    });

    it('blocks after exceeding limit', () => {
        const key = 'ip-exhaust';
        let result = { allowed: true, remaining: 100 };

        // Exhaust all tokens
        for (let i = 0; i < 100; i++) {
            result = checkRateLimit(key);
            if (!result.allowed) break;
        }

        // Should eventually block
        expect(result.allowed).toBe(false);
    });
});
