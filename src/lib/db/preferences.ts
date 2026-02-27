import { getSupabase } from '@/lib/supabase';
import { log } from '@/lib/logger';

export interface UserPreferencesRow {
    user_id: string;
    theme: string;
    default_chart_type: string;
    created_at: string;
    updated_at: string;
}

export async function getUserPreferences(userId: string): Promise<UserPreferencesRow | null> {
    const { data, error } = await getSupabase()
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

    if (error) {
        // PGRST116 = no rows found, which is fine for a new user
        if (error.code !== 'PGRST116') {
            log('error', 'Failed to fetch user preferences', { error: error.message, userId });
        }
        return null;
    }

    return data as UserPreferencesRow;
}

export async function upsertUserPreferences(
    userId: string,
    prefs: { theme?: string; default_chart_type?: string },
): Promise<boolean> {
    const { error } = await getSupabase()
        .from('user_preferences')
        .upsert(
            {
                user_id: userId,
                ...prefs,
                updated_at: new Date().toISOString(),
            },
            { onConflict: 'user_id' },
        );

    if (error) {
        log('error', 'Failed to upsert user preferences', { error: error.message, userId });
        return false;
    }

    return true;
}
