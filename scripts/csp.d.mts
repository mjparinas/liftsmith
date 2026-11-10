// Types for scripts/csp.mjs, so src/lib/csp.test.ts can check it.
export declare const SCRIPT_SOURCES: string[];
export declare function inlineScripts(html: string): string[];
export declare function policyFor(html: string): string;
export declare function withPolicy(html: string): string;
