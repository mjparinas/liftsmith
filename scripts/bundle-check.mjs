// Fails the build when a bundled server chunk calls a function that the chunk never defines, in the one place
// the bundler has been seen to leave an import unrewritten: a for loop's update clause. On 2026-11-15 the daily
// reminder job threw "ReferenceError: addDays is not defined" in production because Turbopack bundled
// `for (let day = …; day < to; day = addDays(day, 1, tz))` from src/server/tour.ts with addDays left bare.
// Runs after `next build` (package.json "postbuild").
// Usage: node scripts/bundle-check.mjs [dir]   (default .next/server/chunks)
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const IDENT = String.raw`[A-Za-z_$][\w$]*`;
const GLOBALS = new Set(["Math", "Number", "String", "Object", "Array", "Date", "BigInt", "Symbol", "parseInt", "parseFloat", "require"]);

/** Functions called bare in a for loop's update clause that the code never declares. */
export function bareLoopCalls(code) {
  const out = new Set();
  const loop = new RegExp(String.raw`for\(\s*(?:let|var|const)\s+(${IDENT})\s*=[^;]*;[^;]*;\s*\1\s*=\s*(${IDENT})\(`, "g");
  for (const m of code.matchAll(loop)) {
    const name = m[2];
    if (GLOBALS.has(name)) continue;
    const esc = name.replace(/\$/g, "\\$");
    const declared = new RegExp(
      String.raw`(?:function\s*\*?\s*${esc}\s*\(|(?:let|const|var|class)\s+${esc}\b|[,{(]\s*${esc}\s*[,=)}]|[,;{]${esc}=)`,
    );
    if (!declared.test(code)) out.add(name);
  }
  return [...out];
}

function files(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...files(p));
    else if (name.endsWith(".js")) out.push(p);
  }
  return out;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const dir = process.argv[2] ?? ".next/server/chunks";
  const bad = [];
  for (const f of files(dir)) for (const name of bareLoopCalls(readFileSync(f, "utf8"))) bad.push(`${f}: ${name}`);
  if (bad.length) {
    console.error(`Bundled code calls functions it never defines (an import the bundler left bare):\n  ${bad.join("\n  ")}`);
    process.exit(1);
  }
  console.log(`Bundle check passed for ${dir}`);
}
