"use client";

import { Database, Table2, ChevronRight, Sun, Moon, Upload, User } from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import type { TableInfo } from "@/types";

const isDevBypass = process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS === "true";

function ClerkUserButton() {
    return (
        <UserButton
            afterSignOutUrl="/sign-in"
            appearance={{ elements: { avatarBox: "w-8 h-8" } }}
        />
    );
}

interface SidebarProps {
    tables: TableInfo[];
    isDark: boolean;
    onToggleTheme: () => void;
    onUploadClick?: () => void;
}

export function Sidebar({ tables, isDark, onToggleTheme, onUploadClick }: SidebarProps) {
    const [expandedTable, setExpandedTable] = useState<string | null>(null);

    return (
        <aside className="w-64 border-r border-border bg-card hidden md:flex flex-col">
            <div className="p-6 border-b border-border flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                    <Database className="w-5 h-5" />
                </div>
                <span className="font-bold text-lg tracking-tight flex-1">KKSRAG</span>
                {isDevBypass ? (
                    <div className="w-8 h-8 bg-amber-500/20 rounded-full flex items-center justify-center" title="Dev Mode">
                        <User className="w-4 h-4 text-amber-500" />
                    </div>
                ) : (
                    <ClerkUserButton />
                )}
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
                        {tables.length === 0 && (
                            <p className="text-xs text-muted-foreground/60 px-3 py-2">No datasets uploaded yet</p>
                        )}
                    </div>
                </div>
            </div>

            <div className="p-4 border-t border-border space-y-2">
                {onUploadClick && (
                    <button
                        onClick={onUploadClick}
                        className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-primary/10 hover:bg-primary/20 transition-all text-xs font-bold uppercase tracking-widest text-primary"
                    >
                        <Upload className="w-4 h-4" />
                        Upload CSV
                    </button>
                )}
                <button onClick={onToggleTheme} className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-muted/30 hover:bg-muted transition-all text-xs font-bold uppercase tracking-widest">
                    {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                    {isDark ? "Light Mode" : "Dark Mode"}
                </button>
            </div>
        </aside>
    );
}
