
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// This middleware has been simplified to remove all session and login logic.
// It now only handles redirecting the root path to the dashboard.

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Always redirect the root path to the dashboard
  if (pathname === '/') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|imagenes).*)'],
};
