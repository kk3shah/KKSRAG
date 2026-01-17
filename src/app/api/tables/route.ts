import { NextResponse } from 'next/server';
import { initDb, getTablesSchema } from '@/lib/duckdb';

export async function GET() {
    try {
        await initDb();
        const schema = await getTablesSchema();

        // Parse schema string into structured data for sidebar
        // Schema format: "Table: name\nColumns: col1 (type), col2 (type)\n\n"
        const tables = schema.split('\n\n').filter(Boolean).map(t => {
            const [tableLine, columnLine] = t.split('\n');
            const name = tableLine.replace('Table: ', '').trim();
            const columns = columnLine.replace('Columns: ', '').split(', ').map(c => c.trim());
            return { name, columns };
        });

        return NextResponse.json({ tables });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
