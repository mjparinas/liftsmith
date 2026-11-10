// Formatting is Prettier's job, so reviews and merges never argue about it (Melvin, 2026-11-10).
// Imports are sorted too, so two changes that each add an import rarely touch the same line.
/** @type {import("prettier").Config} */
const config = {
  printWidth: 140,
  plugins: ["@ianvs/prettier-plugin-sort-imports"],
  importOrder: ["<BUILTIN_MODULES>", "<THIRD_PARTY_MODULES>", "", "^@/(.*)$", "", "^[./]"],
  importOrderTypeScriptVersion: "5.0.0",
};

export default config;
