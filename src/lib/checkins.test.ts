import { describe, expect, it } from "vitest";

import { NOW } from "@/test/factories";

import { answerText, checkinFlags, fromTemplate, type Checkin } from "./checkins";

const DAY = 86_400_000;
const Q = [
  { id: "sleep", kind: "scale" as const, label: "Sleep" },
  { id: "gym", kind: "yesno" as const, label: "Gym" },
];
const ci = (x: Partial<Checkin>): Checkin => ({
  id: "c",
  coachId: "k",
  clientId: "me",
  formId: "f",
  title: "Weekly",
  questions: Q,
  sentAt: NOW - DAY,
  answers: null,
  answeredAt: null,
  ...x,
});

describe("check-in flags", () => {
  it("says when the latest check-in has waited three days or more", () => {
    expect(checkinFlags([ci({ sentAt: NOW - 2 * DAY })], NOW)).toEqual([]);
    expect(checkinFlags([ci({ sentAt: NOW - 4 * DAY })], NOW)).toEqual([{ kind: "checkinWaiting", title: "Weekly", days: 4 }]);
  });

  it("flags a score of 2 or less in the latest answer from the last two weeks", () => {
    const done = ci({ answers: { sleep: 2, gym: true }, answeredAt: NOW - DAY });
    expect(checkinFlags([done], NOW)).toEqual([{ kind: "checkinLow", label: "Sleep", value: 2 }]);
    expect(checkinFlags([ci({ answers: { sleep: 3 }, answeredAt: NOW - DAY })], NOW)).toEqual([]);
    expect(checkinFlags([ci({ answers: { sleep: 1 }, answeredAt: NOW - 20 * DAY })], NOW)).toEqual([]);
  });

  it("puts answers in words, and skipped ones say so", () => {
    expect(answerText(Q[0]!, 4)).toBe("4 of 5");
    expect(answerText(Q[1]!, false)).toBe("No");
    expect(answerText(Q[1]!, null)).toBe("Skipped");
  });

  it("templates come with their questions", () => {
    expect(fromTemplate("weekly").questions.map((q) => q.kind)).toEqual(["scale", "scale", "scale", "number", "text", "text"]);
    expect(fromTemplate("blank").questions).toHaveLength(1);
  });
});
