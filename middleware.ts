import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  // Get site settings to check maintenance mode and registration status
  let settingsData = null;
  let settingsError = null;
  
  try {
    const result = await supabase
      .from('app_settings')
      .select('maintenance_mode, allow_registration')
      .single();
      
    settingsData = result.data;
    settingsError = result.error;
  } catch (error) {
    console.warn('Error fetching app settings in middleware:', error instanceof Error ? error.message : error);
    // Default to safe values if settings can't be fetched
    settingsData = { maintenance_mode: false, allow_registration: true };
  }

  // If settings error occurred but we have no data, use defaults
  if (settingsError && !settingsData) {
    // Check if it's a "table doesn't exist" or "no rows" error, and use defaults
    if (settingsError.code === '42P01' || settingsError.code === 'PGRST116') {
      settingsData = { maintenance_mode: false, allow_registration: true };
    } else {
      console.warn('Error fetching app settings:', settingsError);
      settingsData = { maintenance_mode: false, allow_registration: true };
    }
  }

  // If maintenance mode is enabled, only allow admin access
  if (settingsData?.maintenance_mode) {
    const { data: { session } } = await supabase.auth.getSession();
    
    // If user is not authenticated, redirect to login
    if (!session) {
      return NextResponse.redirect(new URL('/login', req.url));
    }
    
    // Check if user is admin
    let profileData = null;
    try {
      const result = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', session.user.id)
        .single();
        
      profileData = result.data;
    } catch (error) {
      console.warn('Error fetching user profile in middleware:', error instanceof Error ? error.message : error);
      // If profile doesn't exist or error occurs, user is not considered an admin
    }
    
    // If user is not admin, prevent access to most routes (except dashboard, login, etc.)
    if (!profileData?.is_admin) {
      // Allow access to dashboard, login, and API routes only
      if (!pathname.startsWith('/dashboard') && 
          !pathname.startsWith('/login') && 
          !pathname.startsWith('/api')) {
        return NextResponse.redirect(new URL('/dashboard', req.url));
      }
    }
  }

  // Check registration status for register page
  if (pathname === '/register' && settingsData && !settingsData.allow_registration) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // Protected routes
  const protectedPaths = ['/dashboard', '/transactions', '/report', '/products', '/orders', '/settings'];
  const isProtectedPath = protectedPaths.some((path) => pathname.startsWith(path));

  // Auth routes
  const authPaths = ['/login', '/register'];
  const isAuthPath = authPaths.some((path) => pathname === path);

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
