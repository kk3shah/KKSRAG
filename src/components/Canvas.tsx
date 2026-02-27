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
            className="flex-1 bg-[#050505] h-full flex flex-col border-l border-white/5 shadow-3xl text-white z-20"
        >
            <header className="px-10 py-6 border-b border-white/5 flex items-center justify-between bg-black/40 backdrop-blur-3xl sticky top-0 z-10">
                <div className="flex items-center gap-5">
                    <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center text-primary shadow-inner">
                        <BarChart3 className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-xl font-black tracking-tighter">Analysis Engine</h3>
                        <p className="text-[10px] text-white/30 font-black uppercase tracking-[0.3em]">Canvas v2.0</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {data.data && data.data.length > 0 && (
                        <button
                            onClick={handleDownloadCsv}
                            className="p-3 hover:bg-white/5 rounded-2xl transition-all group"
                            title="Download CSV"
                        >
                            <Download className="w-5 h-5 text-white/40 group-hover:text-white" />
                        </button>
                    )}
                    {data.sql && (
                        <button
                            onClick={handleCopySql}
                            className="p-3 hover:bg-white/5 rounded-2xl transition-all group"
                            title="Copy SQL"
                        >
                            {copiedSql
                                ? <Check className="w-5 h-5 text-emerald-400" />
                                : <Copy className="w-5 h-5 text-white/40 group-hover:text-white" />
                            }
                        </button>
                    )}
                    <button onClick={onClose} className="p-3 hover:bg-white/5 rounded-2xl transition-all group">
                        <X className="w-6 h-6 text-white/40 group-hover:text-white" />
                    </button>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto p-10 space-y-16 scrollbar-hide">
                {data.data && data.data.length > 0 && data.chartConfig && data.chartConfig.type !== "none" && (
                    <ChartRenderer data={data.data} chartConfig={data.chartConfig} />
                )}

                {data.data && <DataTable data={data.data} />}

                {data.sql && (
                    <section className="space-y-8 pb-20 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
                        <div className="flex items-center gap-4">
                            <div className="w-1.5 h-6 bg-amber-500 rounded-full" />
                            <h4 className="text-xs font-black uppercase tracking-widest text-white/40">DuckDB Pipeline</h4>
                        </div>
                        <div className="bg-[#0c0c0e] p-10 rounded-[2.5rem] border border-white/5 font-mono text-[13px] leading-relaxed text-indigo-200/80 shadow-inner group relative">
                            <div className="absolute top-6 right-8 text-[10px] font-black uppercase tracking-widest text-white/10 group-hover:text-white/30 transition-colors">SQL</div>
                            {data.sql}
                        </div>
                    </section>
                )}
            </div>
        </motion.div>
    );
}
