import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "KKSRAG - AI Data Chatbot",
    description: "Natural language to SQL with DuckDB and Gemini",
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <ClerkProvider>
            <html lang="en" suppressHydrationWarning className="dark">
                <body suppressHydrationWarning className={`${inter.className} min-h-screen bg-background text-foreground antialiased`}>
                    {children}
                </body>
            </html>
        </ClerkProvider>
    );
}
