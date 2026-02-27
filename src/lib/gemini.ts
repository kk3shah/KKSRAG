import { getAIProvider } from '@/lib/ai/provider';

export interface ConversationTurn {
    role: 'user' | 'assistant';
    content: string;
    sql?: string;
}

export const SQL_PROMPT = (schema: string, message: string, history?: ConversationTurn[]): string => {
    const historyBlock = history?.length
        ? `\nConversation History (use this for context like "show me more", "break that down", etc.):\n${history.map(h => `${h.role}: ${h.content}${h.sql ? ` [Generated SQL: ${h.sql}]` : ''}`).join('\n')}\n`
        : '';

    return `You are an expert data analyst and DuckDB SQL specialist. Based on the user's question and the table schema below, generate a SQL query (DuckDB syntax) and suggest a visualization.

CRITICAL: You MUST return ONLY a valid JSON object. No Markdown, no backticks, no preamble.
JSON structure:
{
  "sql": "SELECT ...",
  "chart_type": "bar" | "line" | "pie" | "none",
  "x_axis": "column_name",
  "y_axis": "column_name"
}

DuckDB SQL Guidelines:
- Use double-quotes for column/table identifiers with spaces or mixed case: "Column Name"
- For case-insensitive matching use ILIKE instead of LIKE
- String concatenation uses || (not +)
- Date functions: date_trunc('month', col), strftime('%Y-%m', col), EXTRACT(year FROM col)
- Current date: CURRENT_DATE, current timestamp: NOW()
- Use TRY_CAST() for safe casting that returns NULL instead of error
- Aggregate functions: COUNT(*), SUM(), AVG(), MIN(), MAX(), MEDIAN(), STDDEV()
- Window functions are supported: ROW_NUMBER() OVER (PARTITION BY ... ORDER BY ...)
- LIMIT goes after ORDER BY
- Lists: [1, 2, 3], list_contains(), unnest()
- String functions: lower(), upper(), trim(), substring(), string_split()
- NULLs: COALESCE(), IFNULL(), IS NOT NULL

Few-Shot Examples:

Example 1 — Trend over time:
Question: "Show monthly revenue trend"
Answer: {"sql": "SELECT strftime('%Y-%m', order_date) AS month, SUM(amount) AS total_revenue FROM orders GROUP BY month ORDER BY month", "chart_type": "line", "x_axis": "month", "y_axis": "total_revenue"}

Example 2 — Top N comparison:
Question: "Top 5 products by sales"
Answer: {"sql": "SELECT product_name, SUM(quantity) AS total_sold FROM sales GROUP BY product_name ORDER BY total_sold DESC LIMIT 5", "chart_type": "bar", "x_axis": "product_name", "y_axis": "total_sold"}

Example 3 — Distribution:
Question: "Distribution of customers by region"
Answer: {"sql": "SELECT region, COUNT(*) AS customer_count FROM customers GROUP BY region ORDER BY customer_count DESC", "chart_type": "pie", "x_axis": "region", "y_axis": "customer_count"}

Example 4 — Single value:
Question: "Total number of orders"
Answer: {"sql": "SELECT COUNT(*) AS total_orders FROM orders", "chart_type": "none", "x_axis": "", "y_axis": ""}

Visualization Rules:
- CRITICAL: If the query result has 2+ rows, you MUST pick a chart type ("bar", "line", "pie").
- "line": for trends over time (dates, timestamp, years, months).
- "bar": for comparing categories (names, status, sources, ids).
- "pie": for "top", "distribution", "share", or proportions (max 8 categories).
- "none": ONLY if the result is a single number or text string.
- x_axis: typically the dimension (date, name, category).
- y_axis: typically the metric (count, sum, avg).

Interpretation Rules:
- "Investigate" / "Optimize" -> Look for identifying high/low performers or outliers.
- "Performance" -> Focus on key metrics like conversions, cost, or ROI.
- "Compare" -> Use GROUP BY with the comparison dimension.
- "Trend" / "Over time" -> Use date_trunc or strftime for time grouping.
- If the user asks a vague question, infer the most useful query from the available columns.

Schema:
${schema}
${historyBlock}
User Question: ${message}
`;
};

export const EXPLAIN_PROMPT = (data: string, message: string): string => `
Summarize the following data in a friendly, concise way for a business user.
Highlight the key insight or finding.
Provide 2-3 actionable follow-up questions they might want to ask next.

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
    const ai = getAIProvider();
    return ai.generateText(prompt);
}
