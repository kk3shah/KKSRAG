"use client";

import { Layout } from "lucide-react";
import { motion } from "framer-motion";

export interface Message {
    role: "user" | "assistant";
    content: string;
    sql?: string;
    data?: Record<string, unknown>[];
    summary?: string;
    suggestions?: string[];
    error?: string;
    chartConfig?: {
        type: string;
        xAxis?: string;
        yAxis?: string;
    };
}

interface ChatMessageProps {
    message: Message;
    onViewAnalysis: (msg: Message) => void;
    onSuggestionClick: (suggestion: string) => void;
}

export function ChatMessage({ message, onViewAnalysis, onSuggestionClick }: ChatMessageProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex flex-col ${message.role === "user" ? "items-end" : "items-start"}`}
        >
            <div className={`${message.role === "user" ? "bg-primary text-primary-foreground shadow-xl shadow-primary/10" : "bg-card border border-border"} px-6 py-5 rounded-[1.8rem] max-w-[90%] text-[15px] leading-relaxed`}>
                <div className="whitespace-pre-wrap">{message.content}</div>
                {message.role === "assistant" && message.data && (
                    <button
                        onClick={() => onViewAnalysis(message)}
                        className="mt-6 flex items-center gap-3 px-4 py-2.5 bg-primary/5 hover:bg-primary/10 text-primary rounded-full transition-all text-xs font-black uppercase tracking-widest"
                    >
                        <Layout className="w-4 h-4" /> View Analysis
                    </button>
                )}
            </div>
            {message.suggestions && message.role === "assistant" && (
                <div className="mt-6 flex flex-wrap gap-2 px-1">
                    {message.suggestions.map((s, idx) => (
                        <button
                            key={idx}
                            onClick={() => onSuggestionClick(s)}
                            className="px-5 py-2.5 bg-background border border-border/60 hover:border-primary hover:bg-primary/5 rounded-full text-xs font-bold transition-all text-muted-foreground hover:text-primary"
                        >
                            {s}
                        </button>
                    ))}
                </div>
            )}
        </motion.div>
    );
}
