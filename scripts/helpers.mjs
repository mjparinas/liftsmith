// Shared bits for the browser scripts: a static server for out/, first-run onboarding, and checks.
import fs from "node:fs";
import http from "node:http";
import path from "node:path";

const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".json": "application/json", ".webmanifest": "application/manifest+json", ".txt": "text/plain", ".xml": "application/xml" };

/** Serves the static export. Returns { url, close }. */
export function serve(dir = path.resolve("out")) {
  const srv = http.createServer((req, res) => {
    let p = path.join(dir, decodeURIComponent(new URL(req.url, "http://x").pathname));
    if (fs.existsSync(p) && fs.statSync(p).isDirectory()) p = path.join(p, "index.html");
    if (!fs.existsSync(p)) {
      res.writeHead(404, { "content-type": "text/html" });
      return fs.createReadStream(path.join(dir, "404.html")).pipe(res);
    }
    res.writeHead(200, { "content-type": TYPES[path.extname(p)] ?? "application/octet-stream" });
    fs.createReadStream(p).pipe(res);
  });
  return new Promise((r) => srv.listen(0, () => r({ url: `http://localhost:${srv.address().port}`, close: () => srv.close() })));
}

/** The base URL from argv[2], or a local server for out/. */
export async function base() {
  if (process.argv[2] && !process.argv[2].startsWith("--")) return { url: process.argv[2].replace(/\/$/, ""), close() {} };
  return serve();
}

/** Fails the run on any console error or page crash. */
export function watchErrors(page, errors) {
  page.on("pageerror", (e) => errors.push(`pageerror: ${e}`));
  page.on("console", (m) => m.type() === "error" && errors.push(`console: ${m.text()}`));
}

export async function onboard(page, gym = /Commercial gym/) {
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: gym }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Save" }).click();
  await page.getByText("Today's workout").waitFor();
}

export function check(cond, msg, failures) {
  if (!cond) failures.push(msg);
  return cond;
}

export function finish(name, failures) {
  if (failures.length) {
    console.error(`✗ ${name}: ${failures.length} problem(s)\n  - ${failures.join("\n  - ")}`);
    process.exit(1);
  }
  console.log(`✓ ${name}`);
}
