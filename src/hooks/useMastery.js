/* ═══════════════════════════════════════════
   useMastery — Spaced Repetition Mastery Hook
   Tracks per-question mastery using SM-2 algorithm
   ═══════════════════════════════════════════ */

import { useState, useEffect, useCallback, useMemo } from "react";
import { calculateNextReview, checkDecay, getReviewPriority, MASTERY, MASTERY_LABELS } from "../utils/sm2.js";
import { questionBank } from "../data/questions.js";

const STORAGE_KEY = "ql-mastery";

const load = () => {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; }
  catch { return {}; }
};
const save = (data) => {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch {}
};

export function useMastery() {
  const [mastery, setMastery] = useState(load);

  // Persist on change
  useEffect(() => { save(mastery); }, [mastery]);

  // Check for mastery decay on mount
  useEffect(() => {
    let changed = false;
    const updated = { ...mastery };
    for (const key in updated) {
      const decayed = checkDecay(updated[key]);
      if (decayed) { updated[key] = decayed; changed = true; }
    }
    if (changed) setMastery(updated);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Record an answer for a question
   * @param {string} testId - The test ID (e.g., "dmv-ca")
   * @param {number} questionId - The question ID within the test
   * @param {boolean} isCorrect - Whether the answer was correct
   */
  const recordAnswer = useCallback((testId, questionId, isCorrect) => {
    const key = `${testId}:${questionId}`;
    setMastery(prev => {
      const entry = prev[key] || null;
      const updated = calculateNextReview(entry, isCorrect);
      return { ...prev, [key]: updated };
    });
  }, []);

  /**
   * Get questions due for review (weak areas)
   * @param {number} count - Max number of questions to return
   * @param {string|null} testId - Optional: filter to specific test
   * @returns {Array<{testId, questionId, question, options, correct, explanation, masteryLevel}>}
   */
  const getWeakQuestions = useCallback((count = 15, testId = null) => {
    const now = Date.now();
    const candidates = [];

    for (const key in mastery) {
      const entry = mastery[key];
      // Include if overdue for review OR level < MASTERED
      if (entry.nextReview <= now || entry.level < MASTERY.MASTERED) {
        const [tId, qId] = key.split(":");
        if (testId && tId !== testId) continue;
        // Look up the actual question
        const questions = questionBank[tId];
        if (!questions) continue;
        const q = questions.find(q => q.id === parseInt(qId));
        if (!q) continue;
        candidates.push({
          testId: tId,
          questionId: parseInt(qId),
          ...q,
          masteryLevel: entry.level,
          priority: getReviewPriority(entry),
        });
      }
    }

    // Sort by priority (most important first — lower priority score)
    candidates.sort((a, b) => a.priority - b.priority);
    return candidates.slice(0, count);
  }, [mastery]);

  /**
   * Get mastery statistics
   * @param {string|null} testId - Optional: filter to specific test
   * @returns {{ total, new, learning, familiar, mastered, dueForReview }}
   */
  const getMasteryStats = useCallback((testId = null) => {
    const stats = { total: 0, new: 0, learning: 0, familiar: 0, mastered: 0, dueForReview: 0 };
    const now = Date.now();

    for (const key in mastery) {
      if (testId) {
        const [tId] = key.split(":");
        if (tId !== testId) continue;
      }
      stats.total++;
      const entry = mastery[key];
      if (entry.level === MASTERY.NEW) stats.new++;
      else if (entry.level === MASTERY.LEARNING) stats.learning++;
      else if (entry.level === MASTERY.FAMILIAR) stats.familiar++;
      else if (entry.level === MASTERY.MASTERED) stats.mastered++;

      if (entry.nextReview <= now && entry.level < MASTERY.MASTERED) {
        stats.dueForReview++;
      }
    }

    return stats;
  }, [mastery]);

  /**
   * Get mastery level for a specific question
   */
  const getQuestionMastery = useCallback((testId, questionId) => {
    const key = `${testId}:${questionId}`;
    return mastery[key]?.level ?? null;
  }, [mastery]);

  /**
   * Get count of questions due for review
   */
  const dueCount = useMemo(() => {
    const now = Date.now();
    let count = 0;
    for (const key in mastery) {
      const entry = mastery[key];
      if (entry.nextReview <= now && entry.level < MASTERY.MASTERED) count++;
    }
    return count;
  }, [mastery]);

  return {
    mastery,
    recordAnswer,
    getWeakQuestions,
    getMasteryStats,
    getQuestionMastery,
    dueCount,
    MASTERY,
    MASTERY_LABELS,
  };
}
