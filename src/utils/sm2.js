/* ═══════════════════════════════════════════
   SM-2 SPACED REPETITION ALGORITHM
   Based on SuperMemo SM-2 by Piotr Wozniak
   Simplified for client-side day-level intervals
   ═══════════════════════════════════════════ */

// Mastery levels
export const MASTERY = { NEW: 0, LEARNING: 1, FAMILIAR: 2, MASTERED: 3 };
export const MASTERY_LABELS = ["New", "Learning", "Familiar", "Mastered"];
export const MASTERY_COLORS = ["var(--ink-muted)", "var(--warm)", "var(--accent)", "var(--success)"];

// Day intervals per level (in milliseconds)
const DAY = 86400000;
const INTERVALS = {
  [MASTERY.LEARNING]: [1 * DAY, 3 * DAY],      // 1 day, 3 days
  [MASTERY.FAMILIAR]: [7 * DAY, 14 * DAY],     // 1 week, 2 weeks
  [MASTERY.MASTERED]: [30 * DAY, 60 * DAY],    // 1 month, 2 months
};

// Decay threshold: mastered questions decay after 30 days without review
export const MASTERY_DECAY_DAYS = 30;

/**
 * Calculate next review state after answering a question
 * @param {object} entry - Current mastery entry (or null for new question)
 * @param {boolean} isCorrect - Whether the answer was correct
 * @returns {object} Updated mastery entry
 */
export function calculateNextReview(entry, isCorrect) {
  const now = Date.now();
  const current = entry || {
    level: MASTERY.NEW,
    wrongCount: 0,
    rightCount: 0,
    lastSeen: now,
    nextReview: now,
    easeFactor: 2.5,
  };

  let newLevel = current.level;
  let newEase = current.easeFactor;

  if (isCorrect) {
    // Promote: NEW → LEARNING → FAMILIAR → MASTERED
    if (newLevel < MASTERY.MASTERED) {
      // Need consecutive correct answers to promote
      const consecutiveRight = (current.rightCount || 0) + 1;
      const promotionThreshold = newLevel === MASTERY.NEW ? 1 : newLevel === MASTERY.LEARNING ? 2 : 3;
      if (consecutiveRight >= promotionThreshold) {
        newLevel = Math.min(newLevel + 1, MASTERY.MASTERED);
      }
    }
    // Increase ease factor (makes intervals longer)
    newEase = Math.min(3.0, newEase + 0.1);
  } else {
    // Demote on wrong answer (but never below LEARNING once seen)
    if (newLevel > MASTERY.LEARNING) {
      newLevel = newLevel - 1;
    } else if (newLevel === MASTERY.NEW) {
      newLevel = MASTERY.LEARNING;
    }
    // Decrease ease factor (makes reviews more frequent)
    newEase = Math.max(1.3, newEase - 0.2);
  }

  // Calculate next review time
  const levelIntervals = INTERVALS[newLevel] || [DAY, DAY];
  const baseInterval = isCorrect ? levelIntervals[1] : levelIntervals[0];
  const adjustedInterval = Math.round(baseInterval * (newEase / 2.5));
  const nextReview = now + adjustedInterval;

  return {
    level: newLevel,
    wrongCount: current.wrongCount + (isCorrect ? 0 : 1),
    rightCount: isCorrect ? (current.rightCount || 0) + 1 : 0, // Reset on wrong
    lastSeen: now,
    nextReview,
    easeFactor: newEase,
  };
}

/**
 * Check if mastered questions should decay
 * @param {object} entry - Mastery entry
 * @returns {object|null} Updated entry if decayed, null if no change
 */
export function checkDecay(entry) {
  if (entry.level !== MASTERY.MASTERED) return null;
  const daysSinceReview = (Date.now() - entry.lastSeen) / DAY;
  if (daysSinceReview >= MASTERY_DECAY_DAYS) {
    return { ...entry, level: MASTERY.FAMILIAR, nextReview: Date.now() };
  }
  return null;
}

/**
 * Score a question for review priority (lower = higher priority)
 * Used to select which weak questions to show first
 */
export function getReviewPriority(entry) {
  const now = Date.now();
  const overdue = now - entry.nextReview; // positive = overdue
  const levelWeight = (MASTERY.MASTERED - entry.level) * 100000;
  const wrongWeight = entry.wrongCount * 10000;
  return -(levelWeight + wrongWeight + overdue); // More negative = higher priority
}
