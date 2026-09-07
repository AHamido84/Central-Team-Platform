import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    id: string;
    roleId: string;
    roleName: string;
    clientId: string | null;
  }

  interface Session {
    user: {
      id: string;
      roleId: string;
      roleName: string;
      clientId: string | null;
    } & DefaultSession["user"];
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id: string;
    roleId: string;
    roleName: string;
    clientId: string | null;
  }
}
