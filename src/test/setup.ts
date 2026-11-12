import "fake-indexeddb/auto";
import "@testing-library/jest-dom/vitest";

// Admin tests sign in with an emailed link alone; src/server/twoFactor.test.ts switches two-step back to required.
process.env.ADMIN_2FA ??= "optional";

// Friends keeps its last feed in memory (src/lib/socialCache.ts); each test starts without one.
const { beforeEach } = await import("vitest");
const { forgetFriends } = await import("@/lib/socialCache");
beforeEach(() => forgetFriends());
