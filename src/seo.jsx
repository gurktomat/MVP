/* ═══════════════════════════════════════════
   QUIZLANE — DYNAMIC SEO ENGINE
   Per-page title, meta, OG, canonical, JSON-LD
   Auto-generates from test data + state info
   ═══════════════════════════════════════════ */

import { useEffect } from "react";
import { testCategories } from "./data/questions.js";
import { STATE_INFO } from "./data/stateInfo.js";
import { viewToUrl, getStateFullName } from "./utils/routes.js";

const BASE_URL = "https://quizlane.org";
const YEAR = new Date().getFullYear();

/* ── Build test lookup from testCategories ── */
const testLookup = {};
const categoryLookup = {};
testCategories.forEach(cat => {
  categoryLookup[cat.id] = cat;
  cat.tests.forEach(t => { testLookup[t.id] = { ...t, categoryId: cat.id, categoryName: cat.name }; });
});

/* ── Static SEO entries ── */
const STATIC_SEO = {
  home: {
    title: `QuizLane — Free Practice Tests | Pass Your Test on the First Try`,
    description: "Free practice tests for driving permits, US citizenship, real estate, food handler, OSHA safety & more. No account needed. Pass your test on the first try.",
  },
  categories: {
    title: "All Practice Tests — QuizLane",
    description: "Browse all free practice test categories: driving license, US citizenship, real estate, food handler, OSHA safety, and notary public exams.",
  },
  progress: {
    title: "My Progress — QuizLane",
    description: "Track your test scores, streaks, mastery levels, and improvement across all practice tests on QuizLane.",
  },
  "weak-areas": {
    title: "Review Weak Areas — QuizLane",
    description: "Practice your weakest questions using spaced repetition. Focus on what you need to improve most.",
  },
};

/* ── Category SEO ── */
const CATEGORY_SEO = {
  driving: {
    title: `Free DMV Practice Tests ${YEAR} — All 50 States | QuizLane`,
    description: "Free DMV practice tests for all 50 states. Car permit, motorcycle endorsement, and CDL questions with instant feedback and explanations.",
  },
  citizenship: {
    title: `Free US Citizenship Practice Test ${YEAR} — 100 Civics Questions | QuizLane`,
    description: "Practice all 100 USCIS civics questions for the US naturalization test. Free, no account needed. Pass your citizenship test.",
  },
  "real-estate": {
    title: `Free Real Estate Exam Practice Test ${YEAR} | QuizLane`,
    description: "Prepare for your real estate license exam with free practice questions covering property law, contracts, finance, and national exam topics.",
  },
  "food-handler": {
    title: `Free Food Handler Practice Test ${YEAR} — ServSafe Prep | QuizLane`,
    description: "Prepare for your food handler certification with free ServSafe-style practice questions on food safety, hygiene, and temperature control.",
  },
  osha: {
    title: `Free OSHA 10-Hour Safety Practice Test ${YEAR} | QuizLane`,
    description: "Prepare for your OSHA 10-hour general industry certification with free workplace safety practice questions.",
  },
  cpr: {
    title: `Free CPR & First Aid Practice Test ${YEAR} | QuizLane`,
    description: "Practice CPR and first aid certification questions. Free test prep with instant feedback and explanations.",
  },
  notary: {
    title: `Free Notary Public Exam Practice Test ${YEAR} | QuizLane`,
    description: "Practice for your notary public commission exam with free questions covering notarial acts, laws, and procedures.",
  },
};

/**
 * Get SEO data for any view/viewData combination
 * Auto-generates titles/descriptions for state DMV tests
 */
function getSEOData(view, viewData) {
  // Static pages
  if (STATIC_SEO[view]) return STATIC_SEO[view];

  // Category pages
  if (view === "category" && viewData) {
    if (CATEGORY_SEO[viewData]) return CATEGORY_SEO[viewData];
    const cat = categoryLookup[viewData];
    if (cat) return {
      title: `Free ${cat.name} Practice Tests — QuizLane`,
      description: `Prepare for your ${cat.name.toLowerCase()} exam with free practice questions and explanations.`,
    };
  }

  // Quiz / test pages
  if (view === "quiz" && viewData) {
    const test = testLookup[viewData];
    if (!test) return STATIC_SEO.home;

    // State DMV test
    if (test.stateAbbrev) {
      const info = STATE_INFO[test.stateAbbrev];
      const stateName = getStateFullName(test.stateAbbrev) || test.name;
      if (info) {
        return {
          title: `Free ${stateName} DMV Practice Test ${YEAR} — ${info.writtenTestQuestions} Questions | QuizLane`,
          description: info.description,
        };
      }
      return {
        title: `Free ${stateName} DMV Practice Test ${YEAR} | QuizLane`,
        description: `Practice for your ${stateName} driver license written test. ${test.questionCount} free questions with instant feedback.`,
      };
    }

    // Non-state tests
    const testTitles = {
      "car-permit": `Free Car Permit DMV Practice Test ${YEAR} — ${test.questionCount} Questions | QuizLane`,
      "motorcycle": `Free Motorcycle Permit Practice Test ${YEAR} | QuizLane`,
      "cdl": `Free CDL General Knowledge Practice Test ${YEAR} | QuizLane`,
      "civics": `Free US Citizenship Civics Practice Test ${YEAR} — 100 Questions | QuizLane`,
      "re-national": `Free Real Estate National Exam Practice Test ${YEAR} | QuizLane`,
      "food-safety": `Free Food Handler Practice Test ${YEAR} — ServSafe Prep | QuizLane`,
      "osha-10": `Free OSHA 10-Hour Safety Practice Test ${YEAR} | QuizLane`,
      "cpr-firstaid": `Free CPR & First Aid Practice Test ${YEAR} | QuizLane`,
      "notary-gen": `Free Notary Public Exam Practice Test ${YEAR} | QuizLane`,
    };

    return {
      title: testTitles[viewData] || `${test.name} Practice Test — QuizLane`,
      description: test.description ? `${test.description}. ${test.questionCount} free practice questions with instant feedback and detailed explanations.` : `Free ${test.name} practice test with ${test.questionCount} questions and explanations.`,
    };
  }

  // Quick-fire and smart-study
  if (view === "quick-fire") {
    const test = testLookup[viewData];
    return {
      title: `Quick-Fire Mode${test ? ` — ${test.name}` : ""} | QuizLane`,
      description: "Race against the clock in quick-fire mode. 20 questions, 15 seconds each, 3 lives. Test your speed and accuracy.",
    };
  }
  if (view === "smart-study") {
    const test = testLookup[viewData];
    return {
      title: `Smart Study${test ? ` — ${test.name}` : ""} | QuizLane`,
      description: "Adaptive study mode that adjusts difficulty in real-time. Focus on what you need to learn most.",
    };
  }

  return STATIC_SEO.home;
}

/**
 * Build JSON-LD structured data for the current page
 */
function getStructuredData(view, viewData) {
  const path = viewToUrl(view, viewData);
  const pageUrl = `${BASE_URL}${path}`;
  const blocks = [];

  // Breadcrumbs for all pages
  const breadcrumbs = [{ name: "Home", url: BASE_URL }];

  if (view === "home") {
    // WebSite and Organization schemas are in index.html as static JSON-LD
    // Add ItemList of popular tests for rich results on homepage
    blocks.push({
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: "Popular Free Practice Tests",
      itemListElement: testCategories.slice(0, 5).flatMap((cat, ci) =>
        cat.tests.slice(0, 2).map((t, ti) => ({
          "@type": "ListItem",
          position: ci * 2 + ti + 1,
          name: t.name,
          url: `${BASE_URL}${viewToUrl("quiz", t.id)}`,
        }))
      ),
    });
  }

  if (view === "categories") {
    breadcrumbs.push({ name: "Practice Tests", url: pageUrl });
    blocks.push({
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: "Practice Test Categories",
      itemListElement: testCategories.map((cat, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: cat.name,
        url: `${BASE_URL}/practice-tests/${cat.id}`,
      })),
    });
  }

  if (view === "category" && viewData) {
    const cat = categoryLookup[viewData];
    if (cat) {
      breadcrumbs.push({ name: "Practice Tests", url: `${BASE_URL}/practice-tests` });
      breadcrumbs.push({ name: cat.name, url: pageUrl });
      blocks.push({
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: `${cat.name} Practice Tests`,
        itemListElement: cat.tests.map((t, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: t.name,
          url: `${BASE_URL}${viewToUrl("quiz", t.id)}`,
        })),
      });
    }
  }

  if (view === "quiz" && viewData) {
    const test = testLookup[viewData];
    if (test) {
      const cat = categoryLookup[test.categoryId];
      breadcrumbs.push({ name: "Practice Tests", url: `${BASE_URL}/practice-tests` });
      if (cat) breadcrumbs.push({ name: cat.name, url: `${BASE_URL}/practice-tests/${cat.id}` });
      breadcrumbs.push({ name: test.name, url: pageUrl });

      blocks.push({
        "@context": "https://schema.org",
        "@type": "Quiz",
        name: test.name,
        description: test.description,
        url: pageUrl,
        educationalLevel: "beginner",
        numberOfQuestions: test.questionCount,
        timeRequired: `PT${test.timeLimit}M`,
        isAccessibleForFree: true,
        inLanguage: "en-US",
        learningResourceType: "Practice Test",
        interactivityType: "active",
        provider: { "@type": "Organization", name: "QuizLane", url: BASE_URL },
        dateModified: new Date().toISOString().split("T")[0],
      });

      // FAQPage for state DMV tests
      if (test.stateAbbrev) {
        const info = STATE_INFO[test.stateAbbrev];
        if (info?.faqs?.length) {
          blocks.push({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: info.faqs.map(faq => ({
              "@type": "Question",
              name: faq.q,
              acceptedAnswer: { "@type": "Answer", text: faq.a },
            })),
          });
        }
      }
    }
  }

  // Add breadcrumbs if more than just Home
  if (breadcrumbs.length > 1) {
    blocks.push({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: breadcrumbs.map((bc, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: bc.name,
        item: bc.url,
      })),
    });
  }

  return blocks;
}

/**
 * Set or create a meta tag
 */
function setMeta(selector, attr, value) {
  let el = document.querySelector(selector);
  if (!el) {
    el = document.createElement("meta");
    const parts = selector.match(/\[(\w+)="([^"]+)"\]/g);
    if (parts) parts.forEach(p => {
      const [, a, v] = p.match(/\[(\w+)="([^"]+)"\]/);
      el.setAttribute(a, v);
    });
    document.head.appendChild(el);
  }
  el.setAttribute(attr, value);
}

/**
 * Main SEO hook — updates all meta tags, OG, canonical, and JSON-LD
 */
export function useSEO(view, viewData) {
  useEffect(() => {
    const seo = getSEOData(view, viewData);
    const path = viewToUrl(view, viewData);
    const fullUrl = `${BASE_URL}${path}`;

    // Title
    document.title = seo.title;

    // Meta description
    setMeta('meta[name="description"]', "content", seo.description);

    // Canonical
    let canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) canonical.setAttribute("href", fullUrl);

    // Open Graph
    setMeta('meta[property="og:title"]', "content", seo.title);
    setMeta('meta[property="og:description"]', "content", seo.description);
    setMeta('meta[property="og:url"]', "content", fullUrl);

    // Twitter
    setMeta('meta[name="twitter:title"]', "content", seo.title);
    setMeta('meta[name="twitter:description"]', "content", seo.description);

    // JSON-LD structured data
    // Remove old dynamic JSON-LD
    document.querySelectorAll('script[data-seo="dynamic"]').forEach(s => s.remove());

    const ldBlocks = getStructuredData(view, viewData);
    ldBlocks.forEach(block => {
      const script = document.createElement("script");
      script.type = "application/ld+json";
      script.setAttribute("data-seo", "dynamic");
      script.textContent = JSON.stringify(block);
      document.head.appendChild(script);
    });

    // Cleanup on unmount
    return () => {
      document.querySelectorAll('script[data-seo="dynamic"]').forEach(s => s.remove());
    };
  }, [view, viewData]);
}

/**
 * Analytics hook — sends page views to GA4
 */
export function useAnalytics(view, viewData) {
  useEffect(() => {
    const path = viewToUrl(view, viewData);

    // Google Analytics
    if (window.gtag) {
      window.gtag("event", "page_view", { page_path: path, page_title: document.title });
    }
  }, [view, viewData]);
}
