# KKSRAG - AI Data Chatbot

KKSRAG is a production-ready AI data chatbot that allows you to ask complex questions about your local CSV files in plain English. It uses **DuckDB** for lightning-fast SQL queries and **Gemini Pro** for natural language understanding and SQL generation.

## Features
- **NL to SQL**: Ask questions in plain English, get SQL-backed answers.
- **Dynamic Visualization**: Automatically generates charts (Bar, Line) based on your data.
- **Canvas-style UI**: A modern, ChatGPT-like interface with message cards and terminal-style SQL previews.
- **Local Storage**: Queries CSVs stored in the `./data/` folder.
- **DuckDB Powered**: Fast, local analytical database.
- **Dark Mode**: Sleek dark UI optimized for productivity.

## Setup

1. **Environment Variables**:
   Create a `.env.local` file in the root directory (already done if using the provided scripts) and add your Gemini API key:
   ```env
   GOOGLE_GEMINI_API_KEY=your_api_key_here
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Add Data**:
   Place your `.csv` files in the `./data/` folder. The app will automatically register each CSV as a table named after the filename.

4. **Run the App**:
   ```bash
   npm run dev
   ```

## Technology Stack
- **Frontend**: Next.js, React, Tailwind CSS, Recharts, Lucide React.
- **Backend**: Next.js API Routes, DuckDB (Native), Google Generative AI (Gemini Pro).
- **Design**: ShadCN-inspired custom components.

## Guardrails
- **Read-only**: Only `SELECT` queries are allowed. `DROP`, `DELETE`, `UPDATE`, and `INSERT` are blocked.
- **Output Limit**: Results are automatically limited to 1,000 rows to ensure performance.
- **Input Sanitization**: Basic SQL cleaning to prevent injection.

## Project Structure
- `src/lib/duckdb.ts`: DuckDB connection and table management.
- `src/lib/gemini.ts`: Gemini Pro configuration and prompt templates.
- `src/app/api/chat/route.ts`: Main backend logic for processing queries.
- `src/app/page.tsx`: Interactive chat interface.
