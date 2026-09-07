import { describe, expect, it } from "vitest";

import arCommon from "./messages/ar/common.json";
import enCommon from "./messages/en/common.json";
import arNav from "./messages/ar/nav.json";
import enNav from "./messages/en/nav.json";
import arAuth from "./messages/ar/auth.json";
import enAuth from "./messages/en/auth.json";
import arClients from "./messages/ar/clients.json";
import enClients from "./messages/en/clients.json";
import arProjects from "./messages/ar/projects.json";
import enProjects from "./messages/en/projects.json";
import arErrors from "./messages/ar/errors.json";
import enErrors from "./messages/en/errors.json";
import arValidation from "./messages/ar/validation.json";
import enValidation from "./messages/en/validation.json";

const namespaces: [string, unknown, unknown][] = [
  ["common", arCommon, enCommon],
  ["nav", arNav, enNav],
  ["auth", arAuth, enAuth],
  ["clients", arClients, enClients],
  ["projects", arProjects, enProjects],
  ["errors", arErrors, enErrors],
  ["validation", arValidation, enValidation],
];

function collectKeyPaths(value: unknown, prefix = ""): string[] {
  if (value === null || typeof value !== "object") {
    return [prefix];
  }
  return Object.entries(value as Record<string, unknown>).flatMap(([key, child]) =>
    collectKeyPaths(child, prefix ? `${prefix}.${key}` : key),
  );
}

describe("Arabic and English message files stay in sync", () => {
  it.each(namespaces)("%s has identical key sets in ar and en", (_name, ar, en) => {
    const arKeys = collectKeyPaths(ar).sort();
    const enKeys = collectKeyPaths(en).sort();
    expect(enKeys).toEqual(arKeys);
  });
});
