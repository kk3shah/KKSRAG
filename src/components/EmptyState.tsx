"use client";

import { Sparkles } from "lucide-react";

export function EmptyState() {
    return (
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
    );
}
