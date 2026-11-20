// A Next deployment adapter that adds the script policy (scripts/csp.mjs) to every prerendered page, then hands the
// build to the adapter the platform asked for (NEXT_ADAPTER_PATH). Vercel's adapter copies the pages into its
// output inside `next build`, before `postbuild` runs, so a postbuild rewrite never reached the live site (found
// 2026-11-20: "Script policy added to 0 pages"). next.config.ts uses this only when NEXT_ADAPTER_PATH is set.
import { createRequire } from "node:module";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

import { addPolicies } from "./csp.mjs";

const innerPath = process.env.NEXT_ADAPTER_PATH;
const inner = innerPath
  ? await import(pathToFileURL(createRequire(join(process.cwd(), "package.json")).resolve(innerPath)).href).then((m) => m.default ?? m)
  : null;

const adapter = {
  ...inner,
  name: inner?.name ?? "liftsmith-csp",
  async modifyConfig(config, ctx) {
    return inner?.modifyConfig ? inner.modifyConfig(config, ctx) : config;
  },
  async onBuildComplete(ctx) {
    const dir = join(ctx.distDir, "server");
    console.log(`Script policy added to ${addPolicies(dir)} pages in ${dir}`);
    if (inner?.onBuildComplete) await inner.onBuildComplete(ctx);
  },
};

export default adapter;
