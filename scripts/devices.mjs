// The devices the browser tests run on, chosen so each one adds a screen size the others don't.
// iOS devices run in WebKit (the engine behind the iOS app's WKWebView), Android in Chromium (the Android
// WebView). Sizes come from Playwright's device list. Keep it lean: every device adds CI time.
//
//   full: runs the whole playthrough (scripts/e2e.mjs) as well as the layout sweep.
import { chromium, devices, webkit } from "playwright";

export const DEVICES = [
  // iOS
  { name: "iPhone SE (3rd gen)", group: "ios", why: "smallest iPhone still sold, 375×667" },
  { name: "iPhone 16", group: "ios", why: "the most common iPhone size, 393 wide", full: true },
  { name: "iPhone 17 Pro Max", group: "ios", why: "largest iPhone, 440 wide" },
  { name: "iPad Mini", group: "ios", why: "small tablet, 768×1024" },
  { name: "iPad Pro 11 landscape", group: "ios", why: "large tablet on a stand, 1194×834" },
  // Android
  { name: "Galaxy S9+", group: "android", why: "narrowest screen we support, 320 wide" },
  { name: "Galaxy S24", group: "android", why: "360 wide, the most common Android width" },
  { name: "Pixel 7", group: "android", why: "412 wide, Pixel and most mid-range phones", full: true },
  { name: "Galaxy A55", group: "android", why: "best-selling Android line, 480 wide" },
  { name: "Pixel 7 landscape", group: "android", why: "phone on its side, only 360 tall" },
  { name: "Galaxy Z Fold 7", group: "android", why: "foldable opened, nearly square 984×1016" },
  { name: "Galaxy Tab S9", group: "android", why: "Android tablet, 640×1024" },
  { name: "Galaxy Tab S9 landscape", group: "android", why: "Android tablet on its side, 1024×640" },
];

/** Devices picked by the DEVICES env var: "ios", "android", "full", or a comma list of names. Default all. */
export function pick(filter = process.env.DEVICES) {
  if (!filter || filter === "all") return DEVICES;
  if (filter === "ios" || filter === "android") return DEVICES.filter((d) => d.group === filter);
  if (filter === "full") return DEVICES.filter((d) => d.full);
  const names = filter.split(",").map((s) => s.trim());
  return DEVICES.filter((d) => names.includes(d.name));
}

const launched = {};
/**
 * The browser for a device and its context options, or null when that engine isn't installed here
 * (cloud sessions only have Chromium). In CI a missing engine is an error, never a skip.
 */
export async function open(name) {
  const d = devices[name];
  if (!d) throw new Error(`${name} is not in this version of Playwright`);
  const { defaultBrowserType, ...opts } = d;
  const type = defaultBrowserType === "webkit" ? webkit : chromium;
  if (!(defaultBrowserType in launched)) {
    launched[defaultBrowserType] = await type.launch().catch((e) => {
      if (process.env.CI) throw e;
      console.log(`(skipping ${defaultBrowserType} devices: ${String(e).split("\n")[0]})`);
      return null;
    });
  }
  const browser = launched[defaultBrowserType];
  return browser && { browser, opts, engine: defaultBrowserType };
}

export async function closeAll() {
  await Promise.all(Object.values(launched).map((b) => b?.close()));
}
