import { NextResponse } from 'next/server';
import { supabase } from './lib/supabase';

export async function middleware(req) {
  const { pathname } = req.nextUrl;

  // Skip for static files and the public pages like login or signup
  if (pathname.startsWith('/_next') || pathname.startsWith('/api') || ['/login', '/signup', '/'].includes(pathname)) {
    return NextResponse.next();
  }

  const accessToken = req.cookies.get('sb-access-token')?.value;
  if (!accessToken) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // Create a Supabase client with the token from cookie
  const supabaseClient = supabase.createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { global: { headers: { Authorization: `Bearer ${accessToken}` } } }
  );

  const { data: { user } } = await supabaseClient.auth.getUser();
  if (!user) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  const userId = user.id;

  // Check role from your custom tables
  const [admin, employee, client] = await Promise.all([
    supabaseClient.from('admins').select('id').eq('id', userId).single(),
    supabaseClient.from('employees').select('employee_id').eq('employee_id', userId).single(),
    supabaseClient.from('clients').select('id').eq('id', userId).single(),
  ]);

  let role = null;
  if (admin.data) role = 'admin';
  else if (employee.data) role = 'employee';
  else if (client.data) role = 'client';

  // Redirect if role doesn't match route
  if (pathname.startsWith('/admin') && role !== 'admin') {
    return NextResponse.redirect(new URL('/login', req.url));
  }
  if (pathname.startsWith('/employee') && role !== 'employee') {
    return NextResponse.redirect(new URL('/login', req.url));
  }
  if (pathname.startsWith('/client') && role !== 'client') {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/employee/:path*', '/client/:path*'],
};
