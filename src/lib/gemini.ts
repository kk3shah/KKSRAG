import { GoogleGenerativeAI, type GenerativeModel } from '@google/generative-ai';

let model: GenerativeModel | null = null;

function getModel(): GenerativeModel {
    if (!model) {
        const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
        if (!apiKey) {
            throw new Error('GOOGLE_GEMINI_API_KEY environment variable is not set. See .env.example for setup instructions.');
        }
        const genAI = new GoogleGenerativeAI(apiKey);
        model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
    }
    return model;
}

export interface ConversationTurn {
    role: 'user' | 'assistant';
    content: string;
    sql?: string;
}

export const SQL_PROMPT = (schema: string, message: string, history?: ConversationTurn[]): string => {
    const historyBlock = history?.length
        ? `\nConversation History (use this for context like "show me more", "break that down", etc.):\n${history.map(h => `${h.role}: ${h.content}${h.sql ? ` [Generated SQL: ${h.sql}]` : ''}`).join('\n')}\n`
        : '';

    return `You are a data analyst. Based on the user's question and the table schema below, generate a SQL query (DuckDB syntax) and suggest a visualization.

CRITICAL: You MUST return ONLY a valid JSON object. No Markdown, no backticks, no preamble.
JSON structure:
{
  "sql": "SELECT ...",
  "chart_type": "bar" | "line" | "pie" | "none",
  "x_axis": "column_name",
  "y_axis": "column_name"
}

Visualization Rules:
- CRITICAL: If the query result has 2+ rows, you MUST pick a chart type ("bar", "line", "pie").
- "line": for trends over time (dates, timestamp, years, months).
- "bar": for comparing categories (names, status, sources, ids).
- "pie": for "top", "distribution", "share", or proportions.
- "none": ONLY if the result is a single number or text string.
- x_axis: typically the dimension (date, name).
- y_axis: typically the metric (count, sum, avg).

Interpretation Rules:
- "Investigate" / "Optimize" -> Look for identifying high/low performers or outliers.
- "Performance" -> Focus on key metrics like conversions, cost, or ROI.
- "High cost per conversion" -> SELECT ... ORDER BY cost_per_conversion DESC.

Schema:
${schema}
${historyBlock}
User Question: ${message}
`;
};

export const EXPLAIN_PROMPT = (data: string, message: string): string => `
Summarize the following data in a friendly, concise way for a business user.
Provide 2-3 follow-up questions they might want to ask next.

CRITICAL: Return ONLY a valid JSON object. No Markdown.
Structure:
{
  "summary": "Your concise explanation here...",
  "suggestions": ["Question 1?", "Question 2?", "Question 3?"]
}

User Question: ${message}
Data: ${data}
`;

export async function askGemini(prompt: string): Promise<string> {
    const result = await getModel().generateContent(prompt);
    return result.response.text().trim();
}
