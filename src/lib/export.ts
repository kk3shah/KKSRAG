/**
 * Downloads data as a CSV file.
 */
export function downloadCSV(data: Record<string, unknown>[], filename: string): void {
    if (!data.length) return;

    const headers = Object.keys(data[0]);
    const csvRows = [
        headers.join(','),
        ...data.map(row =>
            headers.map(h => {
                const val = row[h];
                const str = val === null || val === undefined ? '' : String(val);
                // Escape values containing commas, quotes, or newlines
                if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                    return `"${str.replace(/"/g, '""')}"`;
                }
                return str;
            }).join(',')
        ),
    ];

    const csv = csvRows.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();

    URL.revokeObjectURL(url);
}

/**
 * Copies text to the clipboard.
 */
export async function copyToClipboard(text: string): Promise<void> {
    await navigator.clipboard.writeText(text);
}
