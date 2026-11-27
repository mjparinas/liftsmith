"use client";

// The free workout generator on the website (/tools/workout-generator/, docs/decisions/workout-generator.md). The
// choices are chips and a slider; every change asks /api/workout-generator/ for the workout, which runs the app's own
// engine on the server, so this page never loads the engine or a language catalogue. The address always carries the
// workout's code (`?w=`), so a copied or shared link opens the same workout. Only types come from the engine here.
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

import type { Equipment, Experience, Goal } from "@/lib/types";
import type { GenFocus, GenKit, GenOptions } from "@/lib/webWorkout";
import type { GenView } from "@/lib/webWorkoutView";
import type { GenUi } from "@/locales/site/tools/types";

import { chip } from "./chip";

export interface GeneratorProps {
  ui: GenUi;
  lang: string;
  initial: GenView;
  focuses: [GenFocus, string][];
  goals: Goal[];
  levels: Experience[];
  kits: [GenKit, Equipment[]][];
  groups: { title: string; items: [Equipment, string][] }[];
  minutes: { min: number; max: number; step: number };
}

const APP_PACKAGE = "com.getliftsmith.app";

/**
 * On Android, a link to our own site doesn't leave the browser for the app, so "Start this in the app" asks for the app
 * by name with the generator link (which the app turns into the routine, appLinks.ts) and falls back to the web app.
 */
const noSubscribe = () => () => {};
const isAndroid = () => /Android/i.test(navigator.userAgent);
const notAndroid = () => false;

function androidIntent(code: string, fallback: string): string {
  const path = `/tools/workout-generator/?w=${encodeURIComponent(code)}`;
  return `intent://www.getliftsmith.com${path}#Intent;scheme=https;package=${APP_PACKAGE};S.browser_fallback_url=${encodeURIComponent(fallback)};end`;
}

function query(o: GenOptions, lang: string): string {
  const q = new URLSearchParams({
    eq: o.equipment.join(","),
    min: String(o.minutes),
    focus: o.focus,
    goal: o.goal,
    level: o.level,
    pairs: o.pairs ? "1" : "0",
    seed: String(o.seed),
    lang,
  });
  return q.toString();
}

const PRIMARY = "press btn-primary inline-flex min-h-12 items-center justify-center rounded-2xl px-6 font-semibold";
const SECONDARY =
  "press inline-flex min-h-12 items-center justify-center rounded-2xl border border-line bg-surface px-6 font-semibold text-ink";

const same = (a: readonly string[], b: readonly string[]) => a.length === b.length && a.every((x) => b.includes(x));

export function WorkoutGenerator(p: GeneratorProps) {
  const { ui } = p;
  const [opts, setOpts] = useState<GenOptions>(p.initial.options);
  const [view, setView] = useState<GenView>(p.initial);
  const [state, setState] = useState<"idle" | "busy" | "error">("idle");
  const [custom, setCustom] = useState(false);
  const [copied, setCopied] = useState(false);
  const android = useSyncExternalStore(noSubscribe, isAndroid, notAndroid);
  const [example, setExample] = useState(true);
  // On a phone the workout is under the choices: after a change, a small button jumps to it while it's off screen.
  const [offScreen, setOffScreen] = useState(false);
  const [changed, setChanged] = useState(false);
  const result = useRef<HTMLElement | null>(null);
  const ask = useRef<AbortController | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchView = useCallback(async (q: string) => {
    ask.current?.abort();
    const ctl = new AbortController();
    ask.current = ctl;
    setState("busy");
    try {
      const res = await fetch(`/api/workout-generator/?${q}`, { signal: ctl.signal });
      if (!res.ok) throw new Error(String(res.status));
      const v = (await res.json()) as GenView;
      if (ctl.signal.aborted) return;
      setView(v);
      setOpts(v.options);
      setExample(false);
      setState("idle");
      const url = new URL(window.location.href);
      url.searchParams.set("w", v.code);
      window.history.replaceState(window.history.state, "", url);
    } catch {
      if (!ctl.signal.aborted) setState("error");
    }
  }, []);

  // A link with a workout in it opens that workout.
  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get("w");
    if (code && code !== p.initial.code)
      timer.current = setTimeout(() => void fetchView(new URLSearchParams({ w: code, lang: p.lang }).toString()), 0);
    return () => {
      ask.current?.abort();
      if (timer.current) clearTimeout(timer.current);
    };
  }, [fetchView, p.initial.code, p.lang]);

  useEffect(() => {
    const el = result.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([e]) => setOffScreen(!e!.isIntersecting), { threshold: 0.05 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  /** Applies a change and asks for the workout, a moment later for the slider so a drag sends one request. */
  const change = (next: Partial<GenOptions>, wait = 0) => {
    const o = { ...opts, ...next };
    setOpts(o);
    setCopied(false);
    setChanged(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => void fetchView(query(o, p.lang)), wait);
  };

  const kit = p.kits.find(([, eq]) => same(eq, opts.equipment))?.[0];
  const toggle = (e: Equipment) =>
    change({ equipment: opts.equipment.includes(e) ? opts.equipment.filter((x) => x !== e) : [...opts.equipment, e] }, 300);

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: view.title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      // Closed the share sheet, or the clipboard isn't allowed: nothing to do.
    }
  };

  const startHref = android ? androidIntent(view.code, view.appUrl) : view.appUrl;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] [&>*]:min-w-0">
      <div className="card space-y-6 p-5">
        <fieldset>
          <legend className="font-semibold">{ui.equipment}</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {p.kits.map(([k, eq]) => (
              <button
                key={k}
                type="button"
                aria-pressed={kit === k && !custom}
                className={chip(kit === k && !custom)}
                onClick={() => {
                  setCustom(false);
                  change({ equipment: eq });
                }}
              >
                {ui.kits[k]}
              </button>
            ))}
            <button
              type="button"
              aria-pressed={custom || !kit}
              aria-expanded={custom}
              className={chip(custom || !kit)}
              onClick={() => setCustom(!custom)}
            >
              {ui.custom}
            </button>
          </div>
          {custom ? (
            <div className="mt-4 space-y-4">
              <p className="text-sm text-muted">{ui.customHint}</p>
              {p.groups.map((g) => (
                <div key={g.title} role="group" aria-label={g.title}>
                  <p className="text-sm font-medium">{g.title}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {g.items.map(([e, name]) => (
                      <button
                        key={e}
                        type="button"
                        aria-pressed={opts.equipment.includes(e)}
                        className={chip(opts.equipment.includes(e))}
                        onClick={() => toggle(e)}
                      >
                        {name}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </fieldset>

        <div>
          <div className="flex items-baseline justify-between gap-3">
            <label htmlFor="gen-minutes" className="font-semibold">
              {ui.minutes}
            </label>
            <span className="num font-semibold">{ui.minutesValue.replace("{n}", String(opts.minutes))}</span>
          </div>
          <input
            id="gen-minutes"
            type="range"
            className="mt-3 w-full accent-[var(--color-accent)]"
            min={p.minutes.min}
            max={p.minutes.max}
            step={p.minutes.step}
            value={opts.minutes}
            aria-valuetext={ui.minutesValue.replace("{n}", String(opts.minutes))}
            onChange={(e) => change({ minutes: Number(e.target.value) }, 350)}
          />
        </div>

        <fieldset>
          <legend className="font-semibold">{ui.focus}</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {p.focuses.map(([f, name]) => (
              <button
                key={f}
                type="button"
                aria-pressed={opts.focus === f}
                className={chip(opts.focus === f)}
                onClick={() => change({ focus: f })}
              >
                {name}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="font-semibold">{ui.goal}</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {p.goals.map((g) => (
              <button
                key={g}
                type="button"
                aria-pressed={opts.goal === g}
                className={chip(opts.goal === g)}
                onClick={() => change({ goal: g })}
              >
                {ui.goals[g]}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="font-semibold">{ui.level}</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {p.levels.map((l) => (
              <button
                key={l}
                type="button"
                aria-pressed={opts.level === l}
                className={chip(opts.level === l)}
                onClick={() => change({ level: l })}
              >
                {ui.levels[l]}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="flex items-start justify-between gap-4">
          <span>
            <span className="font-semibold" id="gen-pairs">
              {ui.pairs}
            </span>
            <span className="mt-1 block text-sm text-muted" id="gen-pairs-hint">
              {ui.pairsHint}
            </span>
          </span>
          {/* The app's switch (ui.tsx Switch), drawn here so the page doesn't load the app's interface code. */}
          <button
            type="button"
            role="switch"
            aria-checked={opts.pairs}
            aria-labelledby="gen-pairs"
            aria-describedby="gen-pairs-hint"
            onClick={() => change({ pairs: !opts.pairs })}
            className={`group relative h-8 w-14 shrink-0 rounded-full border transition-colors duration-200 ${opts.pairs ? "border-transparent" : "border-line bg-raised"}`}
            style={opts.pairs ? { background: "linear-gradient(135deg, var(--grad-a), var(--grad-c))" } : undefined}
          >
            <span
              aria-hidden
              className="absolute left-[3px] top-[3px] h-6 w-6 rounded-full bg-white shadow-[0_2px_6px_rgb(0_0_0/0.35)] transition-transform duration-[460ms] ease-[var(--ease-bounce)]"
              style={{ transform: opts.pairs ? "translateX(24px)" : "translateX(0)" }}
            />
          </button>
        </div>
      </div>

      <section ref={result} id="gen-workout" className="card scroll-mt-24 p-5" aria-labelledby="gen-title" aria-busy={state === "busy"}>
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h2 id="gen-title" className="text-2xl font-bold tracking-tight">
            {view.title}
          </h2>
          <span className="num text-sm text-muted">{view.about}</span>
        </div>
        <p className="mt-2 text-sm text-muted" aria-live="polite">
          {state === "busy" ? ui.working : state === "error" ? ui.error : example ? ui.example : ui.order}
        </p>
        {view.short ? <p className="mt-2 text-sm text-warn">{view.short}</p> : null}
        {view.items.length ? (
          <ol className={`mt-4 space-y-3 transition-opacity ${state === "busy" ? "opacity-60" : ""}`}>
            {view.items.map((it, i) => (
              <li key={`${it.id}-${i}`} className="rounded-2xl border border-line bg-surface p-4">
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <a href={it.href} className="font-semibold underline-offset-2 hover:underline">
                    <span className="num text-muted">{i + 1}. </span>
                    {it.name}
                  </a>
                  <span className="num font-bold text-accent">{it.scheme}</span>
                </div>
                <p className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted">
                  {it.superset ? <span className="font-medium text-ink">{it.superset}</span> : null}
                  <span>{it.rest}</span>
                  <span>{it.effort}</span>
                  {it.warmups ? <span>{it.warmups}</span> : null}
                </p>
                <p className="mt-2 text-sm">{it.why}</p>
              </li>
            ))}
          </ol>
        ) : (
          <p className="mt-4 text-muted">{ui.nothing}</p>
        )}
        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          {view.items.length ? (
            <a href={startHref} className={PRIMARY} data-cta="tool-workout-generator-start">
              {ui.start}
            </a>
          ) : null}
          <button type="button" className={SECONDARY} onClick={() => change({ seed: opts.seed + 1 })}>
            {state === "error" ? ui.make : ui.another}
          </button>
          {view.items.length ? (
            <button type="button" className={SECONDARY} onClick={() => void share()}>
              {copied ? ui.copied : ui.share}
            </button>
          ) : null}
        </div>
        {view.items.length ? <p className="mt-3 text-sm text-muted">{ui.startHint}</p> : null}
      </section>
      {changed && offScreen ? (
        <a
          href="#gen-workout"
          className="press btn-primary fixed left-1/2 top-20 z-30 inline-flex min-h-11 -translate-x-1/2 items-center rounded-full px-5 text-sm font-semibold shadow-lg lg:hidden"
        >
          {ui.see}
        </a>
      ) : null}
    </div>
  );
}
