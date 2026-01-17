import { NextRequest, NextResponse } from 'next/server';
import { SQL_PROMPT, EXPLAIN_PROMPT, askGemini } from '@/lib/gemini';
import { initDb, getTablesSchema, executeQuery } from '@/lib/duckdb';

export async function POST(req: NextRequest) {
    try {
        const { message } = await req.json();

        if (!message) {
            return NextResponse.json({ error: 'Message is required' }, { status: 400 });
        }

        await initDb();
        const schema = await getTablesSchema();

        // 1. Generate SQL
        const sqlPromptText = SQL_PROMPT(schema, message);
        const sqlResponseText = await askGemini(sqlPromptText);

        // Clean potential markdown blocks
        const cleanedSqlJson = sqlResponseText.replace(/```json|```/g, '').trim();

        let sqlData;
        try {
            sqlData = JSON.parse(cleanedSqlJson);
        } catch (e) {
            console.error('Failed to parse SQL JSON:', cleanedSqlJson);
            return NextResponse.json({ error: 'AI generated invalid SQL instructions. Please rephrase.' }, { status: 500 });
        }

        const { sql, chart_type, x_axis, y_axis } = sqlData;

        if (!sql || sql.toLowerCase().includes('error')) {
            return NextResponse.json({ error: sqlData.error || 'I couldn\'t translate that to a database query.' }, { status: 400 });
        }

        // 2. Execute SQL
        let data;
        try {
            data = await executeQuery(sql);
        } catch (dbError: any) {
            return NextResponse.json({
                error: `Database error: ${dbError.message}`,
                sql: sql
            }, { status: 500 });
        }

        // Serialize BigInts
        const serializedData = JSON.parse(JSON.stringify(data, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value
        ));

        // 3. Explain Results
        const explainPromptText = EXPLAIN_PROMPT(JSON.stringify(serializedData.slice(0, 5)), message);
        const explainResponseText = await askGemini(explainPromptText);

        const cleanedExplainJson = explainResponseText.replace(/```json|```/g, '').trim();

        let explainData;
        try {
            explainData = JSON.parse(cleanedExplainJson);
        } catch (e) {
            explainData = {
                summary: explainResponseText,
                suggestions: ["What are the top results?", "Show me more details", "Compare by category"]
            };
        }

        return NextResponse.json({
            sql,
            data: serializedData,
            summary: explainData.summary,
            suggestions: explainData.suggestions,
            chartConfig: { type: chart_type, xAxis: x_axis, yAxis: y_axis }
        });

    } catch (error: any) {
        console.error('Final API Error:', error);
        console.error('Stack Trace:', error.stack);
        return NextResponse.json({
            error: error.message || "An unexpected error occurred.",
            details: error.toString()
        }, { status: 500 });
    }
}
