/**
 * Lightweight browser smoke for CAC readiness.
 * Usage: node scripts/e2e-smoke.mjs [baseUrl]
 */
import { chromium } from "playwright";

const base = process.argv[2] || "http://127.0.0.1:3457";

async function runCase(page, label) {
  await page.locator(".case-tile").filter({ hasText: label }).click();
  await page.waitForSelector(".verdict-title", { timeout: 90000 });
  const source = await page.locator(".badge-live, .badge-prerecorded").first().innerText();
  const verdict = await page.locator(".verdict-title").innerText();
  return { label, source, verdict };
}

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));

  await page.goto(`${base}/`, { waitUntil: "networkidle", timeout: 60000 });
  await page.getByRole("link", { name: /Explore the Demo/i }).first().click();
  await page.waitForURL(/\/scan/);

  const cases = [];
  for (const label of ["Battery-like", "Single coin", "Stacked coins"]) {
    cases.push(await runCase(page, label));
  }

  const judges = await page.goto(`${base}/judges`, { waitUntil: "networkidle", timeout: 60000 });
  const judgesOk = !!judges?.ok();

  console.log(JSON.stringify({ ok: true, cases, judgesOk, pageErrors: errors }, null, 2));
  if (errors.length || !judgesOk) process.exitCode = 1;
  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
