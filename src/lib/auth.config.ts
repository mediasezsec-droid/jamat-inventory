import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnLogin = nextUrl.pathname.startsWith("/login");
      const isOnForgotPassword =
        nextUrl.pathname.startsWith("/forgot-password");
      const isOnSetup = nextUrl.pathname.startsWith("/setup");
      const isOnApi = nextUrl.pathname.startsWith("/api");
      const isOnUnauthorized = nextUrl.pathname === "/unauthorized";

      // Allow public pages
      if (
        isOnApi ||
        isOnSetup ||
        isOnLogin ||
        isOnForgotPassword ||
        isOnUnauthorized
      ) {
        return true;
      }

      // Require login for everything else
      return isLoggedIn;
    },
    jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.id = user.id;
        token.username = (user as any).username;
        token.profileStatus = (user as any).profileStatus;
        token.mobile = (user as any).mobile;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role;
        (session.user as any).id = token.id;
        (session.user as any).username = token.username;
        (session.user as any).profileStatus = token.profileStatus;
        (session.user as any).mobile = token.mobile;
      }
      return session;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
