import "fake-indexeddb/auto";
import "@testing-library/jest-dom/vitest";

// Admin tests sign in with an emailed link alone; src/server/twoFactor.test.ts switches two-step back to required.
process.env.ADMIN_2FA ??= "optional";
