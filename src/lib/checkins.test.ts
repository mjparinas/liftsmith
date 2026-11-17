import { describe, expect, it } from "vitest";

import { NOW } from "@/test/factories";

import { answerText, checkinFlags, checkinTrends, fromTemplate, trendText, type Checkin } from "./checkins";

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
    expect(fromTemplate("weekly").questions.map((q) => q.kind)).toEqual(["scale", "scale", "scale", "weight", "text", "text"]);
    expect(fromTemplate("progress").questions.filter((q) => q.kind === "photo")).toHaveLength(2);
    expect(fromTemplate("blank").questions).toHaveLength(1);
  });
});

describe("check-in trends", () => {
  const W = [
    { id: "sleep", kind: "scale" as const, label: "Sleep" },
    { id: "kg", kind: "weight" as const, label: "Weight" },
    { id: "gym", kind: "yesno" as const, label: "Gym" },
    { id: "wins", kind: "text" as const, label: "Wins" },
  ];
  const week = (i: number, answers: Checkin["answers"], formId = "f") =>
    ci({ id: `c${i}`, formId, questions: W, sentAt: NOW - (10 - i) * 7 * DAY, answeredAt: NOW - (10 - i) * 7 * DAY + 3600_000, answers });

  it("follows each number, weight and yes or no question of the latest form, oldest first", () => {
    const list = [
      week(3, { sleep: 3, kg: 80, gym: false }),
      week(1, { sleep: 4, kg: 82, gym: true, wins: "PR" }),
      week(2, { sleep: null, kg: 81, gym: true }),
      week(0, { sleep: 5 }, "other"),
    ];
    const tr = checkinTrends(list);
    expect(tr.map((x) => [x.id, x.points])).toEqual([
      ["sleep", [4, 3]],
      ["kg", [82, 81, 80]],
      ["gym", [1, 1, 0]],
    ]);
    expect(trendText(tr[1]!, "kg")).toBe("80 kg, down 2 kg");
    expect(trendText(tr[0]!, "kg")).toBe("3 of 5, down 1");
    expect(trendText(tr[2]!, "kg")).toBe("Yes 2 of 3");
    expect(answerText(W[1]!, 80, "lb")).toBe("176.4 lb");
  });

  it("needs two answers, and a waiting check-in doesn't count", () => {
    expect(checkinTrends([week(1, { sleep: 4 }), ci({ questions: W })])).toEqual([]);
  });

  it("flags a score that fell two or more across the last three answers", () => {
    const list = [week(9, { sleep: 3 }), week(8, { sleep: 4 }), week(7, { sleep: 5 })];
    expect(checkinFlags(list, NOW)).toEqual([{ kind: "checkinDrop", label: "Sleep", from: 5, to: 3 }]);
    // Low enough to show as a low score: said once, not twice.
    expect(checkinFlags([week(9, { sleep: 2 }), week(8, { sleep: 4 })], NOW)).toEqual([{ kind: "checkinLow", label: "Sleep", value: 2 }]);
    expect(checkinFlags([week(9, { sleep: 4 }), week(8, { sleep: 5 })], NOW)).toEqual([]);
  });
});
