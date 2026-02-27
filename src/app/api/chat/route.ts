import { NextRequest, NextResponse } from 'next/server';
import { SQL_PROMPT, EXPLAIN_PROMPT, askGemini } from '@/lib/gemini';
import { initUserDb, getUserTablesSchema, executeUserQuery } from '@/lib/duckdb';
import { requireAuth } from '@/lib/auth';
import { saveQueryHistory } from '@/lib/db/queries';
import { checkRateLimit } from '@/lib/rate-limit';
import { log } from '@/lib/logger';
import type { ChatErrorResponse } from '@/types';

const MAX_MESSAGE_LENGTH = 2000;

function getClientIp(req: NextRequest): string {
    return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
        ?? req.headers.get('x-real-ip')
        ?? 'unknown';
}

function errorResponse(error: string, status: number, sql?: string): NextResponse<ChatErrorResponse> {
    return NextResponse.json({ error, ...(sql ? { sql } : {}) }, { status });
}

export async function POST(req: NextRequest) {
    const startTime = Date.now();
    const ip = getClientIp(req);

    // Auth check
    const authResult = await requireAuth();
    if (authResult.error) return authResult.error;
    const { userId } = authResult;

    try {
        // Rate limiting
        const rateResult = checkRateLimit(ip);
        if (!rateResult.allowed) {
            log('warn', 'Rate limit exceeded', { ip, userId });
            return errorResponse('Too many requests. Please wait a moment and try again.', 429);
        }

        // Input validation
        let body: unknown;
        try {
            body = await req.json();
        } catch {
            return errorResponse('Invalid JSON in request body.', 400);
        }

        const bodyObj = body as Record<string, unknown>;
        const message = bodyObj?.message;
        const history = Array.isArray(bodyObj?.history) ? bodyObj.history as Array<{ role: string; content: string; sql?: string }> : undefined;

        if (!message || typeof message !== 'string') {
            return errorResponse('Message is required and must be a string.', 400);
        }

        if (message.length > MAX_MESSAGE_LENGTH) {
            return errorResponse(`Message too long. Maximum ${MAX_MESSAGE_LENGTH} characters.`, 400);
        }

        // Initialize user's database and get schema
        await initUserDb(userId);
        const schema = await getUserTablesSchema(userId);

        // Build conversation context from history
        const conversationHistory = history?.slice(-5).map(h => ({
            role: h.role as 'user' | 'assistant',
            content: String(h.content),
            sql: h.sql ? String(h.sql) : undefined,
        }));

        // 1. Generate SQL
        const sqlPromptText = SQL_PROMPT(schema, message, conversationHistory);
        const sqlResponseText = await askGemini(sqlPromptText);

        // Clean potential markdown blocks
        const cleanedSqlJson = sqlResponseText.replace(/```json|```/g, '').trim();

        let sqlData: Record<string, unknown>;
        try {
            sqlData = JSON.parse(cleanedSqlJson);
        } catch {
            log('warn', 'Failed to parse SQL JSON from AI', { response: cleanedSqlJson.slice(0, 200), userId });
            return errorResponse('AI generated invalid instructions. Please try rephrasing your question.', 500);
        }

        const { sql, chart_type, x_axis, y_axis } = sqlData as {
            sql: string;
            chart_type: string;
            x_axis: string;
            y_axis: string;
        };

        if (!sql || typeof sql !== 'string') {
            return errorResponse('Could not generate a valid query for that question. Please try rephrasing.', 400);
        }

        // 2. Execute SQL against user's DuckDB instance
        let data;
        try {
            data = await executeUserQuery(userId, sql);
        } catch (dbError: unknown) {
            const dbMessage = dbError instanceof Error ? dbError.message : 'Unknown database error';
            log('error', 'Query execution failed', { sql, error: dbMessage, userId });
            return errorResponse(
                'The generated query could not be executed. Please try rephrasing your question.',
                500,
                process.env.NODE_ENV === 'development' ? sql : undefined
            );
        }

        // Serialize BigInts for JSON transport
        const serializedData = JSON.parse(JSON.stringify(data, (_key, value) =>
            typeof value === 'bigint' ? value.toString() : value
        ));

        // 3. Explain Results
        const explainPromptText = EXPLAIN_PROMPT(JSON.stringify(serializedData.slice(0, 5)), message);
        const explainResponseText = await askGemini(explainPromptText);
        const cleanedExplainJson = explainResponseText.replace(/```json|```/g, '').trim();

        let explainData: { summary: string; suggestions: string[] };
        try {
            explainData = JSON.parse(cleanedExplainJson);
        } catch {
            explainData = {
                summary: explainResponseText,
                suggestions: ['What are the top results?', 'Show me more details', 'Compare by category'],
            };
        }

        const totalMs = Date.now() - startTime;
        log('info', 'Query completed', { totalMs, rowCount: serializedData.length, ip, userId });

        // Persist query history to Supabase (fire and forget)
        saveQueryHistory(
            userId,
            message,
            sql,
            explainData.summary?.slice(0, 500),
            serializedData.length,
            totalMs,
        ).catch(() => {
            // Non-critical — already logged inside saveQueryHistory
        });

        return NextResponse.json({
            sql,
            data: serializedData,
            summary: explainData.summary,
            suggestions: explainData.suggestions,
            chartConfig: { type: chart_type, xAxis: x_axis, yAxis: y_axis },
        });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'An unexpected error occurred';
        const totalMs = Date.now() - startTime;
        log('error', 'Unhandled API error', { error: message, totalMs, ip, userId });

        return errorResponse(
            process.env.NODE_ENV === 'development'
                ? message
                : 'An unexpected error occurred. Please try again.',
            500
        );
    }
}
