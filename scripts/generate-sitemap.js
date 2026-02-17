#!/usr/bin/env node
/* ═══════════════════════════════════════════
   SITEMAP GENERATOR — Run after vite build
   Outputs sitemap.xml to dist/
   ═══════════════════════════════════════════ */

import { writeFileSync, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const BASE_URL = "https://quizlane.org";
const TODAY = new Date().toISOString().split("T")[0];

// State abbreviation → full name (for URL slugs)
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

// All routes with their priority and changefreq
const routes = [
  // Core pages
  { path: "/", priority: "1.0", changefreq: "daily" },
  { path: "/practice-tests", priority: "0.9", changefreq: "weekly" },
  { path: "/progress", priority: "0.3", changefreq: "monthly" },
  { path: "/weak-areas", priority: "0.3", changefreq: "monthly" },

  // Category pages
  { path: "/practice-tests/driving", priority: "0.9", changefreq: "weekly" },
  { path: "/practice-tests/citizenship", priority: "0.8", changefreq: "monthly" },
  { path: "/practice-tests/real-estate", priority: "0.8", changefreq: "monthly" },
  { path: "/practice-tests/food-handler", priority: "0.7", changefreq: "monthly" },
  { path: "/practice-tests/osha", priority: "0.7", changefreq: "monthly" },
  { path: "/practice-tests/cpr", priority: "0.7", changefreq: "monthly" },
  { path: "/practice-tests/notary", priority: "0.7", changefreq: "monthly" },

  // General test pages
  { path: "/car-permit-practice-test", priority: "0.8", changefreq: "monthly" },
  { path: "/motorcycle-permit-practice-test", priority: "0.7", changefreq: "monthly" },
  { path: "/cdl-general-knowledge-practice-test", priority: "0.7", changefreq: "monthly" },
  { path: "/us-citizenship-civics-practice-test", priority: "0.8", changefreq: "monthly" },
  { path: "/real-estate-exam-practice-test", priority: "0.7", changefreq: "monthly" },
  { path: "/food-handler-practice-test", priority: "0.7", changefreq: "monthly" },
  { path: "/osha-10-hour-practice-test", priority: "0.7", changefreq: "monthly" },
  { path: "/cpr-first-aid-practice-test", priority: "0.7", changefreq: "monthly" },
  { path: "/notary-public-practice-test", priority: "0.7", changefreq: "monthly" },
];

// State DMV pages (highest volume — these are the money pages)
for (const stateName of Object.values(STATE_NAMES)) {
  routes.push({
    path: `/${stateName}-dmv-practice-test`,
    priority: "0.8",
    changefreq: "monthly",
  });
}

// Build XML
const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes.map(r => `  <url>
    <loc>${BASE_URL}${r.path}</loc>
    <lastmod>${TODAY}</lastmod>
    <changefreq>${r.changefreq}</changefreq>
    <priority>${r.priority}</priority>
  </url>`).join("\n")}
</urlset>
`;

// Write to dist/
const distDir = join(__dirname, "..", "dist");
if (!existsSync(distDir)) {
  mkdirSync(distDir, { recursive: true });
}

writeFileSync(join(distDir, "sitemap.xml"), xml);
console.log(`✅ Sitemap generated: ${routes.length} URLs → dist/sitemap.xml`);

// Also copy to public/ for dev server
const publicDir = join(__dirname, "..", "public");
writeFileSync(join(publicDir, "sitemap.xml"), xml);
console.log(`✅ Sitemap copied to public/sitemap.xml`);
