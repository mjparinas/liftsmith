"use client";

// More on a real gym, the app side (server: src/server/gymExtras.ts; docs/decisions/gyms.md "Round 3"): the owner's
// announcements and trainers, equipment problems anyone can report, and the out-of-order list Today plans around.
// Reporting works signed out; everything else needs an account.
import { create } from "zustand";

import { api, AuthError, readAccount } from "./auth";
import type { GymIssue, GymNews, IssueKind } from "./gymExtras";
import type { Equipment, Gym } from "./types";

const token = () => readAccount()?.token;
const err = (e: unknown) => (e instanceof AuthError ? (e.message === "offline" ? "offline" : e.message) : "failed");

// --- Equipment problems, and the plan working around them ---

const KEY = "liftsmith.outOfOrder";
/** Checked on open and on return to the app, at most this often per gym. */
export const ISSUES_EVERY = 30 * 60_000;

function read(): Record<string, GymIssue[]> {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? "{}") as unknown;
    return v && typeof v === "object" ? (v as Record<string, GymIssue[]>) : {};
  } catch {
    return {};
  }
}

/** Open problems per real gym (placeId), kept on the device so the plan works around them offline too. */
export const useOutOfOrder = create<{ byPlace: Record<string, GymIssue[]> }>(() => ({
  byPlace: typeof localStorage === "undefined" ? {} : read(),
}));

function keep(placeId: string, issues: GymIssue[]): boolean {
  const before = useOutOfOrder.getState().byPlace[placeId] ?? [];
  const same = before.length === issues.length && before.every((x, i) => x.id === issues[i]?.id && x.equipment === issues[i]?.equipment);
  const byPlace = { ...useOutOfOrder.getState().byPlace, [placeId]: issues };
  if (!issues.length) delete byPlace[placeId];
  useOutOfOrder.setState({ byPlace });
  try {
    localStorage.setItem(KEY, JSON.stringify(byPlace));
  } catch {
    // storage full or blocked: the plan still works around them until the app closes
  }
  return !same;
}

/** The equipment out of order at this gym, as far as this phone knows. */
export function outOfOrder(gym: Pick<Gym, "placeId"> | undefined): Equipment[] {
  if (!gym?.placeId) return [];
  return [...new Set((useOutOfOrder.getState().byPlace[gym.placeId] ?? []).map((x) => x.equipment))];
}

/** The gym as the plan sees it: without what's reported broken or missing there. */
export function withoutBroken(gym: Gym): Gym {
  const out = outOfOrder(gym);
  return out.length ? { ...gym, equipment: gym.equipment.filter((e) => !out.includes(e)) } : gym;
}

const looked: Record<string, number> = {};

/** Fetches the gym's open problems; true when they changed (so Today replans). Offline keeps what was there. */
export async function refreshOutOfOrder(placeId: string | undefined, now = Date.now(), force = false): Promise<boolean> {
  const last = looked[placeId ?? ""];
  if (!placeId || (!force && last !== undefined && now - last < ISSUES_EVERY)) return false;
  looked[placeId] = now;
  try {
    const r = await api<{ issues: GymIssue[] }>("/api/gyms/", { token: token(), body: { op: "issues", place: placeId } });
    return keep(placeId, r.issues);
  } catch {
    return false;
  }
}

/** Reports a piece of equipment broken or missing; this phone plans around it at once. */
export async function reportIssue(
  placeId: string,
  equipment: Equipment,
  kind: IssueKind,
  note = "",
): Promise<{ id: string } | { error: string }> {
  try {
    const r = await api<{ id: string }>("/api/gyms/", { token: token(), body: { op: "issue", place: placeId, equipment, kind, note } });
    const list = useOutOfOrder.getState().byPlace[placeId] ?? [];
    if (!list.some((x) => x.id === r.id)) keep(placeId, [...list, { id: r.id, equipment, kind, note, at: Date.now(), reports: 1 }]);
    return r;
  } catch (e) {
    return { error: err(e) };
  }
}

/** "It works again" (or the owner's Fixed): closes the report for everyone. */
export async function fixIssue(placeId: string, id: string): Promise<boolean> {
  try {
    await api("/api/gyms/", { token: token(), body: { op: "issueFixed", place: placeId, id } });
    return true;
  } catch (e) {
    // Already fixed by someone else counts as done.
    if (!(e instanceof AuthError && e.status === 404)) return false;
    return true;
  } finally {
    keep(
      placeId,
      (useOutOfOrder.getState().byPlace[placeId] ?? []).filter((x) => x.id !== id),
    );
  }
}

/** Signing out or erasing data keeps nothing about gyms on the device. */
export function forgetOutOfOrder(): void {
  useOutOfOrder.setState({ byPlace: {} });
  try {
    localStorage.removeItem(KEY);
  } catch {
    // nothing kept
  }
}

// --- The owner's announcements, problem reports and trainers ---

export interface OwnerTrainer {
  code: string;
  name: string;
  role: string;
  bio: string;
  status: "listed" | "pending";
}
export interface OwnerExtras {
  news: GymNews[];
  issues: GymIssue[];
  trainers: OwnerTrainer[];
}

export async function ownerExtras(place: string): Promise<OwnerExtras | null> {
  try {
    return await api<OwnerExtras>("/api/gyms/", { token: token(), body: { op: "extras", place } });
  } catch {
    return null;
  }
}

export async function postNews(place: string, text: string): Promise<{ id: string; pushed: number } | { error: string }> {
  try {
    return await api<{ id: string; pushed: number }>("/api/gyms/", { token: token(), body: { op: "news", place, text } });
  } catch (e) {
    return { error: err(e) };
  }
}

export async function deleteNews(place: string, id: string): Promise<boolean> {
  try {
    await api("/api/gyms/", { token: token(), body: { op: "newsDelete", place, id } });
    return true;
  } catch {
    return false;
  }
}

export async function decideTrainer(place: string, code: string, approve: boolean): Promise<boolean> {
  try {
    await api("/api/gyms/", { token: token(), body: { op: "trainerDecide", place, code, approve } });
    return true;
  } catch {
    return false;
  }
}

// --- A coach's gyms ---

export interface TrainerGym {
  place: string;
  name: string;
  status: "listed" | "pending";
  bio: string;
  code: string;
}

export async function trainerGyms(): Promise<TrainerGym[] | null> {
  const t = token();
  if (!t) return null;
  try {
    return (await api<{ gyms: TrainerGym[] }>("/api/gyms/", { token: t, body: { op: "trainerGyms" } })).gyms;
  } catch {
    return null;
  }
}

export async function listAsTrainer(place: string, bio: string): Promise<{ status: "listed" | "pending" } | { error: string }> {
  try {
    return await api<{ status: "listed" | "pending" }>("/api/gyms/", { token: token(), body: { op: "trainer", place, bio } });
  } catch (e) {
    return { error: err(e) };
  }
}

export async function leaveAsTrainer(place: string): Promise<boolean> {
  try {
    await api("/api/gyms/", { token: token(), body: { op: "trainerLeave", place } });
    return true;
  } catch {
    return false;
  }
}
