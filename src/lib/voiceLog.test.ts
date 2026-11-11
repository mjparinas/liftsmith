import { describe, expect, it } from "vitest";

import { LANGS } from "./i18n";
import { parseBest, parseVoice, rirFor, voiceHints } from "./voiceLog";

describe("parseVoice", () => {
  it("reads weight for reps in English", () => {
    expect(parseVoice("100 for 8", "en")).toEqual({ weight: 100, reps: 8 });
    expect(parseVoice("100 kilos for 8 reps", "en")).toEqual({ weight: 100, reps: 8 });
    expect(parseVoice("135 pounds by 5", "en")).toEqual({ weight: 135, reps: 5 });
    expect(parseVoice("100x8", "en")).toEqual({ weight: 100, reps: 8 });
    expect(parseVoice("62.5 × 10", "en")).toEqual({ weight: 62.5, reps: 10 });
    expect(parseVoice("100 for eight", "en")).toEqual({ weight: 100, reps: 8 });
    expect(parseVoice("a hundred for eight", "en")).toEqual({ weight: 100, reps: 8 });
  });

  it("reads 'for' heard as 4 between two numbers", () => {
    expect(parseVoice("100 4 8", "en")).toEqual({ weight: 100, reps: 8 });
  });

  it("reads the reps first when they're named first", () => {
    expect(parseVoice("8 reps at 100", "en")).toEqual({ weight: 100, reps: 8 });
  });

  it("reads reps alone and weight alone", () => {
    expect(parseVoice("8 reps", "en")).toEqual({ reps: 8 });
    expect(parseVoice("12", "en")).toEqual({ reps: 12 });
    expect(parseVoice("100 kilos", "en")).toEqual({ weight: 100 });
  });

  it("leaves out numbers that can't be a set", () => {
    expect(parseVoice("2026", "en")).toBeNull();
    expect(parseVoice("100 for 0", "en")).toBeNull();
    expect(parseVoice("100 for 8.5", "en")).toBeNull();
    expect(parseVoice("the weather is nice", "en")).toBeNull();
    expect(parseVoice("", "en")).toBeNull();
  });

  it("reads how it felt", () => {
    expect(parseVoice("too easy", "en")).toEqual({ rating: 1 });
    expect(parseVoice("to easy", "en")).toEqual({ rating: 1 });
    expect(parseVoice("2 easy", "en")).toEqual({ rating: 1 });
    expect(parseVoice("too hard", "en")).toEqual({ rating: -1 });
    expect(parseVoice("way too heavy", "en")).toEqual({ rating: -1 });
    expect(parseVoice("just right", "en")).toEqual({ rating: 0 });
  });

  it("reads a set and how it felt together", () => {
    expect(parseVoice("100 for 8 too easy", "en")).toEqual({ weight: 100, reps: 8, rating: 1 });
    expect(parseVoice("too hard, 80 for 6", "en")).toEqual({ weight: 80, reps: 6, rating: -1 });
  });

  it("reads log and undo", () => {
    expect(parseVoice("log it", "en")).toEqual({ log: true });
    expect(parseVoice("done", "en")).toEqual({ log: true });
    expect(parseVoice("undo", "en")).toEqual({ undo: true });
    expect(parseVoice("scratch that", "en")).toEqual({ undo: true });
  });

  it("reads every language", () => {
    expect(parseVoice("100 por 8", "es")).toEqual({ weight: 100, reps: 8 });
    expect(parseVoice("62,5 kilos por ocho repeticiones", "es")).toEqual({ weight: 62.5, reps: 8 });
    expect(parseVoice("demasiado fácil", "es")).toEqual({ rating: 1 });
    expect(parseVoice("muy difícil", "es")).toEqual({ rating: -1 });
    expect(parseVoice("deshacer", "es")).toEqual({ undo: true });

    expect(parseVoice("100 pour 8", "fr")).toEqual({ weight: 100, reps: 8 });
    expect(parseVoice("80 kilos fois dix-huit", "fr")).toEqual({ weight: 80, reps: 18 });
    expect(parseVoice("trop facile", "fr")).toEqual({ rating: 1 });
    expect(parseVoice("trop dur", "fr")).toEqual({ rating: -1 });
    expect(parseVoice("annuler", "fr")).toEqual({ undo: true });

    expect(parseVoice("100 Kilo für 8 Wiederholungen", "de")).toEqual({ weight: 100, reps: 8 });
    expect(parseVoice("100 mal acht", "de")).toEqual({ weight: 100, reps: 8 });
    expect(parseVoice("zu leicht", "de")).toEqual({ rating: 1 });
    expect(parseVoice("zu schwer", "de")).toEqual({ rating: -1 });
    expect(parseVoice("Rückgängig", "de")).toEqual({ undo: true });

    expect(parseVoice("100 per 8", "it")).toEqual({ weight: 100, reps: 8 });
    expect(parseVoice("100 chili per otto ripetizioni", "it")).toEqual({ weight: 100, reps: 8 });
    expect(parseVoice("troppo facile", "it")).toEqual({ rating: 1 });
    expect(parseVoice("troppo pesante", "it")).toEqual({ rating: -1 });
    expect(parseVoice("annulla", "it")).toEqual({ undo: true });

    expect(parseVoice("100キロで8回", "ja")).toEqual({ weight: 100, reps: 8 });
    expect(parseVoice("１００キロで８回", "ja")).toEqual({ weight: 100, reps: 8 });
    expect(parseVoice("8回", "ja")).toEqual({ reps: 8 });
    expect(parseVoice("簡単すぎ", "ja")).toEqual({ rating: 1 });
    expect(parseVoice("きつい", "ja")).toEqual({ rating: -1 });
    expect(parseVoice("取り消し", "ja")).toEqual({ undo: true });
  });

  it("doesn't match a phrase inside another word", () => {
    // "bien" is about right in Spanish, but not inside "también".
    expect(parseVoice("también", "es")).toBeNull();
  });
});

describe("parseBest", () => {
  it("takes the first guess that reads as something to do", () => {
    expect(parseBest(["hello there", "100 for 8"], "en")).toEqual({ text: "100 for 8", command: { weight: 100, reps: 8 } });
    expect(parseBest(["hello"], "en")).toBeNull();
  });
});

describe("rirFor", () => {
  it("maps how it felt to reps left", () => {
    expect(rirFor(1, 2)).toBe(4);
    expect(rirFor(0, 2)).toBe(2);
    expect(rirFor(-1, 2)).toBe(0);
  });
});

describe("voiceHints", () => {
  it("has hints in every language", () => {
    for (const l of LANGS) expect(voiceHints(l).length).toBeGreaterThan(3);
  });
});
