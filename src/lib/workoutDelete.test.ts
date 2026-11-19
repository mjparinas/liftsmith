// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const removeWorkout = vi.fn(async () => true);
const social = vi.fn(async () => ({}));
let account: { id: string; token: string } | null = { id: "a1", token: "t" };
vi.mock("./health", () => ({ removeWorkout }));
vi.mock("./social", () => ({ social }));
vi.mock("./auth", () => ({ readAccount: () => account }));

const { afterDelete, cancelDelete, flushDeletes, retryUnposts, UNDO_MS } = await import("./workoutDelete");

// Deleting a workout: its Health copy and Friends post go once Undo is over, never when it's undone.
describe("after a workout is deleted", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    removeWorkout.mockClear();
    social.mockReset();
    social.mockImplementation(async () => ({}));
    account = { id: "a1", token: "t" };
    localStorage.clear();
  });
  afterEach(() => vi.useRealTimers());

  it("removes the Health copy (with its time) and the post once Undo is over", async () => {
    afterDelete("w1", { start: 1, end: 2 });
    await vi.advanceTimersByTimeAsync(UNDO_MS - 1);
    expect(removeWorkout).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    expect(removeWorkout).toHaveBeenCalledWith("w1", { start: 1, end: 2 });
    expect(social).toHaveBeenCalledWith("unpost", { workoutId: "w1" });
  });

  it("Undo keeps both", async () => {
    afterDelete("w1");
    cancelDelete("w1");
    await vi.advanceTimersByTimeAsync(UNDO_MS * 2);
    expect(removeWorkout).not.toHaveBeenCalled();
    expect(social).not.toHaveBeenCalled();
  });

  it("does it at once when the app is put away", async () => {
    afterDelete("w1");
    await flushDeletes();
    expect(removeWorkout).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(UNDO_MS);
    expect(removeWorkout).toHaveBeenCalledTimes(1);
  });

  it("skips Friends when signed out", async () => {
    account = null;
    afterDelete("w1");
    await vi.advanceTimersByTimeAsync(UNDO_MS);
    expect(social).not.toHaveBeenCalled();
  });

  it("keeps a post it couldn't take down and tries again after the next sync", async () => {
    social.mockRejectedValueOnce(new Error("offline"));
    afterDelete("w1");
    await vi.advanceTimersByTimeAsync(UNDO_MS);
    expect(localStorage.getItem("liftsmith.unpost")).toBe('["w1"]');
    await retryUnposts();
    expect(social).toHaveBeenLastCalledWith("unpost", { workoutId: "w1" });
    expect(localStorage.getItem("liftsmith.unpost")).toBeNull();
  });
});
