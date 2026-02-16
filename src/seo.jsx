import { useEffect } from "react";

/* Page titles and meta descriptions for each view */
const seoData = {
  home: {
    title: "QuizLane — Free Practice Tests | Pass Your Test on the First Try",
    description: "Free practice tests for driving permits, US citizenship, real estate, food handler, OSHA safety & more. No account needed. Pass your test on the first try.",
  },
  categories: {
    title: "All Practice Tests — QuizLane",
    description: "Browse all free practice test categories: driving license, US citizenship, real estate, food handler, OSHA safety, and notary public exams.",
  },
  "category-driving": {
    title: "Free Driving License Practice Tests — QuizLane",
    description: "Free DMV practice tests for car permit, motorcycle endorsement, and CDL. Real questions with explanations. Pass your driving test on the first try.",
  },
  "category-citizenship": {
    title: "Free US Citizenship Civics Practice Test — QuizLane",
    description: "Practice all 100 USCIS civics questions for the US naturalization test. Free, no account needed.",
  },
  "category-real-estate": {
    title: "Free Real Estate Exam Practice Test — QuizLane",
    description: "Prepare for your real estate license exam with free practice questions covering national exam topics.",
  },
  "category-food-handler": {
    title: "Free Food Handler Practice Test — QuizLane",
    description: "Prepare for your food handler certification with free ServSafe-style practice questions.",
  },
  "category-osha": {
    title: "Free OSHA 10-Hour Safety Practice Test — QuizLane",
    description: "Prepare for your OSHA 10-hour certification with free workplace safety practice questions.",
  },
  "category-notary": {
    title: "Free Notary Public Exam Practice Test — QuizLane",
    description: "Practice for your notary public commission exam with free questions covering notarial acts, laws, and procedures.",
  },
  "quiz-car-permit": {
    title: "Car Permit Practice Test — QuizLane",
    description: "25 DMV practice questions for your car permit test. Timed, with instant feedback and explanations.",
  },
  progress: {
    title: "My Progress — QuizLane",
    description: "Track your test scores and improvement across all practice tests on QuizLane.",
  },
};

export function useSEO(view, viewData) {
  useEffect(() => {
    let key = view;
    if (view === "category" && viewData) key = `category-${viewData}`;
    else if (view === "quiz" && viewData) key = `quiz-${viewData}`;

    const data = seoData[key] || seoData.home;
    document.title = data.title;

    let meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", data.description);
  }, [view, viewData]);
}

/* Simple page view analytics — logs to console for now, 
   easy to swap with Google Analytics, Plausible, etc. */
export function useAnalytics(view, viewData) {
  useEffect(() => {
    const page = viewData ? `/${view}/${viewData}` : `/${view}`;
    
    // Console log (for development)
    console.log(`[QuizLane] Page view: ${page}`);
    
    // Uncomment ONE of these when ready:
    
    // --- Google Analytics (gtag.js) ---
    if (window.gtag) window.gtag('event', 'page_view', { page_path: page });
    
    // --- Plausible ---
    // if (window.plausible) window.plausible('pageview', { u: window.location.origin + page });
    
    // --- Vercel Analytics ---
    // Already automatic if you install @vercel/analytics
    
  }, [view, viewData]);
}
