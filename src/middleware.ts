import NextAuth from "next-auth"
import { authConfig } from "./auth.config"
import { NextResponse } from "next/server"

const { auth } = NextAuth(authConfig)

export default auth((req) => {
  const { nextUrl } = req;
  const isWidget = nextUrl.pathname.startsWith('/widget/');
  const response = NextResponse.next()
  
  // --- Security Headers ---
  // Content Security Policy
  const frameAncestors = isWidget ? '*' : "'none'";
  
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-inline' https://checkout.razorpay.com https://cdn.razorpay.com;
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    img-src 'self' data: blob: https://cdn.razorpay.com;
    font-src 'self' https://fonts.gstatic.com;
    connect-src 'self' https://api.razorpay.com https://lumberjack.razorpay.com;
    frame-src 'self' https://api.razorpay.com https://checkout.razorpay.com;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors ${frameAncestors};
    upgrade-insecure-requests;
  `.replace(/\s{2,}/g, ' ').trim();

  response.headers.set('Content-Security-Policy', cspHeader)
  
  // X-Frame-Options is partially redundant with CSP frame-ancestors but kept for legacy
  // DENY blocks all framing; for widgets we must not use DENY.
  if (!isWidget) {
    response.headers.set('X-Frame-Options', 'DENY')
  } else {
    // Some older browsers might still need SAMEORIGIN or the header removed
    // Since we want to allow framing on any site, we omit X-Frame-Options
    // Most modern browsers follow frame-ancestors.
    response.headers.delete('X-Frame-Options');
  }

  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), interest-cohort=()')
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')

  return response
})

export const config = {
  // Include API routes in security headers, exclude only static assets
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
