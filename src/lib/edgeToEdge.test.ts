// Play's edge-to-edge and code optimization checks (docs/decisions/platform-deltas.md, docs/decisions/app-size.md):
// the Android app leaves out @capacitor/status-bar, whose colour calls Play flags as deprecated, but keeps every
// other native plugin; our own Android code never calls the deprecated bar colour APIs; and release builds of both
// Android apps run R8.
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { ANDROID_PLUGINS } from "../../capacitor.config";

const root = join(__dirname, "..", "..");
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8")) as { dependencies: Record<string, string> };

/** Dependencies that bring Android code of their own (Capacitor plugins). */
function nativePlugins(): string[] {
  return Object.keys(pkg.dependencies)
    .filter((name) => existsSync(join(root, "node_modules", name, "android", "build.gradle")))
    .sort();
}

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? files(path) : [path];
  });
}

describe("edge to edge on Android", () => {
  it("includes every native plugin but the status bar plugin", () => {
    expect([...ANDROID_PLUGINS].sort()).toEqual(nativePlugins().filter((name) => name !== "@capacitor/status-bar"));
  });

  it("leaves the status bar plugin out of the Gradle build", () => {
    expect(readFileSync(join(root, "android/app/capacitor.build.gradle"), "utf8")).not.toContain("status-bar");
    expect(readFileSync(join(root, "android/capacitor.settings.gradle"), "utf8")).not.toContain("status-bar");
  });

  it("goes edge to edge in MainActivity", () => {
    const main = readFileSync(join(root, "android/app/src/main/java/com/getliftsmith/app/MainActivity.java"), "utf8");
    // After super.onCreate, where BridgeActivity applies AppTheme.NoActionBar: before it, the window was built under
    // the splash theme and every screen showed a "Liftsmith" title bar.
    expect(main).toMatch(/super\.onCreate\([^)]*\);[\s\S]*EdgeToEdge\.enable\(this/);
    expect(main).not.toMatch(/EdgeToEdge\.enable\(this[^)]*\)[\s\S]*super\.onCreate/);
  });

  it("keeps the title bar off in the launch theme", () => {
    const styles = readFileSync(join(root, "android/app/src/main/res/values/styles.xml"), "utf8");
    const launch = styles.match(/<style name="AppTheme\.NoActionBarLaunch"[\s\S]*?<\/style>/)?.[0] ?? "";
    expect(launch).toContain('<item name="android:windowActionBar">false</item>');
    expect(launch).toContain('<item name="android:windowNoTitle">true</item>');
  });

  it("never calls the deprecated bar colour APIs in our own Android code", () => {
    const deprecated =
      /setStatusBarColor|setNavigationBarColor|setNavigationBarDividerColor|setDecorFitsSystemWindows|SYSTEM_UI_FLAG_|FLAG_TRANSLUCENT_|LAYOUT_IN_DISPLAY_CUTOUT_MODE_(SHORT_EDGES|DEFAULT|NEVER)|statusBarColor|navigationBarColor/;
    const sources = ["android/app/src/main", "android/wear/src/main"].flatMap((dir) => files(join(root, dir)));
    const hits = sources.filter((path) => /\.(java|kt|xml)$/.test(path) && deprecated.test(readFileSync(path, "utf8")));
    expect(hits).toEqual([]);
  });
});

describe("code shrinking", () => {
  it.each(["app", "wear"])("runs R8 on the %s release build", (mod) => {
    const gradle = readFileSync(join(root, "android", mod, "build.gradle"), "utf8");
    const release = gradle.slice(gradle.indexOf("release {", gradle.indexOf("buildTypes")));
    expect(release).toMatch(/minifyEnabled true/);
    expect(release).toMatch(/shrinkResources true/);
    expect(release).toContain("proguard-android-optimize.txt");
    expect(readFileSync(join(root, "android", mod, "proguard-rules.pro"), "utf8")).toContain("-keepattributes SourceFile,LineNumberTable");
  });
});
