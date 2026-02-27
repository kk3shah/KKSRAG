"use client";

import { Zap, X } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

interface UpgradePromptProps {
    reason: string;
    currentUsage?: string;
    onDismiss?: () => void;
}

export function UpgradePrompt({ reason, currentUsage, onDismiss }: UpgradePromptProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-primary/5 border border-primary/20 rounded-2xl p-5 max-w-md"
        >
            <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                    <Zap className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-sm mb-1">Upgrade to continue</h4>
                    <p className="text-xs text-muted-foreground mb-3">
                        {reason}
                        {currentUsage && (
                            <span className="block mt-1 text-foreground/60">{currentUsage}</span>
                        )}
                    </p>
                    <div className="flex items-center gap-3">
                        <Link
                            href="/pricing"
                            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-bold hover:opacity-90 transition-opacity"
                        >
                            View Plans
                        </Link>
                        {onDismiss && (
                            <button
                                onClick={onDismiss}
                                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                            >
                                Maybe later
                            </button>
                        )}
                    </div>
                </div>
                {onDismiss && (
                    <button onClick={onDismiss} className="p-1 hover:bg-muted rounded-lg transition-colors">
                        <X className="w-4 h-4 text-muted-foreground" />
                    </button>
                )}
            </div>
        </motion.div>
    );
}
