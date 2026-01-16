
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getIronSession } from 'iron-session';
import { sessionOptions, type SessionData } from '@/lib/session-options';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const res = NextResponse.next();
  const session = await getIronSession<SessionData>(request, res, sessionOptions);
  const user = session.user;

  // If user is not logged in and tries to access a protected route (not login), redirect to /login
  if (!user && pathname !== '/login') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If user is logged in and tries to access /login, redirect to /dashboard
  if (user && pathname === '/login') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  
  if (pathname === '/') {
    if (user) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return res;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|imagenes).*)'],
  runtime: 'nodejs',
};
