// Latin letters for names written in other scripts, for web addresses only (docs/decisions/seo.md "Gym addresses in
// other scripts"). `slugify` kept only a to z and 0 to 9, so every city written in Cyrillic, Greek, Korean and the rest
// came out empty and fell back to one folder, /gyms/gyms/, where 5,000 gyms from Kyiv, Seoul, Sofia and Tokyo shared
// one city page. Scripts with a plain letter-for-letter spelling are spelled out here (Cyrillic, Greek, Armenian,
// Georgian, Korean Hangul, Japanese kana); the page itself always shows the name as written.

const CYRILLIC: Record<string, string> = {
  а: "a",
  б: "b",
  в: "v",
  г: "g",
  д: "d",
  е: "e",
  ё: "yo",
  ж: "zh",
  з: "z",
  и: "i",
  й: "y",
  к: "k",
  л: "l",
  м: "m",
  н: "n",
  о: "o",
  п: "p",
  р: "r",
  с: "s",
  т: "t",
  у: "u",
  ф: "f",
  х: "kh",
  ц: "ts",
  ч: "ch",
  ш: "sh",
  щ: "shch",
  ъ: "",
  ы: "y",
  ь: "",
  э: "e",
  ю: "yu",
  я: "ya",
  // Ukrainian, Belarusian, Serbian, Macedonian, Bulgarian and Kazakh letters.
  є: "ye",
  і: "i",
  ї: "yi",
  ґ: "g",
  ў: "u",
  ђ: "dj",
  ј: "j",
  љ: "lj",
  њ: "nj",
  ћ: "c",
  џ: "dz",
  ѓ: "gj",
  ќ: "kj",
  ѕ: "dz",
  ә: "a",
  ғ: "gh",
  қ: "q",
  ң: "ng",
  ө: "o",
  ұ: "u",
  ү: "u",
  һ: "h",
};

const GREEK: Record<string, string> = {
  ά: "a",
  έ: "e",
  ή: "i",
  ί: "i",
  ϊ: "i",
  ΐ: "i",
  ό: "o",
  ύ: "y",
  ϋ: "y",
  ΰ: "y",
  ώ: "o",
  α: "a",
  β: "v",
  γ: "g",
  δ: "d",
  ε: "e",
  ζ: "z",
  η: "i",
  θ: "th",
  ι: "i",
  κ: "k",
  λ: "l",
  μ: "m",
  ν: "n",
  ξ: "x",
  ο: "o",
  π: "p",
  ρ: "r",
  σ: "s",
  ς: "s",
  τ: "t",
  υ: "y",
  φ: "f",
  χ: "ch",
  ψ: "ps",
  ω: "o",
};

const ARMENIAN: Record<string, string> = {
  ա: "a",
  բ: "b",
  գ: "g",
  դ: "d",
  ե: "e",
  զ: "z",
  է: "e",
  ը: "y",
  թ: "t",
  ժ: "zh",
  ի: "i",
  լ: "l",
  խ: "kh",
  ծ: "ts",
  կ: "k",
  հ: "h",
  ձ: "dz",
  ղ: "gh",
  ճ: "ch",
  մ: "m",
  յ: "y",
  ն: "n",
  շ: "sh",
  ո: "o",
  չ: "ch",
  պ: "p",
  ջ: "j",
  ռ: "r",
  ս: "s",
  վ: "v",
  տ: "t",
  ր: "r",
  ց: "ts",
  ւ: "u",
  փ: "p",
  ք: "k",
  օ: "o",
  ֆ: "f",
  և: "ev",
};

const GEORGIAN: Record<string, string> = {
  ა: "a",
  ბ: "b",
  გ: "g",
  დ: "d",
  ე: "e",
  ვ: "v",
  ზ: "z",
  თ: "t",
  ი: "i",
  კ: "k",
  ლ: "l",
  მ: "m",
  ნ: "n",
  ო: "o",
  პ: "p",
  ჟ: "zh",
  რ: "r",
  ს: "s",
  ტ: "t",
  უ: "u",
  ფ: "p",
  ქ: "k",
  ღ: "gh",
  ყ: "q",
  შ: "sh",
  ჩ: "ch",
  ც: "ts",
  ძ: "dz",
  წ: "ts",
  ჭ: "ch",
  ხ: "kh",
  ჯ: "j",
  ჰ: "h",
};

// Japanese kana, Hepburn. Katakana is folded onto hiragana first (they're 0x60 apart).
const KANA: Record<string, string> = {
  あ: "a",
  い: "i",
  う: "u",
  え: "e",
  お: "o",
  か: "ka",
  き: "ki",
  く: "ku",
  け: "ke",
  こ: "ko",
  が: "ga",
  ぎ: "gi",
  ぐ: "gu",
  げ: "ge",
  ご: "go",
  さ: "sa",
  し: "shi",
  す: "su",
  せ: "se",
  そ: "so",
  ざ: "za",
  じ: "ji",
  ず: "zu",
  ぜ: "ze",
  ぞ: "zo",
  た: "ta",
  ち: "chi",
  つ: "tsu",
  て: "te",
  と: "to",
  だ: "da",
  ぢ: "ji",
  づ: "zu",
  で: "de",
  ど: "do",
  な: "na",
  に: "ni",
  ぬ: "nu",
  ね: "ne",
  の: "no",
  は: "ha",
  ひ: "hi",
  ふ: "fu",
  へ: "he",
  ほ: "ho",
  ば: "ba",
  び: "bi",
  ぶ: "bu",
  べ: "be",
  ぼ: "bo",
  ぱ: "pa",
  ぴ: "pi",
  ぷ: "pu",
  ぺ: "pe",
  ぽ: "po",
  ま: "ma",
  み: "mi",
  む: "mu",
  め: "me",
  も: "mo",
  や: "ya",
  ゆ: "yu",
  よ: "yo",
  ら: "ra",
  り: "ri",
  る: "ru",
  れ: "re",
  ろ: "ro",
  わ: "wa",
  を: "o",
  ん: "n",
  ゔ: "vu",
  ぁ: "a",
  ぃ: "i",
  ぅ: "u",
  ぇ: "e",
  ぉ: "o",
  ゃ: "ya",
  ゅ: "yu",
  ょ: "yo",
  ゎ: "wa",
  っ: "",
  ー: "",
};

// Korean, Revised Romanization, one syllable block at a time.
const HANGUL_LEAD = ["g", "kk", "n", "d", "tt", "r", "m", "b", "pp", "s", "ss", "", "j", "jj", "ch", "k", "t", "p", "h"];
const HANGUL_VOWEL = [
  "a",
  "ae",
  "ya",
  "yae",
  "eo",
  "e",
  "yeo",
  "ye",
  "o",
  "wa",
  "wae",
  "oe",
  "yo",
  "u",
  "wo",
  "we",
  "wi",
  "yu",
  "eu",
  "ui",
  "i",
];
const HANGUL_TAIL = [
  "",
  "k",
  "k",
  "k",
  "n",
  "n",
  "n",
  "t",
  "l",
  "k",
  "m",
  "l",
  "l",
  "l",
  "p",
  "l",
  "m",
  "p",
  "p",
  "t",
  "t",
  "ng",
  "t",
  "t",
  "k",
  "t",
  "p",
  "t",
];

// Small kana join the sound before them: キャ "kya", シャ "sha", フィ "fi"; っ doubles the next consonant.
const SMALL_Y = new Set(["ゃ", "ゅ", "ょ"]);
const SMALL_V = new Set(["ぁ", "ぃ", "ぅ", "ぇ", "ぉ"]);
const hiragana = (ch: string) => {
  const c = ch.codePointAt(0)!;
  return c >= 0x30a1 && c <= 0x30f6 ? String.fromCodePoint(c - 0x60) : ch;
};

function letter(ch: string): string | null {
  const c = ch.codePointAt(0)!;
  if (c >= 0xac00 && c <= 0xd7a3) {
    const i = c - 0xac00;
    return HANGUL_LEAD[Math.floor(i / 588)]! + HANGUL_VOWEL[Math.floor((i % 588) / 28)]! + HANGUL_TAIL[i % 28]!;
  }
  if (c >= 0x30a1 && c <= 0x30f6) return KANA[String.fromCodePoint(c - 0x60)] ?? null;
  return CYRILLIC[ch] ?? GREEK[ch] ?? ARMENIAN[ch] ?? GEORGIAN[ch] ?? KANA[ch] ?? null;
}

/** "Москва" → "Moskva", "Θεσσαλονίκη" → "Thessaloniki", "서울" → "seoul". Other text is left as it is. */
export function translit(text: string): string {
  let out = "";
  let double = false;
  for (const ch of text.normalize("NFC")) {
    const lower = ch.toLowerCase();
    let l = letter(lower);
    if (l === null) {
      out += ch;
      double = false;
      continue;
    }
    const kana = hiragana(lower);
    if (kana === "っ") {
      double = true;
      continue;
    }
    if (SMALL_Y.has(kana) && /(?:sh|ch|j)i$/.test(out)) out = out.slice(0, -1) + l.slice(1);
    else if ((SMALL_Y.has(kana) || SMALL_V.has(kana)) && /[iu]$/.test(out)) out = out.slice(0, -1) + l;
    else {
      if (double && /^[bcdfghjkmprstz]/.test(l)) l = l[0] + l;
      out += ch !== lower && l ? l[0]!.toUpperCase() + l.slice(1) : l;
    }
    double = false;
  }
  return out;
}

/** A short, stable name for text no table spells out (Chinese characters, Arabic, Thai…): "c-3f2a91bc". */
export function shortHash(text: string): string {
  let h = 0x811c9dc5;
  for (const ch of text) {
    h ^= ch.codePointAt(0)!;
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, "0");
}
