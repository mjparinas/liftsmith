// The workout's keyboard shortcuts on the desktop layout (KeyboardLog.tsx): L logs, ↑ ↓ reps, Shift ↑ ↓ weight,
// and nothing with Ctrl, Cmd or Alt held.
import { describe, expect, it, vi } from "vitest";

import { keyAction } from "./KeyboardLog";

const key = (k: string, over: Partial<KeyboardEvent> = {}) => ({
  key: k,
  shiftKey: false,
  ctrlKey: false,
  metaKey: false,
  altKey: false,
  ...over,
});

describe("keyAction", () => {
  const keys = () => ({
    onLog: vi.fn(),
    weight: { onUp: vi.fn(), onDown: vi.fn() },
    reps: { onUp: vi.fn(), onDown: vi.fn() },
  });

  it("maps L to Log set, the arrows to reps and Shift with the arrows to weight", () => {
    const k = keys();
    keyAction(key("l"), k)?.();
    keyAction(key("L"), k)?.();
    keyAction(key("ArrowUp"), k)?.();
    keyAction(key("ArrowDown"), k)?.();
    keyAction(key("ArrowUp", { shiftKey: true }), k)?.();
    keyAction(key("ArrowDown", { shiftKey: true }), k)?.();
    expect(k.onLog).toHaveBeenCalledTimes(2);
    expect(k.reps.onUp).toHaveBeenCalledOnce();
    expect(k.reps.onDown).toHaveBeenCalledOnce();
    expect(k.weight.onUp).toHaveBeenCalledOnce();
    expect(k.weight.onDown).toHaveBeenCalledOnce();
  });

  it("leaves the browser's own shortcuts and other keys alone", () => {
    const k = keys();
    expect(keyAction(key("l", { ctrlKey: true }), k)).toBeNull();
    expect(keyAction(key("l", { metaKey: true }), k)).toBeNull();
    expect(keyAction(key("ArrowUp", { altKey: true }), k)).toBeNull();
    expect(keyAction(key("Enter"), k)).toBeNull();
    expect(keyAction(key(" "), k)).toBeNull();
  });

  it("does nothing for weight on a bodyweight lift", () => {
    expect(keyAction(key("ArrowUp", { shiftKey: true }), { onLog: () => {}, weight: null, reps: null })).toBeNull();
  });
});
