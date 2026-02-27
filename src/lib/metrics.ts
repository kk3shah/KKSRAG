import { log } from './logger';

interface TimingEntry {
    name: string;
    startMs: number;
    endMs?: number;
    durationMs?: number;
    metadata?: Record<string, unknown>;
}

/**
 * Simple request-scoped performance tracker.
 * Logs structured timing data for monitoring/alerting.
 */
export class RequestMetrics {
    private readonly requestId: string;
    private readonly timings: TimingEntry[] = [];
    private readonly requestStart: number;

    constructor(requestId?: string) {
        this.requestId = requestId ?? `req_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
        this.requestStart = Date.now();
    }

    /**
     * Start timing a named phase.
     */
    startPhase(name: string): void {
        this.timings.push({ name, startMs: Date.now() });
    }

    /**
     * End timing the most recent phase with that name.
     */
    endPhase(name: string, metadata?: Record<string, unknown>): number {
        const entry = [...this.timings].reverse().find(t => t.name === name && !t.endMs);
        if (!entry) {
            log('warn', `endPhase called for unknown phase: ${name}`, { requestId: this.requestId });
            return 0;
        }
        entry.endMs = Date.now();
        entry.durationMs = entry.endMs - entry.startMs;
        entry.metadata = metadata;
        return entry.durationMs;
    }

    /**
     * Log all timings as a structured summary.
     */
    summarize(extraMeta?: Record<string, unknown>): void {
        const totalMs = Date.now() - this.requestStart;
        const phases: Record<string, number> = {};
        for (const t of this.timings) {
            if (t.durationMs !== undefined) {
                phases[t.name] = t.durationMs;
            }
        }

        log('info', 'Request metrics', {
            requestId: this.requestId,
            totalMs,
            phases,
            ...extraMeta,
        });
    }

    get id(): string {
        return this.requestId;
    }
}

// ─── Aggregate counters (in-memory, reset on deploy) ─────────────────────────

interface AggregateMetrics {
    totalRequests: number;
    totalErrors: number;
    avgResponseMs: number;
    p95ResponseMs: number;
    responseTimes: number[];
}

const metrics: AggregateMetrics = {
    totalRequests: 0,
    totalErrors: 0,
    avgResponseMs: 0,
    p95ResponseMs: 0,
    responseTimes: [],
};

const MAX_RESPONSE_TIMES = 1000; // Rolling window

export function recordRequestMetric(durationMs: number, isError: boolean): void {
    metrics.totalRequests++;
    if (isError) metrics.totalErrors++;

    metrics.responseTimes.push(durationMs);
    if (metrics.responseTimes.length > MAX_RESPONSE_TIMES) {
        metrics.responseTimes.shift();
    }

    // Recalculate aggregates
    const sorted = [...metrics.responseTimes].sort((a, b) => a - b);
    metrics.avgResponseMs = Math.round(sorted.reduce((a, b) => a + b, 0) / sorted.length);
    metrics.p95ResponseMs = sorted[Math.floor(sorted.length * 0.95)] ?? 0;
}

export function getAggregateMetrics(): Omit<AggregateMetrics, 'responseTimes'> {
    return {
        totalRequests: metrics.totalRequests,
        totalErrors: metrics.totalErrors,
        avgResponseMs: metrics.avgResponseMs,
        p95ResponseMs: metrics.p95ResponseMs,
    };
}
