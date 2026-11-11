// Unsubscribing from a native plugin's event, whatever addListener handed back.
//
// The app reaches its own plugins through `window.Capacitor.Plugins`. There, Android's bridge returns the
// handle itself ({ remove }), while iOS and `registerPlugin` return a promise of it. Calling `.then` on
// Android's plain handle threw "i.then is not a function" when the workout screen closed, which broke
// the screen the lifter was going to (Today, on Android, 2026-11-11). Every native listener goes through here.

export type ListenerHandle = { remove(): Promise<void> | void };

/** Returns an unsubscribe function for a handle or a promise of one. Never throws. */
export function unlisten(handle: ListenerHandle | Promise<ListenerHandle> | undefined | null): () => void {
  return () =>
    void Promise.resolve(handle)
      .then((h) => h?.remove())
      .catch(() => {});
}
