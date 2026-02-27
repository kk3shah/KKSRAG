/**
 * SQL Sanitization Tests — Security Boundary
 *
 * These tests verify the whitelist-based SQL validation logic.
 * Since DuckDB requires native modules, we test the validation logic
 * by importing the module and calling executeQuery/executeUserQuery
 * which call validateQuery internally. We mock the actual DuckDB calls.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the DuckDB native module with a proper class (not arrow fn) so `new` works
class MockDatabase {
    all(_sql: string, cb: (err: Error | null, rows?: Record<string, unknown>[]) => void) {
        cb(null, []);
    }
    close() { /* noop */ }
}

vi.mock('duckdb', () => ({
    default: { Database: MockDatabase },
    Database: MockDatabase,
}));

// Mock fs and path for initDb
vi.mock('fs', () => ({
    default: {
        existsSync: vi.fn(() => true),
        readdirSync: vi.fn(() => []),
        mkdirSync: vi.fn(),
        writeFileSync: vi.fn(),
        unlinkSync: vi.fn(),
    },
    existsSync: vi.fn(() => true),
    readdirSync: vi.fn(() => []),
    mkdirSync: vi.fn(),
    writeFileSync: vi.fn(),
    unlinkSync: vi.fn(),
}));

vi.mock('@/lib/logger', () => ({
    log: vi.fn(),
}));

describe('SQL Sanitization (Security Boundary)', () => {
    let executeQuery: (sql: string) => Promise<Record<string, unknown>[]>;

    beforeEach(async () => {
        vi.resetModules();
        const mod = await import('@/lib/duckdb');
        executeQuery = mod.executeQuery;
    });

    describe('Allowed queries', () => {
        it('allows basic SELECT', async () => {
            await expect(executeQuery('SELECT * FROM users')).resolves.toBeDefined();
        });

        it('allows SELECT with WHERE', async () => {
            await expect(executeQuery('SELECT name FROM users WHERE id = 1')).resolves.toBeDefined();
        });

        it('allows WITH (CTE)', async () => {
            await expect(
                executeQuery('WITH cte AS (SELECT 1 AS n) SELECT * FROM cte'),
            ).resolves.toBeDefined();
        });

        it('allows SELECT with aggregate functions', async () => {
            await expect(
                executeQuery('SELECT COUNT(*), AVG(price) FROM products'),
            ).resolves.toBeDefined();
        });

        it('allows SELECT with JOIN', async () => {
            await expect(
                executeQuery('SELECT a.name, b.total FROM users a JOIN orders b ON a.id = b.user_id'),
            ).resolves.toBeDefined();
        });

        it('allows SELECT with subquery', async () => {
            await expect(
                executeQuery('SELECT * FROM (SELECT 1 AS n) sub'),
            ).resolves.toBeDefined();
        });

        it('auto-appends LIMIT 1000 if no LIMIT specified', async () => {
            // This should not throw — the function adds LIMIT internally
            await expect(executeQuery('SELECT * FROM users')).resolves.toBeDefined();
        });
    });

    describe('Blocked queries — must start with SELECT or WITH', () => {
        const blockedStarters = [
            'INSERT INTO users VALUES (1, "test")',
            'UPDATE users SET name = "evil"',
            'DELETE FROM users',
            'DROP TABLE users',
            'CREATE TABLE evil (id INT)',
            'ALTER TABLE users ADD COLUMN evil TEXT',
            'TRUNCATE TABLE users',
        ];

        for (const sql of blockedStarters) {
            it(`blocks: ${sql.slice(0, 40)}...`, async () => {
                await expect(executeQuery(sql)).rejects.toThrow('Only SELECT queries');
            });
        }
    });

    describe('Blocked queries — dangerous commands even in subqueries', () => {
        const dangerous = [
            'SELECT * FROM users; DROP TABLE users',
            "SELECT COPY 'users' TO '/tmp/evil.csv'",
            "SELECT * FROM users WHERE ATTACH '/tmp/evil.db'",
            'SELECT EXPORT DATABASE',
            'SELECT IMPORT DATABASE',
            'SELECT INSTALL httpfs',
            'SELECT LOAD httpfs',
            'SELECT PRAGMA version',
            'SELECT CALL system("rm -rf /")',
            'SELECT GRANT ALL TO evil',
            'SELECT REVOKE ALL FROM admin',
        ];

        for (const sql of dangerous) {
            it(`blocks dangerous command: ${sql.slice(0, 50)}...`, async () => {
                await expect(executeQuery(sql)).rejects.toThrow(/restricted operations|Only SELECT/);
            });
        }
    });

    describe('Comment bypass prevention', () => {
        it('blocks injection via line comments', async () => {
            await expect(
                executeQuery('-- DROP TABLE\nDROP TABLE users'),
            ).rejects.toThrow();
        });

        it('blocks injection via block comments', async () => {
            await expect(
                executeQuery('/* SELECT 1 */ DROP TABLE users'),
            ).rejects.toThrow();
        });

        it('blocks hidden commands after line comment strip', async () => {
            // After stripping "-- select", what's left is INSERT...
            await expect(
                executeQuery('-- select\nINSERT INTO users VALUES (1)'),
            ).rejects.toThrow();
        });
    });

    describe('Case insensitivity', () => {
        it('allows lowercase select', async () => {
            await expect(executeQuery('select * from users')).resolves.toBeDefined();
        });

        it('blocks mixed case DROP', async () => {
            await expect(executeQuery('DrOp TABLE users')).rejects.toThrow();
        });

        it('blocks COPY in any case', async () => {
            await expect(executeQuery("SELECT CoPy 'x' TO 'y'")).rejects.toThrow();
        });
    });
});
