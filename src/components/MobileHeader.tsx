"use client";

import { Menu, X, Database } from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import type { TableInfo } from "@/types";

interface MobileHeaderProps {
    tables: TableInfo[];
    onUploadClick?: () => void;
}

export function MobileHeader({ tables, onUploadClick }: MobileHeaderProps) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            {/* Header bar */}
            <header className="md:hidden flex items-center justify-between px-4 py-3 border-b border-border bg-card/90 backdrop-blur-xl sticky top-0 z-40">
                <button
                    onClick={() => setIsOpen(true)}
                    className="p-2 rounded-xl hover:bg-muted transition-colors"
                >
                    <Menu className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-2">
                    <Database className="w-5 h-5 text-primary" />
                    <span className="font-bold text-base tracking-tight">KKSRAG</span>
                </div>
                <UserButton
                    afterSignOutUrl="/sign-in"
                    appearance={{
                        elements: { avatarBox: "w-8 h-8" },
                    }}
                />
            </header>

            {/* Mobile drawer */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 md:hidden"
                            onClick={() => setIsOpen(false)}
                        />
                        <motion.aside
                            initial={{ x: "-100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "-100%" }}
                            transition={{ type: "spring", damping: 30, stiffness: 300 }}
                            className="fixed left-0 top-0 bottom-0 w-72 bg-card border-r border-border z-50 flex flex-col md:hidden"
                        >
                            <div className="p-4 border-b border-border flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Database className="w-5 h-5 text-primary" />
                                    <span className="font-bold text-lg tracking-tight">KKSRAG</span>
                                </div>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="p-2 rounded-xl hover:bg-muted transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-40 mb-3">
                                    Data Inventory
                                </h4>
                                {tables.map(table => (
                                    <div key={table.name} className="px-3 py-2.5 rounded-xl bg-muted/30">
                                        <p className="text-sm font-semibold truncate">{table.name}</p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {table.columns.length} column{table.columns.length !== 1 ? "s" : ""}
                                        </p>
                                    </div>
                                ))}
                                {tables.length === 0 && (
                                    <p className="text-xs text-muted-foreground/60 px-3">No datasets yet</p>
                                )}
                            </div>

                            {onUploadClick && (
                                <div className="p-4 border-t border-border">
                                    <button
                                        onClick={() => {
                                            setIsOpen(false);
                                            onUploadClick();
                                        }}
                                        className="w-full py-3 rounded-xl bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest hover:bg-primary/20 transition-colors"
                                    >
                                        Upload CSV
                                    </button>
                                </div>
                            )}
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
