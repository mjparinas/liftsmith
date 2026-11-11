// Types for scripts/native-web.mjs, so src/lib/nativeWeb.test.ts can check it.
export declare const KEEP: string[];
export declare const SHELL_DIRS: { android: string; ios: string };
export declare function prune(webDir: string, shellDir: string): { removed: string[]; bytes: number };
