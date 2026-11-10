import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, randomInt, timingSafeEqual } from "node:crypto";

// Ported from Gradelings (src/server/totp.ts). Used for admin two-step sign-in (src/server/twoFactor.ts).
// Time-based one-time passwords (RFC 6238: HMAC-SHA1, 30-second steps, 6 digits), which every authenticator app
// understands, plus the helpers around them: base32 secrets, the otpauth link, recovery codes and encrypting a
// secret at rest. No dependency, so there is nothing to keep patched.

const B32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
export const STEP_SECONDS = 30;
export const DIGITS = 6;

export function base32Encode(bytes: Buffer): string {
  let bits = 0;
  let value = 0;
  let out = "";
  for (const b of bytes) {
    value = (value << 8) | b;
    bits += 8;
    while (bits >= 5) {
      out += B32[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += B32[(value << (5 - bits)) & 31];
  return out;
}

export function base32Decode(text: string): Buffer {
  const bytes: number[] = [];
  let bits = 0;
  let value = 0;
  for (const ch of text.toUpperCase().replace(/[\s=-]/g, "")) {
    const i = B32.indexOf(ch);
    if (i < 0) throw new Error("Not base32");
    value = (value << 5) | i;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(bytes);
}

/** A new random secret (160 bits, as RFC 4226 recommends), as base32. */
export function newSecret(): string {
  return base32Encode(randomBytes(20));
}

/** The code for one 30-second step. */
export function codeAtStep(secret: string, step: number): string {
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(step));
  const mac = createHmac("sha1", base32Decode(secret)).update(counter).digest();
  const offset = mac[mac.length - 1] & 15;
  const n = ((mac[offset] & 127) << 24) | (mac[offset + 1] << 16) | (mac[offset + 2] << 8) | mac[offset + 3];
  return String(n % 10 ** DIGITS).padStart(DIGITS, "0");
}

export const stepAt = (ms: number) => Math.floor(ms / 1000 / STEP_SECONDS);

const same = (a: string, b: string) => a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));

/**
 * The step a code matches, allowing one step either way for clock drift, or null. A step at or before
 * `lastStep` is refused, so a code seen once (over someone's shoulder, or in a log) can't be used again.
 */
export function verifyTotp(secret: string, code: string, lastStep: number | null, now = Date.now()): number | null {
  const clean = code.replace(/\s/g, "");
  if (!/^\d{6}$/.test(clean)) return null;
  const current = stepAt(now);
  let hit: number | null = null;
  for (const step of [current - 1, current, current + 1]) {
    // Every step is compared, so the time taken doesn't say which one matched.
    if (same(codeAtStep(secret, step), clean) && (lastStep == null || step > lastStep)) hit = step;
  }
  return hit;
}

/** The link an authenticator app opens (and the QR code encodes) to add the account. */
export function otpauthUri(secret: string, account: string, issuer: string): string {
  const label = `${encodeURIComponent(issuer)}:${encodeURIComponent(account)}`;
  return `otpauth://totp/${label}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=${DIGITS}&period=${STEP_SECONDS}`;
}

// ---------- Recovery codes ----------

const CODE_ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789"; // no look-alikes: i, l, o, 0, 1
export const BACKUP_CODE_COUNT = 8;

/** Eight single-use recovery codes like `k3m9x-tq7vd` (about 49 bits each). */
export function newBackupCodes(): string[] {
  return Array.from({ length: BACKUP_CODE_COUNT }, () => {
    const pick = () => Array.from({ length: 5 }, () => CODE_ALPHABET[randomInt(CODE_ALPHABET.length)]).join("");
    return `${pick()}-${pick()}`;
  });
}

/** What a typed recovery code is compared as: lowercase, without spaces or dashes. */
export const normaliseBackupCode = (code: string) => code.toLowerCase().replace(/[\s-]/g, "");

export const hashBackupCode = (code: string) =>
  createHash("sha256")
    .update(`backup:${normaliseBackupCode(code)}`)
    .digest("hex");

export const looksLikeBackupCode = (code: string) => /^[a-z2-9]{10}$/.test(normaliseBackupCode(code));

// ---------- Secrets at rest ----------

const key = () => {
  const k = process.env.TWO_FACTOR_KEY;
  return k ? createHash("sha256").update(`two-factor:${k}`).digest() : null;
};

/** Encrypts a secret with TWO_FACTOR_KEY (AES-256-GCM), so a copy of the database alone can't make codes. Without the key it is stored as it is. */
export function sealSecret(secret: string): string {
  const k = key();
  if (!k) return `plain.${secret}`;
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", k, iv);
  const body = Buffer.concat([cipher.update(secret, "utf8"), cipher.final()]);
  return `v1.${iv.toString("base64url")}.${cipher.getAuthTag().toString("base64url")}.${body.toString("base64url")}`;
}

export function openSecret(stored: string): string {
  if (stored.startsWith("plain.")) return stored.slice(6);
  const [version, iv, tag, body] = stored.split(".");
  const k = key();
  if (version !== "v1" || !iv || !tag || !body || !k)
    throw new Error("The two-step secret can't be read (is TWO_FACTOR_KEY set to the value it was saved with?)");
  const decipher = createDecipheriv("aes-256-gcm", k, Buffer.from(iv, "base64url"));
  decipher.setAuthTag(Buffer.from(tag, "base64url"));
  return Buffer.concat([decipher.update(Buffer.from(body, "base64url")), decipher.final()]).toString("utf8");
}
