import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import type { NextRequest, NextFetchEvent } from 'next/server';

const isPublicRoute = createRouteMatcher([
    '/sign-in(.*)',
    '/sign-up(.*)',
    '/api/health(.*)',
    '/pricing(.*)',
]);

/**
 * Dev auth bypass: when NEXT_PUBLIC_DEV_AUTH_BYPASS=true in development,
 * skip Clerk middleware entirely — all routes are accessible without sign-in.
 */
const devBypass =
    process.env.NODE_ENV === 'development' &&
    process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS === 'true';

const clerkMw = clerkMiddleware(async (auth, request) => {
    if (!isPublicRoute(request)) {
        await auth.protect();
    }
});

export default function middleware(req: NextRequest, event: NextFetchEvent) {
    if (devBypass) {
        return NextResponse.next();
    }

    return clerkMw(req, event);
}

export const config = {
    matcher: [
        // Skip Next.js internals and static files
        '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
        // Always run for API routes
        '/(api|trpc)(.*)',
    ],
};
