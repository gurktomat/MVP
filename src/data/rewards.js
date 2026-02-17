/* ═══════════════════════════════════════════
   QUIZLANE — REWARDS & MYSTERY BOX DATA
   ═══════════════════════════════════════════ */

// Mystery box XP thresholds and their rewards
export const MYSTERY_THRESHOLDS = [
  { xp: 250, reward: { type: "badge", id: "early-bird", name: "Early Bird", desc: "Reached 250 XP" } },
  { xp: 500, reward: { type: "shield", count: 1, name: "Free Shield", desc: "A streak shield to protect your streak" } },
  { xp: 1000, reward: { type: "title", title: "Road Scholar", desc: "An exclusive display title" } },
  { xp: 2000, reward: { type: "xpBoost", amount: 150, name: "XP Surge", desc: "+150 bonus XP!" } },
  { xp: 3500, reward: { type: "title", title: "Quiz Machine", desc: "An exclusive display title" } },
  { xp: 5000, reward: { type: "badge", id: "legend-box", name: "Legend's Reward", desc: "Reached 5000 XP milestone" } },
  { xp: 7500, reward: { type: "shield", count: 2, name: "Double Shield", desc: "Two streak shields!" } },
  { xp: 10000, reward: { type: "title", title: "Test Master", desc: "The ultimate display title" } },
];

// Spin wheel segments with weights
export const SPIN_SEGMENTS = [
  { label: "+10 XP", value: 10, type: "xp", weight: 30, color: "var(--surface-sunken)", textColor: "var(--ink-light)" },
  { label: "+25 XP", value: 25, type: "xp", weight: 25, color: "var(--accent-soft)", textColor: "var(--accent)" },
  { label: "+50 XP", value: 50, type: "xp", weight: 18, color: "var(--xp-violet-soft)", textColor: "var(--xp-violet)" },
  { label: "+100 XP", value: 100, type: "xp", weight: 10, color: "var(--success-soft)", textColor: "var(--success)" },
  { label: "2× Next", value: 2, type: "multiplier", weight: 7, color: "var(--warm-soft)", textColor: "var(--warm)" },
  { label: "Shield", value: 1, type: "shield", weight: 5, color: "var(--streak-orange-soft)", textColor: "var(--streak-orange)" },
  { label: "Badge", value: 1, type: "badge", weight: 3, color: "var(--badge-gold-soft)", textColor: "var(--badge-gold)" },
  { label: "JACKPOT", value: 500, type: "xp", weight: 2, color: "var(--gradient-accent)", textColor: "#fff" },
];

// Daily multiplier weights
export const MULTIPLIER_WEIGHTS = [
  { value: 1, weight: 60, label: "1×", color: "var(--ink-muted)" },
  { value: 2, weight: 25, label: "2× XP Day!", color: "var(--accent)" },
  { value: 3, weight: 12, label: "3× XP Day!", color: "var(--xp-violet)" },
  { value: 5, weight: 3, label: "5× XP Day!", color: "var(--badge-gold)" },
];

// Celebration milestones
export const CELEBRATION_MILESTONES = {
  streaks: [3, 7, 14, 30, 50, 100],
  scores: [100], // perfect scores
  levels: [3, 5, 7, 9], // Scholar, Expert, Champion, Sage
};

// Titles available through mystery boxes and achievements
export const ALL_TITLES = [
  { id: "road-scholar", name: "Road Scholar" },
  { id: "quiz-machine", name: "Quiz Machine" },
  { id: "test-master", name: "Test Master" },
  { id: "streak-lord", name: "Streak Lord" },
  { id: "perfect-mind", name: "Perfect Mind" },
];
