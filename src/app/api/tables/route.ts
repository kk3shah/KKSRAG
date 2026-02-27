import { NextResponse } from 'next/server';
import { initDb, getTablesSchema } from '@/lib/duckdb';
import { log } from '@/lib/logger';
import type { TablesResponse, TableInfo } from '@/types';

export async function GET() {
    try {
        await initDb();
        const schema = await getTablesSchema();

        if (!schema) {
            return NextResponse.json({ tables: [] } satisfies TablesResponse);
        }

        const tables: TableInfo[] = schema.split('\n\n').filter(Boolean).map(t => {
            const lines = t.split('\n');
            const name = lines[0]?.replace('Table: ', '').trim() ?? '';
            const columns = lines[1]?.replace('Columns: ', '').split(', ').map(c => c.trim()) ?? [];
            return { name, columns };
        });

        return NextResponse.json({ tables } satisfies TablesResponse);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        log('error', 'Failed to fetch tables', { error: message });

        return NextResponse.json(
            { error: process.env.NODE_ENV === 'development' ? message : 'Failed to load table information.' },
            { status: 500 }
        );
    }
}
