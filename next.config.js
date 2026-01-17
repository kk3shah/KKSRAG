/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    // Ensure DuckDB (native module) is not bundled by Turbopack/Webpack
    serverExternalPackages: ['duckdb'],
    env: {
        GOOGLE_GEMINI_API_KEY: process.env.GOOGLE_GEMINI_API_KEY,
    },
};

export default nextConfig;
