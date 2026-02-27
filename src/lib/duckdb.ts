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

async function loadDuckDB(): Promise<void> {
    if (!DatabaseConstructor) {
        // Dynamic import avoids Turbopack trying to statically analyze DuckDB's
        // native binary config (which causes a build panic due to missing napi_versions field)
        const duckdb = await import('duckdb');
        DatabaseConstructor = duckdb.Database;
    }
}

// ─── Per-user DuckDB instance management ───

interface UserInstance {
    db: DuckDBDatabase;
    initialized: boolean;
    lastAccessed: number;
    loadedTables: Set<string>;
}

const userInstances = new Map<string, UserInstance>();
const IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

// Shared/default instance for backward compatibility (unauthenticated routes, health checks)
let defaultDb: DuckDBDatabase | null = null;
let defaultInitialized = false;

/**
 * Evicts idle user DuckDB instances to free memory.
 */
function evictIdleInstances(): void {
    const now = Date.now();
    for (const [userId, instance] of userInstances) {
        if (now - instance.lastAccessed > IDLE_TIMEOUT_MS) {
            try {
                instance.db.close();
            } catch {
                // Ignore close errors
            }
            userInstances.delete(userId);
            log('info', 'Evicted idle DuckDB instance', { userId });
        }
    }
}

// Run eviction every 5 minutes
const evictionInterval = setInterval(evictIdleInstances, 5 * 60 * 1000);
// Don't block Node.js exit
if (evictionInterval.unref) {
    evictionInterval.unref();
}

/**
 * Gets or creates a DuckDB instance for a specific user.
 */
async function getUserDb(userId: string): Promise<UserInstance> {
    let instance = userInstances.get(userId);

    if (!instance) {
        await loadDuckDB();
        const db = new DatabaseConstructor(':memory:') as DuckDBDatabase;
        instance = {
            db,
            initialized: false,
            lastAccessed: Date.now(),
            loadedTables: new Set(),
        };
        userInstances.set(userId, instance);
        log('info', 'Created DuckDB instance', { userId });
    }

    instance.lastAccessed = Date.now();
    return instance;
}

/**
 * Gets the default (shared) DuckDB instance.
 * Used for unauthenticated contexts (health checks, etc.)
 */
async function getDefaultDb(): Promise<DuckDBDatabase> {
    if (!defaultDb) {
        await loadDuckDB();
        defaultDb = new DatabaseConstructor(':memory:') as DuckDBDatabase;
    }
    return defaultDb;
}

// ─── Default instance (backward compat / health checks) ───

/**
 * Initializes the default DuckDB with CSV files from ./data folder.
 * Only runs once — subsequent calls are no-ops.
 */
export async function initDb(): Promise<void> {
    if (defaultInitialized) return;

    const database = await getDefaultDb();
    await loadCsvsFromDir(database, path.join(process.cwd(), 'data'));
    defaultInitialized = true;
}

/**
 * Resets the default initialization flag.
 */
export function resetDbInit(): void {
    defaultInitialized = false;
}

// ─── Per-user functions ───

/**
 * Initializes a user's DuckDB instance with CSVs from the shared data dir.
 */
export async function initUserDb(userId: string): Promise<void> {
    const instance = await getUserDb(userId);
    if (instance.initialized) return;

    // Load shared CSVs from ./data directory
    await loadCsvsFromDir(instance.db, path.join(process.cwd(), 'data'));
    instance.initialized = true;
}

/**
 * Loads a specific CSV file into a user's DuckDB instance.
 * Used after upload to immediately make the data queryable.
 */
export async function loadCsvIntoUserDb(
    userId: string,
    tableName: string,
    filePath: string,
): Promise<void> {
    const instance = await getUserDb(userId);
    const safeName = tableName.replace(/[^a-zA-Z0-9_]/g, '_');

    await new Promise<void>((resolve, reject) => {
        instance.db.all(
            `CREATE OR REPLACE TABLE "${safeName}" AS SELECT * FROM read_csv_auto('${filePath.replace(/'/g, "''")}')`,
            (err: Error | null) => {
                if (err) {
                    log('error', `Failed to load table ${safeName} for user`, { error: err.message, userId });
                    reject(err);
                } else {
                    instance.loadedTables.add(safeName);
                    log('info', `Table ${safeName} loaded for user`, { userId });
                    resolve();
                }
            },
        );
    });
}

/**
 * Resets a user's DuckDB instance (e.g., after file upload).
 */
export function resetUserDb(userId: string): void {
    const instance = userInstances.get(userId);
    if (instance) {
        try {
            instance.db.close();
        } catch {
            // Ignore
        }
        userInstances.delete(userId);
        log('info', 'Reset DuckDB instance', { userId });
    }
}

/**
 * Gets the schema for all tables in a user's DuckDB instance.
 */
export async function getUserTablesSchema(userId: string): Promise<string> {
    const instance = await getUserDb(userId);
    return getSchemaFromDb(instance.db);
}

/**
 * Executes a read-only SQL query against a user's DuckDB instance.
 */
export async function executeUserQuery(
    userId: string,
    sql: string,
): Promise<Record<string, unknown>[]> {
    validateQuery(sql);

    let finalSql = sql.trim().replace(/;+$/, '');
    if (!/\bLIMIT\b/i.test(finalSql)) {
        finalSql = `${finalSql} LIMIT 1000`;
    }

    const instance = await getUserDb(userId);

    return new Promise((resolve, reject) => {
        instance.db.all(finalSql, (err: Error | null, rows?: Record<string, unknown>[]) => {
            if (err) return reject(err);
            resolve(rows ?? []);
        });
    });
}

// ─── Shared (default) instance functions ───

/**
 * Fetches schema for all registered tables (default instance).
 */
export async function getTablesSchema(): Promise<string> {
    const database = await getDefaultDb();
    return getSchemaFromDb(database);
}

/**
 * Executes a read-only SQL query (default instance).
 */
export async function executeQuery(sql: string): Promise<Record<string, unknown>[]> {
    validateQuery(sql);

    let finalSql = sql.trim().replace(/;+$/, '');
    if (!/\bLIMIT\b/i.test(finalSql)) {
        finalSql = `${finalSql} LIMIT 1000`;
    }

    const database = await getDefaultDb();

    return new Promise((resolve, reject) => {
        database.all(finalSql, (err: Error | null, rows?: Record<string, unknown>[]) => {
            if (err) return reject(err);
            resolve(rows ?? []);
        });
    });
}

// ─── Shared helpers ───

/**
 * Loads all CSV files from a directory into a DuckDB database.
 */
async function loadCsvsFromDir(database: DuckDBDatabase, dataDir: string): Promise<void> {
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
        return;
    }

    const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.csv'));
    if (files.length === 0) return;

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
                },
            );
        });
    }
}

/**
 * Retrieves schema from any DuckDB database instance.
 */
function getSchemaFromDb(database: DuckDBDatabase): Promise<string> {
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
            },
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
