#!/usr/bin/env node
/* ═══════════════════════════════════════════
   PRERENDER SCRIPT — Static HTML for SEO
   Runs after vite build + sitemap generation
   Uses Puppeteer to render all routes to HTML
   ═══════════════════════════════════════════ */

import { existsSync, mkdirSync, writeFileSync, readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { createServer } from "http";
import puppeteer from "puppeteer";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST_DIR = join(__dirname, "..", "dist");
const PORT = 4173;
const BASE = `http://localhost:${PORT}`;

// All routes to prerender (same source of truth as sitemap)
const STATE_NAMES = {
  AL: "alabama", AK: "alaska", AZ: "arizona", AR: "arkansas", CA: "california",
  CO: "colorado", CT: "connecticut", DE: "delaware", FL: "florida", GA: "georgia",
  HI: "hawaii", ID: "idaho", IL: "illinois", IN: "indiana", IA: "iowa",
  KS: "kansas", KY: "kentucky", LA: "louisiana", ME: "maine", MD: "maryland",
  MA: "massachusetts", MI: "michigan", MN: "minnesota", MS: "mississippi", MO: "missouri",
  MT: "montana", NE: "nebraska", NV: "nevada", NH: "new-hampshire", NJ: "new-jersey",
  NM: "new-mexico", NY: "new-york", NC: "north-carolina", ND: "north-dakota", OH: "ohio",
  OK: "oklahoma", OR: "oregon", PA: "pennsylvania", RI: "rhode-island", SC: "south-carolina",
  SD: "south-dakota", TN: "tennessee", TX: "texas", UT: "utah", VT: "vermont",
  VA: "virginia", WA: "washington", WV: "west-virginia", WI: "wisconsin", WY: "wyoming",
};

function getRoutes() {
  const routes = [
    "/",
    "/practice-tests",
    "/practice-tests/driving",
    "/practice-tests/citizenship",
    "/practice-tests/real-estate",
    "/practice-tests/food-handler",
    "/practice-tests/osha",
    "/practice-tests/cpr",
    "/practice-tests/notary",
    "/car-permit-practice-test",
    "/motorcycle-permit-practice-test",
    "/cdl-general-knowledge-practice-test",
    "/us-citizenship-civics-practice-test",
    "/real-estate-exam-practice-test",
    "/food-handler-practice-test",
    "/osha-10-hour-practice-test",
    "/cpr-first-aid-practice-test",
    "/notary-public-practice-test",
  ];

  // State DMV pages
  for (const stateName of Object.values(STATE_NAMES)) {
    routes.push(`/${stateName}-dmv-practice-test`);
  }

  return routes;
}

/**
 * Serve the dist folder as a static SPA server
 * (mimics Vercel's SPA fallback behavior)
 */
function startServer() {
  const indexHtml = readFileSync(join(DIST_DIR, "index.html"), "utf-8");

  const mimeTypes = {
    ".html": "text/html",
    ".js": "application/javascript",
    ".css": "text/css",
    ".json": "application/json",
    ".png": "image/png",
    ".svg": "image/svg+xml",
    ".ico": "image/x-icon",
    ".xml": "application/xml",
    ".txt": "text/plain",
    ".webmanifest": "application/manifest+json",
  };

  return new Promise((resolve) => {
    const server = createServer((req, res) => {
      const url = req.url.split("?")[0];

      // Try to serve the exact file from dist
      const filePath = join(DIST_DIR, url === "/" ? "index.html" : url);
      if (existsSync(filePath) && !filePath.endsWith("/")) {
        const ext = "." + filePath.split(".").pop();
        const contentType = mimeTypes[ext] || "application/octet-stream";
        try {
          const content = readFileSync(filePath);
          res.writeHead(200, { "Content-Type": contentType });
          res.end(content);
          return;
        } catch {}
      }

      // SPA fallback: serve index.html for all routes
      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(indexHtml);
    });

    server.listen(PORT, () => {
      resolve(server);
    });
  });
}

/**
 * Prerender a batch of routes using a single browser page
 */
async function prerenderRoutes(page, routes) {
  const results = [];

  for (const route of routes) {
    try {
      await page.goto(`${BASE}${route}`, {
        waitUntil: "networkidle0",
        timeout: 15000,
      });

      // Wait a tick for React to finish any async state updates
      await page.evaluate(() => new Promise((r) => setTimeout(r, 200)));

      // Extract the full HTML
      let html = await page.content();

      // Clean up: remove scripts that would re-execute on load
      // but keep the module script that hydrates React
      // We only want to inject the rendered HTML so crawlers see it;
      // the JS bundle still loads and hydrates as normal

      // Remove any dynamic JSON-LD scripts (they'll be re-added by React)
      // Actually, KEEP them — they are what Google reads from source
      // Just remove the Google Analytics inline script duplication concern
      // (it's fine, gtag is idempotent)

      // Write to dist as route/index.html
      const outDir =
        route === "/"
          ? DIST_DIR
          : join(DIST_DIR, route.replace(/^\//, ""));

      if (route !== "/") {
        mkdirSync(outDir, { recursive: true });
      }

      const outFile =
        route === "/"
          ? join(DIST_DIR, "index.html")
          : join(outDir, "index.html");

      writeFileSync(outFile, html, "utf-8");
      results.push({ route, status: "ok" });
    } catch (err) {
      results.push({ route, status: "error", error: err.message });
    }
  }

  return results;
}

async function main() {
  console.log("🔍 Prerendering all routes for SEO...\n");

  if (!existsSync(DIST_DIR)) {
    console.error("❌ dist/ directory not found. Run `vite build` first.");
    process.exit(1);
  }

  // Start local server
  const server = await startServer();
  console.log(`   Static server running on port ${PORT}`);

  // Launch browser
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const routes = getRoutes();
  console.log(`   Prerendering ${routes.length} routes...\n`);

  const page = await browser.newPage();

  // Block images and fonts for faster rendering
  await page.setRequestInterception(true);
  page.on("request", (req) => {
    const type = req.resourceType();
    if (["image", "font", "media"].includes(type)) {
      req.abort();
    } else {
      req.continue();
    }
  });

  const startTime = Date.now();
  const results = await prerenderRoutes(page, routes);
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  // Summary
  const ok = results.filter((r) => r.status === "ok").length;
  const errors = results.filter((r) => r.status === "error");

  console.log(`\n✅ Prerendered ${ok}/${routes.length} routes in ${elapsed}s`);

  if (errors.length > 0) {
    console.log(`\n⚠️  ${errors.length} errors:`);
    errors.forEach((e) => console.log(`   ${e.route}: ${e.error}`));
  }

  // Cleanup
  await browser.close();
  server.close();
}

main().catch((err) => {
  console.error("❌ Prerender failed:", err);
  process.exit(1);
});
