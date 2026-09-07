import NextAuth from "next-auth";
import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { routing } from "@/i18n/routing";
import { authConfig } from "@/lib/auth.config";

// Uses the edge-safe authConfig (no Prisma/bcrypt) so the proxy bundle never
// pulls in Node-only dependencies. See src/lib/auth.config.ts.
const { auth } = NextAuth(authConfig);

const handleI18nRouting = createMiddleware(routing);

const PUBLIC_PATHS = ["/login"];

function stripLocale(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);
  const [maybeLocale, ...rest] = segments;
  if ((routing.locales as readonly string[]).includes(maybeLocale)) {
    return "/" + rest.join("/");
  }
  return pathname;
}

function localeOf(pathname: string): string {
  const first = pathname.split("/").filter(Boolean)[0];
  return first && (routing.locales as readonly string[]).includes(first)
    ? first
    : routing.defaultLocale;
}

export default auth((req: NextRequest & { auth: unknown }) => {
  const { pathname } = req.nextUrl;
  const pathWithoutLocale = stripLocale(pathname) || "/";
  const isPublic = PUBLIC_PATHS.some(
    (p) => pathWithoutLocale === p || pathWithoutLocale.startsWith(`${p}/`),
  );

  if (!req.auth && !isPublic) {
    const loginUrl = new URL(`/${localeOf(pathname)}/login`, req.url);
    return NextResponse.redirect(loginUrl);
  }

  return handleI18nRouting(req);
});

export const config = {
  matcher: ["/((?!api|trpc|_next|_vercel|.*\\..*).*)"],
};
