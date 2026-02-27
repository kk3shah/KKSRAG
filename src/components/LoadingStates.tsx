"use client";

import { motion } from "framer-motion";

/**
 * Skeleton loader for chat messages
 */
export function MessageSkeleton() {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-start gap-3"
        >
            <div className="bg-card border border-border px-6 py-5 rounded-[1.8rem] max-w-[80%] space-y-3">
                <div className="h-4 bg-muted/40 rounded-full w-64 animate-pulse" />
                <div className="h-4 bg-muted/30 rounded-full w-48 animate-pulse" />
                <div className="h-4 bg-muted/20 rounded-full w-32 animate-pulse" />
            </div>
            <div className="flex gap-2 px-1">
                <div className="h-9 bg-muted/20 rounded-full w-32 animate-pulse" />
                <div className="h-9 bg-muted/20 rounded-full w-28 animate-pulse" />
            </div>
        </motion.div>
    );
}

/**
 * Skeleton loader for the canvas panel
 */
export function CanvasSkeleton() {
    return (
        <div className="p-10 space-y-8">
            {/* Chart skeleton */}
            <div className="space-y-4">
                <div className="flex items-center gap-4">
                    <div className="w-1.5 h-6 bg-primary/20 rounded-full" />
                    <div className="h-3 bg-white/10 rounded-full w-24 animate-pulse" />
                </div>
                <div className="h-64 bg-white/[0.02] rounded-[2.5rem] border border-white/5 animate-pulse" />
            </div>
            {/* Table skeleton */}
            <div className="space-y-4">
                <div className="flex items-center gap-4">
                    <div className="w-1.5 h-6 bg-emerald-500/20 rounded-full" />
                    <div className="h-3 bg-white/10 rounded-full w-20 animate-pulse" />
                </div>
                <div className="h-48 bg-white/[0.02] rounded-[2.5rem] border border-white/5 animate-pulse" />
            </div>
        </div>
    );
}

/**
 * Inline stream status display
 */
export function StreamStatus({ status }: { status: string }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-4 text-muted-foreground p-5 bg-muted/10 rounded-2xl w-fit"
        >
            <div className="flex gap-1">
                {[0, 1, 2].map(i => (
                    <motion.div
                        key={i}
                        className="w-2 h-2 bg-primary rounded-full"
                        animate={{ scale: [1, 1.5, 1], opacity: [0.4, 1, 0.4] }}
                        transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                    />
                ))}
            </div>
            <span className="text-xs font-bold uppercase tracking-[0.15em]">{status}</span>
        </motion.div>
    );
}

/**
 * Error message with retry button
 */
export function ErrorMessage({
    message,
    onRetry,
    suggestions,
}: {
    message: string;
    onRetry?: () => void;
    suggestions?: string[];
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-500/5 border border-red-500/20 rounded-2xl p-5 max-w-[90%] space-y-3"
        >
            <p className="text-sm text-red-300">{message}</p>
            <div className="flex flex-wrap gap-2">
                {onRetry && (
                    <button
                        onClick={onRetry}
                        className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-300 rounded-full text-xs font-bold uppercase tracking-wide transition-colors"
                    >
                        Try Again
                    </button>
                )}
                {suggestions?.map((s, i) => (
                    <span key={i} className="px-3 py-2 text-xs text-red-300/60 italic">
                        Try: &ldquo;{s}&rdquo;
                    </span>
                ))}
            </div>
        </motion.div>
    );
}
