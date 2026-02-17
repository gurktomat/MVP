import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Routes, Route, useNavigate, useLocation, useParams, Navigate } from "react-router-dom";
import { testCategories, questionBank } from "./data/questions.js";
import { useSEO, useAnalytics } from "./seo.jsx";
import { useMastery } from "./hooks/useMastery.js";
import { useGoal } from "./hooks/useGoal.js";
import { MASTERY_LABELS, MASTERY_COLORS } from "./utils/sm2.js";
import { MYSTERY_THRESHOLDS, MULTIPLIER_WEIGHTS, SPIN_SEGMENTS } from "./data/rewards.js";
import { getContextualQuote } from "./data/quotes.js";
import { viewToUrl, urlToView, URL_TO_TEST_MAP, URL_TO_CATEGORY_MAP } from "./utils/routes.js";
import SpinWheel from "./components/SpinWheel.jsx";
import { CelebrationOverlay } from "./components/Celebrations.jsx";
import QuickFirePage from "./components/QuickFire.jsx";
import SmartStudyPage from "./components/SmartStudy.jsx";
import ShareCard from "./components/ShareCard.jsx";
import OnboardingFlow from "./components/Onboarding.jsx";
import WeakAreasPage from "./components/WeakAreas.jsx";
import StateLandingPage from "./components/StateLanding.jsx";
import {
  Home, BookOpen, BarChart3, Sun, Moon, Flame, Sparkles, Trophy, Target, Zap,
  Clock, CheckCircle2, XCircle, ChevronRight, ArrowLeft, X, FileText, Award,
  TrendingUp, Users, Shield, Brain, Lightbulb, ChevronDown, Star, Crown,
  Compass, Rocket, Gem, Swords, Gauge, CircleDot, Info, Gift, Calendar,
  BookOpenCheck, GraduationCap, ClipboardList, MapPin, Timer, Percent,
  ArrowRight, Keyboard, RotateCcw, Play, Eye, Search, SlidersHorizontal,
  Quote, ArrowUpRight, Hash, Minus, Heart, RefreshCw, Share2, Copy
} from "lucide-react";

/* ═══════════════════════════════════════════
   DATA (imported from ./data/questions.js)
   ═══════════════════════════════════════════ */


/* ═══════════════════════════════════════════
   HOOKS
   ═══════════════════════════════════════════ */
const useBreakpoint = () => {
  const [bp, setBp] = useState("mobile");
  useEffect(() => {
    const check = () => {
      const w = window.innerWidth;
      if (w >= 1536) setBp("4k");
      else if (w >= 1280) setBp("desktop");
      else if (w >= 768) setBp("tablet");
      else setBp("mobile");
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return bp;
};

/* ═══════════════════════════════════════════
   LOCAL STORAGE HOOK
   ═══════════════════════════════════════════ */
const useLocalStorage = (key, initialValue) => {
  const [value, setValue] = useState(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch { return initialValue; }
  });
  useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
  }, [key, value]);
  return [value, setValue];
};

/* ═══════════════════════════════════════════
   THEME HOOK
   ═══════════════════════════════════════════ */
const useTheme = () => {
  const [theme, setTheme] = useLocalStorage("ql-theme", "system");
  const [resolved, setResolved] = useState("dark");
  useEffect(() => {
    if (theme !== "system") { setResolved(theme); return; }
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    setResolved(mq.matches ? "dark" : "light");
    const handler = (e) => setResolved(e.matches ? "dark" : "light");
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme]);
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", resolved);
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", resolved === "dark" ? "#0f0f17" : "#fafaf8");
  }, [resolved]);
  const toggle = () => setTheme(resolved === "dark" ? "light" : "dark");
  return { theme, resolved, toggle, setTheme };
};

/* ═══════════════════════════════════════════
   GAMIFICATION CONSTANTS
   ═══════════════════════════════════════════ */
const XP_VALUES = { correctAnswer: 10, perfectScore: 50, quizComplete: 25, streakBonus: 15, dailyChallenge: 40 };

const LevelIcon = ({ name, size = 18, ...props }) => {
  const icons = { Newcomer: CircleDot, Learner: BookOpen, Student: BookOpenCheck, Scholar: GraduationCap, Expert: Lightbulb, Master: Star, Champion: Trophy, Wizard: Brain, Sage: Eye, Legend: Crown };
  const Icon = icons[name] || CircleDot;
  return <Icon size={size} {...props} />;
};

const BadgeIcon = ({ id, size = 22, ...props }) => {
  const icons = { "first-steps": Target, perfectionist: Gem, "on-fire": Flame, "weekly-warrior": Swords, explorer: Compass, overachiever: Rocket, "speed-demon": Gauge, "xp-milestone": Sparkles };
  const Icon = icons[id] || Award;
  return <Icon size={size} {...props} />;
};

const LEVELS = [
  { name: "Newcomer", min: 0 },
  { name: "Learner", min: 100 },
  { name: "Student", min: 300 },
  { name: "Scholar", min: 600 },
  { name: "Expert", min: 1000 },
  { name: "Master", min: 1500 },
  { name: "Champion", min: 2200 },
  { name: "Wizard", min: 3000 },
  { name: "Sage", min: 4000 },
  { name: "Legend", min: 5500 },
];

const BADGES = [
  { id: "first-steps", name: "First Steps", desc: "Complete your first quiz", check: (s) => Object.values(s.stats || {}).some(v => v.attempts > 0) },
  { id: "perfectionist", name: "Perfectionist", desc: "Score 100% on any quiz", check: (s) => Object.values(s.stats || {}).some(v => v.bestScore === 100) },
  { id: "on-fire", name: "On Fire", desc: "Maintain a 3-day streak", check: (s) => (s.game?.streak || 0) >= 3 },
  { id: "weekly-warrior", name: "Weekly Warrior", desc: "Maintain a 7-day streak", check: (s) => (s.game?.streak || 0) >= 7 },
  { id: "explorer", name: "Explorer", desc: "Try 5 different tests", check: (s) => Object.values(s.stats || {}).filter(v => v.attempts > 0).length >= 5 },
  { id: "overachiever", name: "Overachiever", desc: "Pass 10 quizzes", check: (s) => Object.values(s.stats || {}).reduce((n, v) => n + (v.passed ? 1 : 0), 0) >= 10 },
  { id: "speed-demon", name: "Speed Demon", desc: "Complete a quiz in under 2 minutes", check: (s) => Object.values(s.stats || {}).some(v => v.history?.some(h => h.timeSpent < 120)) },
  { id: "xp-milestone", name: "XP Milestone", desc: "Earn 1000 XP", check: (s) => (s.game?.xp || 0) >= 1000 },
];

const getLevel = (xp) => {
  for (let i = LEVELS.length - 1; i >= 0; i--) { if (xp >= LEVELS[i].min) return { ...LEVELS[i], index: i, nextMin: LEVELS[i + 1]?.min || null }; }
  return { ...LEVELS[0], index: 0, nextMin: LEVELS[1].min };
};

const INITIAL_GAME_STATE = {
  xp: 0, streak: 0, lastActiveDate: null, badges: [], dailyChallengeDate: null, dailyChallengeTestId: null, weekActivity: [],
  // Streak Shields
  streakShields: 0, shieldsEarned: 0, shieldUsedDates: [], lastStreakMilestone: 0,
  // Variable Rewards
  dailyMultiplier: 1, dailyMultiplierDate: null, mysteryBoxesClaimed: [], titles: [], activeTitle: null,
  // Spin Wheel
  lastSpinDate: null, lastSpinReward: null, spinsTotal: 0,
  // Onboarding
  onboardingComplete: false, selectedCategory: null,
  // Completion tracking for today
  quizCompletedToday: false, quizCompletedTodayDate: null,
};

/* ═══════════════════════════════════════════
   DAILY MULTIPLIER (Variable Reward)
   ═══════════════════════════════════════════ */
const getDailyMultiplier = () => {
  const seed = new Date().toDateString().split("").reduce((a, c, i) => a + c.charCodeAt(0) * (i + 1), 0);
  const totalWeight = MULTIPLIER_WEIGHTS.reduce((s, w) => s + w.weight, 0);
  let roll = seed % totalWeight;
  for (const m of MULTIPLIER_WEIGHTS) {
    roll -= m.weight;
    if (roll <= 0) return m;
  }
  return MULTIPLIER_WEIGHTS[0];
};

/* Category & test icon mapping (replaces data-file emoji with Lucide SVGs) */
const CAT_ICONS = {
  driving: { Icon: Play, color: "#2563eb" },
  citizenship: { Icon: Shield, color: "#dc2626" },
  "real-estate": { Icon: Home, color: "#16a34a" },
  "food-handler": { Icon: Award, color: "#d97706" },
  osha: { Icon: Shield, color: "#ea580c" },
  cpr: { Icon: TrendingUp, color: "#e11d48" },
  notary: { Icon: FileText, color: "#7c3aed" },
};
const TEST_ICONS = {
  "car-permit": Play, motorcycle: Gauge, cdl: Gauge,
  civics: BookOpenCheck, "re-national": ClipboardList,
  "food-safety": Award, "osha-10": Shield,
  "cpr-firstaid": TrendingUp, "notary-gen": FileText,
};
const CatIcon = ({ catId, size = 24, style = {} }) => {
  const entry = CAT_ICONS[catId] || { Icon: BookOpen, color: "var(--accent)" };
  return <entry.Icon size={size} style={{ color: entry.color, ...style }} />;
};
const TestIcon = ({ testId, size = 24, style = {} }) => {
  const Icon = testId.startsWith("dmv-") ? MapPin : (TEST_ICONS[testId] || BookOpen);
  return <Icon size={size} style={style} />;
};

const getDailyChallenge = (gameState) => {
  const today = new Date().toDateString();
  if (gameState.dailyChallengeDate === today && gameState.dailyChallengeTestId) {
    return gameState.dailyChallengeTestId;
  }
  const allTests = testCategories.flatMap(c => c.tests);
  const seed = new Date().toDateString().split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return allTests[seed % allTests.length].id;
};

/* ═══════════════════════════════════════════
   TOAST SYSTEM
   ═══════════════════════════════════════════ */
const useToasts = () => {
  const [toasts, setToasts] = useState([]);
  const add = useCallback((msg, type = "info", duration = 3500) => {
    const id = Date.now() + Math.random();
    setToasts(p => [...p, { id, msg, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), duration);
  }, []);
  return { toasts, addToast: add };
};

/* ═══════════════════════════════════════════
   GLOBAL STYLES
   ═══════════════════════════════════════════ */
const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,300..800;1,14..32,300..800&family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;0,8..60,700;0,8..60,800;1,8..60,400&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    :root, [data-theme="light"] {
      --font-heading: 'Source Serif 4', Georgia, serif;
      --font-body: 'Inter', system-ui, sans-serif;
      --ink: #1a1a2e;
      --ink-light: #4a4a6a;
      --ink-muted: #6b6b86;
      --surface: #fafaf8;
      --surface-raised: #ffffff;
      --surface-sunken: #f0f0ec;
      --surface-overlay: rgba(255,255,255,0.85);
      --surface-glass: rgba(255,255,255,0.6);
      --border: #e8e8e2;
      --border-light: #f0f0ec;
      --accent: #2563eb;
      --accent-soft: #eff4ff;
      --accent-glow: rgba(37,99,235,0.12);
      --success: #16a34a;
      --success-soft: #f0fdf4;
      --danger: #dc2626;
      --danger-soft: #fef2f2;
      --warm: #f59e0b;
      --warm-soft: #fffbeb;
      --xp-violet: #a78bfa;
      --xp-violet-soft: #f3f0ff;
      --streak-orange: #fb923c;
      --streak-orange-soft: #fff7ed;
      --badge-gold: #facc15;
      --badge-gold-soft: #fefce8;
      --gradient-accent: linear-gradient(135deg, #2563eb, #7c3aed);
      --gradient-streak: linear-gradient(135deg, #fb923c, #f97316);
      --gradient-xp: linear-gradient(135deg, #a78bfa, #8b5cf6);
      --gradient-hero: linear-gradient(180deg, var(--surface) 0%, var(--surface-sunken) 100%);
      --shadow-sm: 0 1px 3px rgba(0,0,0,0.04);
      --shadow-md: 0 4px 16px rgba(0,0,0,0.06);
      --shadow-lg: 0 8px 32px rgba(0,0,0,0.08);
      --shadow-glow: 0 0 40px rgba(37,99,235,0.08);
      --radius-sm: 10px;
      --radius-md: 16px;
      --radius-lg: 22px;
      --radius-xl: 28px;
      --grain-opacity: 0.03;
    }
    [data-theme="dark"] {
      --ink: #e8e8f0;
      --ink-light: #a0a0b8;
      --ink-muted: #8888a4;
      --surface: #0f0f17;
      --surface-raised: #1a1a27;
      --surface-sunken: #0a0a12;
      --surface-overlay: rgba(15,15,23,0.85);
      --surface-glass: rgba(26,26,39,0.6);
      --border: #2a2a3c;
      --border-light: #222233;
      --accent: #60a5fa;
      --accent-soft: rgba(96,165,250,0.14);
      --accent-glow: rgba(96,165,250,0.22);
      --success: #4ade80;
      --success-soft: rgba(74,222,128,0.12);
      --danger: #f87171;
      --danger-soft: rgba(248,113,113,0.12);
      --warm: #fbbf24;
      --warm-soft: rgba(251,191,36,0.1);
      --xp-violet: #c4b5fd;
      --xp-violet-soft: rgba(196,181,253,0.12);
      --streak-orange: #fdba74;
      --streak-orange-soft: rgba(253,186,116,0.12);
      --badge-gold: #fde047;
      --badge-gold-soft: rgba(253,224,71,0.1);
      --gradient-accent: linear-gradient(135deg, #2563eb, #7c3aed);
      --gradient-streak: linear-gradient(135deg, #fdba74, #fb923c);
      --gradient-xp: linear-gradient(135deg, #c4b5fd, #a78bfa);
      --gradient-hero: linear-gradient(180deg, #0f0f17 0%, #0a0a12 100%);
      --shadow-sm: 0 1px 3px rgba(0,0,0,0.2);
      --shadow-md: 0 4px 16px rgba(0,0,0,0.3);
      --shadow-lg: 0 8px 32px rgba(0,0,0,0.4);
      --shadow-glow: 0 0 40px rgba(59,130,246,0.1);
      --radius-sm: 10px;
      --radius-md: 16px;
      --radius-lg: 22px;
      --radius-xl: 28px;
      --grain-opacity: 0.02;
    }
    body { font-family: var(--font-body); background: var(--surface); color: var(--ink); -webkit-font-smoothing: antialiased; transition: background 0.4s ease, color 0.3s; line-height: 1.6; }
    h1, h2, h3 { font-family: var(--font-heading); line-height: 1.2; }
    .hide-scrollbar::-webkit-scrollbar { display: none; }
    .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
    ::selection { background: var(--accent-soft); color: var(--accent); }
    @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes scaleIn { from { opacity: 0; transform: scale(0.92); } to { opacity: 1; transform: scale(1); } }
    @keyframes slideIn { from { opacity: 0; transform: translateX(-12px); } to { opacity: 1; transform: translateX(0); } }
    @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-8px); } }
    @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
    @keyframes pulseRing { 0% { box-shadow: 0 0 0 0 rgba(59,130,246,0.3); } 70% { box-shadow: 0 0 0 10px rgba(59,130,246,0); } 100% { box-shadow: 0 0 0 0 rgba(59,130,246,0); } }
    @keyframes scoreCount { from { opacity: 0; transform: scale(0.5); } to { opacity: 1; transform: scale(1); } }
    @keyframes drawCircle { from { stroke-dashoffset: var(--circumference); } to { stroke-dashoffset: var(--offset); } }
    @keyframes confettiBurst { 0% { opacity: 1; transform: translateY(0) rotate(0deg) scale(1); } 100% { opacity: 0; transform: translateY(-80px) rotate(720deg) scale(0.3); } }
    @keyframes pageEnter { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes streakPulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.15); } }
    @keyframes levelUp { 0% { opacity: 0; transform: scale(0.5) translateY(20px); } 50% { transform: scale(1.1) translateY(-5px); } 100% { opacity: 1; transform: scale(1) translateY(0); } }
    @keyframes toastIn { from { opacity: 0; transform: translateY(-10px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
    @keyframes toastOut { from { opacity: 1; transform: translateX(0); } to { opacity: 0; transform: translateX(100%); } }
    @keyframes xpFloat { 0% { opacity: 1; transform: translateY(0) scale(1); } 100% { opacity: 0; transform: translateY(-30px) scale(1.2); } }
    @keyframes skeletonShimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
    @keyframes gentleBounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
    @keyframes progressFill { from { width: 0%; } }
    @keyframes slideDown { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes correctPop { 0% { transform: scale(1); } 40% { transform: scale(1.03); } 100% { transform: scale(1); } }
    @keyframes wrongShake { 0%, 100% { transform: translateX(0); } 20%, 60% { transform: translateX(-3px); } 40%, 80% { transform: translateX(3px); } }
    .anim-fade-up { animation: fadeUp 0.5s cubic-bezier(0.22, 1, 0.36, 1) both; }
    .anim-scale-in { animation: scaleIn 0.4s cubic-bezier(0.22, 1, 0.36, 1) both; }
    .anim-slide-in { animation: slideIn 0.4s cubic-bezier(0.22, 1, 0.36, 1) both; }
    .anim-page-enter { animation: pageEnter 0.4s cubic-bezier(0.22, 1, 0.36, 1) both; }
    .anim-d1 { animation-delay: 0.06s; }
    .anim-d2 { animation-delay: 0.12s; }
    .anim-d3 { animation-delay: 0.18s; }
    .anim-d4 { animation-delay: 0.24s; }
    .anim-d5 { animation-delay: 0.3s; }
    .anim-d6 { animation-delay: 0.36s; }
    .tap-target { min-height: 48px; min-width: 48px; }
    @media (hover: hover) {
      .hover-lift:hover { transform: translateY(-4px); box-shadow: var(--shadow-lg); }
      .hover-glow:hover { box-shadow: var(--shadow-glow), 0 4px 16px rgba(0,0,0,0.06); border-color: var(--accent) !important; }
      .hover-option:hover { background: var(--accent-soft) !important; border-color: var(--accent) !important; transform: translateX(4px); }
      .hover-scale:hover { transform: scale(1.02); }
    }
    button { transition: all 0.25s cubic-bezier(0.22, 1, 0.36, 1); }
    button:active { transform: scale(0.97); }
    .grain { position: fixed; inset: 0; pointer-events: none; opacity: var(--grain-opacity); z-index: 9999;
      background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
    }
    .skeleton { background: linear-gradient(90deg, var(--surface-sunken) 25%, var(--border-light) 50%, var(--surface-sunken) 75%); background-size: 200% 100%; animation: skeletonShimmer 1.5s ease-in-out infinite; border-radius: 8px; }
    .glass-card { background: var(--surface-glass); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border: 1px solid var(--border); }
    .focus-ring:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
    input[type="search"] { -webkit-appearance: none; }
    input[type="search"]::-webkit-search-cancel-button { -webkit-appearance: none; }
  `}</style>
);

/* ═══════════════════════════════════════════
   SHARED COMPONENTS
   ═══════════════════════════════════════════ */
const ToastContainer = ({ toasts }) => (
  <div style={{ position: "fixed", top: 20, right: 20, zIndex: 10000, display: "flex", flexDirection: "column", gap: 10 }}>
    {toasts.map((t) => {
      const colors = { badge: { bg: "var(--badge-gold-soft)", border: "var(--badge-gold)", icon: "var(--badge-gold)" }, xp: { bg: "var(--xp-violet-soft)", border: "var(--xp-violet)", icon: "var(--xp-violet)" }, streak: { bg: "var(--streak-orange-soft)", border: "var(--streak-orange)", icon: "var(--streak-orange)" }, levelup: { bg: "var(--accent-soft)", border: "var(--accent)", icon: "var(--accent)" } };
      const c = colors[t.type] || { bg: "var(--surface-raised)", border: "var(--border)", icon: "var(--ink-muted)" };
      const Icon = t.type === "badge" ? Award : t.type === "xp" ? Sparkles : t.type === "streak" ? Flame : t.type === "levelup" ? TrendingUp : Info;
      return (
        <div key={t.id} style={{
          padding: "14px 20px", borderRadius: 16, display: "flex", alignItems: "center", gap: 12,
          background: c.bg, border: `1.5px solid ${c.border}`,
          boxShadow: "var(--shadow-lg)", animation: "toastIn 0.35s cubic-bezier(0.22, 1, 0.36, 1)",
          fontFamily: "var(--font-body)", fontSize: 14, fontWeight: 500, color: "var(--ink)",
          maxWidth: 360, backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
        }}>
          <div style={{ width: 32, height: 32, borderRadius: 10, background: c.bg, border: `1px solid ${c.border}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Icon size={16} style={{ color: c.icon }} />
          </div>
          <span style={{ lineHeight: 1.4 }}>{t.msg}</span>
        </div>
      );
    })}
  </div>
);

const CountUpNumber = ({ end, duration = 1200 }) => {
  const [val, setVal] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    const start = 0; const startTime = Date.now();
    const tick = () => {
      const elapsed = Date.now() - startTime;
      if (elapsed >= duration) { setVal(end); return; }
      const progress = elapsed / duration;
      const eased = 1 - Math.pow(1 - progress, 3);
      setVal(Math.round(start + (end - start) * eased));
      ref.current = requestAnimationFrame(tick);
    };
    ref.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(ref.current);
  }, [end, duration]);
  return <span>{val}</span>;
};

const StreakIndicator = ({ streak, compact }) => {
  if (!streak || streak < 1) return null;
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: compact ? 4 : 6,
      background: "var(--streak-orange-soft)", border: "1px solid var(--streak-orange)",
      borderRadius: 100, padding: compact ? "3px 8px" : "4px 12px",
      fontSize: compact ? 11 : 13, fontWeight: 600, color: "var(--streak-orange)",
    }}>
      <Flame size={compact ? 12 : 14} style={{ animation: streak >= 3 ? "streakPulse 1.5s ease-in-out infinite" : "none" }} />
      {streak}
    </div>
  );
};

const XPPill = ({ xp, compact }) => {
  const level = getLevel(xp);
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: compact ? 4 : 6,
      background: "var(--xp-violet-soft)", border: "1px solid var(--xp-violet)",
      borderRadius: 100, padding: compact ? "3px 8px" : "4px 12px",
      fontSize: compact ? 11 : 13, fontWeight: 600, color: "var(--xp-violet)",
    }}>
      <LevelIcon name={level.name} size={compact ? 12 : 14} />
      {compact ? `${xp}` : `${xp} XP`}
    </div>
  );
};

const ThemeToggle = ({ resolved, toggle, size = 32 }) => (
  <button onClick={toggle} aria-label="Toggle theme" style={{
    width: size, height: size, borderRadius: size / 2, border: "1px solid var(--border)",
    background: "var(--surface-sunken)", cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
    transition: "all 0.3s", fontSize: size * 0.45,
  }}>
    {resolved === "dark" ? <Sun size={size * 0.45} /> : <Moon size={size * 0.45} />}
  </button>
);

const WeekActivityDots = ({ weekActivity }) => {
  const days = ["M", "T", "W", "T", "F", "S", "S"];
  const today = new Date().getDay();
  const adjustedToday = today === 0 ? 6 : today - 1;
  return (
    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
      {days.map((d, i) => {
        const active = weekActivity?.includes(i);
        const isToday = i === adjustedToday;
        return (
          <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
            <div style={{
              width: 10, height: 10, borderRadius: "50%",
              background: active ? "var(--success)" : isToday ? "var(--accent-soft)" : "var(--surface-sunken)",
              border: isToday && !active ? "1.5px solid var(--accent)" : "1px solid var(--border-light)",
              transition: "all 0.2s",
            }} />
            <span style={{ fontSize: 9, color: "var(--ink-muted)", fontWeight: isToday ? 700 : 400 }}>{d}</span>
          </div>
        );
      })}
    </div>
  );
};

const BentoCard = ({ children, span = 1, accent, style = {} }) => (
  <div className="hover-glow" style={{
    gridColumn: `span ${span}`, background: "var(--surface-raised)", borderRadius: 22,
    padding: 24, border: "1.5px solid var(--border)", position: "relative", overflow: "hidden",
    transition: "all 0.35s cubic-bezier(0.22, 1, 0.36, 1)", ...style,
  }}>
    {accent && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: accent, borderRadius: "22px 22px 0 0" }} />}
    {children}
  </div>
);

/* ═══════════════════════════════════════════
   MOBILE BOTTOM NAV
   ═══════════════════════════════════════════ */
const MobileNav = ({ currentView, onNavigate, streak, xp, themeResolved, themeToggle }) => (
  <nav style={{
    position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 100,
    background: "var(--surface-overlay)", backdropFilter: "blur(24px) saturate(1.4)", WebkitBackdropFilter: "blur(24px) saturate(1.4)",
    borderTop: "1px solid var(--border)", paddingBottom: "env(safe-area-inset-bottom, 0px)",
  }}>
    {(streak > 0 || xp > 0) && (
      <div style={{ display: "flex", justifyContent: "center", gap: 8, padding: "7px 16px 0" }}>
        <StreakIndicator streak={streak} compact />
        <XPPill xp={xp} compact />
      </div>
    )}
    <div style={{ display: "flex", justifyContent: "space-around", padding: "6px 0 4px" }}>
      {[
        { id: "home", label: "Home", Icon: Home },
        { id: "categories", label: "Tests", Icon: FileText },
        { id: "progress", label: "Progress", Icon: BarChart3 },
      ].map((item) => {
        const active = currentView === item.id || (item.id === "categories" && (currentView === "category" || currentView === "quiz"));
        return (
          <button key={item.id} onClick={() => onNavigate(item.id)}
            className="tap-target"
            style={{
              display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
              background: "none", border: "none", cursor: "pointer", padding: "8px 20px",
              color: active ? "var(--accent)" : "var(--ink-muted)",
              fontFamily: "var(--font-body)", fontSize: 10, fontWeight: active ? 600 : 500,
              transition: "color 0.2s", position: "relative",
            }}>
            <item.Icon size={22} strokeWidth={active ? 2.5 : 2} />
            <span>{item.label}</span>
            {active && <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: 16, height: 2, borderRadius: 1, background: "var(--accent)" }} />}
          </button>
        );
      })}
      <button onClick={themeToggle} className="tap-target" style={{
        display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
        background: "none", border: "none", cursor: "pointer", padding: "8px 20px",
        color: "var(--ink-muted)", fontFamily: "var(--font-body)", fontSize: 10, fontWeight: 500,
      }}>
        {themeResolved === "dark" ? <Sun size={22} /> : <Moon size={22} />}
        <span>Theme</span>
      </button>
    </div>
  </nav>
);

/* ═══════════════════════════════════════════
   TABLET SIDEBAR
   ═══════════════════════════════════════════ */
const TabletSidebar = ({ currentView, onNavigate, streak, xp, themeResolved, themeToggle }) => (
  <aside style={{
    position: "fixed", left: 0, top: 0, bottom: 0, width: 72, zIndex: 100,
    background: "var(--surface-raised)", borderRight: "1px solid var(--border)",
    display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 16, gap: 4,
  }}>
    <button onClick={() => onNavigate("home")} style={{
      width: 44, height: 44, borderRadius: 14, border: "none", cursor: "pointer", marginBottom: 12,
      background: "var(--gradient-accent)", display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <span style={{ color: "white", fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 18 }}>Q</span>
    </button>
    {streak > 0 && <div style={{ marginBottom: 4 }}><StreakIndicator streak={streak} compact /></div>}
    {xp > 0 && <div style={{ marginBottom: 8 }}><XPPill xp={xp} compact /></div>}
    {[
      { id: "home", Icon: Home, label: "Home" },
      { id: "categories", Icon: FileText, label: "Tests" },
      { id: "progress", Icon: BarChart3, label: "Stats" },
    ].map((item) => {
      const active = currentView === item.id || (item.id === "categories" && (currentView === "category" || currentView === "quiz"));
      return (
        <button key={item.id} onClick={() => onNavigate(item.id)}
          className="tap-target"
          style={{
            width: 56, padding: "10px 0", borderRadius: 12, border: "none", cursor: "pointer",
            background: active ? "var(--accent-soft)" : "transparent",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
            transition: "background 0.2s",
            color: active ? "var(--accent)" : "var(--ink-muted)",
          }}>
          <item.Icon size={20} />
          <span style={{ fontSize: 10, fontFamily: "var(--font-body)", fontWeight: active ? 600 : 400, color: active ? "var(--accent)" : "var(--ink-muted)" }}>{item.label}</span>
        </button>
      );
    })}
    <div style={{ marginTop: "auto", marginBottom: 16 }}>
      <ThemeToggle resolved={themeResolved} toggle={themeToggle} size={36} />
    </div>
  </aside>
);

/* ═══════════════════════════════════════════
   DESKTOP HEADER
   ═══════════════════════════════════════════ */
const DesktopHeader = ({ currentView, onNavigate, is4k, streak, xp, themeResolved, themeToggle }) => (
  <header style={{
    position: "sticky", top: 0, zIndex: 100,
    background: "var(--surface-overlay)", backdropFilter: "blur(24px) saturate(1.4)", WebkitBackdropFilter: "blur(24px) saturate(1.4)",
    borderBottom: "1px solid var(--border)",
  }}>
    <div style={{
      maxWidth: is4k ? 1600 : 1200, margin: "0 auto", padding: is4k ? "0 48px" : "0 32px",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      height: is4k ? 80 : 64,
    }}>
      <button onClick={() => onNavigate("home")} style={{ display: "flex", alignItems: "center", gap: 12, background: "none", border: "none", cursor: "pointer" }}>
        <div style={{
          width: is4k ? 44 : 36, height: is4k ? 44 : 36, borderRadius: 12,
          background: "var(--gradient-accent)",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 2px 8px rgba(37,99,235,0.3)",
        }}>
          <span style={{ color: "white", fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: is4k ? 20 : 16 }}>Q</span>
        </div>
        <span style={{ fontFamily: "var(--font-heading)", fontSize: is4k ? 26 : 22, fontWeight: 700, color: "var(--ink)", letterSpacing: "-0.01em" }}>QuizLane</span>
      </button>
      <nav style={{ display: "flex", gap: 4, alignItems: "center" }}>
        {[
          { id: "home", label: "Home" },
          { id: "categories", label: "Practice Tests" },
          { id: "progress", label: "My Progress" },
        ].map((item) => {
          const active = currentView === item.id || (item.id === "categories" && (currentView === "category" || currentView === "quiz"));
          return (
            <button key={item.id} onClick={() => onNavigate(item.id)} className="focus-ring" style={{
              padding: is4k ? "10px 24px" : "8px 18px", borderRadius: 10, border: "none", cursor: "pointer",
              background: active ? "var(--accent-soft)" : "transparent",
              color: active ? "var(--accent)" : "var(--ink-light)",
              fontFamily: "var(--font-body)", fontSize: is4k ? 16 : 14, fontWeight: active ? 600 : 500,
              transition: "all 0.2s",
              position: "relative",
            }}>
              {item.label}
              {active && <div style={{ position: "absolute", bottom: -1, left: "50%", transform: "translateX(-50%)", width: 20, height: 2, borderRadius: 1, background: "var(--accent)" }} />}
            </button>
          );
        })}
        <div style={{ width: 1, height: 24, background: "var(--border)", margin: "0 10px" }} />
        <StreakIndicator streak={streak} />
        <XPPill xp={xp} />
        <ThemeToggle resolved={themeResolved} toggle={themeToggle} size={is4k ? 36 : 32} />
      </nav>
    </div>
  </header>
);

/* ═══════════════════════════════════════════
   RESPONSIVE CONTAINER
   ═══════════════════════════════════════════ */
const Container = ({ children, bp, noPad }) => {
  const styles = {
    mobile: { maxWidth: "100%", padding: noPad ? 0 : "0 16px", margin: "0 auto" },
    tablet: { maxWidth: "100%", padding: noPad ? 0 : "0 24px", margin: "0 auto", marginLeft: 72 },
    desktop: { maxWidth: 1200, padding: noPad ? 0 : "0 32px", margin: "0 auto" },
    "4k": { maxWidth: 1600, padding: noPad ? 0 : "0 48px", margin: "0 auto" },
  };
  return <div style={styles[bp]}>{children}</div>;
};

/* ═══════════════════════════════════════════
   HOME PAGE
   ═══════════════════════════════════════════ */
const HomePage = ({ onNavigate, bp, stats, gameState, dueCount, goalHook, getMasteryStats, dailyMultiplierInfo, onShowSpin }) => {
  const is4k = bp === "4k";
  const isDesktop = bp === "desktop" || is4k;
  const isTablet = bp === "tablet";
  const hasActivity = Object.values(stats).some(v => v.attempts > 0);
  const level = getLevel(gameState.xp || 0);
  const dailyTestId = getDailyChallenge(gameState);
  const dailyTest = testCategories.flatMap(c => c.tests).find(t => t.id === dailyTestId);
  const recentBadge = gameState.badges?.length > 0 ? BADGES.find(b => b.id === gameState.badges[gameState.badges.length - 1]) : null;

  if (hasActivity) {
    // RETURNING USER: Bento Grid Dashboard
    const totalAttempts = Object.values(stats).reduce((s, v) => s + (v.attempts || 0), 0);
    const avgScore = (() => {
      const completed = Object.values(stats).filter(v => v.attempts > 0);
      return completed.length > 0 ? Math.round(completed.reduce((s, v) => s + (v.bestScore || 0), 0) / completed.length) : 0;
    })();
    const xpProgress = level.nextMin ? ((gameState.xp - level.min) / (level.nextMin - level.min)) * 100 : 100;

    return (
      <div style={{ paddingBottom: bp === "mobile" ? 100 : 40 }}>
        <Container bp={bp}>
          <div style={{ padding: isDesktop ? "40px 0" : "24px 0" }}>
            {/* Welcome */}
            <div className="anim-fade-up" style={{ marginBottom: isDesktop ? 32 : 24 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                <h1 style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: is4k ? 40 : isDesktop ? 32 : 26 }}>
                  Welcome back
                </h1>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "var(--xp-violet-soft)", border: "1px solid var(--xp-violet)", borderRadius: 100, padding: "4px 12px" }}>
                  <LevelIcon name={level.name} size={16} style={{ color: "var(--xp-violet)" }} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: "var(--xp-violet)" }}>{level.name}</span>
                </div>
              </div>
              <p style={{ fontSize: is4k ? 17 : 15, color: "var(--ink-muted)" }}>
                {gameState.streak >= 3 ? `${gameState.streak}-day streak! You're on fire — keep it going.` : gameState.streak > 0 ? "Keep the momentum going — your streak is on the line!" : "Ready to start a new streak today?"}
              </p>
            </div>

            {/* Bento Grid */}
            <div style={{
              display: "grid",
              gridTemplateColumns: is4k ? "repeat(4, 1fr)" : isDesktop ? "repeat(4, 1fr)" : isTablet ? "repeat(2, 1fr)" : "1fr",
              gap: is4k ? 20 : 16,
            }}>
              {/* Streak Card */}
              <BentoCard accent="var(--gradient-streak)">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 12 }}>
                  <Flame size={32} style={{ color: "var(--streak-orange)", animation: gameState.streak >= 3 ? "streakPulse 1.5s ease-in-out infinite" : "none" }} />
                  <WeekActivityDots weekActivity={gameState.weekActivity} />
                </div>
                <div style={{ fontSize: is4k ? 40 : 34, fontWeight: 800, fontFamily: "var(--font-heading)", color: "var(--streak-orange)" }}>
                  <CountUpNumber end={gameState.streak || 0} />
                </div>
                <div style={{ fontSize: 13, color: "var(--ink-muted)", marginTop: 2 }}>Day Streak</div>
              </BentoCard>

              {/* Daily Challenge Card */}
              <BentoCard accent="var(--gradient-accent)">
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--accent)", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                  <Zap size={14} /> Daily Challenge
                </div>
                <h3 style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: is4k ? 18 : 16, marginBottom: 4 }}>{dailyTest?.name || "Random Quiz"}</h3>
                <p style={{ fontSize: 12, color: "var(--ink-muted)", marginBottom: 14 }}>+{XP_VALUES.dailyChallenge} bonus XP</p>
                <button onClick={() => onNavigate("quiz", dailyTestId)} className="tap-target" style={{
                  width: "100%", padding: "10px", borderRadius: 10, border: "none", cursor: "pointer",
                  background: "var(--gradient-accent)", color: "#fff", fontSize: 13, fontWeight: 600,
                  fontFamily: "var(--font-body)", transition: "transform 0.2s",
                }}>Take Challenge →</button>
              </BentoCard>

              {/* XP / Level Card */}
              <BentoCard accent="var(--gradient-xp)">
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                  <LevelIcon name={level.name} size={24} style={{ color: "var(--xp-violet)" }} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--xp-violet)" }}>{level.name}</div>
                    <div style={{ fontSize: 11, color: "var(--ink-muted)" }}>Level {level.index + 1}</div>
                  </div>
                </div>
                <div style={{ fontSize: is4k ? 30 : 26, fontWeight: 800, fontFamily: "var(--font-heading)", color: "var(--xp-violet)" }}>
                  <CountUpNumber end={gameState.xp || 0} /> <span style={{ fontSize: 14, fontWeight: 500 }}>XP</span>
                </div>
                {level.nextMin && (
                  <div style={{ marginTop: 8 }}>
                    <div style={{ width: "100%", height: 6, background: "var(--surface-sunken)", borderRadius: 4, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${xpProgress}%`, background: "var(--gradient-xp)", borderRadius: 4, transition: "width 0.5s" }} />
                    </div>
                    <div style={{ fontSize: 11, color: "var(--ink-muted)", marginTop: 4 }}>{level.nextMin - gameState.xp} XP to next level</div>
                  </div>
                )}
              </BentoCard>

              {/* Quick Stats Card */}
              <BentoCard>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink-muted)", marginBottom: 12 }}>Quick Stats</div>
                <div style={{ display: "grid", gap: 8 }}>
                  {[
                    { label: "Tests Taken", value: totalAttempts, color: "var(--accent)" },
                    { label: "Avg Score", value: `${avgScore}%`, color: "var(--success)" },
                    { label: "Badges", value: gameState.badges?.length || 0, color: "var(--badge-gold)" },
                  ].map((s, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: i < 2 ? "1px solid var(--border-light)" : "none" }}>
                      <span style={{ fontSize: 13, color: "var(--ink-muted)" }}>{s.label}</span>
                      <span style={{ fontSize: 15, fontWeight: 700, color: s.color }}>{s.value}</span>
                    </div>
                  ))}
                </div>
              </BentoCard>

              {/* Recent Badge */}
              {recentBadge && (
                <BentoCard accent="linear-gradient(135deg, var(--badge-gold), #f59e0b)">
                  <div style={{ textAlign: "center", padding: "8px 0" }}>
                    <div style={{ display: "flex", justifyContent: "center", marginBottom: 8, color: "var(--badge-gold)" }}><BadgeIcon id={recentBadge.id} size={40} /></div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "var(--badge-gold)" }}>{recentBadge.name}</div>
                    <div style={{ fontSize: 12, color: "var(--ink-muted)", marginTop: 2 }}>{recentBadge.desc}</div>
                  </div>
                </BentoCard>
              )}

              {/* Daily Multiplier Card */}
              {dailyMultiplierInfo && dailyMultiplierInfo.value > 1 && (
                <BentoCard accent="var(--gradient-xp)">
                  <div style={{ textAlign: "center", padding: "8px 0" }}>
                    <div style={{
                      fontSize: is4k ? 44 : 38, fontWeight: 900, fontFamily: "var(--font-heading)",
                      background: "var(--gradient-accent)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                      marginBottom: 4,
                    }}>{dailyMultiplierInfo.label}</div>
                    <p style={{ fontSize: 12, color: "var(--ink-muted)" }}>All XP earned today is multiplied!</p>
                  </div>
                </BentoCard>
              )}

              {/* Weak Areas Card */}
              {dueCount > 0 && (
                <BentoCard accent="var(--gradient-streak)">
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                    <Brain size={20} style={{ color: "var(--warm)" }} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: "var(--warm)" }}>Weak Areas</span>
                  </div>
                  <div style={{ fontSize: is4k ? 30 : 26, fontWeight: 800, fontFamily: "var(--font-heading)", color: "var(--warm)" }}>{dueCount}</div>
                  <div style={{ fontSize: 12, color: "var(--ink-muted)", marginBottom: 12 }}>questions need review</div>
                  <button onClick={() => onNavigate("weak-areas")} className="tap-target" style={{
                    width: "100%", padding: "10px", borderRadius: 10, border: "none", cursor: "pointer",
                    background: "var(--gradient-streak)", color: "#fff", fontSize: 13, fontWeight: 600,
                    fontFamily: "var(--font-body)",
                  }}>Review Now →</button>
                </BentoCard>
              )}

              {/* Goal Countdown Card */}
              {goalHook.goal && !goalHook.goal.dismissed && goalHook.daysLeft !== null && (
                <BentoCard accent={goalHook.urgency === "urgent" || goalHook.urgency === "critical" ? "var(--danger)" : "var(--gradient-accent)"}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                    <Calendar size={16} style={{ color: "var(--accent)" }} />
                    <span style={{ fontSize: 12, fontWeight: 600, color: "var(--accent)" }}>Test Day Goal</span>
                  </div>
                  <div style={{
                    fontSize: is4k ? 36 : 30, fontWeight: 800, fontFamily: "var(--font-heading)",
                    color: goalHook.urgency === "urgent" ? "var(--danger)" : goalHook.urgency === "alert" ? "var(--warm)" : "var(--accent)",
                  }}>{goalHook.daysLeft}</div>
                  <div style={{ fontSize: 12, color: "var(--ink-muted)", marginBottom: 6 }}>days until your test</div>
                  <p style={{ fontSize: 11, color: "var(--ink-light)", lineHeight: 1.4 }}>
                    {goalHook.getRecommendation(goalHook.getReadiness(stats, getMasteryStats))}
                  </p>
                </BentoCard>
              )}

              {/* Quick-Fire & Smart Study Buttons */}
              <BentoCard span={isDesktop ? 2 : isTablet ? 2 : 1}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <button onClick={() => onNavigate("quick-fire", "car-permit")} className="tap-target hover-scale" style={{
                    padding: "18px 12px", borderRadius: 14, border: "1.5px solid var(--danger)",
                    background: "var(--danger-soft)", cursor: "pointer", textAlign: "center",
                    fontFamily: "var(--font-body)", transition: "all 0.25s",
                  }}>
                    <Zap size={24} style={{ color: "var(--danger)", marginBottom: 6 }} />
                    <div style={{ fontSize: 14, fontWeight: 700, color: "var(--danger)" }}>Quick-Fire</div>
                    <div style={{ fontSize: 11, color: "var(--ink-muted)", marginTop: 2 }}>20 Qs • 15s each • 3 lives</div>
                  </button>
                  <button onClick={() => onNavigate("smart-study", "car-permit")} className="tap-target hover-scale" style={{
                    padding: "18px 12px", borderRadius: 14, border: "1.5px solid var(--accent)",
                    background: "var(--accent-soft)", cursor: "pointer", textAlign: "center",
                    fontFamily: "var(--font-body)", transition: "all 0.25s",
                  }}>
                    <Brain size={24} style={{ color: "var(--accent)", marginBottom: 6 }} />
                    <div style={{ fontSize: 14, fontWeight: 700, color: "var(--accent)" }}>Smart Study</div>
                    <div style={{ fontSize: 11, color: "var(--ink-muted)", marginTop: 2 }}>Adaptive • Infinite • Your pace</div>
                  </button>
                </div>
              </BentoCard>

              {/* Daily Spin Card */}
              {gameState.quizCompletedToday && gameState.lastSpinDate !== new Date().toDateString() && (
                <BentoCard accent="var(--badge-gold)">
                  <div style={{ textAlign: "center", padding: "8px 0" }}>
                    <Gift size={32} style={{ color: "var(--badge-gold)", marginBottom: 8, animation: "gentleBounce 2s ease-in-out infinite" }} />
                    <div style={{ fontSize: 14, fontWeight: 700, color: "var(--badge-gold)", marginBottom: 4 }}>Daily Spin Available!</div>
                    <p style={{ fontSize: 12, color: "var(--ink-muted)", marginBottom: 12 }}>Spin the wheel for bonus rewards</p>
                    <button onClick={onShowSpin} className="tap-target" style={{
                      padding: "10px 20px", borderRadius: 10, border: "none", cursor: "pointer",
                      background: "var(--badge-gold)", color: "var(--surface)", fontSize: 13, fontWeight: 700,
                      fontFamily: "var(--font-body)",
                    }}>Spin Now! 🎡</button>
                  </div>
                </BentoCard>
              )}

              {/* Streak Shield indicator */}
              {(gameState.streakShields || 0) > 0 && (
                <BentoCard>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <Shield size={18} style={{ color: "var(--accent)" }} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: "var(--accent)" }}>Streak Shields</span>
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    {[0, 1, 2].map(i => (
                      <div key={i} style={{
                        width: 28, height: 28, borderRadius: 8,
                        background: i < (gameState.streakShields || 0) ? "var(--accent-soft)" : "var(--surface-sunken)",
                        border: `1.5px solid ${i < (gameState.streakShields || 0) ? "var(--accent)" : "var(--border)"}`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        <Shield size={14} style={{ color: i < (gameState.streakShields || 0) ? "var(--accent)" : "var(--ink-muted)", opacity: i < (gameState.streakShields || 0) ? 1 : 0.3 }} />
                      </div>
                    ))}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--ink-muted)", marginTop: 6 }}>Protect your streak on missed days</div>
                </BentoCard>
              )}

              {/* Motivational Quote */}
              {(() => {
                const quote = getContextualQuote(gameState, stats[Object.keys(stats).pop()]?.lastScore);
                return (
                  <BentoCard span={isDesktop ? 2 : isTablet ? 2 : 1}>
                    <div style={{ display: "flex", gap: 12, alignItems: "start" }}>
                      <Quote size={24} style={{ color: "var(--ink-muted)", flexShrink: 0, marginTop: 2 }} />
                      <div>
                        <p style={{ fontFamily: "var(--font-heading)", fontStyle: "italic", fontSize: is4k ? 17 : 15, lineHeight: 1.6, color: "var(--ink)", marginBottom: 6 }}>
                          "{quote.text}"
                        </p>
                        <p style={{ fontSize: 12, color: "var(--ink-muted)" }}>— {quote.author}</p>
                      </div>
                    </div>
                  </BentoCard>
                );
              })()}

              {/* Continue Practicing - span 2 or 3 */}
              <BentoCard span={isDesktop ? (recentBadge ? 3 : 4) : isTablet ? 2 : 1}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                  <div>
                    <h3 style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: is4k ? 20 : 17, marginBottom: 4 }}>Continue Practicing</h3>
                    <p style={{ fontSize: 13, color: "var(--ink-muted)" }}>Pick up where you left off or try a new category</p>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => onNavigate("categories")} className="tap-target" style={{
                      padding: "12px 24px", borderRadius: 12, border: "none", cursor: "pointer",
                      background: "var(--gradient-accent)", color: "#fff", fontFamily: "var(--font-body)", fontSize: 14, fontWeight: 600,
                      transition: "transform 0.2s", boxShadow: "0 4px 16px rgba(37,99,235,0.25)",
                    }}>All Tests →</button>
                    <button onClick={() => onNavigate("progress")} className="tap-target" style={{
                      padding: "12px 24px", borderRadius: 12, cursor: "pointer",
                      background: "transparent", color: "var(--ink)", fontFamily: "var(--font-body)", fontSize: 14, fontWeight: 600,
                      border: "1.5px solid var(--border)", transition: "all 0.2s",
                    }}>Progress</button>
                  </div>
                </div>
              </BentoCard>
            </div>
          </div>
        </Container>
      </div>
    );
  }

  // FIRST-TIME USER: Hero landing
  const totalQuestions = testCategories.reduce((s, c) => s + c.tests.reduce((t, test) => t + (test.questionCount || 10), 0), 0);

  return (
    <div>
      {/* Hero */}
      <section style={{ padding: isDesktop ? "96px 0 80px" : isTablet ? "64px 0 52px" : "48px 0 40px", textAlign: "center", position: "relative", overflow: "hidden", background: "var(--gradient-hero)" }}>
        {/* Decorative orbs */}
        <div style={{ position: "absolute", top: "-20%", right: "-10%", width: isDesktop ? 600 : 350, height: isDesktop ? 600 : 350, borderRadius: "50%", background: "radial-gradient(circle, rgba(59,130,246,0.07) 0%, transparent 65%)", pointerEvents: "none", filter: "blur(40px)" }} />
        <div style={{ position: "absolute", bottom: "-30%", left: "-10%", width: isDesktop ? 500 : 280, height: isDesktop ? 500 : 280, borderRadius: "50%", background: "radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 65%)", pointerEvents: "none", filter: "blur(40px)" }} />
        <div style={{ position: "absolute", top: "30%", left: "50%", width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle, rgba(251,146,60,0.04) 0%, transparent 70%)", pointerEvents: "none", filter: "blur(30px)" }} />

        <Container bp={bp}>
          <div className="anim-fade-up" style={{ position: "relative", zIndex: 1 }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              background: "var(--accent-soft)", border: "1px solid var(--accent)",
              borderRadius: 100, padding: "7px 18px", marginBottom: isDesktop ? 32 : 22,
              fontSize: is4k ? 15 : 13, fontWeight: 600, color: "var(--accent)",
              letterSpacing: "0.01em",
            }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--accent)", display: "inline-block", animation: "gentleBounce 2s ease-in-out infinite" }} />
              100% Free — No account needed
            </div>

            <h1 style={{
              fontFamily: "var(--font-heading)", fontWeight: 800, color: "var(--ink)",
              fontSize: is4k ? 68 : isDesktop ? 56 : isTablet ? 44 : 34,
              lineHeight: 1.1, letterSpacing: "-0.025em",
              maxWidth: is4k ? 920 : isDesktop ? 740 : 600, margin: "0 auto",
              marginBottom: isDesktop ? 22 : 16,
            }}>
              Pass your test on the{" "}
              <span style={{ fontStyle: "italic", background: "var(--gradient-accent)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", paddingRight: 4 }}>first try</span>
            </h1>

            <p style={{
              fontSize: is4k ? 20 : isDesktop ? 18 : 16, lineHeight: 1.7,
              color: "var(--ink-muted)", maxWidth: is4k ? 640 : 540, margin: "0 auto",
              marginBottom: isDesktop ? 40 : 30,
            }}>
              Practice with real exam questions, build streaks, earn XP, and walk into test day feeling confident.
            </p>

            <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap", marginBottom: isDesktop ? 52 : 36 }}>
              <button onClick={() => onNavigate("categories")} className="tap-target" style={{
                padding: is4k ? "18px 40px" : "16px 32px", borderRadius: 14, border: "none", cursor: "pointer",
                background: "var(--gradient-accent)", color: "white",
                fontFamily: "var(--font-body)", fontSize: is4k ? 17 : 16, fontWeight: 600,
                boxShadow: "0 4px 20px rgba(37,99,235,0.3)", animation: "pulseRing 2.5s ease-out infinite",
                display: "inline-flex", alignItems: "center", gap: 8,
              }}>
                Start Practicing <ArrowRight size={18} />
              </button>
              <button onClick={() => onNavigate("progress")} className="tap-target" style={{
                padding: is4k ? "18px 40px" : "16px 32px", borderRadius: 14, cursor: "pointer",
                background: "var(--surface-raised)", color: "var(--ink)",
                fontFamily: "var(--font-body)", fontSize: is4k ? 17 : 16, fontWeight: 600,
                border: "1.5px solid var(--border)",
              }}>
                View Progress
              </button>
            </div>

            <div style={{ display: "flex", justifyContent: "center", gap: isDesktop ? 20 : 12, flexWrap: "wrap" }}>
              {[
                { Icon: FileText, label: "Questions", value: `${totalQuestions}+` },
                { Icon: Target, label: "Pass Rate", value: "94%" },
                { Icon: MapPin, label: "Region", value: "USA" },
                { Icon: Timer, label: "Avg Time", value: "15 min" },
              ].map((s, i) => (
                <div key={i} className={`anim-fade-up anim-d${i + 2}`} style={{
                  display: "flex", alignItems: "center", gap: 8,
                  fontSize: is4k ? 14 : 13, color: "var(--ink-light)",
                  background: "var(--surface-glass)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
                  border: "1px solid var(--border-light)",
                  borderRadius: 100, padding: "9px 18px",
                }}>
                  <s.Icon size={is4k ? 18 : 15} style={{ color: "var(--accent)" }} />
                  <span><strong style={{ color: "var(--ink)", fontWeight: 700 }}>{s.value}</strong> {s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </section>

      {/* Category Cards */}
      <section style={{ paddingTop: isDesktop ? 64 : 40, paddingBottom: bp === "mobile" ? 100 : isDesktop ? 80 : 60 }}>
        <Container bp={bp}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "end", marginBottom: isDesktop ? 32 : 24 }}>
            <div>
              <h2 className="anim-fade-up" style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: is4k ? 36 : isDesktop ? 30 : 24, marginBottom: 6, color: "var(--ink)" }}>Choose your test</h2>
              <p className="anim-fade-up anim-d1" style={{ fontSize: is4k ? 17 : 15, color: "var(--ink-muted)" }}>Start with any category and track your improvement</p>
            </div>
            {isDesktop && <button onClick={() => onNavigate("categories")} className="anim-fade-up" style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, fontWeight: 600, color: "var(--accent)", fontFamily: "var(--font-body)", display: "flex", alignItems: "center", gap: 4 }}>View all <ArrowRight size={14} /></button>}
          </div>
          <div style={{
            display: "grid",
            gridTemplateColumns: is4k ? "repeat(4, 1fr)" : isDesktop ? "repeat(4, 1fr)" : isTablet ? "repeat(2, 1fr)" : "1fr",
            gap: is4k ? 20 : 16,
          }}>
            {testCategories.map((cat, i) => (
              <button key={cat.id} onClick={() => onNavigate("category", cat.id)}
                className={`anim-fade-up anim-d${Math.min(i + 1, 6)} hover-lift hover-glow tap-target`}
                style={{
                  textAlign: "left", padding: is4k ? 28 : isDesktop ? 24 : 20,
                  borderRadius: 20, border: "1.5px solid var(--border)",
                  background: "var(--surface-raised)", cursor: "pointer",
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  position: "relative", overflow: "hidden",
                }}>
                <div style={{ position: "absolute", top: 0, right: 0, width: "40%", height: "40%", background: `radial-gradient(circle at top right, ${cat.accent}10, transparent 70%)`, pointerEvents: "none" }} />
                <div style={{
                  width: is4k ? 56 : 48, height: is4k ? 56 : 48, borderRadius: 16,
                  background: `linear-gradient(135deg, ${cat.accent}20, ${cat.accent}08)`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  marginBottom: 16, border: `1px solid ${cat.accent}25`,
                }}><CatIcon catId={cat.id} size={is4k ? 26 : 24} /></div>
                <h3 style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: is4k ? 20 : 18, marginBottom: 4, color: "var(--ink)" }}>{cat.name}</h3>
                <p style={{ fontSize: is4k ? 14 : 13, color: "var(--ink-muted)", lineHeight: 1.5, marginBottom: 12 }}>{cat.description}</p>
                <span style={{ fontSize: is4k ? 14 : 13, fontWeight: 600, color: cat.accent, display: "inline-flex", alignItems: "center", gap: 4 }}>
                  {cat.tests.length} test{cat.tests.length > 1 ? "s" : ""} →
                </span>
              </button>
            ))}
          </div>
        </Container>
      </section>

      {/* Features */}
      <section style={{ background: "var(--surface-sunken)", borderTop: "1px solid var(--border)", padding: isDesktop ? "80px 0" : "52px 0" }}>
        <Container bp={bp}>
          <div style={{ textAlign: "center", marginBottom: isDesktop ? 48 : 32 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--accent)", marginBottom: 12 }}>
              <Minus size={14} /> Why QuizLane
            </div>
            <h2 style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: is4k ? 36 : isDesktop ? 30 : 24, marginBottom: 8, color: "var(--ink)" }}>Built for results, not just practice</h2>
            <p style={{ fontSize: is4k ? 17 : 15, color: "var(--ink-muted)", maxWidth: 480, margin: "0 auto" }}>Everything you need to walk in confident and pass on the first try</p>
          </div>
          <div style={{
            display: "grid",
            gridTemplateColumns: isDesktop ? "repeat(3, 1fr)" : isTablet ? "repeat(3, 1fr)" : "1fr",
            gap: is4k ? 24 : 16,
          }}>
            {[
              { Icon: Target, title: "Real Questions", desc: "Modeled after the actual exam format and difficulty level. Practice with the same types of questions you'll see on test day.", accent: "var(--accent)", num: "01" },
              { Icon: BarChart3, title: "Smart Tracking", desc: "See your weak areas, track improvement over time, and know exactly when you're ready to take the real exam.", accent: "var(--success)", num: "02" },
              { Icon: Lightbulb, title: "Learn Why", desc: "Every answer comes with a detailed explanation so you truly understand the material, not just memorize answers.", accent: "var(--xp-violet)", num: "03" },
            ].map((f, i) => (
              <div key={i} className={`anim-fade-up anim-d${i + 1} hover-glow`} style={{
                background: "var(--surface-raised)", borderRadius: 20, padding: is4k ? 32 : 28,
                border: "1px solid var(--border)", position: "relative", overflow: "hidden",
                transition: "all 0.35s cubic-bezier(0.22, 1, 0.36, 1)",
              }}>
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: f.accent, borderRadius: "20px 20px 0 0" }} />
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 16 }}>
                  <div style={{
                    width: is4k ? 56 : 48, height: is4k ? 56 : 48, borderRadius: 14,
                    background: "var(--surface-sunken)", border: "1px solid var(--border-light)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: f.accent,
                  }}><f.Icon size={is4k ? 26 : 22} /></div>
                  <span style={{ fontSize: 32, fontWeight: 800, fontFamily: "var(--font-heading)", color: "var(--border)", lineHeight: 1 }}>{f.num}</span>
                </div>
                <h3 style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: is4k ? 20 : 18, marginBottom: 8, color: "var(--ink)" }}>{f.title}</h3>
                <p style={{ fontSize: is4k ? 15 : 14, color: "var(--ink-muted)", lineHeight: 1.65 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Testimonials */}
      <section style={{ padding: isDesktop ? "80px 0" : "52px 0", borderTop: "1px solid var(--border)" }}>
        <Container bp={bp}>
          <div style={{ textAlign: "center", marginBottom: isDesktop ? 48 : 32 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--success)", marginBottom: 12 }}>
              <Minus size={14} /> Trusted by students
            </div>
            <h2 style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: is4k ? 36 : isDesktop ? 30 : 24, color: "var(--ink)" }}>People pass with QuizLane</h2>
          </div>
          <div style={{
            display: "grid",
            gridTemplateColumns: isDesktop ? "repeat(3, 1fr)" : isTablet ? "repeat(2, 1fr)" : "1fr",
            gap: is4k ? 20 : 16,
          }}>
            {[
              { name: "Sarah M.", test: "DMV Permit Test", text: "Passed on my first attempt after practicing for just 3 days. The explanations really helped me understand the material.", stars: 5 },
              { name: "James L.", test: "Real Estate Exam", text: "The practice questions were nearly identical to the real exam. Scored 92% when I only needed 75% to pass.", stars: 5 },
              { name: "Maria R.", test: "US Citizenship", text: "As a non-native speaker, the clear explanations made all the difference. Passed my civics test with flying colors!", stars: 5 },
            ].map((t, i) => (
              <div key={i} className={`anim-fade-up anim-d${i + 1}`} style={{
                background: "var(--surface-raised)", borderRadius: 20, padding: is4k ? 28 : 24,
                border: "1px solid var(--border)", position: "relative",
              }}>
                <Quote size={28} style={{ color: "var(--border)", marginBottom: 12 }} />
                <p style={{ fontSize: is4k ? 15 : 14, color: "var(--ink-light)", lineHeight: 1.65, marginBottom: 16 }}>{t.text}</p>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "end" }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: "var(--ink)" }}>{t.name}</div>
                    <div style={{ fontSize: 12, color: "var(--ink-muted)" }}>{t.test}</div>
                  </div>
                  <div style={{ display: "flex", gap: 2 }}>
                    {Array.from({ length: t.stars }).map((_, j) => <Star key={j} size={14} style={{ color: "var(--badge-gold)", fill: "var(--badge-gold)" }} />)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* CTA */}
      <section style={{ background: "var(--surface-sunken)", borderTop: "1px solid var(--border)", padding: isDesktop ? "72px 0" : "48px 0", marginBottom: bp === "mobile" ? 60 : 0, textAlign: "center" }}>
        <Container bp={bp}>
          <div className="anim-fade-up" style={{ maxWidth: 520, margin: "0 auto" }}>
            <h2 style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: is4k ? 32 : isDesktop ? 28 : 22, marginBottom: 12, color: "var(--ink)" }}>Ready to start practicing?</h2>
            <p style={{ fontSize: is4k ? 17 : 15, color: "var(--ink-muted)", marginBottom: 28 }}>Join thousands of students who passed their test on the first try.</p>
            <button onClick={() => onNavigate("categories")} className="tap-target" style={{
              padding: is4k ? "18px 40px" : "16px 32px", borderRadius: 14, border: "none", cursor: "pointer",
              background: "var(--gradient-accent)", color: "white",
              fontFamily: "var(--font-body)", fontSize: is4k ? 17 : 16, fontWeight: 600,
              boxShadow: "0 4px 20px rgba(37,99,235,0.3)",
              display: "inline-flex", alignItems: "center", gap: 8,
            }}>
              Get Started — It's Free <ArrowRight size={18} />
            </button>
          </div>
        </Container>
      </section>
    </div>
  );
};

/* ═══════════════════════════════════════════
   CATEGORIES PAGE
   ═══════════════════════════════════════════ */
const CategoriesPage = ({ onNavigate, stats, bp }) => {
  const [search, setSearch] = useState("");
  const is4k = bp === "4k";
  const isDesktop = bp === "desktop" || is4k;
  const isTablet = bp === "tablet";
  const filtered = search.trim() ? testCategories.filter(cat => cat.name.toLowerCase().includes(search.toLowerCase()) || cat.description.toLowerCase().includes(search.toLowerCase()) || cat.tests.some(t => t.name.toLowerCase().includes(search.toLowerCase()))) : testCategories;
  const totalTests = testCategories.reduce((s, c) => s + c.tests.length, 0);
  const completedTests = Object.values(stats).filter(s => s.attempts > 0).length;

  return (
    <Container bp={bp}>
      <div style={{ padding: isDesktop ? "40px 0 80px" : "24px 0 100px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: isDesktop ? "end" : "start", flexDirection: bp === "mobile" ? "column" : "row", gap: 16, marginBottom: isDesktop ? 28 : 20 }}>
          <div>
            <h1 className="anim-fade-up" style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: is4k ? 36 : isDesktop ? 30 : 24, marginBottom: 4 }}>All Practice Tests</h1>
            <p className="anim-fade-up anim-d1" style={{ fontSize: is4k ? 17 : 15, color: "var(--ink-muted)" }}>{totalTests} tests across {testCategories.length} categories {completedTests > 0 && <span style={{ color: "var(--success)", fontWeight: 600 }}>• {completedTests} completed</span>}</p>
          </div>
          {/* Search */}
          <div className="anim-fade-up anim-d2" style={{ position: "relative", width: bp === "mobile" ? "100%" : is4k ? 320 : 260 }}>
            <Search size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--ink-muted)", pointerEvents: "none" }} />
            <input type="search" placeholder="Search tests..." value={search} onChange={(e) => setSearch(e.target.value)} className="focus-ring" style={{
              width: "100%", padding: "11px 14px 11px 38px", borderRadius: 12, border: "1.5px solid var(--border)",
              background: "var(--surface-raised)", color: "var(--ink)", fontFamily: "var(--font-body)", fontSize: 14,
              outline: "none", transition: "border-color 0.2s",
            }} />
          </div>
        </div>
        {filtered.length === 0 ? (
          <div className="anim-fade-up" style={{ textAlign: "center", padding: "48px 0" }}>
            <Search size={40} style={{ color: "var(--ink-muted)", marginBottom: 16, opacity: 0.4 }} />
            <h3 style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 18, marginBottom: 6 }}>No tests found</h3>
            <p style={{ fontSize: 14, color: "var(--ink-muted)" }}>Try a different search term</p>
          </div>
        ) : (
          <div style={{
            display: "grid",
            gridTemplateColumns: is4k ? "repeat(2, 1fr)" : isDesktop ? "repeat(2, 1fr)" : isTablet ? "repeat(2, 1fr)" : "1fr",
            gap: is4k ? 20 : 16,
          }}>
            {filtered.map((cat, i) => {
              const total = cat.tests.reduce((s, t) => s + (stats[t.id]?.attempts || 0), 0);
              const catBest = cat.tests.filter(t => stats[t.id]?.bestScore > 0);
              const catAvg = catBest.length > 0 ? Math.round(catBest.reduce((s, t) => s + stats[t.id].bestScore, 0) / catBest.length) : 0;
              return (
                <button key={cat.id} onClick={() => onNavigate("category", cat.id)}
                  className={`anim-fade-up anim-d${Math.min(i + 1, 6)} hover-lift hover-glow tap-target`}
                  style={{
                    textAlign: "left", padding: is4k ? 28 : 24,
                    borderRadius: 22, border: "1.5px solid var(--border)",
                    background: "var(--surface-raised)", cursor: "pointer",
                    transition: "all 0.35s cubic-bezier(0.22, 1, 0.36, 1)",
                  }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 16 }}>
                    <div style={{
                      width: 52, height: 52, borderRadius: 16,
                      background: `linear-gradient(135deg, ${cat.accent}15, ${cat.accent}08)`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      border: `1px solid ${cat.accent}20`,
                    }}><CatIcon catId={cat.id} size={26} /></div>
                    <div style={{ display: "flex", gap: 6 }}>
                      {catAvg > 0 && <span style={{ fontSize: 12, fontWeight: 600, color: catAvg >= 70 ? "var(--success)" : "var(--warm)", background: catAvg >= 70 ? "var(--success-soft)" : "var(--warm-soft)", padding: "4px 10px", borderRadius: 20 }}>Avg {catAvg}%</span>}
                      {total > 0 && <span style={{ fontSize: 12, fontWeight: 600, color: "var(--accent)", background: "var(--accent-soft)", padding: "4px 10px", borderRadius: 20 }}>{total} taken</span>}
                    </div>
                  </div>
                  <h3 style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: is4k ? 22 : 19, marginBottom: 4 }}>{cat.name}</h3>
                  <p style={{ fontSize: 14, color: "var(--ink-muted)", marginBottom: 14, lineHeight: 1.55 }}>{cat.description}</p>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 13, color: "var(--ink-muted)" }}>{cat.tests.length} test{cat.tests.length > 1 ? "s" : ""}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: cat.accent, display: "inline-flex", alignItems: "center", gap: 4 }}>Practice <ArrowRight size={13} /></span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </Container>
  );
};

/* ═══════════════════════════════════════════
   CATEGORY DETAIL PAGE
   ═══════════════════════════════════════════ */
const CategoryPage = ({ categoryId, onNavigate, stats, bp }) => {
  const cat = testCategories.find((c) => c.id === categoryId);
  if (!cat) return null;
  const is4k = bp === "4k";
  const isDesktop = bp === "desktop" || is4k;
  const isTablet = bp === "tablet";
  const completedCount = cat.tests.filter(t => stats[t.id]?.attempts > 0).length;

  // Separate state DMV tests from general tests
  const isStateDmv = (test) => test.id.startsWith("dmv-");
  const generalTests = cat.tests.filter(t => !isStateDmv(t));
  const stateTests = cat.tests.filter(t => isStateDmv(t));
  const hasStateTests = stateTests.length > 0;

  // Search & filter for categories with many tests
  const [stateSearch, setStateSearch] = useState("");
  const [stateFilter, setStateFilter] = useState("all"); // "all", "completed", "not-started"

  const filteredStateTests = useMemo(() => {
    let filtered = stateTests;
    if (stateSearch.trim()) {
      const q = stateSearch.toLowerCase();
      filtered = filtered.filter(t => t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q));
    }
    if (stateFilter === "completed") filtered = filtered.filter(t => stats[t.id]?.attempts > 0);
    if (stateFilter === "not-started") filtered = filtered.filter(t => !stats[t.id]?.attempts);
    return filtered;
  }, [stateTests, stateSearch, stateFilter, stats]);

  // Full-size test card (used for general tests)
  const TestCard = ({ test, i }) => {
    const ts = stats[test.id]; const attempts = ts?.attempts || 0; const best = ts?.bestScore || 0;
    const passed = best >= test.passingScore;
    return (
      <div key={test.id} className={`anim-fade-up anim-d${Math.min(i + 2, 6)}`} style={{
        background: "var(--surface-raised)", borderRadius: 18, padding: is4k ? 28 : 22,
        border: `1.5px solid ${attempts > 0 && passed ? "var(--success)" : "var(--border)"}`,
        position: "relative",
      }}>
        {attempts > 0 && passed && <div style={{ position: "absolute", top: 12, right: 12 }}><CheckCircle2 size={18} style={{ color: "var(--success)" }} /></div>}
        <div style={{ display: "flex", flexDirection: bp === "mobile" ? "column" : "row", justifyContent: "space-between", alignItems: bp === "mobile" ? "stretch" : "center", gap: 16 }}>
          <div style={{ display: "flex", gap: 14, alignItems: "start" }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12, flexShrink: 0,
              background: `linear-gradient(135deg, ${cat.accent}12, ${cat.accent}06)`,
              display: "flex", alignItems: "center", justifyContent: "center",
              border: `1px solid ${cat.accent}18`,
            }}>
              <TestIcon testId={test.id} size={is4k ? 24 : 20} style={{ color: cat.accent }} />
            </div>
            <div>
              <h3 style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: is4k ? 20 : 17, marginBottom: 5 }}>{test.name}</h3>
              <p style={{ fontSize: 13, color: "var(--ink-muted)", marginBottom: 10, lineHeight: 1.5 }}>{test.description}</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {[{ label: `${test.questionCount} Qs`, Icon: Hash }, { label: `${test.timeLimit} min`, Icon: Clock }, { label: `${test.passingScore}% to pass`, Icon: Target }].map((tag, j) => (
                  <span key={j} style={{ fontSize: 12, fontWeight: 500, background: "var(--surface-sunken)", color: "var(--ink-light)", padding: "4px 10px", borderRadius: 8, display: "inline-flex", alignItems: "center", gap: 4 }}>
                    <tag.Icon size={11} /> {tag.label}
                  </span>
                ))}
                {attempts > 0 && <span style={{ fontSize: 12, fontWeight: 600, background: passed ? "var(--success-soft)" : "var(--warm-soft)", color: passed ? "var(--success)" : "var(--warm)", padding: "4px 10px", borderRadius: 8 }}>Best: {best}%</span>}
              </div>
            </div>
          </div>
          <button onClick={() => onNavigate("quiz", test.id)} className="tap-target" style={{
            padding: "12px 24px", borderRadius: 12, cursor: "pointer",
            background: attempts > 0 ? "var(--surface-sunken)" : "var(--gradient-accent)", color: attempts > 0 ? "var(--ink)" : "#fff",
            fontFamily: "var(--font-body)", fontSize: 14, fontWeight: 600, whiteSpace: "nowrap",
            flexShrink: 0, display: "flex", alignItems: "center", gap: 6,
            border: attempts > 0 ? "1.5px solid var(--border)" : "none",
          }}>{attempts > 0 ? <><RotateCcw size={14} /> Retry</> : <><Play size={14} /> Start</>}</button>
        </div>
      </div>
    );
  };

  // Compact state test card (grid layout for 50 states)
  const StateTestCard = ({ test }) => {
    const ts = stats[test.id]; const attempts = ts?.attempts || 0; const best = ts?.bestScore || 0;
    const passed = best >= test.passingScore;
    const stateAbbr = test.id.replace("dmv-", "").toUpperCase();
    return (
      <button key={test.id} onClick={() => onNavigate("quiz", test.id)}
        className="tap-target hover-lift" style={{
          textAlign: "left", padding: is4k ? 20 : 16, borderRadius: 16, cursor: "pointer",
          background: "var(--surface-raised)",
          border: `1.5px solid ${attempts > 0 && passed ? "var(--success)" : "var(--border)"}`,
          transition: "all 0.25s ease", position: "relative", fontFamily: "var(--font-body)",
        }}>
        {attempts > 0 && passed && <div style={{ position: "absolute", top: 8, right: 8 }}><CheckCircle2 size={14} style={{ color: "var(--success)" }} /></div>}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10, flexShrink: 0,
            background: `linear-gradient(135deg, ${cat.accent}15, ${cat.accent}08)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            border: `1px solid ${cat.accent}20`,
            fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 15, color: cat.accent,
          }}>{stateAbbr}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h4 style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: is4k ? 16 : 14, lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{test.name}</h4>
            <p style={{ fontSize: 12, color: "var(--ink-muted)", lineHeight: 1.3, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{test.questionCount} Qs · {test.passingScore}% to pass</p>
          </div>
        </div>
        {attempts > 0 && (
          <div style={{ display: "flex", gap: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 600, background: passed ? "var(--success-soft)" : "var(--warm-soft)", color: passed ? "var(--success)" : "var(--warm)", padding: "2px 8px", borderRadius: 6 }}>Best: {best}%</span>
            <span style={{ fontSize: 11, fontWeight: 500, background: "var(--surface-sunken)", color: "var(--ink-light)", padding: "2px 8px", borderRadius: 6 }}>{attempts} taken</span>
          </div>
        )}
        {attempts === 0 && (
          <span style={{ fontSize: 12, fontWeight: 600, color: cat.accent, display: "inline-flex", alignItems: "center", gap: 4 }}>
            <Play size={11} /> Start test
          </span>
        )}
      </button>
    );
  };

  return (
    <Container bp={bp}>
      <div style={{ maxWidth: hasStateTests ? (is4k ? 1200 : 1000) : (is4k ? 900 : 740), padding: isDesktop ? "40px 0 80px" : "20px 0 100px" }}>
        <button onClick={() => onNavigate("categories")} className="tap-target anim-fade-up focus-ring" style={{
          background: "none", border: "none", cursor: "pointer", fontSize: 14,
          color: "var(--ink-muted)", marginBottom: 24, fontFamily: "var(--font-body)",
          display: "flex", alignItems: "center", gap: 6,
        }}><ArrowLeft size={14} /> Back to all tests</button>

        {/* Category header with progress */}
        <div className="anim-fade-up anim-d1" style={{
          background: "var(--surface-raised)", borderRadius: 22, padding: is4k ? 32 : 24,
          border: "1.5px solid var(--border)", marginBottom: 20, position: "relative", overflow: "hidden",
        }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: cat.accent }} />
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: completedCount > 0 ? 16 : 0 }}>
            <div style={{
              width: is4k ? 68 : 56, height: is4k ? 68 : 56, borderRadius: 18,
              background: `linear-gradient(135deg, ${cat.accent}15, ${cat.accent}08)`,
              display: "flex", alignItems: "center", justifyContent: "center",
              border: `1px solid ${cat.accent}20`,
            }}><CatIcon catId={cat.id} size={is4k ? 32 : 28} /></div>
            <div style={{ flex: 1 }}>
              <h1 style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: is4k ? 32 : 26, lineHeight: 1.2 }}>{cat.name}</h1>
              <p style={{ fontSize: is4k ? 16 : 14, color: "var(--ink-muted)", marginTop: 2 }}>{cat.description}</p>
            </div>
          </div>
          {completedCount > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ flex: 1, height: 6, background: "var(--surface-sunken)", borderRadius: 4, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${(completedCount / cat.tests.length) * 100}%`, background: cat.accent, borderRadius: 4, transition: "width 0.5s" }} />
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-muted)", whiteSpace: "nowrap" }}>{completedCount}/{cat.tests.length} completed</span>
            </div>
          )}
        </div>

        {/* General Tests Section */}
        {generalTests.length > 0 && (
          <>
            {hasStateTests && <h2 className="anim-fade-up anim-d2" style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: is4k ? 22 : 18, marginBottom: 12, marginTop: 8 }}>General Tests</h2>}
            <div style={{ display: "grid", gap: 12, marginBottom: hasStateTests ? 32 : 0 }}>
              {generalTests.map((test, i) => <TestCard key={test.id} test={test} i={i} />)}
            </div>
          </>
        )}

        {/* State Tests Section (for categories with 50+ state-specific tests) */}
        {hasStateTests && (
          <>
            <div className="anim-fade-up anim-d3" style={{ display: "flex", justifyContent: "space-between", alignItems: bp === "mobile" ? "stretch" : "center", flexDirection: bp === "mobile" ? "column" : "row", gap: 12, marginBottom: 16 }}>
              <div>
                <h2 style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: is4k ? 22 : 18, display: "flex", alignItems: "center", gap: 8 }}>
                  <MapPin size={18} style={{ color: cat.accent }} /> State Practice Tests
                </h2>
                <p style={{ fontSize: 13, color: "var(--ink-muted)", marginTop: 2 }}>{stateTests.length} states · {stateTests.filter(t => stats[t.id]?.attempts > 0).length} completed</p>
              </div>
              {/* Search within states */}
              <div style={{ position: "relative", width: bp === "mobile" ? "100%" : is4k ? 280 : 220 }}>
                <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--ink-muted)", pointerEvents: "none" }} />
                <input type="search" placeholder="Search states..." value={stateSearch} onChange={(e) => setStateSearch(e.target.value)} className="focus-ring" style={{
                  width: "100%", padding: "9px 12px 9px 34px", borderRadius: 10, border: "1.5px solid var(--border)",
                  background: "var(--surface-raised)", color: "var(--ink)", fontFamily: "var(--font-body)", fontSize: 13, outline: "none",
                }} />
              </div>
            </div>

            {/* Filter tabs */}
            <div className="anim-fade-up anim-d4" style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
              {[{ key: "all", label: "All States" }, { key: "not-started", label: "Not Started" }, { key: "completed", label: "Completed" }].map(f => (
                <button key={f.key} onClick={() => setStateFilter(f.key)} style={{
                  padding: "6px 14px", borderRadius: 20, cursor: "pointer", fontSize: 12, fontWeight: 600,
                  fontFamily: "var(--font-body)", border: "1.5px solid",
                  borderColor: stateFilter === f.key ? cat.accent : "var(--border)",
                  background: stateFilter === f.key ? `${cat.accent}15` : "var(--surface-raised)",
                  color: stateFilter === f.key ? cat.accent : "var(--ink-muted)",
                  transition: "all 0.2s",
                }}>{f.label}</button>
              ))}
            </div>

            {/* State test grid */}
            {filteredStateTests.length === 0 ? (
              <div style={{ textAlign: "center", padding: "32px 0" }}>
                <Search size={32} style={{ color: "var(--ink-muted)", marginBottom: 12, opacity: 0.4 }} />
                <p style={{ fontSize: 14, color: "var(--ink-muted)" }}>No states match your search</p>
              </div>
            ) : (
              <div style={{
                display: "grid",
                gridTemplateColumns: is4k ? "repeat(4, 1fr)" : isDesktop ? "repeat(3, 1fr)" : isTablet ? "repeat(2, 1fr)" : "repeat(2, 1fr)",
                gap: is4k ? 14 : 10,
              }}>
                {filteredStateTests.map(test => <StateTestCard key={test.id} test={test} />)}
              </div>
            )}
          </>
        )}
      </div>
    </Container>
  );
};

/* ═══════════════════════════════════════════
   QUIZ PAGE
   ═══════════════════════════════════════════ */
const QuizPage = ({ testId, onNavigate, onComplete, bp, gameState, recordAnswer, onShowShare }) => {
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState(null);
  const [showExp, setShowExp] = useState(false);
  const [answers, setAnswers] = useState([]);
  const [done, setDone] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);
  const [startTime] = useState(Date.now());
  const [xpEarned, setXpEarned] = useState(0);
  const [showXpFloat, setShowXpFloat] = useState(false);
  const testInfo = testCategories.flatMap((c) => c.tests).find((t) => t.id === testId);
  const allQuestions = questionBank[testId] || questionBank["car-permit"].slice(0, 10);
  const [questions] = useState(() => {
    const count = testInfo?.questionCount || allQuestions.length;
    if (allQuestions.length <= count) return allQuestions;
    const shuffled = [...allQuestions].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  });
  const is4k = bp === "4k";
  const isDesktop = bp === "desktop" || is4k;

  useEffect(() => { if (testInfo) setTimeLeft(testInfo.timeLimit * 60); }, [testInfo]);
  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0 || done) return;
    const t = setInterval(() => setTimeLeft((v) => { if (v <= 1) { clearInterval(t); setDone(true); return 0; } return v - 1; }), 1000);
    return () => clearInterval(t);
  }, [timeLeft, done]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e) => {
      if (done) return;
      if (!showExp && e.key >= "1" && e.key <= "4") {
        const idx = parseInt(e.key) - 1;
        if (idx < questions[currentQ].options.length) pick(idx);
      }
      if (showExp && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); next(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [currentQ, showExp, done, answers]);

  const pick = (i) => {
    if (showExp) return;
    setSelected(i);
    setShowExp(true);
    const isCorrect = i === questions[currentQ].correct;
    setAnswers([...answers, { qId: questions[currentQ].id, sel: i, cor: questions[currentQ].correct }]);
    // Track mastery via spaced repetition
    if (recordAnswer) recordAnswer(testId, questions[currentQ].id, isCorrect);
    if (isCorrect) {
      setXpEarned(prev => prev + XP_VALUES.correctAnswer);
      setShowXpFloat(true);
      setTimeout(() => setShowXpFloat(false), 800);
    }
  };
  const next = () => { if (currentQ < questions.length - 1) { setCurrentQ(currentQ + 1); setSelected(null); setShowExp(false); } else setDone(true); };
  const fmt = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
  const correctN = answers.filter((a) => a.sel === a.cor).length;
  const score = Math.round((correctN / questions.length) * 100);
  const passed = testInfo && score >= testInfo.passingScore;

  useEffect(() => {
    if (done && testInfo) {
      const totalXp = xpEarned + XP_VALUES.quizComplete + (score === 100 ? XP_VALUES.perfectScore : 0);
      onComplete(testId, { score, correct: correctN, total: questions.length, timeSpent: Math.round((Date.now() - startTime) / 1000), passed, xpEarned: totalXp });
    }
  }, [done]);

  if (done) {
    const totalXp = xpEarned + XP_VALUES.quizComplete + (score === 100 ? XP_VALUES.perfectScore : 0);
    const prevLevel = getLevel((gameState?.xp || 0) - totalXp);
    const newLevel = getLevel(gameState?.xp || 0);
    const leveledUp = newLevel.index > prevLevel.index;

    return (
      <Container bp={bp}>
        <div style={{ maxWidth: is4k ? 720 : 600, margin: "0 auto", padding: isDesktop ? "48px 0" : "20px 0 100px" }}>
          <div className="anim-scale-in" style={{ background: "var(--surface-raised)", borderRadius: 24, border: "1.5px solid var(--border)", overflow: "hidden", boxShadow: "var(--shadow-lg)" }}>
            <div style={{ padding: is4k ? 56 : 48, textAlign: "center", background: passed ? "var(--success-soft)" : "var(--warm-soft)", position: "relative", overflow: "hidden" }}>
              {/* Enhanced confetti - 20 particles */}
              {passed && Array.from({ length: 20 }).map((_, i) => (
                <div key={i} style={{
                  position: "absolute",
                  width: [6, 8, 10, 12][i % 4], height: [6, 8, 10, 12][i % 4],
                  borderRadius: i % 3 === 0 ? "50%" : i % 3 === 1 ? "2px" : "0",
                  background: ["var(--accent)", "var(--success)", "var(--xp-violet)", "var(--streak-orange)", "var(--badge-gold)"][i % 5],
                  left: `${5 + (i * 4.5)}%`, top: `${10 + (i % 5) * 15}%`,
                  animation: `confettiBurst ${1 + (i % 3) * 0.3}s ease-out ${i * 0.05}s both`,
                  opacity: 0.8,
                  transform: `rotate(${i * 45}deg)`,
                }} />
              ))}

              {/* Animated Score Ring with gradient stroke */}
              <div style={{ position: "relative", width: is4k ? 170 : 140, height: is4k ? 170 : 140, margin: "0 auto 20px" }}>
                <svg width="100%" height="100%" viewBox="0 0 140 140" style={{ transform: "rotate(-90deg)" }}>
                  <defs>
                    <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor={passed ? "var(--success)" : "var(--warm)"} />
                      <stop offset="100%" stopColor={passed ? "var(--accent)" : "var(--streak-orange)"} />
                    </linearGradient>
                  </defs>
                  <circle cx="70" cy="70" r="60" fill="none" stroke="var(--border)" strokeWidth="10" opacity="0.2" />
                  <circle cx="70" cy="70" r="60" fill="none"
                    stroke="url(#scoreGrad)" strokeWidth="10" strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 60}
                    strokeDashoffset={2 * Math.PI * 60 * (1 - score / 100)}
                    style={{
                      "--circumference": 2 * Math.PI * 60,
                      "--offset": 2 * Math.PI * 60 * (1 - score / 100),
                      animation: "drawCircle 1.2s ease-out both",
                    }}
                  />
                </svg>
                <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: is4k ? 42 : 36, fontWeight: 800, fontFamily: "var(--font-heading)", color: "var(--ink)", animation: "scoreCount 0.6s ease-out 0.4s both" }}>
                    <CountUpNumber end={score} duration={1000} />%
                  </span>
                  <span style={{ fontSize: 11, color: "var(--ink-muted)", fontWeight: 500 }}>Score</span>
                </div>
              </div>

              <h2 style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: is4k ? 30 : 24, marginBottom: 8 }}>{passed ? "You Passed!" : "Keep Practicing!"}</h2>
              <p style={{ fontSize: is4k ? 16 : 14, color: "var(--ink-light)" }}>{passed ? "You're ready for the real test!" : `You need ${testInfo?.passingScore}% to pass.`}</p>

              {/* Level up banner */}
              {leveledUp && (
                <div style={{
                  marginTop: 16, padding: "10px 20px", borderRadius: 12,
                  background: "var(--accent-soft)", border: "1px solid var(--accent)",
                  display: "inline-flex", alignItems: "center", gap: 8,
                  animation: "levelUp 0.6s ease-out 0.8s both",
                }}>
                  <LevelIcon name={newLevel.name} size={20} style={{ color: "var(--accent)" }} />
                  <span style={{ fontWeight: 700, color: "var(--accent)" }}>Level Up! {newLevel.name}</span>
                </div>
              )}
            </div>
            <div style={{ padding: is4k ? 36 : 28 }}>
              {/* XP Breakdown */}
              <div style={{
                background: "var(--xp-violet-soft)", borderRadius: 14, padding: 16, marginBottom: 20,
                border: "1px solid var(--xp-violet)",
              }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--xp-violet)", marginBottom: 8 }}>XP Earned</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  <span style={{ fontSize: 12, background: "var(--surface-raised)", padding: "4px 10px", borderRadius: 8, color: "var(--ink-light)", display: "inline-flex", alignItems: "center", gap: 4 }}><CheckCircle2 size={12} /> Correct: +{correctN * XP_VALUES.correctAnswer}</span>
                  <span style={{ fontSize: 12, background: "var(--surface-raised)", padding: "4px 10px", borderRadius: 8, color: "var(--ink-light)", display: "inline-flex", alignItems: "center", gap: 4 }}><Trophy size={12} /> Complete: +{XP_VALUES.quizComplete}</span>
                  {score === 100 && <span style={{ fontSize: 12, background: "var(--surface-raised)", padding: "4px 10px", borderRadius: 8, color: "var(--ink-light)", display: "inline-flex", alignItems: "center", gap: 4 }}><Gem size={12} /> Perfect: +{XP_VALUES.perfectScore}</span>}
                </div>
                <div style={{ fontSize: 18, fontWeight: 800, color: "var(--xp-violet)", marginTop: 8 }}>Total: +{totalXp} XP</div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 24 }}>
                {[{ v: correctN, l: "Correct", c: "var(--success)" },{ v: questions.length - correctN, l: "Wrong", c: "var(--danger)" },{ v: fmt(Math.round((Date.now() - startTime) / 1000)), l: "Time", c: "var(--ink-light)" }].map((s, i) => (
                  <div key={i} style={{ textAlign: "center", padding: is4k ? 20 : 16, background: "var(--surface-sunken)", borderRadius: 14 }}>
                    <div style={{ fontSize: is4k ? 30 : 26, fontWeight: 700, color: s.c, fontFamily: "var(--font-heading)" }}>{typeof s.v === "number" ? <CountUpNumber end={s.v} duration={800} /> : s.v}</div>
                    <div style={{ fontSize: 12, color: "var(--ink-muted)", marginTop: 2 }}>{s.l}</div>
                  </div>
                ))}
              </div>
              {answers.filter((a) => a.sel !== a.cor).length > 0 && (
                <div style={{ marginBottom: 24 }}>
                  <h3 style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 16, marginBottom: 12 }}>Review Missed:</h3>
                  <div style={{ display: "grid", gap: 10 }}>
                    {answers.filter((a) => a.sel !== a.cor).map((a, i) => {
                      const q = questions.find((q) => q.id === a.qId);
                      return (
                        <div key={i} style={{ background: "var(--danger-soft)", borderRadius: 14, padding: is4k ? 20 : 16, border: "1px solid var(--danger)" }}>
                          <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 6, color: "var(--ink)" }}>{q.question}</p>
                          <p style={{ fontSize: 12, color: "var(--danger)", marginBottom: 3 }}>Your answer: {q.options[a.sel]}</p>
                          <p style={{ fontSize: 12, color: "var(--success)", marginBottom: 6 }}>Correct: {q.options[q.correct]}</p>
                          <p style={{ fontSize: 12, color: "var(--ink-light)", lineHeight: 1.5 }}>{q.explanation}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              <div style={{ display: "flex", gap: 12, flexDirection: bp === "mobile" ? "column" : "row" }}>
                <button onClick={() => { setCurrentQ(0); setSelected(null); setShowExp(false); setAnswers([]); setDone(false); setXpEarned(0); setTimeLeft(testInfo ? testInfo.timeLimit * 60 : 1500); }}
                  className="tap-target" style={{ flex: 1, padding: "15px 24px", borderRadius: 14, border: "none", cursor: "pointer", background: "var(--gradient-accent)", color: "#fff", fontFamily: "var(--font-body)", fontSize: 15, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: "0 4px 16px rgba(37,99,235,0.25)" }}>
                  <RotateCcw size={16} /> Try Again
                </button>
                <button onClick={() => onNavigate("categories")} className="tap-target" style={{ flex: 1, padding: "15px 24px", borderRadius: 14, cursor: "pointer", background: "var(--surface-sunken)", color: "var(--ink)", fontFamily: "var(--font-body)", fontSize: 15, fontWeight: 600, border: "1.5px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  <BookOpen size={16} /> Other Tests
                </button>
              </div>
              {/* Share & Weak Areas buttons */}
              <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
                {onShowShare && (
                  <button onClick={() => onShowShare({
                    testName: testInfo?.name || testId,
                    score, passed,
                    streak: gameState?.streak || 0,
                    level: getLevel(gameState?.xp || 0),
                    xp: gameState?.xp || 0,
                  })} className="tap-target" style={{
                    flex: 1, padding: "12px 16px", borderRadius: 12, cursor: "pointer",
                    background: "var(--accent-soft)", color: "var(--accent)",
                    fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 600,
                    border: "1px solid var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  }}>
                    <Share2 size={14} /> Share Results
                  </button>
                )}
                {answers.filter(a => a.sel !== a.cor).length > 0 && (
                  <button onClick={() => onNavigate("weak-areas")} className="tap-target" style={{
                    flex: 1, padding: "12px 16px", borderRadius: 12, cursor: "pointer",
                    background: "var(--warm-soft)", color: "var(--warm)",
                    fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 600,
                    border: "1px solid var(--warm)", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  }}>
                    <Brain size={14} /> Practice Missed
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </Container>
    );
  }

  const q = questions[currentQ];
  const progress = ((currentQ + (showExp ? 1 : 0)) / questions.length) * 100;

  return (
    <Container bp={bp}>
      <div style={{ maxWidth: is4k ? 720 : 600, margin: "0 auto", padding: isDesktop ? "32px 0" : "16px 0 100px" }}>
        {/* Top bar */}
        <div className="anim-fade-up" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <button onClick={() => onNavigate("categories")} className="tap-target" style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, color: "var(--ink-muted)", fontFamily: "var(--font-body)", display: "flex", alignItems: "center", gap: 4 }}><X size={16} /> Exit</button>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {xpEarned > 0 && <span style={{ fontSize: 12, fontWeight: 600, color: "var(--xp-violet)", background: "var(--xp-violet-soft)", padding: "3px 8px", borderRadius: 8 }}>+{xpEarned} XP</span>}
            <span style={{ fontSize: 14, fontWeight: 600, color: "var(--ink-light)" }}>{currentQ + 1}/{questions.length}</span>
            {timeLeft !== null && (
              <span style={{
                fontSize: 13, fontFamily: "monospace", fontWeight: 600, padding: "4px 12px", borderRadius: 8,
                background: timeLeft < 60 ? "var(--danger-soft)" : "var(--surface-sunken)",
                color: timeLeft < 60 ? "var(--danger)" : "var(--ink-light)",
              }}><Clock size={13} style={{ marginRight: 4, verticalAlign: "middle" }} /> {fmt(timeLeft)}</span>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ width: "100%", height: 5, background: "var(--surface-sunken)", borderRadius: 4, marginBottom: 12, overflow: "hidden" }}>
          <div style={{
            height: "100%", width: `${progress}%`,
            background: "var(--gradient-accent)", borderRadius: 4, transition: "width 0.5s cubic-bezier(0.22, 1, 0.36, 1)",
          }} />
        </div>

        {/* Progress dots */}
        {questions.length <= 20 && (
          <div style={{ display: "flex", gap: 4, marginBottom: 24, justifyContent: "center", flexWrap: "wrap" }}>
            {questions.map((_, i) => {
              const answered = answers[i];
              const isCurrent = i === currentQ;
              return (
                <div key={i} style={{
                  width: isCurrent ? 20 : 8, height: 8, borderRadius: 4,
                  background: answered ? (answered.sel === answered.cor ? "var(--success)" : "var(--danger)") : isCurrent ? "var(--accent)" : "var(--surface-sunken)",
                  border: isCurrent ? "none" : `1px solid ${answered ? "transparent" : "var(--border-light)"}`,
                  transition: "all 0.3s cubic-bezier(0.22, 1, 0.36, 1)",
                }} />
              );
            })}
          </div>
        )}

        {/* Question card */}
        <div className="anim-scale-in" style={{ background: "var(--surface-raised)", borderRadius: 22, border: "1.5px solid var(--border)", padding: is4k ? 36 : bp === "mobile" ? 20 : 28, marginBottom: 14, position: "relative" }}>
          {/* XP float animation */}
          {showXpFloat && (
            <div style={{
              position: "absolute", top: 10, right: 16, fontSize: 14, fontWeight: 700, color: "var(--xp-violet)",
              animation: "xpFloat 0.8s ease-out forwards", pointerEvents: "none",
            }}>+{XP_VALUES.correctAnswer} XP</div>
          )}

          <h2 style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: is4k ? 22 : bp === "mobile" ? 17 : 19, lineHeight: 1.4, marginBottom: 24, color: "var(--ink)" }}>{q.question}</h2>
          <div style={{ display: "grid", gap: 10 }}>
            {q.options.map((opt, i) => {
              let bg = "var(--surface-raised)", border = "var(--border)", ring = "none", anim = "";
              if (showExp) {
                if (i === q.correct) { bg = "var(--success-soft)"; border = "var(--success)"; ring = "0 0 0 2px var(--success)"; anim = "correctPop 0.35s ease-out"; }
                else if (i === selected) { bg = "var(--danger-soft)"; border = "var(--danger)"; ring = "0 0 0 2px var(--danger)"; anim = "wrongShake 0.4s ease-out"; }
                else { bg = "var(--surface-sunken)"; border = "var(--border-light)"; }
              }
              return (
                <button key={i} onClick={() => pick(i)} disabled={showExp}
                  className={`tap-target${!showExp ? ' hover-option' : ''}`}
                  style={{
                    width: "100%", textAlign: "left",
                    padding: is4k ? "18px 20px" : "15px 16px",
                    borderRadius: 14, border: `1.5px solid ${border}`,
                    background: bg, cursor: showExp ? "default" : "pointer",
                    display: "flex", alignItems: "start", gap: 12,
                    transition: "all 0.25s cubic-bezier(0.22, 1, 0.36, 1)", boxShadow: ring !== "none" ? ring : "none",
                    opacity: showExp && i !== q.correct && i !== selected ? 0.35 : 1,
                    fontFamily: "var(--font-body)",
                    animation: anim || "none",
                  }}>
                  <span style={{
                    width: is4k ? 32 : 28, height: is4k ? 32 : 28, borderRadius: 9, flexShrink: 0,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 12, fontWeight: 700, marginTop: 1,
                    background: showExp && i === q.correct ? "var(--success)" : showExp && i === selected ? "var(--danger)" : "var(--surface-sunken)",
                    color: (showExp && (i === q.correct || i === selected)) ? "white" : "var(--ink-light)",
                    transition: "all 0.25s ease",
                  }}>
                    {showExp && i === q.correct ? <CheckCircle2 size={14} /> : showExp && i === selected ? <XCircle size={14} /> : String.fromCharCode(65 + i)}
                  </span>
                  <span style={{ fontSize: is4k ? 16 : 14, color: showExp && i !== q.correct && i !== selected ? "var(--ink-muted)" : "var(--ink)", lineHeight: 1.55 }}>{opt}</span>
                </button>
              );
            })}
          </div>
          {/* Keyboard hint */}
          {!showExp && isDesktop && (
            <div style={{ marginTop: 12, textAlign: "center", fontSize: 11, color: "var(--ink-muted)" }}>Press 1-{q.options.length} to select</div>
          )}
        </div>

        {/* Explanation */}
        {showExp && (
          <div className="anim-fade-up" style={{
            background: "var(--accent-soft)", borderRadius: 18, border: "1px solid var(--accent)",
            padding: is4k ? 24 : 18, marginBottom: 14, borderLeft: "3px solid var(--accent)",
          }}>
            <div style={{ display: "flex", gap: 10, alignItems: "start" }}>
              <div style={{
                width: 32, height: 32, borderRadius: 10, flexShrink: 0,
                background: "var(--surface-raised)", border: "1px solid var(--border)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Lightbulb size={16} style={{ color: "var(--accent)" }} />
              </div>
              <div>
                <h4 style={{ fontWeight: 600, fontSize: 13, marginBottom: 4, color: "var(--accent)" }}>Why this answer?</h4>
                <p style={{ fontSize: is4k ? 15 : 14, color: "var(--ink-light)", lineHeight: 1.6 }}>{q.explanation}</p>
              </div>
            </div>
          </div>
        )}

        {/* Next button */}
        {showExp && (
          <button onClick={next} className="tap-target anim-fade-up" style={{
            width: "100%", padding: "16px", borderRadius: 14, border: "none", cursor: "pointer",
            background: "var(--gradient-accent)", color: "#fff",
            fontFamily: "var(--font-body)", fontSize: 15, fontWeight: 600,
            boxShadow: "0 4px 16px rgba(37,99,235,0.25)",
            transition: "transform 0.2s, box-shadow 0.2s",
          }}>
            {currentQ < questions.length - 1 ? "Next Question" : "See Results"} <ArrowRight size={16} style={{ marginLeft: 4, verticalAlign: "middle" }} />
            {isDesktop && <span style={{ fontSize: 12, opacity: 0.7, marginLeft: 8 }}>Enter ↵</span>}
          </button>
        )}
      </div>
    </Container>
  );
};

/* ═══════════════════════════════════════════
   PROGRESS PAGE
   ═══════════════════════════════════════════ */
const ProgressPage = ({ stats, onNavigate, bp, gameState, getMasteryStats, goalHook }) => {
  const all = testCategories.flatMap((c) => c.tests);
  const completed = all.filter((t) => stats[t.id]?.attempts > 0);
  const totalA = Object.values(stats).reduce((s, v) => s + (v.attempts || 0), 0);
  const avg = completed.length > 0 ? Math.round(completed.reduce((s, t) => s + (stats[t.id]?.bestScore || 0), 0) / completed.length) : 0;
  const is4k = bp === "4k";
  const isDesktop = bp === "desktop" || is4k;
  const isTablet = bp === "tablet";
  const level = getLevel(gameState?.xp || 0);
  const xpProgress = level.nextMin ? ((gameState.xp - level.min) / (level.nextMin - level.min)) * 100 : 100;

  return (
    <Container bp={bp}>
      <div style={{ padding: isDesktop ? "40px 0 80px" : "24px 0 100px" }}>
        <h1 className="anim-fade-up" style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: is4k ? 36 : isDesktop ? 30 : 24, marginBottom: 4 }}>Your Progress</h1>
        <p className="anim-fade-up anim-d1" style={{ fontSize: is4k ? 17 : 15, color: "var(--ink-muted)", marginBottom: isDesktop ? 32 : 24 }}>Track performance across all tests {totalA > 0 && <span style={{ color: "var(--accent)", fontWeight: 600 }}>• {totalA} tests taken</span>}</p>

        {/* Level + XP Card */}
        <div className="anim-fade-up anim-d1" style={{
          background: "var(--surface-raised)", borderRadius: 20, padding: is4k ? 28 : 20,
          border: "1.5px solid var(--border)", marginBottom: isDesktop ? 24 : 16,
          display: "flex", flexDirection: bp === "mobile" ? "column" : "row",
          alignItems: bp === "mobile" ? "stretch" : "center", gap: 20,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{
              width: 56, height: 56, borderRadius: 16, background: "var(--xp-violet-soft)",
              border: "1px solid var(--xp-violet)", display: "flex", alignItems: "center", justifyContent: "center",
              color: "var(--xp-violet)",
            }}><LevelIcon name={level.name} size={28} /></div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, fontFamily: "var(--font-heading)", color: "var(--xp-violet)" }}>{level.name}</div>
              <div style={{ fontSize: 13, color: "var(--ink-muted)" }}>Level {level.index + 1} • {gameState?.xp || 0} XP</div>
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--ink-muted)", marginBottom: 4 }}>
              <span>{level.name}</span>
              <span>{level.nextMin ? LEVELS[level.index + 1]?.name : "Max Level"}</span>
            </div>
            <div style={{ width: "100%", height: 8, background: "var(--surface-sunken)", borderRadius: 4, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${xpProgress}%`, background: "var(--gradient-xp)", borderRadius: 4, transition: "width 0.5s" }} />
            </div>
            {level.nextMin && <div style={{ fontSize: 11, color: "var(--ink-muted)", marginTop: 4 }}>{level.nextMin - (gameState?.xp || 0)} XP to next level</div>}
          </div>
        </div>

        {/* Stats grid */}
        <div className="anim-fade-up anim-d2" style={{
          display: "grid",
          gridTemplateColumns: bp === "mobile" ? "repeat(2, 1fr)" : "repeat(4, 1fr)",
          gap: is4k ? 20 : 12, marginBottom: isDesktop ? 24 : 16,
        }}>
          {[
            { l: "Tests Taken", v: totalA, Icon: FileText, accent: "var(--accent)" },
            { l: "Passed", v: Object.values(stats).filter((s) => s.passed).length, Icon: CheckCircle2, accent: "var(--success)" },
            { l: "Avg Score", v: `${avg}%`, Icon: BarChart3, accent: "var(--xp-violet)" },
            { l: "Streak", v: gameState?.streak || 0, Icon: Flame, accent: "var(--streak-orange)" },
          ].map((s, idx) => (
            <div key={idx} style={{
              background: "var(--surface-raised)", borderRadius: 18, padding: is4k ? 28 : 20,
              border: "1px solid var(--border)", textAlign: "center", position: "relative", overflow: "hidden",
            }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: s.accent }} />
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 8, color: s.accent }}><s.Icon size={is4k ? 28 : 24} /></div>
              <div style={{ fontSize: is4k ? 28 : 24, fontWeight: 700, fontFamily: "var(--font-heading)", color: "var(--ink)" }}>{typeof s.v === "number" ? <CountUpNumber end={s.v} /> : s.v}</div>
              <div style={{ fontSize: 12, color: "var(--ink-muted)", marginTop: 2 }}>{s.l}</div>
            </div>
          ))}
        </div>

        {/* Badges Section */}
        <div className="anim-fade-up anim-d3" style={{ marginBottom: isDesktop ? 32 : 20 }}>
          <h2 style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: is4k ? 22 : 18, marginBottom: 14 }}>Badges ({gameState?.badges?.length || 0}/{BADGES.length})</h2>
          <div style={{
            display: "grid",
            gridTemplateColumns: is4k ? "repeat(4, 1fr)" : isDesktop ? "repeat(4, 1fr)" : isTablet ? "repeat(4, 1fr)" : "repeat(2, 1fr)",
            gap: is4k ? 16 : 10,
          }}>
            {BADGES.map((badge) => {
              const earned = gameState?.badges?.includes(badge.id);
              return (
                <div key={badge.id} style={{
                  background: "var(--surface-raised)", borderRadius: 16, padding: is4k ? 20 : 16,
                  border: `1.5px solid ${earned ? "var(--badge-gold)" : "var(--border)"}`,
                  textAlign: "center", opacity: earned ? 1 : 0.4, transition: "all 0.3s",
                }}>
                  <div style={{ display: "flex", justifyContent: "center", marginBottom: 6, color: earned ? "var(--badge-gold)" : "var(--ink-muted)", opacity: earned ? 1 : 0.5 }}><BadgeIcon id={badge.id} size={is4k ? 32 : 28} /></div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: earned ? "var(--badge-gold)" : "var(--ink-muted)", marginBottom: 2 }}>{badge.name}</div>
                  <div style={{ fontSize: 10, color: "var(--ink-muted)" }}>{badge.desc}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Category Breakdowns */}
        <h2 className="anim-fade-up anim-d4" style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: is4k ? 22 : 18, marginBottom: 14 }}>By Category</h2>
        <div style={{ display: "grid", gap: 12, marginBottom: isDesktop ? 32 : 20 }}>
          {testCategories.map((cat) => {
            const catTests = cat.tests;
            const catCompleted = catTests.filter(t => stats[t.id]?.attempts > 0);
            const catAvg = catCompleted.length > 0 ? Math.round(catCompleted.reduce((s, t) => s + (stats[t.id]?.bestScore || 0), 0) / catCompleted.length) : 0;
            const catProgress = Math.round((catCompleted.length / catTests.length) * 100);
            return (
              <div key={cat.id} className="anim-fade-up" style={{
                background: "var(--surface-raised)", borderRadius: 16, padding: is4k ? 24 : 18,
                border: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 16,
              }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 14, flexShrink: 0,
                  background: `linear-gradient(135deg, ${cat.accent}20, ${cat.accent}08)`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  border: `1px solid ${cat.accent}25`,
                }}><CatIcon catId={cat.id} size={24} /></div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontWeight: 600, fontSize: 14 }}>{cat.name}</span>
                    <span style={{ fontSize: 12, color: "var(--ink-muted)" }}>{catCompleted.length}/{catTests.length} tests</span>
                  </div>
                  <div style={{ width: "100%", height: 6, background: "var(--surface-sunken)", borderRadius: 4, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${catProgress}%`, background: cat.accent, borderRadius: 4, transition: "width 0.5s" }} />
                  </div>
                  {catCompleted.length > 0 && <div style={{ fontSize: 11, color: "var(--ink-muted)", marginTop: 3 }}>Avg: {catAvg}%</div>}
                </div>
                <button onClick={() => onNavigate("category", cat.id)} style={{
                  background: "none", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600,
                  color: cat.accent, fontFamily: "var(--font-body)", whiteSpace: "nowrap",
                }}>View →</button>
              </div>
            );
          })}
        </div>

        {/* Test History */}
        <h2 className="anim-fade-up" style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: is4k ? 22 : 18, marginBottom: 14 }}>Test History</h2>
        {completed.length === 0 ? (
          <div className="anim-fade-up" style={{
            background: "var(--surface-raised)", borderRadius: 24, border: "1.5px solid var(--border)",
            padding: isDesktop ? 72 : 52, textAlign: "center", position: "relative", overflow: "hidden",
          }}>
            <div style={{
              position: "absolute", inset: 0, opacity: 0.03,
              backgroundImage: "radial-gradient(circle at 25% 25%, var(--accent) 1.5px, transparent 1.5px), radial-gradient(circle at 75% 75%, var(--accent) 1.5px, transparent 1.5px)",
              backgroundSize: "48px 48px", pointerEvents: "none",
            }} />
            <div style={{
              width: 88, height: 88, borderRadius: 26, margin: "0 auto 24px",
              background: "var(--accent-soft)", border: "1.5px solid var(--accent)",
              display: "flex", alignItems: "center", justifyContent: "center", animation: "float 3s ease-in-out infinite",
            }}>
              <ClipboardList size={38} style={{ color: "var(--accent)" }} />
            </div>
            <h3 style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 22, marginBottom: 8 }}>No tests taken yet</h3>
            <p style={{ fontSize: 15, color: "var(--ink-muted)", marginBottom: 32, maxWidth: 340, margin: "0 auto 32px", lineHeight: 1.65 }}>
              Take your first practice test and start building your path to passing.
            </p>
            <button onClick={() => onNavigate("categories")} className="tap-target" style={{
              padding: "16px 32px", borderRadius: 14, border: "none", cursor: "pointer",
              background: "var(--gradient-accent)", color: "white", fontFamily: "var(--font-body)", fontSize: 15, fontWeight: 600,
              boxShadow: "0 4px 16px rgba(37,99,235,0.25)",
              display: "inline-flex", alignItems: "center", gap: 8,
            }}>Start Practicing <ArrowRight size={16} /></button>
          </div>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {completed.map((test, i) => {
              const s = stats[test.id];
              return (
                <div key={test.id} className="anim-fade-up" style={{
                  background: "var(--surface-raised)", borderRadius: 16, padding: is4k ? 24 : 18,
                  border: "1px solid var(--border)",
                  display: "flex", flexDirection: bp === "mobile" ? "column" : "row",
                  alignItems: bp === "mobile" ? "stretch" : "center",
                  justifyContent: "space-between", gap: 12,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <TestIcon testId={test.id} size={24} style={{ color: "var(--accent)" }} />
                    <div>
                      <h3 style={{ fontWeight: 600, fontSize: is4k ? 16 : 15 }}>{test.name}</h3>
                      <p style={{ fontSize: 12, color: "var(--ink-muted)" }}>{s.attempts} attempt{s.attempts > 1 ? "s" : ""} • Best: {s.bestScore}%</p>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: is4k ? 160 : 120, height: 6, background: "var(--surface-sunken)", borderRadius: 4, overflow: "hidden" }}>
                      <div style={{ height: "100%", borderRadius: 4, width: `${s.bestScore}%`, background: s.bestScore >= test.passingScore ? "var(--success)" : "var(--warm)", transition: "width 0.5s" }} />
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 700, minWidth: 36, color: s.bestScore >= test.passingScore ? "var(--success)" : "var(--warm)" }}>{s.bestScore}%</span>
                    <button onClick={() => onNavigate("quiz", test.id)} className="tap-target" style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, color: "var(--accent)", fontFamily: "var(--font-body)", whiteSpace: "nowrap" }}>Retry →</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Container>
  );
};

/* ═══════════════════════════════════════════
   FOOTER
   ═══════════════════════════════════════════ */
const Footer = ({ bp }) => {
  if (bp === "mobile") return null;
  return (
    <footer style={{ borderTop: "1px solid var(--border)", padding: "32px 0", marginTop: "auto" }}>
      <Container bp={bp}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 26, height: 26, borderRadius: 8, background: "var(--gradient-accent)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: "white", fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 13 }}>Q</span>
            </div>
            <span style={{ fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 15, color: "var(--ink-light)" }}>QuizLane</span>
          </div>
          <p style={{ fontSize: 13, color: "var(--ink-muted)" }}>© 2026 QuizLane — Free test prep for everyone.</p>
        </div>
      </Container>
    </footer>
  );
};

/* ═══════════════════════════════════════════
   ROUTE WRAPPER COMPONENTS
   Extract URL params and pass to existing components
   ═══════════════════════════════════════════ */
function CategoryPageWrapper(props) {
  const { categorySlug } = useParams();
  const categoryId = URL_TO_CATEGORY_MAP[categorySlug] || categorySlug;
  return <CategoryPage categoryId={categoryId} {...props} />;
}

function QuizPageWrapper(props) {
  const { testSlug } = useParams();
  const testId = URL_TO_TEST_MAP[testSlug];
  const [quizStarted, setQuizStarted] = useState(false);

  if (!testId) return <Navigate to="/" replace />;

  // For state DMV tests, show landing page first
  const testInfo = testCategories.flatMap(c => c.tests).find(t => t.id === testId);
  if (testInfo?.stateAbbrev && !quizStarted) {
    return (
      <StateLandingPage
        testId={testId}
        stateAbbrev={testInfo.stateAbbrev}
        onStartQuiz={() => setQuizStarted(true)}
        onNavigate={props.onNavigate}
        bp={props.bp}
      />
    );
  }

  return <QuizPage testId={testId} {...props} />;
}

function QuickFireWrapper(props) {
  const { testId } = useParams();
  return <QuickFirePage testId={testId} {...props} />;
}

function SmartStudyWrapper(props) {
  const { testId } = useParams();
  return <SmartStudyPage testId={testId} {...props} />;
}

/* ═══════════════════════════════════════════
   MAIN APP
   ═══════════════════════════════════════════ */
export default function App() {
  const bp = useBreakpoint();
  const navigate = useNavigate();
  const location = useLocation();
  const [stats, setStats] = useLocalStorage("ql-stats", {});
  const [gameState, setGameState] = useLocalStorage("ql-game", INITIAL_GAME_STATE);
  const { resolved: themeResolved, toggle: themeToggle } = useTheme();
  const { toasts, addToast } = useToasts();
  const { mastery, recordAnswer, getWeakQuestions, getMasteryStats, getQuestionMastery, dueCount } = useMastery();
  const goalHook = useGoal();

  // Derive view/viewData from URL for SEO and analytics
  const { view, viewData } = useMemo(() => urlToView(location.pathname), [location.pathname]);

  // Navigation adapter: all 31 existing onNavigate calls still work as nav("quiz", "dmv-ca")
  // but now they push real URLs via React Router
  const nav = useCallback((v, d = null) => {
    const url = viewToUrl(v, d);
    navigate(url);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [navigate]);

  useSEO(view, viewData);
  useAnalytics(view, viewData);

  // Update streak on app load (with shield protection)
  useEffect(() => {
    const today = new Date().toDateString();
    if (gameState.lastActiveDate === today) return;
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    setGameState(prev => {
      const isConsecutive = prev.lastActiveDate === yesterday;
      let newStreak;
      let newShields = prev.streakShields || 0;
      const shieldUsedDates = [...(prev.shieldUsedDates || [])];

      if (isConsecutive) {
        newStreak = prev.streak + 1;
      } else if (prev.lastActiveDate === today) {
        newStreak = prev.streak;
      } else if (prev.streak > 0 && newShields > 0 && prev.lastActiveDate) {
        // Use a streak shield!
        newStreak = prev.streak + 1;
        newShields--;
        shieldUsedDates.push(today);
        setTimeout(() => addToast("Streak Shield used! Your streak is safe.", "streak"), 500);
      } else {
        newStreak = 1;
      }

      const dayOfWeek = new Date().getDay();
      const adjustedDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      const newWeek = [...(prev.weekActivity || [])];
      if (!newWeek.includes(adjustedDay)) newWeek.push(adjustedDay);
      const isMonday = dayOfWeek === 1;

      return {
        ...prev,
        streak: newStreak,
        lastActiveDate: today,
        weekActivity: isMonday && prev.lastActiveDate !== today ? [adjustedDay] : newWeek,
        streakShields: newShields,
        shieldUsedDates,
        // Update daily multiplier
        dailyMultiplier: getDailyMultiplier().value,
        dailyMultiplierDate: today,
      };
    });
  }, []);

  // Check and award badges
  const checkBadges = useCallback((newStats, newGame) => {
    const state = { stats: newStats, game: newGame };
    const newBadges = [];
    BADGES.forEach(badge => {
      if (!newGame.badges.includes(badge.id) && badge.check(state)) {
        newBadges.push(badge.id);
        addToast(`Badge unlocked: ${badge.name}!`, "badge");
      }
    });
    if (newBadges.length > 0) {
      setGameState(prev => ({ ...prev, badges: [...prev.badges, ...newBadges] }));
    }
  }, [addToast, setGameState]);

  // Celebration state
  const [celebration, setCelebration] = useState(null);
  const [showSpinWheel, setShowSpinWheel] = useState(false);
  const [showShareCard, setShowShareCard] = useState(null);

  const onDone = useCallback((id, r) => {
    // Update stats
    const newStats = { ...stats };
    const e = newStats[id] || { attempts: 0, bestScore: 0, passed: false, history: [] };
    const isFirstQuiz = Object.values(stats).every(v => !v.attempts || v.attempts === 0);
    newStats[id] = {
      attempts: e.attempts + 1,
      bestScore: Math.max(e.bestScore, r.score),
      passed: e.passed || r.passed,
      lastScore: r.score,
      passingScore: testCategories.flatMap(c => c.tests).find(t => t.id === id)?.passingScore,
      history: [...(e.history || []), r],
    };
    setStats(newStats);

    // Apply daily multiplier to XP
    const multiplier = gameState.dailyMultiplier || 1;
    const baseXp = r.xpEarned || 0;
    const xpToAdd = Math.round(baseXp * multiplier);
    const prevXp = gameState.xp || 0;
    const newXp = prevXp + xpToAdd;
    const prevLevel = getLevel(prevXp);
    const newLevel = getLevel(newXp);

    const isDailyChallenge = id === getDailyChallenge(gameState);
    const dailyBonus = isDailyChallenge && gameState.dailyChallengeDate !== new Date().toDateString() ? XP_VALUES.dailyChallenge : 0;

    // Award streak shields at 7-day milestones
    let newShields = gameState.streakShields || 0;
    let newMilestone = gameState.lastStreakMilestone || 0;
    const streak = gameState.streak || 0;
    if (streak > 0 && streak % 7 === 0 && streak > newMilestone && newShields < 3) {
      newShields = Math.min(3, newShields + 1);
      newMilestone = streak;
      setTimeout(() => addToast("Streak Shield earned! 🛡️", "streak"), 1200);
    }

    // Check mystery box thresholds
    const claimedBoxes = [...(gameState.mysteryBoxesClaimed || [])];
    const totalXpAfter = newXp + dailyBonus;
    const newMysteryReward = MYSTERY_THRESHOLDS.find(t =>
      totalXpAfter >= t.xp && !claimedBoxes.includes(t.xp)
    );
    if (newMysteryReward) {
      claimedBoxes.push(newMysteryReward.xp);
      setTimeout(() => addToast(`Mystery reward unlocked at ${newMysteryReward.xp} XP!`, "badge"), 2000);
    }

    const today = new Date().toDateString();
    const updatedGame = {
      ...gameState,
      xp: totalXpAfter,
      dailyChallengeDate: isDailyChallenge ? today : gameState.dailyChallengeDate,
      dailyChallengeTestId: isDailyChallenge ? id : gameState.dailyChallengeTestId,
      streakShields: newShields,
      lastStreakMilestone: newMilestone,
      shieldsEarned: (gameState.shieldsEarned || 0) + (newShields > (gameState.streakShields || 0) ? 1 : 0),
      mysteryBoxesClaimed: claimedBoxes,
      quizCompletedToday: true,
      quizCompletedTodayDate: today,
    };
    setGameState(updatedGame);

    // Toasts
    const xpMsg = multiplier > 1 ? `+${xpToAdd} XP earned! (${multiplier}× bonus)` : `+${xpToAdd + dailyBonus} XP earned!`;
    if (xpToAdd > 0) addToast(xpMsg, "xp");
    if (isDailyChallenge && dailyBonus > 0) addToast(`Daily Challenge complete! +${dailyBonus} bonus XP`, "streak");
    if (newLevel.index > prevLevel.index) addToast(`Level up! You're now a ${newLevel.name}`, "levelup");

    // Trigger celebrations
    if (isFirstQuiz && r.passed) setTimeout(() => setCelebration({ type: "first-quiz" }), 600);
    else if (r.score === 100) setTimeout(() => setCelebration({ type: "perfect-score" }), 600);
    else if (newLevel.index > prevLevel.index) setTimeout(() => setCelebration({ type: "level-up", data: { levelName: newLevel.name } }), 600);

    // Check streak celebrations
    const streakMilestones = [3, 7, 14, 30];
    for (const m of streakMilestones) {
      if (streak === m) {
        setTimeout(() => setCelebration({ type: `streak-${m}` }), 800);
        break;
      }
    }

    // Check badges after a short delay
    setTimeout(() => checkBadges(newStats, updatedGame), 500);
  }, [stats, gameState, setStats, setGameState, addToast, checkBadges]);

  // Handle spin wheel reward
  const handleSpinReward = useCallback((reward) => {
    setShowSpinWheel(false);
    if (reward.type === "xp") {
      setGameState(prev => ({ ...prev, xp: (prev.xp || 0) + reward.value }));
      addToast(`+${reward.value} XP from Daily Spin!`, "xp");
    } else if (reward.type === "shield") {
      setGameState(prev => ({ ...prev, streakShields: Math.min(3, (prev.streakShields || 0) + 1) }));
      addToast("Streak Shield earned from Daily Spin!", "streak");
    } else if (reward.type === "multiplier") {
      addToast("2× XP for your next quiz!", "xp");
    } else if (reward.type === "badge") {
      addToast("Special badge from Daily Spin!", "badge");
    }
    setGameState(prev => ({ ...prev, lastSpinDate: new Date().toDateString(), spinsTotal: (prev.spinsTotal || 0) + 1 }));
  }, [addToast, setGameState]);

  // Daily multiplier info
  const dailyMultiplierInfo = getDailyMultiplier();

  // Shared props for page components
  const homeProps = { onNavigate: nav, bp, stats, gameState, dueCount, goalHook, getMasteryStats, dailyMultiplierInfo, onShowSpin: () => setShowSpinWheel(true) };
  const quizProps = { onNavigate: nav, onComplete: onDone, bp, gameState, recordAnswer, onShowShare: setShowShareCard };
  const navProps = { streak: gameState.streak || 0, xp: gameState.xp || 0, themeResolved, themeToggle };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", position: "relative" }}>
      <GlobalStyles />
      <div className="grain" />
      <ToastContainer toasts={toasts} />

      {/* Overlay components */}
      {celebration && <CelebrationOverlay type={celebration.type} data={celebration.data} onDismiss={() => setCelebration(null)} />}
      {showSpinWheel && <SpinWheel show={showSpinWheel} onClose={() => setShowSpinWheel(false)} onReward={handleSpinReward} gameState={gameState} />}
      {showShareCard && <ShareCard {...showShareCard} onClose={() => setShowShareCard(null)} />}

      {bp === "mobile" && <MobileNav currentView={view} onNavigate={nav} {...navProps} />}
      {bp === "tablet" && <TabletSidebar currentView={view} onNavigate={nav} {...navProps} />}
      {(bp === "desktop" || bp === "4k") && <DesktopHeader currentView={view} onNavigate={nav} is4k={bp === "4k"} {...navProps} />}

      <main style={{ flex: 1 }} className="anim-page-enter" key={location.pathname}>
        <Routes>
          <Route path="/" element={<HomePage {...homeProps} />} />
          <Route path="/practice-tests" element={<CategoriesPage onNavigate={nav} stats={stats} bp={bp} />} />
          <Route path="/practice-tests/:categorySlug" element={<CategoryPageWrapper onNavigate={nav} stats={stats} bp={bp} />} />
          <Route path="/quick-fire/:testId" element={<QuickFireWrapper onNavigate={nav} onComplete={onDone} bp={bp} gameState={gameState} />} />
          <Route path="/smart-study/:testId" element={<SmartStudyWrapper onNavigate={nav} onComplete={onDone} bp={bp} gameState={gameState} recordAnswer={recordAnswer} getWeakQuestions={getWeakQuestions} mastery={mastery} />} />
          <Route path="/progress" element={<ProgressPage stats={stats} onNavigate={nav} bp={bp} gameState={gameState} getMasteryStats={getMasteryStats} goalHook={goalHook} />} />
          <Route path="/weak-areas" element={<WeakAreasPage onNavigate={nav} onComplete={onDone} bp={bp} gameState={gameState} getWeakQuestions={getWeakQuestions} recordAnswer={recordAnswer} />} />
          <Route path="/:testSlug" element={<QuizPageWrapper {...quizProps} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer bp={bp} />
    </div>
  );
}
