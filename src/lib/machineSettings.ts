import { exercise } from "./exercises";
import type { Equipment, Gym } from "./types";

// Machine settings memory (Melvin picked it, 2026-11-09). Seat height, pad and pin positions differ
// from machine to machine and gym to gym, and nobody remembers them. They're saved per exercise per
// gym as a few labelled values ("Seat 4", "Back pad 2") and shown on the exercise before the first
// set. Other apps offer one free-text note; labelled fields read at a glance and fill in quickly.

export interface Setting {
  label: string;
  value: string;
}

const BY_EQUIPMENT: Partial<Record<Equipment, string[]>> = {
  chestPress: ["Seat", "Handles"],
  shoulderPress: ["Seat", "Handles"],
  pecDeck: ["Seat", "Arm start"],
  latPulldown: ["Thigh pad", "Grip"],
  seatedRow: ["Seat", "Chest pad"],
  legPress: ["Back angle", "Foot position", "Safety stop"],
  hackSquat: ["Shoulder pads", "Foot position", "Safety stop"],
  legExtension: ["Back pad", "Shin pad", "Range start"],
  legCurl: ["Back pad", "Ankle pad", "Range start"],
  calfMachine: ["Shoulder pads"],
  smith: ["Bar hooks", "Safety stops"],
  rack: ["J-hooks", "Safety pins"],
  cable: ["Pulley height", "Attachment"],
  inclineBench: ["Bench angle"],
  dipBars: ["Width"],
};

const MAX = 4;

/** The labels to offer for an exercise, from the equipment it needs. Empty when there's nothing to set up. */
export function presetLabels(exerciseId: string): string[] {
  const ex = exercise(exerciseId);
  const out: string[] = [];
  for (const n of ex.needs) for (const l of BY_EQUIPMENT[n] ?? []) if (!out.includes(l)) out.push(l);
  return out.slice(0, MAX);
}

export function hasSettings(exerciseId: string): boolean {
  return presetLabels(exerciseId).length > 0;
}

export function settingsFor(gym: Gym, exerciseId: string): Setting[] {
  return gym.settings?.[exerciseId] ?? [];
}

/** One line for the exercise header: "Seat 4 · Back pad 2". */
export function settingsLine(list: readonly Setting[]): string {
  return list
    .filter((s) => s.value.trim())
    .map((s) => `${s.label} ${s.value.trim()}`)
    .join(" · ");
}

/** Saves the settings for an exercise on a gym, dropping empty values and keeping it small. */
export function withSettings(gym: Gym, exerciseId: string, list: readonly Setting[]): Gym {
  const clean = list
    .map((s) => ({ label: s.label.trim().slice(0, 24), value: s.value.trim().slice(0, 16) }))
    .filter((s) => s.label && s.value)
    .slice(0, MAX);
  const settings = { ...(gym.settings ?? {}) };
  if (clean.length) settings[exerciseId] = clean;
  else delete settings[exerciseId];
  return { ...gym, settings };
}
