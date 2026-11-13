// Whether an account takes part in coaching, which decides if the desktop sidebar shows Coaching.
import { describe, expect, it } from "vitest";

import { usesCoaching } from "./trainer";

const person = { id: "p1", name: "Ana", since: 1 } as never;

describe("usesCoaching", () => {
  it("is off for a lifter with no coach, client, invite or role", () => {
    expect(usesCoaching({ coaches: [], clients: [], invite: null, role: null })).toBe(false);
  });

  it("is on for a client, a coach with clients, a coach with an invite out, or one who picked a role", () => {
    expect(usesCoaching({ coaches: [person] })).toBe(true);
    expect(usesCoaching({ coaches: [], clients: [person] })).toBe(true);
    expect(usesCoaching({ coaches: [], invite: { code: "ABC123", expiresAt: 2 } })).toBe(true);
    expect(usesCoaching({ coaches: [], role: "trainer" })).toBe(true);
  });
});
