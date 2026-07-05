import { NextResponse } from 'next/server';

export const config = {
  matcher: [
    /*
     * Match all paths except for:
     * 1. /api routes
     * 2. /_next (Next.js internals)
     * 3. /_static (inside /public)
     * 4. all root files inside /public (e.g. favicon.ico)
     */
    '/((?!api/|_next/|_static/|_vercel|[\\w-]+\\.\\w+).*)',
  ],
};

export default async function middleware(req) {
  const url = req.nextUrl;

  // Keep the request port for tenant rewrites, but compare root hosts without it.
  const requestHost = (req.headers.get('host') || '').toLowerCase();
  const hostname = requestHost.split(':')[0];
  const configuredRootHost = (process.env.NEXT_PUBLIC_ROOT_DOMAIN || '')
    .toLowerCase()
    .split(':')[0];

  const searchParams = req.nextUrl.searchParams.toString();
  const path = `${url.pathname}${searchParams.length > 0 ? `?${searchParams}` : ''}`;

  // If the hostname is the root domain (or localhost), let it run the normal app/(site)
  if (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '[::1]' ||
    hostname === configuredRootHost ||
    hostname === `www.${configuredRootHost}` ||
    hostname?.endsWith('.vercel.app') || // Support Vercel previews as root
    url.pathname === '/login' ||
    url.pathname.startsWith('/api/')
  ) {
    // Normal routing
    return NextResponse.next();
  }

  // Rewrite everything else (Subdomains or Custom Domains) to a specific layout folder
  // E.g., pobaschool.digigram.com/about -> /app/[domain]/about
  return NextResponse.rewrite(new URL(`/${requestHost}${path}`, req.url));
}
