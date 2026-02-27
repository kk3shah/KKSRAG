export interface ChatRequest {
    message: string;
    history?: ConversationTurn[];
}

export interface ConversationTurn {
    role: 'user' | 'assistant';
    content: string;
    sql?: string;
}

export interface ChartConfig {
    type: 'bar' | 'line' | 'pie' | 'none';
    xAxis?: string;
    yAxis?: string;
}

export interface ChatResponse {
    sql: string;
    data: Record<string, unknown>[];
    summary: string;
    suggestions: string[];
    chartConfig: ChartConfig;
}

export interface ChatErrorResponse {
    error: string;
    sql?: string;
}

export interface TableInfo {
    name: string;
    columns: string[];
}

export interface TablesResponse {
    tables: TableInfo[];
}

export interface DuckDBRow {
    [key: string]: unknown;
}

export interface SchemaRow {
    table_name: string;
    column_name: string;
    data_type: string;
}
