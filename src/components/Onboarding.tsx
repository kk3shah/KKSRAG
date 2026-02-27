"use client";

import { useState } from "react";
import { Upload, MessageSquare, BarChart3, ArrowRight, Sparkles, Database } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface OnboardingProps {
    onComplete: () => void;
    onUploadClick: () => void;
    onSampleQuery: (query: string) => void;
}

const SAMPLE_QUERIES = [
    "Show me the top 10 rows",
    "What are the column names and types?",
    "Summarize the data by category",
];

const steps = [
    {
        id: "welcome",
        icon: Sparkles,
        title: "Welcome to KKSRAG",
        description: "Your AI-powered data analysis assistant. Ask questions in plain English and get instant SQL queries, charts, and insights.",
    },
    {
        id: "upload",
        icon: Upload,
        title: "Upload Your Data",
        description: "Start by uploading a CSV file. Your data stays private and isolated — no one else can see it.",
    },
    {
        id: "query",
        icon: MessageSquare,
        title: "Ask Questions",
        description: "Try asking a question about your data. KKSRAG will generate SQL, execute it, and explain the results.",
    },
];

export function Onboarding({ onComplete, onUploadClick, onSampleQuery }: OnboardingProps) {
    const [currentStep, setCurrentStep] = useState(0);

    const step = steps[currentStep];
    const Icon = step.icon;
    const isLast = currentStep === steps.length - 1;

    const handleNext = () => {
        if (currentStep === 1) {
            // Upload step — trigger upload modal
            onUploadClick();
            setCurrentStep(prev => prev + 1);
        } else if (isLast) {
            onComplete();
        } else {
            setCurrentStep(prev => prev + 1);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center h-full text-center px-4 py-16">
            <AnimatePresence mode="wait">
                <motion.div
                    key={step.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="max-w-md mx-auto"
                >
                    {/* Progress dots */}
                    <div className="flex items-center justify-center gap-2 mb-10">
                        {steps.map((_, i) => (
                            <div
                                key={i}
                                className={`w-2 h-2 rounded-full transition-all ${
                                    i === currentStep
                                        ? "bg-primary w-6"
                                        : i < currentStep
                                        ? "bg-primary/40"
                                        : "bg-muted"
                                }`}
                            />
                        ))}
                    </div>

                    {/* Icon */}
                    <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-primary/20">
                        <Icon className="w-10 h-10 text-primary" />
                    </div>

                    {/* Content */}
                    <h2 className="text-3xl font-black tracking-tighter mb-4">{step.title}</h2>
                    <p className="text-muted-foreground text-base mb-8 max-w-sm mx-auto">{step.description}</p>

                    {/* Step-specific content */}
                    {step.id === "upload" && (
                        <div className="mb-8 p-4 bg-muted/20 rounded-2xl border border-border/50">
                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                <Database className="w-5 h-5 text-primary" />
                                <span>Or skip this step and use any existing data</span>
                            </div>
                        </div>
                    )}

                    {step.id === "query" && (
                        <div className="mb-8 space-y-2">
                            <p className="text-xs text-muted-foreground mb-3 uppercase tracking-wider font-bold">Try one of these:</p>
                            {SAMPLE_QUERIES.map((q, i) => (
                                <button
                                    key={i}
                                    onClick={() => {
                                        onSampleQuery(q);
                                        onComplete();
                                    }}
                                    className="block w-full px-4 py-3 bg-muted/30 hover:bg-primary/10 border border-border/50 hover:border-primary/30 rounded-xl text-sm text-left transition-all group"
                                >
                                    <span className="flex items-center gap-3">
                                        <BarChart3 className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                        {q}
                                    </span>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Navigation */}
                    <div className="flex items-center justify-center gap-4">
                        <button
                            onClick={handleNext}
                            className="px-8 py-3.5 bg-primary text-primary-foreground rounded-xl font-bold text-sm hover:opacity-90 transition-opacity flex items-center gap-2"
                        >
                            {step.id === "upload" ? "Upload CSV" : isLast ? "Start Querying" : "Next"}
                            <ArrowRight className="w-4 h-4" />
                        </button>
                        {currentStep > 0 && !isLast && (
                            <button
                                onClick={() => setCurrentStep(prev => prev + 1)}
                                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                            >
                                Skip
                            </button>
                        )}
                        {currentStep === 0 && (
                            <button
                                onClick={onComplete}
                                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                            >
                                Skip intro
                            </button>
                        )}
                    </div>
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
