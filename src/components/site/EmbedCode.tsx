"use client";

// "Put this calculator on your site": the code to paste and one Copy button (src/lib/embeds.ts).
import { useState } from "react";

import { embedSnippet, type Embed } from "@/lib/embeds";

export function EmbedCode({ embed }: { embed: Embed }) {
  const code = embedSnippet(embed);
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };
  return (
    <section className="mt-10 max-w-3xl" aria-labelledby="embed-title">
      <h2 id="embed-title" className="text-2xl font-bold tracking-tight">
        Put this calculator on your site
      </h2>
      <p className="mt-2 text-muted">
        Free for gyms, coaches and blogs. Paste this code into your page. It works on any site that allows HTML, and nothing is tracked or
        stored.
      </p>
      <label htmlFor="embed-code" className="sr-only">
        Code for the {embed.name.toLowerCase()}
      </label>
      <textarea
        id="embed-code"
        readOnly
        value={code}
        rows={4}
        className="mt-3 w-full rounded-xl border border-line bg-surface p-3 font-mono text-sm text-ink"
        onFocus={(ev) => ev.currentTarget.select()}
      />
      <button
        type="button"
        onClick={copy}
        className="press mt-2 min-h-11 rounded-full border border-line bg-surface px-5 text-sm font-medium"
      >
        {copied ? "Copied" : "Copy code"}
      </button>
    </section>
  );
}
