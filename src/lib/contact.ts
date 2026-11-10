// The website's contact form (/contact/). It posts to /api/feedback/, the same route as in-app feedback, with
// `source: "contact"` and one of these topics, so every message reaches the same inbox with the sender as Reply-To.
import type { FeedbackKind } from "./feedback";

export const CONTACT_TOPICS: { id: string; label: string; kind: FeedbackKind }[] = [
  { id: "question", label: "A question about the app", kind: "other" },
  { id: "problem", label: "Something isn't working", kind: "bug" },
  { id: "idea", label: "An idea or a feature request", kind: "idea" },
  { id: "billing", label: "Pro, billing or a refund", kind: "other" },
  { id: "privacy", label: "A privacy or data request", kind: "other" },
  { id: "press", label: "Press, creators or partnerships", kind: "other" },
];

/** How soon a person replies, said on the contact, help and status pages. */
export const REPLY_TIME = "two working days";

/** The same limit as in-app feedback (checkFeedback in feedbackServer.ts). */
export const CONTACT_MAX_MESSAGE = 4000;
