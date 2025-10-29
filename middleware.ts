import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Protected routes
  const protectedPaths = ['/dashboard', '/transactions', '/report'];
  const isProtectedPath = protectedPaths.some((path) => pathname.startsWith(path));

  // Auth routes
  const authPaths = ['/login', '/register'];
  const isAuthPath = authPaths.includes(pathname);

  // For protected routes, check session in client-side
  // Server-side auth check will be done by each page component
  if (isProtectedPath || isAuthPath) {
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
