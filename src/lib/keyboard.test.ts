// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { keyboardUp, typingFocused, useKeyboardViewport } from "./keyboard";

describe("keyboardUp", () => {
  it("needs a focused text box and a view well short of its tallest", () => {
    expect(keyboardUp(400, 800, true)).toBe(true);
    expect(keyboardUp(400, 800, false)).toBe(false);
    // A browser bar sliding away is not a keyboard.
    expect(keyboardUp(740, 800, true)).toBe(false);
  });
});

describe("typingFocused", () => {
  it("counts text boxes and text areas, not buttons, switches or read-only boxes", () => {
    const area = document.createElement("textarea");
    const text = document.createElement("input");
    const box = document.createElement("input");
    box.type = "checkbox";
    const locked = document.createElement("input");
    locked.readOnly = true;
    expect(typingFocused(area)).toBe(true);
    expect(typingFocused(text)).toBe(true);
    expect(typingFocused(box)).toBe(false);
    expect(typingFocused(locked)).toBe(false);
    expect(typingFocused(document.createElement("button"))).toBe(false);
    expect(typingFocused(null)).toBe(false);
  });
});

/** A visual viewport the test can shrink, as the keyboard does. */
class FakeViewport extends EventTarget {
  width = 390;
  height = 800;
  offsetTop = 0;
  resize(height: number, offsetTop = 0) {
    this.height = height;
    this.offsetTop = offsetTop;
    this.dispatchEvent(new Event("resize"));
  }
}

describe("useKeyboardViewport", () => {
  const root = document.documentElement;
  afterEach(() => {
    Object.defineProperty(window, "visualViewport", { value: undefined, configurable: true });
    document.body.innerHTML = "";
  });

  it("follows the visible part of the page and marks the keyboard while typing", () => {
    const vv = new FakeViewport();
    Object.defineProperty(window, "visualViewport", { value: vv, configurable: true });
    const area = document.body.appendChild(document.createElement("textarea"));
    const hook = renderHook(() => useKeyboardViewport());
    expect(root.style.getPropertyValue("--vv-h")).toBe("800px");
    expect(root.dataset.keyboard).toBeUndefined();

    act(() => {
      area.focus();
      vv.resize(460, 120);
    });
    expect(root.style.getPropertyValue("--vv-h")).toBe("460px");
    expect(root.style.getPropertyValue("--vv-top")).toBe("120px");
    expect(root.dataset.keyboard).toBe("");

    act(() => {
      area.blur();
      vv.resize(800);
    });
    expect(root.dataset.keyboard).toBeUndefined();

    hook.unmount();
    expect(root.style.getPropertyValue("--vv-h")).toBe("");
  });

  it("does nothing when the screen doesn't ask", () => {
    Object.defineProperty(window, "visualViewport", { value: new FakeViewport(), configurable: true });
    renderHook(() => useKeyboardViewport(false));
    expect(root.style.getPropertyValue("--vv-h")).toBe("");
  });
});
