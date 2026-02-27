import { getSupabase } from '@/lib/supabase';
import { log } from '@/lib/logger';

export interface DashboardRow {
    id: string;
    user_id: string;
    name: string;
    queries: DashboardQuery[];
    is_public: boolean;
    created_at: string;
    updated_at: string;
}

export interface DashboardQuery {
    question: string;
    sql: string;
    chartConfig?: {
        type: string;
        xAxis?: string;
        yAxis?: string;
    };
}

export async function createDashboard(
    userId: string,
    name: string,
    queries: DashboardQuery[],
    isPublic: boolean = false,
): Promise<DashboardRow | null> {
    const { data, error } = await getSupabase()
        .from('dashboards')
        .insert({
            user_id: userId,
            name,
            queries,
            is_public: isPublic,
        })
        .select()
        .single();

    if (error) {
        log('error', 'Failed to create dashboard', { error: error.message, userId });
        return null;
    }

    return data as DashboardRow;
}

export async function getUserDashboards(userId: string): Promise<DashboardRow[]> {
    const { data, error } = await getSupabase()
        .from('dashboards')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

    if (error) {
        log('error', 'Failed to fetch dashboards', { error: error.message, userId });
        return [];
    }

    return (data ?? []) as DashboardRow[];
}

export async function getDashboard(dashboardId: string): Promise<DashboardRow | null> {
    const { data, error } = await getSupabase()
        .from('dashboards')
        .select('*')
        .eq('id', dashboardId)
        .single();

    if (error) {
        if (error.code !== 'PGRST116') {
            log('error', 'Failed to fetch dashboard', { error: error.message, dashboardId });
        }
        return null;
    }

    return data as DashboardRow;
}

export async function updateDashboard(
    userId: string,
    dashboardId: string,
    updates: { name?: string; queries?: DashboardQuery[]; is_public?: boolean },
): Promise<boolean> {
    const { error } = await getSupabase()
        .from('dashboards')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', dashboardId)
        .eq('user_id', userId);

    if (error) {
        log('error', 'Failed to update dashboard', { error: error.message, userId, dashboardId });
        return false;
    }

    return true;
}

export async function deleteDashboard(userId: string, dashboardId: string): Promise<boolean> {
    const { error } = await getSupabase()
        .from('dashboards')
        .delete()
        .eq('id', dashboardId)
        .eq('user_id', userId);

    if (error) {
        log('error', 'Failed to delete dashboard', { error: error.message, userId, dashboardId });
        return false;
    }

    return true;
}
