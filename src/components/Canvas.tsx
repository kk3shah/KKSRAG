"use client";

import { BarChart3, X, Download, Copy, Check } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { ChartRenderer } from "./ChartRenderer";
import { DataTable } from "./DataTable";
import { downloadCSV, copyToClipboard } from "@/lib/export";
import type { Message } from "./ChatMessage";

interface CanvasProps {
    data: Message;
    onClose: () => void;
}

export function Canvas({ data, onClose }: CanvasProps) {
    const [copiedSql, setCopiedSql] = useState(false);

    const handleCopySql = async () => {
        if (!data.sql) return;
        await copyToClipboard(data.sql);
        setCopiedSql(true);
        setTimeout(() => setCopiedSql(false), 2000);
    };

    const handleDownloadCsv = () => {
        if (!data.data?.length) return;
        downloadCSV(data.data, `kksrag-export-${Date.now()}.csv`);
    };

    return (
        <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 200 }}
            className="fixed inset-0 md:relative md:inset-auto md:flex-1 bg-[#050505] h-full flex flex-col border-l border-white/5 shadow-3xl text-white z-30 md:z-20"
        >
            <header className="px-6 md:px-10 py-4 md:py-6 border-b border-white/5 flex items-center justify-between bg-black/40 backdrop-blur-3xl sticky top-0 z-10">
                <div className="flex items-center gap-3 md:gap-5">
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-primary/20 rounded-xl md:rounded-2xl flex items-center justify-center text-primary shadow-inner">
                        <BarChart3 className="w-5 h-5 md:w-6 md:h-6" />
                    </div>
                    <div>
                        <h3 className="text-base md:text-xl font-black tracking-tighter">Analysis Engine</h3>
                        <p className="text-[10px] text-white/30 font-black uppercase tracking-[0.3em]">Canvas v2.0</p>
                    </div>
                </div>
                <div className="flex items-center gap-1 md:gap-2">
                    {data.data && data.data.length > 0 && (
                        <button
                            onClick={handleDownloadCsv}
                            className="p-2 md:p-3 hover:bg-white/5 rounded-xl md:rounded-2xl transition-all group"
                            title="Download CSV"
                        >
                            <Download className="w-5 h-5 text-white/40 group-hover:text-white" />
                        </button>
                    )}
                    {data.sql && (
                        <button
                            onClick={handleCopySql}
                            className="p-2 md:p-3 hover:bg-white/5 rounded-xl md:rounded-2xl transition-all group"
                            title="Copy SQL"
                        >
                            {copiedSql
                                ? <Check className="w-5 h-5 text-emerald-400" />
                                : <Copy className="w-5 h-5 text-white/40 group-hover:text-white" />
                            }
                        </button>
                    )}
                    <button onClick={onClose} className="p-2 md:p-3 hover:bg-white/5 rounded-xl md:rounded-2xl transition-all group">
                        <X className="w-5 h-5 md:w-6 md:h-6 text-white/40 group-hover:text-white" />
                    </button>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-10 md:space-y-16 scrollbar-hide">
                {data.data && data.data.length > 0 && data.chartConfig && data.chartConfig.type !== "none" && (
                    <ChartRenderer data={data.data} chartConfig={data.chartConfig} />
                )}

                {data.data && <DataTable data={data.data} />}

                {data.sql && (
                    <section className="space-y-6 md:space-y-8 pb-10 md:pb-20 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
                        <div className="flex items-center gap-4">
                            <div className="w-1.5 h-6 bg-amber-500 rounded-full" />
                            <h4 className="text-xs font-black uppercase tracking-widest text-white/40">DuckDB Pipeline</h4>
                        </div>
                        <div className="bg-[#0c0c0e] p-6 md:p-10 rounded-2xl md:rounded-[2.5rem] border border-white/5 font-mono text-[12px] md:text-[13px] leading-relaxed text-indigo-200/80 shadow-inner group relative overflow-x-auto">
                            <div className="absolute top-4 md:top-6 right-4 md:right-8 text-[10px] font-black uppercase tracking-widest text-white/10 group-hover:text-white/30 transition-colors">SQL</div>
                            <pre className="whitespace-pre-wrap break-words">{data.sql}</pre>
                        </div>
                    </section>
                )}
            </div>
        </motion.div>
    );
}
