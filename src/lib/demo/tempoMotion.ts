// Tempo and paused lifts in the exercise demo. A paused squat and a back squat share one pose
// family, so before this they played the same animation and a swap from one to the other looked
// like nothing happened (Melvin, 2026-11-12: "Swapping a workout doesn't seem to change the 3D
// animation to match"). Lifts with a tempo (`TEMPOS` in tempo.ts, read from their own cues) now
// play that tempo: the slow lowering, the pause and its length, and the phase line says so
// ("Pause · 2s"). Same seconds as the tempo coach, so the demo, the how-to and the coach agree.
import { tempoOf, type Tempo } from "../tempo";
import type { PhaseRow } from "./rig";

const strip = (label: string) => label.replace(/\s*·\s*[\d.]+s$/, "");

/** The motion's phases replaced by the lift's tempo, or the phases as they are when it has none. */
export function tempoPhases(exerciseId: string | null | undefined, phases: PhaseRow[]): PhaseRow[] {
  const tempo = exerciseId ? tempoOf(exerciseId) : undefined;
  return tempo ? fromTempo(tempo, phases) : phases;
}

export function fromTempo(tempo: Tempo, phases: PhaseRow[]): PhaseRow[] {
  const fwd = phases.find((p) => p[2] > p[1]);
  const back = phases.find((p) => p[2] < p[1]);
  if (!fwd || !back) return phases;
  // The tempo's first move is the motion's 0 → 1 stroke (a squat lowers first, a deadlift pulls first).
  const firstMove = tempo.phases.find((p) => p.phase !== "hold")?.phase;
  if (!firstMove) return phases;
  const word = (dir: "down" | "up") => strip((dir === firstMove ? fwd : back)[3]);
  const effort = (dir: "down" | "up") => (dir === firstMove ? fwd : back)[4];

  const out: PhaseRow[] = [];
  const lead = phases[0];
  if (lead && lead[1] === lead[2] && lead[1] === 0) out.push(lead);
  // Group the moves into strokes (one way across 0..1); moves in a row that go the same way share a stroke.
  const moves = tempo.phases.filter((p) => p.phase !== "hold");
  let d = 0;
  let i = 0;
  for (const p of tempo.phases) {
    if (p.phase === "hold") {
      out.push([p.s, d, d, `Pause · ${p.s}s`, 0.7]);
      continue;
    }
    // this move's share of its stroke
    let start = i;
    while (start > 0 && moves[start - 1]!.phase === p.phase) start--;
    let end = i;
    while (end < moves.length - 1 && moves[end + 1]!.phase === p.phase) end++;
    const stroke = moves.slice(start, end + 1);
    const total = stroke.reduce((n, x) => n + x.s, 0);
    const before = stroke.slice(0, i - start).reduce((n, x) => n + x.s, 0);
    const toward = p.phase === firstMove ? 1 : 0;
    const from = toward ? before / total : 1 - before / total;
    const to = toward ? (before + p.s) / total : 1 - (before + p.s) / total;
    out.push([p.s, from, to, `${word(p.phase)} · ${p.s}s`, effort(p.phase)]);
    d = to;
    i++;
  }
  // a rep must end where it started, or the loop would jump
  return d === 0 ? out : phases;
}
