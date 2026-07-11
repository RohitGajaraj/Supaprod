import type { ProviderId } from "./connectors/registry";

// RPT-02 - the connect-moment trust card's per-provider copy. Hand-written,
// not derived from the raw OAuth scope strings in connectors/registry.ts:
// a trust claim has to be exactly right, and a heuristic scope-string
// classifier risks over- or under-claiming access for an edge-case scope.
// Update this alongside any scope change in the registry.

export type TrustCopy = {
  weRead: string;
  weNeverRead: string;
};

const TRUST_COPY: Record<ProviderId, TrustCopy> = {
  github: {
    weRead: "Repository contents, issues, and pull requests in the repos you authorize.",
    weNeverRead: "Any repo you have not authorized, or your account settings and billing.",
  },
  linear: {
    weRead: "Issues and their status in the teams you connect.",
    weNeverRead: "Other Linear workspaces, or billing and member data.",
  },
  notion: {
    weRead: "Pages and databases in the workspace you share with the integration.",
    weNeverRead: "Any page you have not explicitly shared with it.",
  },
  google_docs: {
    weRead: "The specific Google Docs files you choose to import.",
    weNeverRead: "Your full Drive, or any file you have not picked.",
  },
  google_calendar: {
    weRead: "Your calendar events, to sync and create meetings from decisions.",
    weNeverRead: "Gmail, Drive, or any other Google product.",
  },
  gmail: {
    weRead: "Recent inbox messages, read-only, to surface customer and lead signals.",
    weNeverRead: "We never send email as you, and never touch Drive or Calendar.",
  },
  google_tasks: {
    weRead: "Your Google Tasks lists, to sync action items.",
    weNeverRead: "Gmail, Calendar, or Drive.",
  },
  microsoft_outlook: {
    weRead: "Your Outlook calendar events, to sync and create meetings from decisions.",
    weNeverRead: "Mail, contacts, or files.",
  },
  microsoft_mail: {
    weRead: "Recent inbox messages, read-only, to surface customer and lead signals.",
    weNeverRead: "We never send email as you, and never touch Calendar or files.",
  },
  figma: {
    weRead: "File metadata for the files you reference in a spec or brief.",
    weNeverRead: "Account settings, or files you have not referenced.",
  },
  jira: {
    weRead: "Work items and their status in the projects you connect.",
    weNeverRead: "Billing, admin settings, or projects you have not connected.",
  },
  firecrawl: {
    weRead: "Nothing personal - this is shared crawl infrastructure, not a per-user connection.",
    weNeverRead: "There is no personal OAuth grant with this provider.",
  },
  intercom: {
    weRead: "Support conversations, to surface them as discovery signals.",
    weNeverRead: "Billing or admin settings.",
  },
  stripe: {
    weRead: "Canceled-subscription events and their cancellation reasons.",
    weNeverRead: "Card numbers, bank details, or the ability to move money.",
  },
  slack: {
    weRead: "Message history in the channels you add the app to, and messages the app posts.",
    weNeverRead: "Direct messages, or channels you have not added the app to.",
  },
  zendesk: {
    weRead: "Recent support tickets, as customer-voice signals.",
    weNeverRead: "Billing or agent account settings.",
  },
  hubspot: {
    weRead: "Closed-lost deals and their loss reasons.",
    weNeverRead: "Contacts, billing, or deals you have not closed.",
  },
  salesforce: {
    weRead: "Closed-lost opportunities, as win/loss signals.",
    weNeverRead: "Other objects, billing, or admin settings.",
  },
  canny: {
    weRead: "Recent feature-request posts, as feedback signals.",
    weNeverRead: "Billing or admin settings.",
  },
  productboard: {
    weRead: "Customer notes and insights.",
    weNeverRead: "Billing or admin settings.",
  },
};

const FALLBACK: TrustCopy = {
  weRead: "Only the access you approve on the next screen.",
  weNeverRead: "Nothing beyond the scopes shown there.",
};

export function trustCopyFor(id: ProviderId): TrustCopy {
  return TRUST_COPY[id] ?? FALLBACK;
}
