"use client";

import { Send, Loader2 } from "lucide-react";

interface ChatInputProps {
    input: string;
    isLoading: boolean;
    onInputChange: (value: string) => void;
    onSubmit: (e: React.FormEvent) => void;
}

export function ChatInput({ input, isLoading, onInputChange, onSubmit }: ChatInputProps) {
    return (
        <footer className="p-4 md:p-6 bg-transparent pointer-events-none sticky bottom-0 z-50">
            <form onSubmit={onSubmit} className="relative max-w-3xl mx-auto pointer-events-auto">
                <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-purple-600/20 rounded-[2.5rem] blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200" />
                    <input
                        value={input}
                        onChange={(e) => onInputChange(e.target.value)}
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
    );
}
