"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, X, FileText, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface FileUploadProps {
    onUploadComplete?: (dataset: { id: string; name: string; original_filename: string }) => void;
    onClose?: () => void;
}

type UploadState = "idle" | "uploading" | "success" | "error";

export function FileUpload({ onUploadComplete, onClose }: FileUploadProps) {
    const [dragActive, setDragActive] = useState(false);
    const [uploadState, setUploadState] = useState<UploadState>("idle");
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [fileName, setFileName] = useState<string | null>(null);
    const [customName, setCustomName] = useState("");
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    }, []);

    const processFile = useCallback((file: File) => {
        if (!file.name.toLowerCase().endsWith(".csv")) {
            setErrorMessage("Only CSV files are accepted.");
            setUploadState("error");
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            setErrorMessage("File is too large. Maximum size is 10MB.");
            setUploadState("error");
            return;
        }

        setSelectedFile(file);
        setFileName(file.name);
        setCustomName(file.name.replace(/\.csv$/i, ""));
        setErrorMessage(null);
        setUploadState("idle");
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            processFile(e.dataTransfer.files[0]);
        }
    }, [processFile]);

    const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            processFile(e.target.files[0]);
        }
    }, [processFile]);

    const handleUpload = useCallback(async () => {
        if (!selectedFile) return;

        setUploadState("uploading");
        setErrorMessage(null);

        try {
            const formData = new FormData();
            formData.append("file", selectedFile);
            if (customName.trim()) {
                formData.append("name", customName.trim());
            }

            const res = await fetch("/api/upload", {
                method: "POST",
                body: formData,
            });

            const data = await res.json();

            if (!res.ok) {
                setErrorMessage(data.error || "Upload failed.");
                setUploadState("error");
                return;
            }

            setUploadState("success");
            onUploadComplete?.(data.dataset);

            // Auto-close after success
            setTimeout(() => {
                onClose?.();
            }, 1500);
        } catch {
            setErrorMessage("Network error. Please check your connection.");
            setUploadState("error");
        }
    }, [selectedFile, customName, onUploadComplete, onClose]);

    const resetState = useCallback(() => {
        setSelectedFile(null);
        setFileName(null);
        setCustomName("");
        setErrorMessage(null);
        setUploadState("idle");
        if (inputRef.current) inputRef.current.value = "";
    }, []);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose?.();
            }}
        >
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6"
            >
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-bold">Upload Dataset</h2>
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Drop zone */}
                <div
                    className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${
                        dragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                    }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => inputRef.current?.click()}
                >
                    <input
                        ref={inputRef}
                        type="file"
                        accept=".csv"
                        className="hidden"
                        onChange={handleFileSelect}
                    />

                    <AnimatePresence mode="wait">
                        {!selectedFile ? (
                            <motion.div
                                key="empty"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                            >
                                <Upload className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
                                <p className="text-sm font-medium">
                                    Drop a CSV file here or <span className="text-primary">browse</span>
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">Max 10MB</p>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="file"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex items-center gap-3"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <FileText className="w-8 h-8 text-primary shrink-0" />
                                <div className="text-left flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{fileName}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {selectedFile.size < 1024
                                            ? `${selectedFile.size} B`
                                            : selectedFile.size < 1024 * 1024
                                            ? `${(selectedFile.size / 1024).toFixed(1)} KB`
                                            : `${(selectedFile.size / (1024 * 1024)).toFixed(1)} MB`}
                                    </p>
                                </div>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        resetState();
                                    }}
                                    className="p-1 rounded-md hover:bg-muted"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Dataset name */}
                {selectedFile && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        className="mt-4"
                    >
                        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                            Dataset Name
                        </label>
                        <input
                            type="text"
                            value={customName}
                            onChange={(e) => setCustomName(e.target.value)}
                            placeholder="e.g. sales_2024"
                            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                    </motion.div>
                )}

                {/* Error message */}
                <AnimatePresence>
                    {errorMessage && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="mt-4 flex items-center gap-2 text-red-400 text-sm"
                        >
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <span>{errorMessage}</span>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Upload button */}
                {selectedFile && uploadState !== "success" && (
                    <button
                        onClick={handleUpload}
                        disabled={uploadState === "uploading"}
                        className="mt-4 w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {uploadState === "uploading" ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Uploading...
                            </>
                        ) : (
                            <>
                                <Upload className="w-4 h-4" />
                                Upload
                            </>
                        )}
                    </button>
                )}

                {/* Success state */}
                {uploadState === "success" && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="mt-4 flex items-center justify-center gap-2 text-green-400 py-3"
                    >
                        <CheckCircle2 className="w-5 h-5" />
                        <span className="font-medium text-sm">Dataset uploaded successfully!</span>
                    </motion.div>
                )}
            </motion.div>
        </motion.div>
    );
}
