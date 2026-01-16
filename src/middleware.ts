
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getIronSession } from 'iron-session';
import { sessionOptions, type SessionData } from '@/lib/session-options';

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const session = await getIronSession<SessionData>(request, response, sessionOptions);
  const user = session.user;
  const { pathname } = request.nextUrl;

  // Handle redirects for the root path
  if (pathname === '/') {
    if (user) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Logic for authentication pages
  if (pathname === '/login') {
    if (user) {
      // If user is logged in, redirect from login page to dashboard
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    // Allow unauthenticated users to access the login page
    return response;
  }

  // For all other routes, check for an active session
  if (!user) {
    // If no user, redirect to login
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Protect admin routes
  if (pathname.startsWith('/admin') && user.role !== 'admin') {
    // If a non-admin tries to access admin routes, redirect to dashboard
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // If all checks pass, allow the request to proceed
  return response;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|imagenes).*)'],
  runtime: 'nodejs',
};
