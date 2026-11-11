import type { Lang } from "./i18n";
import type { Rating } from "./types";

// Voice set logging (a lab, Settings › Labs): the lifter says "100 for 8", "8 reps", "too easy" or
// "undo", the phone's own speech recognizer writes it down (src/lib/speech.ts), and this file turns
// the words into what to do. Pure, so every phrase in every language is tested (voiceLog.test.ts).
//
// The phrase lists are data for matching what people say, not text the app shows, so they live here
// by language rather than in the catalogues. Recognizers mostly write numbers as digits; small number
// words ("for eight") and decimal commas ("62,5") are turned into digits first.

/** What one utterance asks for. Weight is in the unit the lifter trains in (the gym's), as said. */
export interface VoiceCommand {
  weight?: number;
  reps?: number;
  /** Log the set as it stands ("log it", "done"), when no numbers were said. */
  log?: boolean;
  /** How it felt: 1 too easy, 0 about right, -1 too hard (the same scale as exercise feedback). */
  rating?: Rating;
  undo?: boolean;
}

interface Words {
  /** Between the weight and the reps: "100 for 8". */
  by: string[];
  /** After a number that is the weight. */
  unit: string[];
  /** After a number that is the reps. */
  reps: string[];
  easy: string[];
  right: string[];
  hard: string[];
  log: string[];
  undo: string[];
  /** Number words, 0 upward, so "for eight" reads as "for 8". */
  nums: string[];
}

// Longer phrases come before the shorter ones they contain ("too easy" before "easy").
const WORDS: Record<Lang, Words> = {
  en: {
    by: ["for", "by", "x", "times", "at"],
    unit: ["kilograms", "kilogram", "kilos", "kilo", "kgs", "kg", "pounds", "pound", "lbs", "lb"],
    reps: ["repetitions", "repetition", "reps", "rep"],
    easy: ["too easy", "to easy", "2 easy", "way too easy", "easy", "too light", "light"],
    right: ["just right", "about right", "perfect", "right", "good"],
    hard: ["too hard", "to hard", "2 hard", "too heavy", "to heavy", "hard", "heavy", "tough"],
    log: ["log it", "log set", "log", "done", "next"],
    undo: ["scratch that", "undo"],
    nums: [
      "zero",
      "one",
      "two",
      "three",
      "four",
      "five",
      "six",
      "seven",
      "eight",
      "nine",
      "ten",
      "eleven",
      "twelve",
      "thirteen",
      "fourteen",
      "fifteen",
      "sixteen",
      "seventeen",
      "eighteen",
      "nineteen",
      "twenty",
    ],
  },
  es: {
    by: ["por", "x", "a", "con"],
    unit: ["kilogramos", "kilogramo", "kilos", "kilo", "kg", "libras", "libra", "lbs", "lb"],
    reps: ["repeticiones", "repetición", "repeticion", "reps", "rep"],
    easy: ["demasiado fácil", "muy fácil", "demasiado facil", "muy facil", "fácil", "facil", "ligero"],
    right: ["perfecto", "justo", "bien"],
    hard: ["demasiado difícil", "muy difícil", "demasiado difícil", "muy dificil", "difícil", "dificil", "muy pesado", "pesado", "duro"],
    log: ["registrar", "registra", "listo", "hecho", "siguiente"],
    undo: ["deshacer", "deshaz"],
    nums: [
      "cero",
      "uno",
      "dos",
      "tres",
      "cuatro",
      "cinco",
      "seis",
      "siete",
      "ocho",
      "nueve",
      "diez",
      "once",
      "doce",
      "trece",
      "catorce",
      "quince",
      "dieciséis",
      "diecisiete",
      "dieciocho",
      "diecinueve",
      "veinte",
    ],
  },
  fr: {
    by: ["pour", "fois", "x", "par", "à"],
    unit: ["kilogrammes", "kilogramme", "kilos", "kilo", "kg", "livres", "livre", "lbs", "lb"],
    reps: ["répétitions", "répétition", "repetitions", "reps", "rép", "rep"],
    easy: ["trop facile", "trop léger", "facile", "léger"],
    right: ["parfait", "pile", "juste", "bien"],
    hard: ["trop difficile", "trop dur", "trop lourd", "difficile", "dur", "lourd"],
    log: ["enregistrer", "enregistre", "valider", "valide", "c'est fait", "fini", "suivant"],
    undo: ["annuler", "annule"],
    nums: [
      "zéro",
      "un",
      "deux",
      "trois",
      "quatre",
      "cinq",
      "six",
      "sept",
      "huit",
      "neuf",
      "dix",
      "onze",
      "douze",
      "treize",
      "quatorze",
      "quinze",
      "seize",
      "dix-sept",
      "dix-huit",
      "dix-neuf",
      "vingt",
    ],
  },
  de: {
    by: ["für", "fur", "mal", "x", "bei", "mit"],
    unit: ["kilogramm", "kilos", "kilo", "kg", "pfund", "lbs", "lb"],
    reps: ["wiederholungen", "wiederholung", "wdh", "reps", "rep"],
    easy: ["viel zu leicht", "zu leicht", "zu einfach", "leicht", "einfach"],
    right: ["genau richtig", "passt", "perfekt", "richtig", "gut"],
    hard: ["zu schwer", "zu hart", "schwer", "hart", "anstrengend"],
    log: ["eintragen", "speichern", "fertig", "erledigt", "weiter"],
    undo: ["rückgängig", "ruckgangig", "zurück"],
    nums: [
      "null",
      "eins",
      "zwei",
      "drei",
      "vier",
      "fünf",
      "sechs",
      "sieben",
      "acht",
      "neun",
      "zehn",
      "elf",
      "zwölf",
      "dreizehn",
      "vierzehn",
      "fünfzehn",
      "sechzehn",
      "siebzehn",
      "achtzehn",
      "neunzehn",
      "zwanzig",
    ],
  },
  it: {
    by: ["per", "x", "da", "con"],
    unit: ["chilogrammi", "chilogrammo", "chili", "chilo", "kili", "kilo", "kg", "libbre", "libbra", "lbs", "lb"],
    reps: ["ripetizioni", "ripetizione", "reps", "rep"],
    easy: ["troppo facile", "troppo leggero", "facile", "leggero"],
    right: ["perfetto", "giusto", "bene"],
    hard: ["troppo difficile", "troppo pesante", "troppo duro", "difficile", "pesante", "duro"],
    log: ["registra", "fatto", "finito", "avanti"],
    undo: ["annulla"],
    nums: [
      "zero",
      "uno",
      "due",
      "tre",
      "quattro",
      "cinque",
      "sei",
      "sette",
      "otto",
      "nove",
      "dieci",
      "undici",
      "dodici",
      "tredici",
      "quattordici",
      "quindici",
      "sedici",
      "diciassette",
      "diciotto",
      "diciannove",
      "venti",
    ],
  },
  ja: {
    by: ["キロで", "kgで", "ポンドで", "で", "x", "かける"],
    unit: ["キログラム", "キロ", "kg", "ポンド", "lb"],
    reps: ["レップ", "回", "かい", "reps", "rep"],
    easy: ["簡単すぎ", "かんたんすぎ", "軽すぎ", "楽すぎ", "簡単", "かんたん", "軽い", "楽"],
    right: ["ちょうどいい", "ちょうど良い", "丁度いい", "ちょうど", "いい感じ", "普通"],
    hard: ["きつすぎ", "キツすぎ", "重すぎ", "難しい", "きつい", "キツい", "キツイ", "重い"],
    log: ["記録", "完了", "終わり", "できた", "次"],
    undo: ["取り消し", "元に戻す", "戻して"],
    nums: [],
  },
};

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Matches one phrase as whole words (Japanese has no spaces, so there it's a plain match). */
function has(text: string, phrase: string, lang: Lang): boolean {
  if (lang === "ja") return text.includes(phrase);
  return new RegExp(`(^|[^\\p{L}\\p{N}])${escape(phrase)}(?=$|[^\\p{L}\\p{N}])`, "u").test(text);
}

function first(text: string, phrases: string[], lang: Lang): boolean {
  return phrases.some((p) => has(text, p, lang));
}

function normalise(raw: string, lang: Lang): string {
  // NFKC turns full-width digits and letters (Japanese input) into plain ones.
  let s = raw.normalize("NFKC").toLowerCase().trim();
  // "×" and "*" between numbers, and a decimal comma (62,5) in the languages that use one.
  s = s.replace(/[×*]/g, " x ");
  s = s.replace(/(\d),(\d)/g, "$1.$2");
  // "100x8" and "8reps": room between digits and letters.
  s = s.replace(/(\d)([a-z])/g, "$1 $2").replace(/([a-z])(\d)/g, "$1 $2");
  // Number words to digits, longest first so "dix-sept" isn't read as "dix".
  const nums = WORDS[lang].nums.map((w, n) => [w, n] as const).sort((a, b) => b[0].length - a[0].length);
  for (const [w, n] of nums) s = s.replace(new RegExp(`(^|[^\\p{L}])${escape(w)}(?=$|[^\\p{L}])`, "gu"), `$1${n}`);
  // English "a hundred" and "two hundred" (recognizers usually write 100 and 200 themselves).
  s = s.replace(/(?:^|\s)(?:a|one) hundred/g, " 100").replace(/(\d+) hundred/g, (_, a: string) => String(Number(a) * 100));
  return s.replace(/\s+/g, " ").trim();
}

interface Num {
  value: number;
  start: number;
  end: number;
}

function numbers(s: string): Num[] {
  return [...s.matchAll(/\d+(?:\.\d+)?/g)].map((m) => ({ value: Number(m[0]), start: m.index, end: m.index + m[0].length }));
}

/** The words between two positions, trimmed. */
const between = (s: string, a: number, b: number) => s.slice(a, b).trim();

/** Whether the text starts with one of the phrases (as a whole word outside Japanese). */
function startsWith(text: string, phrases: string[], lang: Lang): boolean {
  return phrases.some((p) => text === p || text.startsWith(lang === "ja" ? p : `${p} `));
}

/** The text without one leading phrase from the list. */
function stripLead(text: string, phrases: string[], lang: Lang): string {
  const hit = [...phrases].sort((a, b) => b.length - a.length).find((p) => startsWith(text, [p], lang));
  return hit ? text.slice(hit.length).trim() : text;
}

/** Reads one utterance. Null when nothing in it is something to do. */
export function parseVoice(raw: string, lang: Lang): VoiceCommand | null {
  const w = WORDS[lang];
  const s = normalise(raw, lang);
  if (!s) return null;
  const out: VoiceCommand = {};

  if (first(s, w.undo, lang)) return { undo: true };

  // Ratings first, and cut out of the text, so "too easy" can't leave a stray "2" behind in English.
  let rest = s;
  const rate = (list: string[], r: Rating) => {
    if (out.rating !== undefined) return;
    const hit = [...list].sort((a, b) => b.length - a.length).find((p) => has(rest, p, lang));
    if (hit) {
      out.rating = r;
      rest = rest.replace(hit, " ");
    }
  };
  // "Not too hard" is rare in the gym; the strong phrases go first.
  rate(w.easy, 1);
  rate(w.hard, -1);
  rate(w.right, 0);

  const ns = numbers(rest);
  if (ns.length >= 2) {
    const a = ns[0]!;
    // English "100 for 8" heard as "100 4 8": a lone 4 between two numbers is the word "for".
    const b = lang === "en" && ns.length >= 3 && ns[1]!.value === 4 ? ns[2]! : ns[1]!;
    const mid = between(rest, a.end, b.start);
    const bare = stripLead(stripLead(mid, w.unit, lang), w.by, lang);
    if (startsWith(mid, w.reps, lang)) {
      // "8 reps at 100" says the reps first.
      out.reps = a.value;
      out.weight = b.value;
    } else if (!bare || (lang === "en" && bare === "4") || first(rest.slice(b.end), w.reps, lang)) {
      out.weight = a.value;
      out.reps = b.value;
    }
  } else if (ns.length === 1) {
    const n = ns[0]!;
    const after = rest.slice(n.end).trim();
    if (startsWith(after, w.unit, lang)) out.weight = n.value;
    else if (startsWith(after, w.reps, lang) || (!after && Number.isInteger(n.value) && n.value >= 1 && n.value <= 50)) out.reps = n.value;
  }

  if (out.reps !== undefined && (!Number.isInteger(out.reps) || out.reps < 1 || out.reps > 100)) {
    delete out.reps;
    delete out.weight;
  }
  if (out.weight !== undefined && (out.weight < 0 || out.weight > 1000)) delete out.weight;

  if (out.weight === undefined && out.reps === undefined && first(rest, w.log, lang)) out.log = true;
  return Object.keys(out).length ? out : null;
}

/** Short phrases to help the recognizer (iOS contextual strings, Chrome phrases): the words above. */
export function voiceHints(lang: Lang): string[] {
  const w = WORDS[lang];
  return [
    ...w.easy.slice(0, 2),
    ...w.hard.slice(0, 2),
    ...w.right.slice(0, 1),
    ...w.reps.slice(0, 1),
    ...w.undo.slice(0, 1),
    ...w.log.slice(0, 1),
  ];
}

/** Reads the first of the recognizer's guesses that makes sense. */
export function parseBest(guesses: readonly string[], lang: Lang): { text: string; command: VoiceCommand } | null {
  for (const text of guesses) {
    const command = parseVoice(text, lang);
    if (command) return { text, command };
  }
  return null;
}

/** Reps left for a rating, for the set's reps-left record: too easy 4+, about right the plan's, too hard none. */
export function rirFor(rating: Rating, planned: number): number {
  return rating === 1 ? 4 : rating === -1 ? 0 : Math.min(4, Math.max(0, planned));
}
