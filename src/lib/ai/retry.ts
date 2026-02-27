import { getAIProvider } from './provider';
import { log } from '@/lib/logger';

const FIX_SQL_PROMPT = (
    schema: string,
    originalQuestion: string,
    failedSql: string,
    errorMessage: string,
): string => `You are a SQL debugger. The user asked a question, SQL was generated, but it failed with an error.
Fix the SQL so it runs correctly against DuckDB.

CRITICAL: Return ONLY a valid JSON object. No Markdown, no backticks.
{
  "sql": "SELECT ...",
  "chart_type": "bar" | "line" | "pie" | "none",
  "x_axis": "column_name",
  "y_axis": "column_name"
}

Schema:
${schema}

User Question: ${originalQuestion}

Failed SQL:
${failedSql}

Error Message:
${errorMessage}

Common DuckDB fixes:
- Use double-quotes for identifiers with spaces or mixed case
- DuckDB uses ILIKE for case-insensitive LIKE
- String concatenation uses || not +
- Date functions: date_trunc('month', col), strftime('%Y-%m', col)
- LIMIT goes after ORDER BY
- Column names are case-sensitive by default

Fix the SQL and return the corrected JSON:`;

export interface RetryResult {
    sql: string;
    chart_type: string;
    x_axis: string;
    y_axis: string;
    wasRetried: boolean;
}

/**
 * Attempts to fix a failed SQL query by sending the error back to the AI.
 * Returns the fixed SQL response, or null if the fix also fails to parse.
 */
export async function retrySqlGeneration(
    schema: string,
    originalQuestion: string,
    failedSql: string,
    errorMessage: string,
): Promise<RetryResult | null> {
    try {
        const ai = getAIProvider();
        const prompt = FIX_SQL_PROMPT(schema, originalQuestion, failedSql, errorMessage);
        const response = await ai.generateText(prompt);
        const cleaned = response.replace(/```json|```/g, '').trim();
        const parsed = JSON.parse(cleaned) as Record<string, unknown>;

        if (!parsed.sql || typeof parsed.sql !== 'string') {
            log('warn', 'Retry SQL fix returned no SQL', { response: cleaned.slice(0, 200) });
            return null;
        }

        log('info', 'SQL retry succeeded', {
            originalSql: failedSql.slice(0, 100),
            fixedSql: String(parsed.sql).slice(0, 100),
        });

        return {
            sql: String(parsed.sql),
            chart_type: String(parsed.chart_type ?? 'none'),
            x_axis: String(parsed.x_axis ?? ''),
            y_axis: String(parsed.y_axis ?? ''),
            wasRetried: true,
        };
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        log('warn', 'SQL retry failed', { error: msg });
        return null;
    }
}
