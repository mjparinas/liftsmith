"use client";

// Signing out of this device (Account.tsx). Signing out wipes the lifter's data from the device (wipe.ts), so the
// next person on a shared computer or phone sees none of it. The data is offline first, so what hasn't reached the
// account yet is pushed before anything is wiped; if that fails, the lifter chooses: try again, download a backup,
// or sign out anyway. Docs: docs/decisions/accounts-and-sign-in.md "Signing out wipes the device".
import { readAccount, signOut } from "./auth";
import { stopPush } from "./push";
import { useApp } from "./store";
import { syncNow } from "./sync";
import { readSync, type SyncState } from "./syncOutbox";
import { restartApp, writeOwner } from "./wipe";

/** How many changes on this device the account doesn't have yet. */
export function unsynced(s: SyncState = readSync(), events: number = useApp.getState().events.length): number {
  // Until the first full push after signing in, the whole history is still to go.
  if (!s.seeded) return events;
  return s.out.length + s.del.length + (s.rev !== s.sentRev ? 1 : 0);
}

export type SignOutResult = { ok: true } | { ok: false; waiting: number };

/** Pushes what's waiting, then signs out and wipes the device and starts the app again. With `force`, skips the push
 *  (the lifter chose "Sign out anyway"). Returns how much is still waiting when the push didn't get it all up. */
export async function signOutDevice({ force = false, restart = restartApp } = {}): Promise<SignOutResult> {
  if (!force && readAccount()) {
    await syncNow();
    // Also counts when the server ended the session meanwhile (syncNow forgets the account): it can't go up now.
    const waiting = unsynced();
    if (waiting > 0) return { ok: false, waiting };
  }
  await stopPush().catch(() => undefined);
  await signOut();
  await useApp.getState().wipeLocal();
  writeOwner(null);
  restart();
  return { ok: true };
}
