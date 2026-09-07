import { getRequestConfig } from "next-intl/server";
import { hasLocale } from "next-intl";
import { routing } from "./routing";

const namespaces = [
  "common",
  "nav",
  "auth",
  "clients",
  "contacts",
  "contracts",
  "projects",
  "errors",
  "validation",
  "dashboard",
  "requests",
  "tasks",
  "deliverables",
  "campaigns",
  "files",
  "notifications",
  "account",
  "activity",
  "leads",
  "sales",
  "team",
  "integrations",
  "settings",
  "search",
] as const;

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  const messages = Object.assign(
    {},
    ...(await Promise.all(
      namespaces.map(async (ns) => ({
        [ns]: (await import(`./messages/${locale}/${ns}.json`)).default,
      })),
    )),
  );

  return { locale, messages };
});
