import { NextResponse } from 'next/server';
import { getAggregateMetrics } from '@/lib/metrics';

export async function GET() {
    const checks: Record<string, unknown> = {
        status: 'ok',
        timestamp: new Date().toISOString(),
    };

    // Check required env vars
    const envVars = ['GOOGLE_GEMINI_API_KEY', 'SUPABASE_URL', 'SUPABASE_SERVICE_KEY'];
    const missingEnv = envVars.filter(v => !process.env[v]);
    if (missingEnv.length > 0) {
        checks.status = 'degraded';
        checks.missing_env = missingEnv.join(', ');
    }

    // Check DuckDB availability (lazy — don't import at module level)
    try {
        const duckdb = await import('@/lib/duckdb');
        await duckdb.initDb();
        const schema = await duckdb.getTablesSchema();
        checks.duckdb = 'ok';
        checks.tables = schema ? schema.split('\n\n').filter(Boolean).length : 0;
    } catch (err: unknown) {
        checks.duckdb = 'error';
        checks.duckdb_error = err instanceof Error ? err.message : 'Unknown';
        checks.status = 'degraded';
    }

    // Performance metrics
    checks.metrics = getAggregateMetrics();

    const statusCode = checks.status === 'ok' ? 200 : 503;
    return NextResponse.json(checks, { status: statusCode });
}
