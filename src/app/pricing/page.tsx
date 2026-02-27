"use client";

import { Check, Sparkles, Zap, Crown } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { PLAN_LIMITS, type PlanTier } from "@/lib/billing/limits";

const tiers: { name: string; tier: PlanTier; icon: typeof Sparkles; description: string; highlighted?: boolean }[] = [
    {
        name: "Free",
        tier: "free",
        icon: Sparkles,
        description: "Perfect for exploring your data",
    },
    {
        name: "Pro",
        tier: "pro",
        icon: Zap,
        description: "For power users and analysts",
        highlighted: true,
    },
    {
        name: "Team",
        tier: "team",
        icon: Crown,
        description: "For teams and organizations",
    },
];

function formatLimit(value: number, suffix?: string): string {
    if (value === -1) return "Unlimited";
    return `${value}${suffix ?? ""}`;
}

export default function PricingPage() {
    return (
        <div className="min-h-screen bg-background text-foreground">
            <div className="max-w-5xl mx-auto px-4 py-20">
                {/* Header */}
                <div className="text-center mb-16">
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-4xl md:text-5xl font-black tracking-tighter mb-4"
                    >
                        Simple, transparent pricing
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-lg text-muted-foreground max-w-md mx-auto"
                    >
                        Start free, upgrade when you need more power.
                    </motion.p>
                </div>

                {/* Pricing Cards */}
                <div className="grid md:grid-cols-3 gap-6">
                    {tiers.map((tier, i) => {
                        const limits = PLAN_LIMITS[tier.tier];
                        const Icon = tier.icon;

                        return (
                            <motion.div
                                key={tier.tier}
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 * (i + 1) }}
                                className={`relative rounded-3xl border p-8 flex flex-col ${
                                    tier.highlighted
                                        ? "border-primary bg-primary/5 shadow-xl shadow-primary/10"
                                        : "border-border bg-card"
                                }`}
                            >
                                {tier.highlighted && (
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wider rounded-full">
                                        Most Popular
                                    </div>
                                )}

                                <div className="mb-6">
                                    <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
                                        <Icon className="w-6 h-6 text-primary" />
                                    </div>
                                    <h3 className="text-2xl font-black tracking-tight">{tier.name}</h3>
                                    <p className="text-sm text-muted-foreground mt-1">{tier.description}</p>
                                </div>

                                <div className="mb-8">
                                    <span className="text-4xl font-black">
                                        ${limits.priceMonthly}
                                    </span>
                                    <span className="text-muted-foreground text-sm">/month</span>
                                </div>

                                <ul className="space-y-3 mb-8 flex-1">
                                    <Feature text={`${formatLimit(limits.maxDatasets)} datasets`} />
                                    <Feature text={`${formatLimit(limits.maxQueriesPerDay)} queries/day`} />
                                    <Feature text={`${formatLimit(limits.maxFileSizeMB, "MB")} file size`} />
                                    <Feature text="Conversation memory" enabled={limits.conversationMemory} />
                                    <Feature text="CSV & SQL export" enabled={limits.exportEnabled} />
                                    <Feature text="Shared dashboards" enabled={limits.sharedDashboards} />
                                </ul>

                                <Link
                                    href={tier.tier === "free" ? "/" : "/sign-up"}
                                    className={`w-full py-3.5 rounded-xl text-center font-bold text-sm transition-all ${
                                        tier.highlighted
                                            ? "bg-primary text-primary-foreground hover:opacity-90"
                                            : "bg-muted hover:bg-muted/80 text-foreground"
                                    }`}
                                >
                                    {tier.tier === "free" ? "Get Started" : "Start Free Trial"}
                                </Link>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Back link */}
                <div className="text-center mt-12">
                    <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                        ← Back to app
                    </Link>
                </div>
            </div>
        </div>
    );
}

function Feature({ text, enabled = true }: { text: string; enabled?: boolean }) {
    return (
        <li className={`flex items-center gap-3 text-sm ${enabled ? "text-foreground" : "text-muted-foreground/40 line-through"}`}>
            <Check className={`w-4 h-4 shrink-0 ${enabled ? "text-primary" : "text-muted-foreground/20"}`} />
            {text}
        </li>
    );
}
