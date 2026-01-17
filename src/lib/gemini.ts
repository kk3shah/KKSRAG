import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

export const SQL_PROMPT = (schema: string, message: string) => `
You are a data analyst. Based on the user's question and the table schema below, generate a SQL query (DuckDB syntax) and suggest a visualization.

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

User Question: ${message}
`;

export const EXPLAIN_PROMPT = (data: string, message: string) => `
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

export async function askGemini(prompt: string) {
  const result = await model.generateContent(prompt);
  return result.response.text().trim();
}
