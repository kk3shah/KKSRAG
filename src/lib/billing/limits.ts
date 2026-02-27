import { getSupabase } from '@/lib/supabase';
import { log } from '@/lib/logger';

export type PlanTier = 'free' | 'pro' | 'team';

export interface PlanLimits {
    maxDatasets: number;
    maxQueriesPerDay: number;
    maxFileSizeMB: number;
    conversationMemory: boolean;
    exportEnabled: boolean;
    sharedDashboards: boolean;
    priceMonthly: number;
}

export const PLAN_LIMITS: Record<PlanTier, PlanLimits> = {
    free: {
        maxDatasets: 3,
        maxQueriesPerDay: 50,
        maxFileSizeMB: 5,
        conversationMemory: false,
        exportEnabled: false,
        sharedDashboards: false,
        priceMonthly: 0,
    },
    pro: {
        maxDatasets: 20,
        maxQueriesPerDay: 500,
        maxFileSizeMB: 50,
        conversationMemory: true,
        exportEnabled: true,
        sharedDashboards: false,
        priceMonthly: 29,
    },
    team: {
        maxDatasets: -1, // unlimited
        maxQueriesPerDay: -1, // unlimited
        maxFileSizeMB: 200,
        conversationMemory: true,
        exportEnabled: true,
        sharedDashboards: true,
        priceMonthly: 79,
    },
};

/**
 * Get a user's current plan tier.
 * Checks the subscriptions table; defaults to 'free' if no active subscription.
 */
export async function getUserPlan(userId: string): Promise<PlanTier> {
    try {
        const { data, error } = await getSupabase()
            .from('subscriptions')
            .select('plan, status')
            .eq('user_id', userId)
            .eq('status', 'active')
            .single();

        if (error || !data) return 'free';

        const plan = data.plan as string;
        if (plan === 'pro' || plan === 'team') return plan;
        return 'free';
    } catch {
        return 'free';
    }
}

/**
 * Get the limits for a user's current plan.
 */
export async function getUserLimits(userId: string): Promise<PlanLimits> {
    const plan = await getUserPlan(userId);
    return PLAN_LIMITS[plan];
}

/**
 * Check if the user has exceeded their daily query limit.
 */
export async function checkQueryLimit(userId: string): Promise<{ allowed: boolean; used: number; limit: number }> {
    const limits = await getUserLimits(userId);

    // Unlimited
    if (limits.maxQueriesPerDay === -1) {
        return { allowed: true, used: 0, limit: -1 };
    }

    try {
        const today = new Date().toISOString().split('T')[0];
        const { count, error } = await getSupabase()
            .from('query_history')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .gte('created_at', `${today}T00:00:00Z`);

        if (error) {
            log('warn', 'Failed to check query count', { error: error.message, userId });
            // Fail open — don't block users if we can't check
            return { allowed: true, used: 0, limit: limits.maxQueriesPerDay };
        }

        const used = count ?? 0;
        return {
            allowed: used < limits.maxQueriesPerDay,
            used,
            limit: limits.maxQueriesPerDay,
        };
    } catch {
        return { allowed: true, used: 0, limit: limits.maxQueriesPerDay };
    }
}

/**
 * Check if the user has exceeded their dataset limit.
 */
export async function checkDatasetLimit(userId: string): Promise<{ allowed: boolean; used: number; limit: number }> {
    const limits = await getUserLimits(userId);

    if (limits.maxDatasets === -1) {
        return { allowed: true, used: 0, limit: -1 };
    }

    try {
        const { count, error } = await getSupabase()
            .from('datasets')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId);

        if (error) {
            log('warn', 'Failed to check dataset count', { error: error.message, userId });
            return { allowed: true, used: 0, limit: limits.maxDatasets };
        }

        const used = count ?? 0;
        return {
            allowed: used < limits.maxDatasets,
            used,
            limit: limits.maxDatasets,
        };
    } catch {
        return { allowed: true, used: 0, limit: limits.maxDatasets };
    }
}
