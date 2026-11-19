// The admin panel's AI helpers share this one door to Claude (Melvin, 2026-11-16: "do them all"; docs/decisions/admin-ai.md).
// Every request goes through `askClaude`, which checks the switch and the day's cap first, asks one model with the fixed
// instructions cached, and adds what the request cost to the day's total. Nothing here ever acts: the helpers suggest,
// draft or summarize, and a person presses the button that changes anything.
//
// Two admin flags run it (src/lib/flags.ts): `aiHelpers` turns every helper off at once, and `aiDailyCap` is the most
// it may spend in a Pacific day, in US dollars. The spend lives in two admin_settings rows per day (`ai_spend:<day>` in
// millionths of a dollar and `ai_calls:<day>`), each read and written by its key, so a check is two key lookups.
import Anthropic from "@anthropic-ai/sdk";

import { allowed, FLAGS } from "@/lib/flags";

import { batch, query } from "./db";

/** Haiku for reading and sorting (cheap, quick); Sonnet for words a member of the public reads (Inbox drafts). */
export const AI_MODEL = { fast: "claude-haiku-5-5", write: "claude-sonnet-5-5" } as const;
export type AiModel = (typeof AI_MODEL)[keyof typeof AI_MODEL];

/** US dollars per million tokens (platform.claude.com pricing, 2026-11): input, output and cache reads. */
const PRICE: Record<AiModel, { input: number; output: number; cacheRead: number }> = {
  "claude-haiku-5-5": { input: 0.1, output: 0.5, cacheRead: 0.01 },
  "claude-sonnet-5-5": { input: 2, output: 10, cacheRead: 0.1 },
};
/** Writing to the cache costs 1.25 times plain input (five-minute cache). */
const CACHE_WRITE = 1.25;

/** What each helper is called on the panel and in the audit log. */
export type AiTask = "triage" | "gymFill" | "gymAuto" | "gymFix" | "gymDupes" | "page" | "draft" | "digest";

/** The longest text one request may carry (characters), so one odd page or email can't run up the bill. */
export const AI_INPUT_LIMIT = 200_000;

export const aiConfigured = () => Boolean(process.env.ANTHROPIC_API_KEY);

/** Today in Pacific time (the admins' day, as the digest), YYYY-MM-DD. */
export function aiDay(now = Date.now()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Los_Angeles", year: "numeric", month: "2-digit", day: "2-digit" }).format(
    new Date(now),
  );
}

/** What a request cost, in millionths of a dollar, from the usage the API reports. */
export function costMicros(model: AiModel, u: Partial<Anthropic.Beta.BetaUsage> | undefined): number {
  if (!u) return 0;
  const p = PRICE[model];
  const read = u.cache_read_input_tokens ?? 0;
  const write = u.cache_creation_input_tokens ?? 0;
  const plain = u.input_tokens ?? 0;
  // Haiku costs five times as much past 100K input tokens; nothing here sends that much, but price it safely.
  const big = model === AI_MODEL.fast && plain + read + write > 100_000 ? 5 : 1;
  const dollars = (plain * p.input + write * p.input * CACHE_WRITE + read * p.cacheRead + (u.output_tokens ?? 0) * p.output) * big;
  return Math.ceil(dollars);
}

export interface AiStatus {
  /** ANTHROPIC_API_KEY is set. */
  configured: boolean;
  /** The aiHelpers flag. */
  on: boolean;
  /** The day's cap in dollars, what's spent and how many requests. */
  cap: number;
  spent: number;
  calls: number;
  /** Whether a request can go now, and if not, why (a line the panel shows). */
  ready: boolean;
  why: string;
}

const flagValue = (rows: Record<string, unknown>[], name: "aiHelpers" | "aiDailyCap") => {
  const row = rows.find((r) => r.name === name);
  try {
    const v = row ? (JSON.parse(String(row.value)) as unknown) : undefined;
    if (allowed(name, v)) return v;
  } catch {
    // A broken value falls back to the default.
  }
  return FLAGS[name].default;
};

/** The switch, the cap and today's spend: four rows read by their keys. */
export async function aiStatus(now = Date.now()): Promise<AiStatus> {
  const day = aiDay(now);
  const [flags, spend] = await Promise.all([
    query("SELECT name, value FROM feature_flags WHERE name IN ('aiHelpers', 'aiDailyCap')"),
    query("SELECT key, value FROM admin_settings WHERE key IN (?, ?)", [`ai_spend:${day}`, `ai_calls:${day}`]),
  ]);
  const on = flagValue(flags, "aiHelpers") === true;
  const cap = Number(flagValue(flags, "aiDailyCap"));
  const num = (key: string) => Number(spend.find((r) => r.key === key)?.value ?? 0) || 0;
  const spent = num(`ai_spend:${day}`) / 1_000_000;
  const calls = num(`ai_calls:${day}`);
  const configured = aiConfigured();
  const why = !configured
    ? "AI helpers need ANTHROPIC_API_KEY (Admin › System › Settings)."
    : !on
      ? "AI helpers are switched off (Flags › Admin AI helpers)."
      : spent >= cap
        ? `Today's AI spend reached its $${cap} cap (Flags › AI daily cap). It resets at midnight Pacific.`
        : "";
  return { configured, on, cap, spent, calls, ready: !why, why };
}

/** Adds one request's cost to the day, in one statement per row, so parallel requests can't lose each other's. */
async function addSpend(micros: number, now: number) {
  const day = aiDay(now);
  const add = `INSERT INTO admin_settings (key, value, updated_at) VALUES (?, ?, ?)
    ON CONFLICT (key) DO UPDATE SET value = CAST(CAST(admin_settings.value AS INTEGER) + CAST(excluded.value AS INTEGER) AS TEXT), updated_at = excluded.updated_at`;
  await batch([
    { sql: add, args: [`ai_spend:${day}`, String(micros), now] },
    { sql: add, args: [`ai_calls:${day}`, "1", now] },
  ]);
}

export class AiError extends Error {}

export interface AiRequest {
  task: AiTask;
  model?: AiModel;
  /** The fixed instructions, cached between requests. Never put anything that changes per request here. */
  system: string;
  /** This request's material. Anything a member of the public wrote goes inside tags and is called data in `system`. */
  user: string;
  /** A JSON schema: the answer is then JSON that matches it (structured outputs). */
  schema?: Record<string, unknown>;
  maxTokens?: number;
  client?: Anthropic;
  now?: number;
}

/**
 * One request to Claude. Throws an AiError with a line the panel can show when the helpers are off, the day's cap is
 * reached, the key is missing or refused, or the answer is empty. Returns the text (JSON text when `schema` is set).
 */
export async function askClaude(r: AiRequest): Promise<string> {
  const now = r.now ?? Date.now();
  if (!r.client) {
    const status = await aiStatus(now);
    if (!status.ready) throw new AiError(status.why);
  }
  const model = r.model ?? AI_MODEL.fast;
  const anthropic = r.client ?? new Anthropic({ maxRetries: 1, timeout: 60_000 });
  const user = r.user.slice(0, AI_INPUT_LIMIT);
  // Sonnet can hand a declined request to a fallback model inside the same call; Haiku has no server-side fallback.
  const fallback = model === AI_MODEL.write ? { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" as const } : {};
  let res: Anthropic.Beta.BetaMessage;
  try {
    res = await anthropic.beta.messages.create({
      model,
      max_tokens: r.maxTokens ?? 4_000,
      ...fallback,
      output_config: { effort: "low", ...(r.schema ? { format: { type: "json_schema" as const, schema: r.schema } } : {}) },
      system: [{ type: "text", text: r.system, cache_control: { type: "ephemeral" } }],
      messages: [{ role: "user", content: user }],
    });
  } catch (e) {
    if (e instanceof Anthropic.AuthenticationError || e instanceof Anthropic.PermissionDeniedError)
      throw new AiError("Anthropic refused the API key.");
    if (e instanceof Anthropic.RateLimitError) throw new AiError("Too many AI requests just now. Try again in a minute.");
    if (e instanceof Anthropic.APIConnectionError) throw new AiError("Couldn't reach Anthropic.");
    if (e instanceof Anthropic.APIError) throw new AiError(`Anthropic answered ${String(e.status)}.`);
    throw e;
  }
  await addSpend(costMicros(model, res.usage), now).catch((e: unknown) => console.error("ai spend", e));
  if (res.stop_reason === "refusal") throw new AiError("Claude wouldn't answer this one.");
  if (res.stop_reason === "max_tokens") throw new AiError("The answer ran too long. Try again.");
  const text = (res.content ?? [])
    .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === "text")
    .map((b) => b.text)
    .join("")
    .trim();
  if (!text) throw new AiError("The answer came back empty.");
  return text;
}

/** askClaude with a schema, parsed. */
export async function askJson<T>(r: AiRequest & { schema: Record<string, unknown> }): Promise<T> {
  const text = await askClaude(r);
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new AiError("The answer wasn't readable. Try again.");
  }
}
