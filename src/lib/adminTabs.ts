// The admin panel's tabs, in the order the header shows them. Shared with the server so the header's Ask AI can only
// point at a tab that exists (src/server/aiHelpers.ts pageInsights).
export const ADMIN_TABS = [
  "Overview",
  "To Do",
  "Inbox",
  "Reports",
  "Gyms",
  "Traffic",
  "Acquisition",
  "Funnel",
  "Retention",
  "Engagement",
  "Devices",
  "Revenue",
  "Codes",
  "Users",
  "Installs",
  "Flags",
  "Seasons",
  "Automations",
  "System",
  "Log",
] as const;
export type AdminTab = (typeof ADMIN_TABS)[number];
