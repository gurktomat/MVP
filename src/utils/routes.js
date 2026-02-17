/* ═══════════════════════════════════════════
   QUIZLANE — URL ROUTING UTILITIES
   Maps test IDs ↔ SEO-friendly URL slugs
   ═══════════════════════════════════════════ */

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

// testId → URL slug mapping
// State DMVs: "dmv-ca" → "california-dmv-practice-test"
// Other tests: "car-permit" → "car-permit-practice-test"
export const TEST_URL_MAP = {
  // General driving tests
  "car-permit": "car-permit-practice-test",
  "motorcycle": "motorcycle-permit-practice-test",
  "cdl": "cdl-general-knowledge-practice-test",
  // Citizenship
  "civics": "us-citizenship-civics-practice-test",
  // Real estate
  "re-national": "real-estate-exam-practice-test",
  // Food handler
  "food-safety": "food-handler-practice-test",
  // OSHA
  "osha-10": "osha-10-hour-practice-test",
  // CPR
  "cpr-firstaid": "cpr-first-aid-practice-test",
  // Notary
  "notary-gen": "notary-public-practice-test",
};

// Generate state DMV entries: "dmv-ca" → "california-dmv-practice-test"
for (const [abbrev, stateName] of Object.entries(STATE_NAMES)) {
  TEST_URL_MAP[`dmv-${abbrev.toLowerCase()}`] = `${stateName}-dmv-practice-test`;
}

// Reverse map: URL slug → testId
export const URL_TO_TEST_MAP = {};
for (const [testId, slug] of Object.entries(TEST_URL_MAP)) {
  URL_TO_TEST_MAP[slug] = testId;
}

// Category ID → URL slug
export const CATEGORY_URL_MAP = {
  "driving": "driving",
  "citizenship": "citizenship",
  "real-estate": "real-estate",
  "food-handler": "food-handler",
  "osha": "osha",
  "cpr": "cpr",
  "notary": "notary",
};

export const URL_TO_CATEGORY_MAP = {};
for (const [catId, slug] of Object.entries(CATEGORY_URL_MAP)) {
  URL_TO_CATEGORY_MAP[slug] = catId;
}

/**
 * Convert a test ID to its full URL path
 * @param {string} testId - e.g., "dmv-ca", "car-permit"
 * @returns {string} e.g., "/california-dmv-practice-test"
 */
export function getTestUrl(testId) {
  const slug = TEST_URL_MAP[testId];
  return slug ? `/${slug}` : `/practice-test/${testId}`;
}

/**
 * Convert a category ID to its full URL path
 * @param {string} categoryId - e.g., "driving"
 * @returns {string} e.g., "/practice-tests/driving"
 */
export function getCategoryUrl(categoryId) {
  const slug = CATEGORY_URL_MAP[categoryId] || categoryId;
  return `/practice-tests/${slug}`;
}

/**
 * Convert old (view, viewData) pair to a URL path
 * Used by the nav() adapter to preserve all existing onNavigate calls
 */
export function viewToUrl(view, viewData = null) {
  switch (view) {
    case "home": return "/";
    case "categories": return "/practice-tests";
    case "category": return getCategoryUrl(viewData);
    case "quiz": return getTestUrl(viewData);
    case "quick-fire": return `/quick-fire/${viewData}`;
    case "smart-study": return `/smart-study/${viewData}`;
    case "progress": return "/progress";
    case "weak-areas": return "/weak-areas";
    default: return "/";
  }
}

/**
 * Convert a URL path back to (view, viewData) pair
 * Used for SEO and analytics hooks
 */
export function urlToView(pathname) {
  // Exact matches
  if (pathname === "/" || pathname === "") return { view: "home", viewData: null };
  if (pathname === "/practice-tests") return { view: "categories", viewData: null };
  if (pathname === "/progress") return { view: "progress", viewData: null };
  if (pathname === "/weak-areas") return { view: "weak-areas", viewData: null };

  // Category pages: /practice-tests/:slug
  const catMatch = pathname.match(/^\/practice-tests\/(.+)$/);
  if (catMatch) {
    const catId = URL_TO_CATEGORY_MAP[catMatch[1]] || catMatch[1];
    return { view: "category", viewData: catId };
  }

  // Quick-fire: /quick-fire/:testId
  const qfMatch = pathname.match(/^\/quick-fire\/(.+)$/);
  if (qfMatch) return { view: "quick-fire", viewData: qfMatch[1] };

  // Smart study: /smart-study/:testId
  const ssMatch = pathname.match(/^\/smart-study\/(.+)$/);
  if (ssMatch) return { view: "smart-study", viewData: ssMatch[1] };

  // Test pages: /:slug (check against URL_TO_TEST_MAP)
  const slug = pathname.replace(/^\//, "");
  if (URL_TO_TEST_MAP[slug]) {
    return { view: "quiz", viewData: URL_TO_TEST_MAP[slug] };
  }

  // Fallback
  return { view: "home", viewData: null };
}

/**
 * Get full state name from abbreviation
 */
export function getStateFullName(abbrev) {
  const name = STATE_NAMES[abbrev?.toUpperCase()];
  if (!name) return null;
  // Convert slug form "new-york" → "New York"
  return name.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

/**
 * Get all routes for pre-rendering / sitemap generation
 */
export function getAllRoutes() {
  const routes = [
    "/",
    "/practice-tests",
    "/progress",
    "/weak-areas",
  ];

  // Category pages
  for (const slug of Object.values(CATEGORY_URL_MAP)) {
    routes.push(`/practice-tests/${slug}`);
  }

  // Test pages
  for (const slug of Object.values(TEST_URL_MAP)) {
    routes.push(`/${slug}`);
  }

  return routes;
}
