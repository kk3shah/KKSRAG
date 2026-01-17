"use client";

import { useState, useEffect, useRef } from "react";
import {
    Send, BarChart3, Loader2, Database,
    Moon, Sun, Table2, Layout, Maximize2, X,
    Sparkles, ChevronDown, ChevronRight
} from "lucide-react";
import {
    LineChart, Line, BarChart, Bar, PieChart, Pie, XAxis, YAxis,
    CartesianGrid, Tooltip, ResponsiveContainer, Cell, AreaChart, Area
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";

type Message = {
    role: "user" | "assistant";
    content: string;
    sql?: string;
    data?: any[];
    summary?: string;
    suggestions?: string[];
    error?: string;
    chartConfig?: {
        type: string;
        xAxis?: string;
        yAxis?: string;
    };
};

type TableInfo = {
    name: string;
    columns: string[];
};

export default function ChatPage() {
    const [mounted, setMounted] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isDark, setIsDark] = useState(true);
    const [canvasData, setCanvasData] = useState<Message | null>(null);
    const [tables, setTables] = useState<TableInfo[]>([]);
    const [expandedTable, setExpandedTable] = useState<string | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    const fetchTables = async () => {
        try {
            const res = await fetch("/api/tables");
            const data = await res.json();
            if (data.tables) setTables(data.tables);
        } catch (e) { console.error(e); }
    };

    useEffect(() => {
        setMounted(true);
        fetchTables();
    }, []);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    if (!mounted) return null;

    const handleSubmit = async (e?: React.FormEvent, customInput?: string) => {
        if (e) e.preventDefault();
        const query = customInput || input;
        if (!query.trim()) return;

        const userMessage: Message = { role: "user", content: query };
        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        setIsLoading(true);

        try {
            const response = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: query }),
            });

            const data = await response.json();
            if (!response.ok) {
                setMessages((prev) => [...prev, { role: "assistant", content: "I encountered an error while processing that.", error: data.error, sql: data.sql }]);
            } else {
                const assistantMsg: Message = {
                    role: "assistant",
                    content: data.summary,
                    sql: data.sql,
                    data: data.data,
                    summary: data.summary,
                    suggestions: data.suggestions,
                    chartConfig: data.chartConfig
                };
                setMessages((prev) => [...prev, assistantMsg]);
                if (assistantMsg.data && assistantMsg.data.length > 0) setCanvasData(assistantMsg);
                fetchTables();
            }
        } catch (err: any) {
            setMessages((prev) => [...prev, { role: "assistant", content: "Network error. Check your connection.", error: err.message }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={`flex h-screen w-full bg-background text-foreground overflow-hidden ${isDark ? "dark" : ""}`}>
            {/* Sidebar - Ultra Clean */}
            <aside className="w-64 border-r border-border bg-card hidden md:flex flex-col">
                <div className="p-6 border-b border-border flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                        <Database className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-lg tracking-tight">KKSRAG</span>
                </div>

                <div className="flex-1 overflow-y-auto px-4 space-y-4 scrollbar-hide">
                    <div className="px-2 pb-2">
                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-40 mb-4">Data Inventory</h4>
                        <div className="space-y-1">
                            {tables.map(table => (
                                <div key={table.name} className="space-y-1">
                                    <button
                                        onClick={() => setExpandedTable(expandedTable === table.name ? null : table.name)}
                                        className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-muted/50 transition-colors text-left group"
                                    >
                                        <div className="flex items-center gap-3 truncate">
                                            <Table2 className="w-4 h-4 text-primary/60 group-hover:text-primary transition-colors" />
                                            <span className="text-sm font-semibold truncate text-foreground/80 group-hover:text-foreground">{table.name}</span>
                                        </div>
                                        <ChevronRight className={`w-3 h-3 text-muted-foreground transition-transform ${expandedTable === table.name ? "rotate-90" : ""}`} />
                                    </button>
                                    <AnimatePresence>
                                        {expandedTable === table.name && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: "auto", opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="overflow-hidden"
                                            >
                                                <div className="pl-10 pr-2 py-2 space-y-1.5 border-l-2 border-primary/10 ml-5 my-1">
                                                    {table.columns.map(col => (
                                                        <div key={col} className="text-[11px] text-muted-foreground hover:text-foreground transition-colors py-0.5 cursor-default">{col}</div>
                                                    ))}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="p-4 border-t border-border">
                    <button onClick={() => setIsDark(!isDark)} className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-muted/30 hover:bg-muted transition-all text-xs font-bold uppercase tracking-widest">
                        {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                        {isDark ? "Light Mode" : "Dark Mode"}
                    </button>
                </div>
            </aside>

            {/* Main Experience */}
            <main className="flex-1 flex overflow-hidden relative">
                <div className={`flex flex-col h-full bg-background transition-all duration-500 ease-in-out ${canvasData ? "w-[450px]" : "w-full"}`}>
                    <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 md:p-12 space-y-12 no-scrollbar">
                        {messages.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-full text-center space-y-8 py-20">
                                <div className="flex -space-x-4">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="w-16 h-16 bg-primary/10 rounded-[2rem] flex items-center justify-center text-primary border border-primary/20 shadow-xl blur-[0.5px]">
                                            <Sparkles className="w-8 h-8 opacity-50" />
                                        </div>
                                    ))}
                                </div>
                                <div>
                                    <h1 className="text-4xl font-black tracking-tighter mb-4 text-foreground">Welcome to KKSRAG.</h1>
                                    <p className="text-muted-foreground text-base max-w-sm mx-auto font-medium">Interactive intelligence for your campaign data. Start by asking a question.</p>
                                </div>
                            </div>
                        )}

                        <AnimatePresence>
                            {messages.map((msg, i) => (
                                <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start underline-none"}`}>
                                    <div className={`${msg.role === "user" ? "bg-primary text-primary-foreground shadow-xl shadow-primary/10" : "bg-card border border-border"} px-6 py-5 rounded-[1.8rem] max-w-[90%] text-[15px] leading-relaxed`}>
                                        <div className="whitespace-pre-wrap">{msg.content}</div>
                                        {msg.role === "assistant" && msg.data && (
                                            <button onClick={() => setCanvasData(msg)} className="mt-6 flex items-center gap-3 px-4 py-2.5 bg-primary/5 hover:bg-primary/10 text-primary rounded-full transition-all text-xs font-black uppercase tracking-widest">
                                                <Layout className="w-4 h-4" /> View Analysis
                                            </button>
                                        )}
                                    </div>
                                    {msg.suggestions && msg.role === "assistant" && (
                                        <div className="mt-6 flex flex-wrap gap-2 px-1">
                                            {msg.suggestions.map((s, idx) => (
                                                <button key={idx} onClick={() => handleSubmit(undefined, s)} className="px-5 py-2.5 bg-background border border-border/60 hover:border-primary hover:bg-primary/5 rounded-full text-xs font-bold transition-all text-muted-foreground hover:text-primary">
                                                    {s}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </motion.div>
                            ))}
                        </AnimatePresence>
                        {isLoading && (
                            <div className="flex items-center gap-4 text-muted-foreground p-6 bg-muted/10 rounded-3xl w-fit animate-pulse">
                                <Loader2 className="w-5 h-5 animate-spin text-primary" />
                                <span className="text-xs font-black uppercase tracking-[0.2em]">Analyzing Data</span>
                            </div>
                        )}
                    </div>

                    <footer className="p-4 md:p-6 bg-transparent pointer-events-none sticky bottom-0 z-50">
                        <form onSubmit={handleSubmit} className="relative max-w-3xl mx-auto pointer-events-auto">
                            <div className="relative group">
                                <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-purple-600/20 rounded-[2.5rem] blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200" />
                                <input
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Ask anything about your data..."
                                    className="relative w-full pl-8 pr-20 py-5 bg-card/90 backdrop-blur-xl border border-white/10 text-foreground rounded-[2rem] shadow-2xl focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 transition-all text-[15px] font-medium placeholder:text-muted-foreground/50"
                                    disabled={isLoading}
                                    autoFocus
                                />
                                <button
                                    disabled={isLoading || !input.trim()}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full shadow-lg hover:shadow-primary/25 hover:scale-105 active:scale-95 transition-all disabled:opacity-0 disabled:scale-75"
                                >
                                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                                </button>
                            </div>
                            <div className="text-center mt-3">
                                <p className="text-[10px] text-muted-foreground/40 font-medium uppercase tracking-widest">Powered by KKSRAG Engine</p>
                            </div>
                        </form>
                    </footer>
                </div>

                {/* Canvas Pane - Always Level-UP UI */}
                <AnimatePresence>
                    {canvasData && (
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
                                <button onClick={() => setCanvasData(null)} className="p-3 hover:bg-white/5 rounded-2xl transition-all group">
                                    <X className="w-6 h-6 text-white/40 group-hover:text-white" />
                                </button>
                            </header>

                            <div className="flex-1 overflow-y-auto p-10 space-y-16 scrollbar-hide">
                                {/* Visualizations - PREMIUM */}
                                {canvasData.data && canvasData.data.length > 0 && canvasData.chartConfig?.type !== "none" && (
                                    <section className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
                                        <div className="flex items-center gap-4">
                                            <div className="w-1.5 h-6 bg-primary rounded-full" />
                                            <h4 className="text-xs font-black uppercase tracking-widest text-white/40">Visual Insight</h4>
                                        </div>
                                        <div className="bg-gradient-to-b from-white/[0.03] to-transparent border border-white/5 p-10 rounded-[3rem] shadow-3xl h-[480px]">
                                            <ResponsiveContainer width="100%" height="100%">
                                                {(() => {
                                                    // CRITICAL FIX: Convert BigInt strings to Numbers for Recharts
                                                    const yKey = canvasData.chartConfig?.yAxis || "";
                                                    const xKey = canvasData.chartConfig?.xAxis || "";
                                                    const chartData = canvasData.data.map(item => ({
                                                        ...item,
                                                        [yKey]: Number(item[yKey]) || 0
                                                    }));

                                                    if (canvasData.chartConfig?.type === "line") {
                                                        return (
                                                            <LineChart data={chartData}>
                                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                                                                <XAxis dataKey={xKey} stroke="rgba(255,255,255,0.2)" fontSize={11} axisLine={false} tickLine={false} tickMargin={15} />
                                                                <YAxis stroke="rgba(255,255,255,0.2)" fontSize={11} axisLine={false} tickLine={false} tickMargin={15} />
                                                                <Tooltip contentStyle={{ backgroundColor: '#000', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', padding: '15px' }} />
                                                                <Line type="monotone" dataKey={yKey} stroke="#8B5CF6" strokeWidth={4} dot={{ r: 5, fill: '#8B5CF6', strokeWidth: 0 }} activeDot={{ r: 8, fill: '#fff' }} />
                                                            </LineChart>
                                                        );
                                                    } else if (canvasData.chartConfig?.type === "pie") {
                                                        return (
                                                            <PieChart>
                                                                <Pie data={chartData} dataKey={yKey} nameKey={xKey} cx="50%" cy="50%" outerRadius={160} innerRadius={110} paddingAngle={6} stroke="none">
                                                                    {chartData.map((_, index) => <Cell key={`cell-${index}`} fill={["#8B5CF6", "#6366F1", "#A855F7", "#4F46E5"][index % 4]} />)}
                                                                </Pie>
                                                                <Tooltip contentStyle={{ backgroundColor: '#000', border: 'none', borderRadius: '15px' }} />
                                                            </PieChart>
                                                        );
                                                    } else {
                                                        return (
                                                            <BarChart data={chartData} margin={{ bottom: 40 }}>
                                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                                                                <XAxis
                                                                    dataKey={xKey}
                                                                    stroke="rgba(255,255,255,0.2)"
                                                                    fontSize={10}
                                                                    axisLine={false}
                                                                    tickLine={false}
                                                                    tickMargin={15}
                                                                    height={60}
                                                                    interval={0}
                                                                    angle={-10}
                                                                    textAnchor="end"
                                                                />
                                                                <YAxis stroke="rgba(255,255,255,0.2)" fontSize={11} axisLine={false} tickLine={false} tickMargin={15} />
                                                                <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ backgroundColor: '#000', border: 'none', borderRadius: '15px' }} />
                                                                <Bar dataKey={yKey} fill="#8B5CF6" radius={[6, 6, 0, 0]} barSize={40} />
                                                            </BarChart>
                                                        );
                                                    }
                                                })()}
                                            </ResponsiveContainer>
                                        </div>
                                    </section>
                                )}

                                {/* Structured Records */}
                                {canvasData.data && (
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
                                                            {Object.keys(canvasData.data[0]).map(k => <th key={k} className="px-8 py-6 font-black uppercase tracking-tighter border-b border-white/5">{k}</th>)}
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-white/5">
                                                        {canvasData.data.map((row, ri) => (
                                                            <tr key={ri} className="hover:bg-white/5 transition-colors group">
                                                                {Object.values(row).map((v: any, vi) => <td key={vi} className="px-8 py-6 text-white/50 group-hover:text-white transition-colors">{typeof v === 'number' ? v.toLocaleString() : String(v)}</td>)}
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </section>
                                )}

                                {/* SQL Explorer */}
                                {canvasData.sql && (
                                    <section className="space-y-8 pb-20 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
                                        <div className="flex items-center gap-4">
                                            <div className="w-1.5 h-6 bg-amber-500 rounded-full" />
                                            <h4 className="text-xs font-black uppercase tracking-widest text-white/40">DuckDB Pipeline</h4>
                                        </div>
                                        <div className="bg-[#0c0c0e] p-10 rounded-[2.5rem] border border-white/5 font-mono text-[13px] leading-relaxed text-indigo-200/80 shadow-inner group relative">
                                            <div className="absolute top-6 right-8 text-[10px] font-black uppercase tracking-widest text-white/10 group-hover:text-white/30 transition-colors">SQL</div>
                                            {canvasData.sql}
                                        </div>
                                    </section>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>

            <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
        </div>
    );
}
