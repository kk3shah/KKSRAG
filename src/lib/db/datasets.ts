import { getSupabase } from '@/lib/supabase';
import { log } from '@/lib/logger';

export interface DatasetRow {
    id: string;
    user_id: string;
    name: string;
    original_filename: string;
    storage_path: string;
    row_count: number | null;
    column_count: number | null;
    size_bytes: number | null;
    created_at: string;
    updated_at: string;
}

export async function createDataset(
    userId: string,
    name: string,
    originalFilename: string,
    storagePath: string,
    sizeBytes: number,
): Promise<DatasetRow | null> {
    const { data, error } = await getSupabase()
        .from('datasets')
        .insert({
            user_id: userId,
            name,
            original_filename: originalFilename,
            storage_path: storagePath,
            size_bytes: sizeBytes,
        })
        .select()
        .single();

    if (error) {
        log('error', 'Failed to create dataset', { error: error.message, userId });
        return null;
    }

    return data as DatasetRow;
}

export async function getUserDatasets(userId: string): Promise<DatasetRow[]> {
    const { data, error } = await getSupabase()
        .from('datasets')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) {
        log('error', 'Failed to fetch datasets', { error: error.message, userId });
        return [];
    }

    return (data ?? []) as DatasetRow[];
}

export async function renameDataset(userId: string, datasetId: string, newName: string): Promise<boolean> {
    const { error } = await getSupabase()
        .from('datasets')
        .update({ name: newName, updated_at: new Date().toISOString() })
        .eq('id', datasetId)
        .eq('user_id', userId);

    if (error) {
        log('error', 'Failed to rename dataset', { error: error.message, userId, datasetId });
        return false;
    }

    return true;
}

export async function deleteDataset(userId: string, datasetId: string): Promise<boolean> {
    const { error } = await getSupabase()
        .from('datasets')
        .delete()
        .eq('id', datasetId)
        .eq('user_id', userId);

    if (error) {
        log('error', 'Failed to delete dataset', { error: error.message, userId, datasetId });
        return false;
    }

    return true;
}
