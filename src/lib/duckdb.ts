import { Database } from 'duckdb';
import fs from 'fs';
import path from 'path';

const dbPath = ':memory:';
const db = new Database(dbPath);

export const getDb = () => db;

/**
 * Initializes DuckDB with CSV files from the ./data folder.
 */
export async function initDb() {
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir);
    }

    const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.csv'));

    return new Promise((resolve, reject) => {
        // We use a for loop to sequentially register tables.
        // In a real production app, you might want more complex session management.
        let filesProcessed = 0;
        if (files.length === 0) resolve(true);

        files.forEach(file => {
            const tableName = path.basename(file, '.csv').replace(/[^a-zA-Z0-9_]/g, '_');
            const filePath = path.join(dataDir, file);

            db.all(`CREATE OR REPLACE TABLE ${tableName} AS SELECT * FROM read_csv_auto('${filePath}')`, (err) => {
                if (err) {
                    console.error(`Error loading table ${tableName}:`, err);
                } else {
                    console.log(`Table ${tableName} registered/replaced.`);
                }
                filesProcessed++;
                if (filesProcessed === files.length) {
                    resolve(true);
                }
            });
        });
    });
}

/**
 * Fetches schema for all registered tables.
 */
export async function getTablesSchema(): Promise<string> {
    return new Promise((resolve, reject) => {
        db.all("SELECT table_name, column_name, data_type FROM information_schema.columns WHERE table_schema = 'main'", (err, rows) => {
            if (err) return reject(err);

            const schemas: Record<string, string[]> = {};
            rows.forEach((row: any) => {
                if (!schemas[row.table_name]) schemas[row.table_name] = [];
                schemas[row.table_name].push(`${row.column_name} (${row.data_type})`);
            });

            const schemaStr = Object.entries(schemas)
                .map(([table, cols]) => `Table: ${table}\nColumns: ${cols.join(', ')}`)
                .join('\n\n');

            resolve(schemaStr);
        });
    });
}

/**
 * Executes a read-only SQL query against DuckDB.
 */
export async function executeQuery(sql: string): Promise<any[]> {
    // Guardrail: Basic SQL sanitization
    const lowerSql = sql.toLowerCase();
    if (lowerSql.includes('drop') || lowerSql.includes('delete') || lowerSql.includes('update') || lowerSql.includes('insert')) {
        throw new Error('UNAUTHORIZED_ACTION: Only SELECT queries are allowed.');
    }

    // Guardrail: Enforce LIMIT 1000
    let finalSql = sql;
    if (!lowerSql.includes('limit')) {
        finalSql = `${sql.trim().replace(/;$/, '')} LIMIT 1000;`;
    }

    return new Promise((resolve, reject) => {
        db.all(finalSql, (err, rows) => {
            if (err) return reject(err);
            resolve(rows);
        });
    });
}
