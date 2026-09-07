import { describe, expect, it } from "vitest";

import arCommon from "./messages/ar/common.json";
import enCommon from "./messages/en/common.json";
import arNav from "./messages/ar/nav.json";
import enNav from "./messages/en/nav.json";
import arAuth from "./messages/ar/auth.json";
import enAuth from "./messages/en/auth.json";
import arClients from "./messages/ar/clients.json";
import enClients from "./messages/en/clients.json";
import arContacts from "./messages/ar/contacts.json";
import enContacts from "./messages/en/contacts.json";
import arContracts from "./messages/ar/contracts.json";
import enContracts from "./messages/en/contracts.json";
import arProjects from "./messages/ar/projects.json";
import enProjects from "./messages/en/projects.json";
import arErrors from "./messages/ar/errors.json";
import enErrors from "./messages/en/errors.json";
import arValidation from "./messages/ar/validation.json";
import enValidation from "./messages/en/validation.json";
import arDashboard from "./messages/ar/dashboard.json";
import enDashboard from "./messages/en/dashboard.json";
import arRequests from "./messages/ar/requests.json";
import enRequests from "./messages/en/requests.json";
import arTasks from "./messages/ar/tasks.json";
import enTasks from "./messages/en/tasks.json";
import arDeliverables from "./messages/ar/deliverables.json";
import enDeliverables from "./messages/en/deliverables.json";
import arCampaigns from "./messages/ar/campaigns.json";
import enCampaigns from "./messages/en/campaigns.json";
import arFiles from "./messages/ar/files.json";
import enFiles from "./messages/en/files.json";
import arNotifications from "./messages/ar/notifications.json";
import enNotifications from "./messages/en/notifications.json";
import arAccount from "./messages/ar/account.json";
import enAccount from "./messages/en/account.json";
import arActivity from "./messages/ar/activity.json";
import enActivity from "./messages/en/activity.json";
import arLeads from "./messages/ar/leads.json";
import enLeads from "./messages/en/leads.json";
import arSales from "./messages/ar/sales.json";
import enSales from "./messages/en/sales.json";
import arTeam from "./messages/ar/team.json";
import enTeam from "./messages/en/team.json";
import arIntegrations from "./messages/ar/integrations.json";
import enIntegrations from "./messages/en/integrations.json";
import arSettings from "./messages/ar/settings.json";
import enSettings from "./messages/en/settings.json";
import arSearch from "./messages/ar/search.json";
import enSearch from "./messages/en/search.json";

const namespaces: [string, unknown, unknown][] = [
  ["common", arCommon, enCommon],
  ["nav", arNav, enNav],
  ["auth", arAuth, enAuth],
  ["clients", arClients, enClients],
  ["contacts", arContacts, enContacts],
  ["contracts", arContracts, enContracts],
  ["projects", arProjects, enProjects],
  ["errors", arErrors, enErrors],
  ["validation", arValidation, enValidation],
  ["dashboard", arDashboard, enDashboard],
  ["requests", arRequests, enRequests],
  ["tasks", arTasks, enTasks],
  ["deliverables", arDeliverables, enDeliverables],
  ["campaigns", arCampaigns, enCampaigns],
  ["files", arFiles, enFiles],
  ["notifications", arNotifications, enNotifications],
  ["account", arAccount, enAccount],
  ["activity", arActivity, enActivity],
  ["leads", arLeads, enLeads],
  ["sales", arSales, enSales],
  ["team", arTeam, enTeam],
  ["integrations", arIntegrations, enIntegrations],
  ["settings", arSettings, enSettings],
  ["search", arSearch, enSearch],
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
