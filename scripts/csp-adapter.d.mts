// Types for csp-adapter.mjs (src/lib/csp.test.ts imports it).
declare const adapter: {
  name: string;
  modifyConfig(config: unknown, ctx: unknown): Promise<unknown>;
  onBuildComplete(ctx: { distDir: string } & Record<string, unknown>): Promise<void>;
};
export default adapter;
