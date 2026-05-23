import { NextResponse } from 'next/server'

const COOKIE_NAME = 'gmap_session'

// Routes cần đăng nhập
const PROTECTED = ['/dashboard', '/settings']
// Routes chỉ dành cho chưa đăng nhập
const AUTH_ONLY = ['/login', '/register']

export function middleware(req) {
  const { pathname } = req.nextUrl
  const token = req.cookies.get(COOKIE_NAME)?.value

  const isProtected = PROTECTED.some(p => pathname.startsWith(p))
  const isAuthOnly  = AUTH_ONLY.some(p => pathname.startsWith(p))

  if (isProtected && !token) {
    const url = req.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('next', pathname)
    return NextResponse.redirect(url)
  }

  if (isAuthOnly && token) {
    const url = req.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/settings/:path*', '/login', '/register']
}
