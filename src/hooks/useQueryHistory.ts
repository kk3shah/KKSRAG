"use client";

import { useState, useEffect, useCallback } from "react";

export interface QueryHistoryEntry {
    id: string;
    question: string;
    sql: string;
    timestamp: number;
}

const STORAGE_KEY = "kksrag-query-history";
const MAX_ENTRIES = 50;

function loadHistory(): QueryHistoryEntry[] {
    if (typeof window === "undefined") return [];
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? (JSON.parse(raw) as QueryHistoryEntry[]) : [];
    } catch {
        return [];
    }
}

function saveHistory(entries: QueryHistoryEntry[]): void {
    if (typeof window === "undefined") return;
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    } catch {
        // localStorage might be full or unavailable
    }
}

export function useQueryHistory() {
    const [history, setHistory] = useState<QueryHistoryEntry[]>([]);

    useEffect(() => {
        setHistory(loadHistory());
    }, []);

    const addEntry = useCallback((question: string, sql: string) => {
        setHistory(prev => {
            const entry: QueryHistoryEntry = {
                id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                question,
                sql,
                timestamp: Date.now(),
            };
            const updated = [entry, ...prev].slice(0, MAX_ENTRIES);
            saveHistory(updated);
            return updated;
        });
    }, []);

    const clearHistory = useCallback(() => {
        setHistory([]);
        saveHistory([]);
    }, []);

    return { history, addEntry, clearHistory };
}
