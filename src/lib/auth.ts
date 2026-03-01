import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { log } from '@/lib/logger';

const DEV_BYPASS_USER_ID = 'dev_master_user';

/**
 * Check if dev auth bypass is enabled.
 * Set NEXT_PUBLIC_DEV_AUTH_BYPASS=true in .env.local to skip Clerk auth locally.
 * Only works in development mode — ignored in production.
 */
function isDevBypass(): boolean {
    return (
        process.env.NODE_ENV === 'development' &&
        process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS === 'true'
    );
}

/**
 * Extracts the authenticated user's ID from the Clerk session.
 * Returns { userId } on success, or { error: NextResponse } on failure.
 *
 * In dev mode with NEXT_PUBLIC_DEV_AUTH_BYPASS=true, skips Clerk entirely
 * and returns a static dev user ID.
 */
export async function requireAuth(): Promise<
    { userId: string; error?: never } | { userId?: never; error: NextResponse }
> {
    // Dev bypass — skip Clerk entirely
    if (isDevBypass()) {
        return { userId: DEV_BYPASS_USER_ID };
    }

    try {
        const { userId } = await auth();

        if (!userId) {
            return {
                error: NextResponse.json(
                    { error: 'Authentication required.' },
                    { status: 401 },
                ),
            };
        }

        return { userId };
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Auth check failed';
        log('error', 'Auth middleware error', { error: message });
        return {
            error: NextResponse.json(
                { error: 'Authentication error.' },
                { status: 401 },
            ),
        };
    }
}
