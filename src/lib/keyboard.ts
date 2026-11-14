// The on-screen keyboard and the part of the screen it leaves (Melvin, 2026-11-13: "the text input should stay fixed on
// the bottom and the viewport should scroll", for coach messages on phones). Each platform shows the keyboard its own
// way: Android's app shrinks the whole web view (Capacitor's SystemBars pads it by the keyboard), Chrome on Android and
// Safari and the iOS app only shrink the visual viewport and leave the page as tall as before. The visual viewport is
// the part still visible in every case, so a screen that keeps its own box on screen sizes it from that:
//   --vv-h    the visible height, in px
//   --vv-top  how far the visible part has scrolled down the page (iOS scrolls it to show the focused box)
// and <html data-keyboard> is set while the keyboard is up, which hides the tab bar (globals.css) so the send box sits
// right on the keyboard. Nothing runs unless a screen asks (useKeyboardViewport), and nothing on a desktop or in a
// browser without visualViewport (jsdom), where the CSS falls back to 100dvh.
import { useEffect } from "react";

/** The keyboard is up when a text box has focus and the visible height dropped this much below its tallest. */
const KEYBOARD_PX = 120;

/** True when the focused element takes typing (a text box, a text area or an editable block). */
export function typingFocused(el: Element | null): boolean {
  if (!el) return false;
  if (el instanceof HTMLTextAreaElement) return !el.readOnly && !el.disabled;
  if (el instanceof HTMLInputElement) {
    const kind = el.type || "text";
    return !el.readOnly && !el.disabled && ["text", "search", "email", "url", "tel", "number", "password"].includes(kind);
  }
  return el instanceof HTMLElement && el.isContentEditable === true;
}

/** Whether the keyboard covers part of the screen: a text box has focus and the view is well short of its tallest. */
export function keyboardUp(height: number, tallest: number, focused: boolean): boolean {
  return focused && tallest - height >= KEYBOARD_PX;
}

/** While a screen is shown, keep --vv-h, --vv-top and data-keyboard on <html> in step with the visible part of the page. */
export function useKeyboardViewport(on = true): void {
  useEffect(() => {
    const vv = typeof window === "undefined" ? undefined : window.visualViewport;
    if (!on || !vv) return;
    const root = document.documentElement;
    // The tallest the view has been at this width: turning the phone starts over.
    let width = Math.round(vv.width);
    let tallest = vv.height;
    const update = () => {
      if (Math.round(vv.width) !== width) {
        width = Math.round(vv.width);
        tallest = vv.height;
      }
      const up = keyboardUp(vv.height, tallest, typingFocused(document.activeElement));
      if (!up) tallest = Math.max(tallest, vv.height);
      root.style.setProperty("--vv-h", `${Math.round(vv.height)}px`);
      root.style.setProperty("--vv-top", `${Math.round(vv.offsetTop)}px`);
      if (up) root.dataset.keyboard = "";
      else delete root.dataset.keyboard;
    };
    update();
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    // Focus moves before the keyboard opens and after it closes; the resize that follows settles it.
    document.addEventListener("focusin", update);
    document.addEventListener("focusout", update);
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
      document.removeEventListener("focusin", update);
      document.removeEventListener("focusout", update);
      root.style.removeProperty("--vv-h");
      root.style.removeProperty("--vv-top");
      delete root.dataset.keyboard;
    };
  }, [on]);
}
