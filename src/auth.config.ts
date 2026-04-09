import { NextAuthConfig } from "next-auth"
import Credentials from "next-auth/providers/credentials"

// This is the Edge-compatible part of our auth config
export const authConfig = {
  providers: [
    // We provide an empty Credentials provider here just to satisfy the type
    // The actual authorize logic will be in src/auth.ts
    Credentials({}),
  ],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isDashboard = nextUrl.pathname.startsWith('/dashboard');
      const isAuthPage = nextUrl.pathname.startsWith('/auth');

      if (isDashboard) {
        if (isLoggedIn) return true;
        return false; // Redirect unauthenticated users to login page
      }

      if (isAuthPage && isLoggedIn) {
        return Response.redirect(new URL('/dashboard', nextUrl));
      }

      return true;
    },
    async redirect({ url, baseUrl }) {
      // Allows relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url
      return baseUrl + "/dashboard"
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub
      }
      return session
    },
  },
  session: { strategy: "jwt" },
  pages: {
    signIn: "/auth/signin",
  },
} satisfies NextAuthConfig
