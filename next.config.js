import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    // Ensure DuckDB (native module) is not bundled by Turbopack/Webpack
    serverExternalPackages: ['duckdb'],
    turbopack: {
        root: __dirname,
    },
};

export default nextConfig;
