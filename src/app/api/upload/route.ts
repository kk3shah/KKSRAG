import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { createDataset } from '@/lib/db/datasets';
import { loadCsvIntoUserDb, initUserDb } from '@/lib/duckdb';
import { getSupabase } from '@/lib/supabase';
import { log } from '@/lib/logger';
import path from 'path';
import fs from 'fs';
import os from 'os';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['text/csv', 'application/vnd.ms-excel'];
const ALLOWED_EXTENSIONS = ['.csv'];

export async function POST(req: NextRequest) {
    // Auth check
    const authResult = await requireAuth();
    if (authResult.error) return authResult.error;
    const { userId } = authResult;

    try {
        const formData = await req.formData();
        const file = formData.get('file');
        const name = formData.get('name');

        if (!file || !(file instanceof File)) {
            return NextResponse.json({ error: 'No file provided.' }, { status: 400 });
        }

        // Validate file type
        const ext = path.extname(file.name).toLowerCase();
        if (!ALLOWED_EXTENSIONS.includes(ext)) {
            return NextResponse.json({ error: 'Only CSV files are allowed.' }, { status: 400 });
        }

        // Check MIME type (some browsers send different types for CSV)
        if (file.type && !ALLOWED_TYPES.includes(file.type) && file.type !== 'application/octet-stream') {
            log('warn', 'Unexpected MIME type for CSV upload', { type: file.type, name: file.name });
        }

        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json(
                { error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB.` },
                { status: 400 },
            );
        }

        // Read file into buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Upload to Supabase Storage
        const storagePath = `${userId}/${Date.now()}-${file.name}`;
        const { error: uploadError } = await getSupabase()
            .storage
            .from('datasets')
            .upload(storagePath, buffer, {
                contentType: 'text/csv',
                upsert: false,
            });

        if (uploadError) {
            log('error', 'Supabase storage upload failed', { error: uploadError.message, userId });
            return NextResponse.json({ error: 'Failed to upload file.' }, { status: 500 });
        }

        // Register in datasets table
        const datasetName = (typeof name === 'string' && name.trim())
            ? name.trim()
            : path.basename(file.name, ext);

        const dataset = await createDataset(userId, datasetName, file.name, storagePath, file.size);
        if (!dataset) {
            return NextResponse.json({ error: 'Failed to register dataset.' }, { status: 500 });
        }

        // Write file temporarily for DuckDB to read
        const tmpDir = path.join(os.tmpdir(), 'kksrag-uploads');
        if (!fs.existsSync(tmpDir)) {
            fs.mkdirSync(tmpDir, { recursive: true });
        }
        const tmpPath = path.join(tmpDir, `${dataset.id}.csv`);
        fs.writeFileSync(tmpPath, buffer);

        // Load into user's DuckDB instance
        try {
            await initUserDb(userId);
            await loadCsvIntoUserDb(userId, datasetName, tmpPath);
        } catch (dbErr: unknown) {
            const dbMsg = dbErr instanceof Error ? dbErr.message : 'Unknown error';
            log('error', 'Failed to load CSV into DuckDB', { error: dbMsg, userId, dataset: datasetName });
            // Non-fatal — file is still uploaded, just can't query it yet
        } finally {
            // Clean up temp file
            try {
                fs.unlinkSync(tmpPath);
            } catch {
                // Ignore cleanup errors
            }
        }

        log('info', 'File uploaded successfully', {
            userId,
            dataset: datasetName,
            sizeBytes: file.size,
            datasetId: dataset.id,
        });

        return NextResponse.json({
            dataset: {
                id: dataset.id,
                name: dataset.name,
                original_filename: dataset.original_filename,
                size_bytes: dataset.size_bytes,
            },
        });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Upload failed';
        log('error', 'Unhandled upload error', { error: message, userId });
        return NextResponse.json(
            { error: 'An unexpected error occurred during upload.' },
            { status: 500 },
        );
    }
}
