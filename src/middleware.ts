
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getIronSession } from 'iron-session';
import { sessionOptions, SessionData } from '@/lib/session';

export async function middleware(request: NextRequest) {
  const session = await getIronSession<SessionData>(request.cookies, sessionOptions);
  const { user } = session;

  const { pathname } = request.nextUrl;
  
  const isAppRoute = pathname.startsWith('/dashboard') || pathname.startsWith('/logs') || pathname.startsWith('/admin');

  if (!user && isAppRoute) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  if (user && pathname === '/login') {
     return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  
  if (pathname === '/') {
      if (user) {
          return NextResponse.redirect(new URL('/dashboard', request.url));
      } else {
          return NextResponse.redirect(new URL('/login', request.url));
      }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|imagenes).*)'],
};
