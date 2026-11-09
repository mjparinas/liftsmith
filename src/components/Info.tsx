"use client";
import { GLOSSARY, type Term } from "@/lib/glossary";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";

// The "i" button next to a label that isn't obvious (Melvin, 2026-11-09). Tapping it opens a short
// plain-language explanation from the glossary. One component everywhere: the app and the web
// dashboard. A 44 px tap target with a small visible circle, a labelled dialog, Escape or Got it to
// close, and focus returns to the button.

export function Info({ term, className = "" }: { term: Term; className?: string }) {
  const [open, setOpen] = useState(false);
  const btn = useRef<HTMLButtonElement>(null);
  const ok = useRef<HTMLButtonElement>(null);
  const id = useId();
  const { title, body } = GLOSSARY[term];

  const close = useCallback(() => {
    setOpen(false);
    btn.current?.focus();
  }, []);

  useEffect(() => {
    if (!open) return;
    ok.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  return (
    <>
      <button
        ref={btn}
        type="button"
        aria-label={`What is ${title.toLowerCase()}?`}
        aria-haspopup="dialog"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
        className={`press -my-3 inline-grid h-11 w-11 shrink-0 place-items-center align-middle normal-case tracking-normal ${className}`}
      >
        <span aria-hidden className="grid h-5 w-5 place-items-center rounded-full border border-current text-[11px] font-bold leading-none text-muted">i</span>
      </button>
      {open && createPortal(
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 p-4 sm:items-center" onClick={close}>
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={`${id}-t`}
            className="animate-rise safe-bottom w-full max-w-md rounded-3xl border border-line bg-surface p-5 text-left normal-case tracking-normal text-ink"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id={`${id}-t`} className="text-lg font-semibold">{title}</h2>
            <div className="mt-2 space-y-2 text-[15px] leading-relaxed text-muted">
              {body.map((p) => <p key={p}>{p}</p>)}
            </div>
            <button ref={ok} type="button" onClick={close} className="press mt-4 min-h-11 w-full rounded-2xl bg-accent px-5 py-3 font-semibold text-accent-ink">Got it</button>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
