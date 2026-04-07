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
      if (isDashboard) {
        if (isLoggedIn) return true;
        return false; // Redirect unauthenticated users to login page
      }
      return true;
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
