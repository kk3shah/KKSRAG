import fs from 'fs';
import path from 'path';
import { log } from './logger';

// DuckDB types - using generic types since we dynamically import to avoid Turbopack issues
type DuckDBDatabase = {
    all(sql: string, callback: (err: Error | null, rows?: Record<string, unknown>[]) => void): void;
    close(): void;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let DatabaseConstructor: any = null;
let db: DuckDBDatabase | null = null;
let initialized = false;

async function loadDuckDB(): Promise<void> {
    if (!DatabaseConstructor) {
        // Dynamic import avoids Turbopack trying to statically analyze DuckDB's
        // native binary config (which causes a build panic due to missing napi_versions field)
        const duckdb = await import('duckdb');
        DatabaseConstructor = duckdb.Database;
    }
}

async function getDb(): Promise<DuckDBDatabase> {
    if (!db) {
        await loadDuckDB();
        db = new DatabaseConstructor(':memory:') as DuckDBDatabase;
    }
    return db;
}

/**
 * Initializes DuckDB with CSV files from the ./data folder.
 * Only runs once — subsequent calls are no-ops until resetDbInit() is called.
 */
export async function initDb(): Promise<void> {
    if (initialized) return;

    const database = await getDb();
    const dataDir = path.join(process.cwd(), 'data');

    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
        initialized = true;
        return;
    }

    const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.csv'));
    if (files.length === 0) {
        initialized = true;
        return;
    }

    for (const file of files) {
        const tableName = path.basename(file, '.csv').replace(/[^a-zA-Z0-9_]/g, '_');
        const filePath = path.join(dataDir, file);

        await new Promise<void>((resolve) => {
            database.all(
                `CREATE OR REPLACE TABLE "${tableName}" AS SELECT * FROM read_csv_auto('${filePath.replace(/'/g, "''")}')`,
                (err: Error | null) => {
                    if (err) {
                        log('error', `Failed to load table ${tableName}`, { error: err.message, file });
                    } else {
                        log('info', `Table ${tableName} registered`, { file });
                    }
                    resolve();
                }
            );
        });
    }

    initialized = true;
}

/**
 * Resets the initialization flag, forcing the next initDb() call to reload tables.
 * Useful when new files are uploaded.
 */
export function resetDbInit(): void {
    initialized = false;
}

/**
 * Fetches schema for all registered tables.
 */
export async function getTablesSchema(): Promise<string> {
    const database = await getDb();

    return new Promise((resolve, reject) => {
        database.all(
            "SELECT table_name, column_name, data_type FROM information_schema.columns WHERE table_schema = 'main'",
            (err: Error | null, rows?: Record<string, unknown>[]) => {
                if (err) return reject(err);
                if (!rows) return resolve('');

                const schemas: Record<string, string[]> = {};
                for (const row of rows) {
                    const tableName = String(row.table_name);
                    const columnName = String(row.column_name);
                    const dataType = String(row.data_type);
                    if (!schemas[tableName]) schemas[tableName] = [];
                    schemas[tableName].push(`${columnName} (${dataType})`);
                }

                const schemaStr = Object.entries(schemas)
                    .map(([table, cols]) => `Table: ${table}\nColumns: ${cols.join(', ')}`)
                    .join('\n\n');

                resolve(schemaStr);
            }
        );
    });
}

/**
 * Validates that a SQL query is safe to execute (read-only).
 * Uses a whitelist approach: must start with SELECT or WITH.
 * Also blocks dangerous DuckDB-specific commands even in subqueries.
 */
function validateQuery(sql: string): void {
    // Strip SQL comments to prevent bypass
    const stripped = sql
        .replace(/\/\*[\s\S]*?\*\//g, ' ')   // block comments
        .replace(/--.*$/gm, ' ')              // line comments
        .trim();

    // Whitelist: must start with SELECT or WITH (CTEs)
    if (!/^(SELECT|WITH)\s/i.test(stripped)) {
        throw new Error('Only SELECT queries and CTEs (WITH) are allowed.');
    }

    // Block dangerous DuckDB-specific commands even in subqueries
    const dangerous = /\b(COPY|ATTACH|DETACH|EXPORT|IMPORT|INSTALL|LOAD|CREATE|ALTER|DROP|DELETE|UPDATE|INSERT|TRUNCATE|GRANT|REVOKE|PRAGMA|CALL)\b/i;
    if (dangerous.test(stripped)) {
        throw new Error('This query contains restricted operations.');
    }
}

/**
 * Executes a read-only SQL query against DuckDB.
 */
export async function executeQuery(sql: string): Promise<Record<string, unknown>[]> {
    validateQuery(sql);

    // Enforce LIMIT to prevent memory exhaustion
    let finalSql = sql.trim().replace(/;+$/, '');
    if (!/\bLIMIT\b/i.test(finalSql)) {
        finalSql = `${finalSql} LIMIT 1000`;
    }

    const database = await getDb();

    return new Promise((resolve, reject) => {
        database.all(finalSql, (err: Error | null, rows?: Record<string, unknown>[]) => {
            if (err) return reject(err);
            resolve(rows ?? []);
        });
    });
}
