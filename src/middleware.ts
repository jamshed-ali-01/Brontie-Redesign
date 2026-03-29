import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // MAINTENANCE MODE LOGIC
  // Only /login, /admin (and its subroutes), and their corresponding API routes are allowed natively
  const isMaintenanceAllowedPath =
    pathname === '/login' ||
    // We do NOT whitelist '/maintenance' here because we want the middleware to check its status 
    // and redirect away from it if maintenance mode is OFF.
    pathname.startsWith('/admin') ||
    pathname.startsWith('/api/') ||
    // IMPORTANT: Exclude Next.js internal paths which can cause redirect loops
    pathname.startsWith('/_next/') ||
    pathname.includes('.') ||
    // Handle the weird '' pathname that Next.js sometimes uses internally for the root
    pathname === '';

  if (!isMaintenanceAllowedPath || pathname === '/maintenance') {
    try {
      // First check if the user has a valid bypass cookie (set by the /maintenance page)
      const hasBypassCookie = request.cookies.has('maintenance_bypass');

      // Fetch maintenance status from our internal API which reads from the DB
      const statusRes = await fetch(new URL('/api/maintenance/status', request.url), {
        headers: {
          authorization: request.headers.get('authorization') || '',
        },
        cache: 'no-store'
      });

      if (statusRes.ok) {
        const { maintenanceMode, isBypassed } = await statusRes.json();

        // If maintenance is ON and the user is NOT bypassed (by basic auth fallback OR cookie)
        // AND they are not currently trying to access the maintenance page itself
        if (maintenanceMode && !isBypassed && !hasBypassCookie && pathname !== '/maintenance') {
          console.log(`[Maintenance Block] Redirecting '${pathname}' to /maintenance`);
          // Redirect the user to the visual maintenance page
          return NextResponse.redirect(new URL('/maintenance', request.url));
        }

        // If they try to access the maintenance page but maintenance mode is actually OFF,
        // send them back to the homepage.
        if (!maintenanceMode && pathname === '/maintenance') {
          return NextResponse.redirect(new URL('/', request.url));
        }
      }
    } catch (error) {
      console.error('Failed to fetch maintenance status in middleware', error);
      // Fail open if the API or DB is temporarily unreachable to avoid bringing down the whole site unnecessarily
    }
  }

  // Handle dynamic short links for organizations (e.g., /org=my-cafe or /org/my-cafe)
  if (pathname.startsWith('/org=') || pathname.startsWith('/org/')) {
    const slug = pathname.replace('/org=', '').replace('/org/', '');
    if (slug) {
      return NextResponse.redirect(new URL(`/products?organization=${slug}`, request.url));
    }
  }

  // Check if accessing admin pages (not API routes)
  if (pathname.startsWith('/admin') && !pathname.startsWith('/api/admin')) {
    // Just check if user id cookie exists (don't verify it)
    const userId = request.cookies.get('admin-user-id')?.value;

    if (!userId) {
      // No user id at all - redirect to login
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // User id exists - let through (API routes will verify if user is still active)
    return NextResponse.next();
  }

  // For all other routes, continue normally
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes) -> We want to match /api/ though, so removing this
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     * - \.(.*) (any file with an extension, like .png, .css, etc)
     */
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\..*).*)',
  ]
};
