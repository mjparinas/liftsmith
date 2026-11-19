#!/usr/bin/env node
// Bumps the app's version everywhere at once (Melvin, 2026-11-19: "versions should get bumped on every new
// feature"; docs/decisions/app-versions.md). package.json is the one source: the web build stamps it into the app
// (NEXT_PUBLIC_APP_VERSION), release.yml hands it to Gradle (VERSION_NAME) and Xcode (MARKETING_VERSION), and the
// Gradle files read it for local builds. This script moves package.json and package-lock.json with `npm version`
// and keeps the Xcode project's own MARKETING_VERSION in step, so a local iOS build says the same thing.
//
//   node scripts/bump-version.mjs minor   # a new feature: 0.2.0 -> 0.3.0
//   node scripts/bump-version.mjs patch   # fixes only:   0.2.0 -> 0.2.1
//   node scripts/bump-version.mjs 1.0.0   # an exact version
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";

const kind = process.argv[2];
if (!kind || !(/^(major|minor|patch)$/.test(kind) || /^\d+\.\d+\.\d+$/.test(kind))) {
  console.error("Usage: node scripts/bump-version.mjs minor|patch|major|<x.y.z>");
  process.exit(1);
}

execFileSync("npm", ["version", kind, "--no-git-tag-version"], { stdio: "ignore" });
const version = JSON.parse(readFileSync("package.json", "utf8")).version;

const pbx = "ios/App/App.xcodeproj/project.pbxproj";
writeFileSync(pbx, readFileSync(pbx, "utf8").replace(/MARKETING_VERSION = [^;]+;/g, `MARKETING_VERSION = ${version};`));

console.log(`Version ${version}. Add or extend the newest release in src/lib/appNews.ts with "version: \\"${version}\\"".`);
