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

  // Get hostname of request (e.g. pobaschool.digigram.com, pobaschool.edu.bd, localhost:3000)
  let hostname = req.headers
    .get('host')
    ?.replace('.localhost:3000', `.${process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'localhost:3000'}`);

  const searchParams = req.nextUrl.searchParams.toString();
  const path = `${url.pathname}${searchParams.length > 0 ? `?${searchParams}` : ''}`;

  // If the hostname is the root domain (or localhost), let it run the normal app/(site)
  if (
    hostname === 'localhost:3000' ||
    hostname === process.env.NEXT_PUBLIC_ROOT_DOMAIN ||
    hostname === `www.${process.env.NEXT_PUBLIC_ROOT_DOMAIN}` ||
    hostname?.endsWith('.vercel.app') || // Support Vercel previews as root
    url.pathname === '/login' ||
    url.pathname.startsWith('/api/')
  ) {
    // Normal routing
    return NextResponse.next();
  }

  // Rewrite everything else (Subdomains or Custom Domains) to a specific layout folder
  // E.g., pobaschool.digigram.com/about -> /app/[domain]/about
  return NextResponse.rewrite(new URL(`/${hostname}${path}`, req.url));
}
