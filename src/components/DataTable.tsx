"use client";

interface DataTableProps {
    data: Record<string, unknown>[];
}

export function DataTable({ data }: DataTableProps) {
    if (!data.length) return null;

    const columns = Object.keys(data[0]);

    return (
        <section className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150">
            <div className="flex items-center gap-4">
                <div className="w-1.5 h-6 bg-emerald-500 rounded-full" />
                <h4 className="text-xs font-black uppercase tracking-widest text-white/40">Raw Dataset</h4>
            </div>
            <div className="rounded-[2.5rem] border border-white/5 overflow-hidden bg-white/[0.02] shadow-3xl">
                <div className="overflow-x-auto max-h-[600px] scrollbar-hide">
                    <table className="w-full text-[13px] text-left">
                        <thead className="bg-white/5 text-white/40 sticky top-0 z-10 backdrop-blur-3xl">
                            <tr>
                                {columns.map(k => (
                                    <th key={k} className="px-8 py-6 font-black uppercase tracking-tighter border-b border-white/5">{k}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {data.map((row, ri) => (
                                <tr key={ri} className="hover:bg-white/5 transition-colors group">
                                    {Object.values(row).map((v, vi) => (
                                        <td key={vi} className="px-8 py-6 text-white/50 group-hover:text-white transition-colors">
                                            {typeof v === 'number' ? v.toLocaleString() : String(v ?? '')}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </section>
    );
}
