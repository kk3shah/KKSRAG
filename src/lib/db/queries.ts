import { getSupabase } from '@/lib/supabase';
import { log } from '@/lib/logger';

export interface QueryHistoryRow {
    id: string;
    user_id: string;
    question: string;
    sql: string;
    result_summary: string | null;
    row_count: number | null;
    execution_ms: number | null;
    created_at: string;
}

export async function saveQueryHistory(
    userId: string,
    question: string,
    sql: string,
    resultSummary?: string,
    rowCount?: number,
    executionMs?: number,
): Promise<void> {
    try {
        const { error } = await getSupabase()
            .from('query_history')
            .insert({
                user_id: userId,
                question,
                sql,
                result_summary: resultSummary ?? null,
                row_count: rowCount ?? null,
                execution_ms: executionMs ?? null,
            });

        if (error) {
            log('error', 'Failed to save query history', { error: error.message, userId });
        }
    } catch (err) {
        // Non-critical — don't fail the request if history save fails
        log('error', 'Query history save exception', { error: String(err) });
    }
}

export async function getQueryHistory(userId: string, limit: number = 50): Promise<QueryHistoryRow[]> {
    const { data, error } = await getSupabase()
        .from('query_history')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) {
        log('error', 'Failed to fetch query history', { error: error.message, userId });
        return [];
    }

    return (data ?? []) as QueryHistoryRow[];
}
