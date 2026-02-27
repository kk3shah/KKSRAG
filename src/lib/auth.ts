import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { log } from '@/lib/logger';

/**
 * Extracts the authenticated user's ID from the Clerk session.
 * Returns { userId } on success, or { error: NextResponse } on failure.
 */
export async function requireAuth(): Promise<
    { userId: string; error?: never } | { userId?: never; error: NextResponse }
> {
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
