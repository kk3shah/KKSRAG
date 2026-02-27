"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Loader2 } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { Sidebar } from "@/components/Sidebar";
import { EmptyState } from "@/components/EmptyState";
import { ChatMessage, type Message } from "@/components/ChatMessage";
import { ChatInput } from "@/components/ChatInput";
import { Canvas } from "@/components/Canvas";
import { FileUpload } from "@/components/FileUpload";
import { useQueryHistory } from "@/hooks/useQueryHistory";
import type { TableInfo } from "@/types";

export default function ChatPage() {
    const [mounted, setMounted] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isDark, setIsDark] = useState(true);
    const [canvasData, setCanvasData] = useState<Message | null>(null);
    const [tables, setTables] = useState<TableInfo[]>([]);
    const [streamStatus, setStreamStatus] = useState<string | null>(null);
    const [showUpload, setShowUpload] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const { addEntry } = useQueryHistory();

    const fetchTables = useCallback(async () => {
        try {
            const res = await fetch("/api/tables");
            const data = await res.json();
            if (data.tables) setTables(data.tables);
        } catch {
            // Tables fetch is non-critical
        }
    }, []);

    useEffect(() => {
        setMounted(true);
        fetchTables();
    }, [fetchTables]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSubmit = useCallback(async (e?: React.FormEvent, customInput?: string) => {
        if (e) e.preventDefault();
        const query = customInput ?? input;
        if (!query.trim()) return;

        const userMessage: Message = { role: "user", content: query };
        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        setIsLoading(true);
        setStreamStatus("Generating SQL...");

        // Build conversation history for context
        const history = messages
            .slice(-10)
            .map(m => ({
                role: m.role,
                content: m.content,
                ...(m.sql ? { sql: m.sql } : {}),
            }));

        try {
            const response = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: query, history }),
            });

            setStreamStatus("Processing results...");
            const data = await response.json();

            if (!response.ok) {
                setMessages((prev) => [...prev, {
                    role: "assistant",
                    content: "I encountered an error while processing that.",
                    error: data.error,
                    sql: data.sql,
                }]);
            } else {
                const assistantMsg: Message = {
                    role: "assistant",
                    content: data.summary,
                    sql: data.sql,
                    data: data.data,
                    summary: data.summary,
                    suggestions: data.suggestions,
                    chartConfig: data.chartConfig,
                };
                setMessages((prev) => [...prev, assistantMsg]);
                if (assistantMsg.data && assistantMsg.data.length > 0) {
                    setCanvasData(assistantMsg);
                }
                if (data.sql) {
                    addEntry(query, data.sql);
                }
                fetchTables();
            }
        } catch (err: unknown) {
            const errMsg = err instanceof Error ? err.message : "Unknown error";
            setMessages((prev) => [...prev, {
                role: "assistant",
                content: "Network error. Check your connection.",
                error: errMsg,
            }]);
        } finally {
            setIsLoading(false);
            setStreamStatus(null);
        }
    }, [input, messages, addEntry, fetchTables]);

    if (!mounted) return null;

    return (
        <div className={`flex h-screen w-full bg-background text-foreground overflow-hidden ${isDark ? "dark" : ""}`}>
            <Sidebar
                tables={tables}
                isDark={isDark}
                onToggleTheme={() => setIsDark(!isDark)}
                onUploadClick={() => setShowUpload(true)}
            />

            <main className="flex-1 flex overflow-hidden relative">
                <div className={`flex flex-col h-full bg-background transition-all duration-500 ease-in-out ${canvasData ? "w-[450px]" : "w-full"}`}>
                    <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 md:p-12 space-y-12 no-scrollbar">
                        {messages.length === 0 && <EmptyState />}

                        <AnimatePresence>
                            {messages.map((msg, i) => (
                                <ChatMessage
                                    key={i}
                                    message={msg}
                                    onViewAnalysis={setCanvasData}
                                    onSuggestionClick={(s) => handleSubmit(undefined, s)}
                                />
                            ))}
                        </AnimatePresence>

                        {isLoading && (
                            <div className="flex items-center gap-4 text-muted-foreground p-6 bg-muted/10 rounded-3xl w-fit animate-pulse">
                                <Loader2 className="w-5 h-5 animate-spin text-primary" />
                                <span className="text-xs font-black uppercase tracking-[0.2em]">
                                    {streamStatus ?? "Analyzing Data"}
                                </span>
                            </div>
                        )}
                    </div>

                    <ChatInput
                        input={input}
                        isLoading={isLoading}
                        onInputChange={setInput}
                        onSubmit={handleSubmit}
                    />
                </div>

                <AnimatePresence>
                    {canvasData && (
                        <Canvas
                            data={canvasData}
                            onClose={() => setCanvasData(null)}
                        />
                    )}
                </AnimatePresence>
            </main>

            {/* File Upload Modal */}
            <AnimatePresence>
                {showUpload && (
                    <FileUpload
                        onClose={() => setShowUpload(false)}
                        onUploadComplete={() => {
                            fetchTables();
                        }}
                    />
                )}
            </AnimatePresence>

            <style jsx global>{`
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
                .scrollbar-hide::-webkit-scrollbar { display: none; }
                .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </div>
    );
}
