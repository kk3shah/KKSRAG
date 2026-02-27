type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogEntry {
    timestamp: string;
    level: LogLevel;
    message: string;
    [key: string]: unknown;
}

export function log(level: LogLevel, message: string, meta?: Record<string, unknown>): void {
    const entry: LogEntry = {
        timestamp: new Date().toISOString(),
        level,
        message,
        ...meta,
    };

    const isProduction = process.env.NODE_ENV === 'production';

    if (isProduction) {
        const output = JSON.stringify(entry);
        if (level === 'error') {
            console.error(output);
        } else {
            console.log(output);
        }
    } else {
        const prefix = `[${level.toUpperCase()}]`;
        if (level === 'error') {
            console.error(prefix, message, meta ?? '');
        } else if (level === 'warn') {
            console.warn(prefix, message, meta ?? '');
        } else if (level === 'debug') {
            console.debug(prefix, message, meta ?? '');
        } else {
            console.log(prefix, message, meta ?? '');
        }
    }
}
