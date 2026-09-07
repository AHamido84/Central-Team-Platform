import type { NextAuthConfig } from "next-auth";

// Edge-safe base config shared by the middleware auth wrapper (src/middleware.ts)
// and the full server-side config (src/lib/auth.ts). This file must never import
// Prisma or bcryptjs — those aren't safe in the middleware bundle.
export const authConfig = {
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt" },
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.roleId = user.roleId;
        token.roleName = user.roleName;
        token.clientId = user.clientId;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id;
      session.user.roleId = token.roleId;
      session.user.roleName = token.roleName;
      session.user.clientId = token.clientId;
      return session;
    },
  },
} satisfies NextAuthConfig;
