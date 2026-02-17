/* ═══════════════════════════════════════════
   useGoal — Test Day Goal & Countdown Hook
   Manages test date goals with readiness scoring
   ═══════════════════════════════════════════ */

import { useState, useEffect, useCallback, useMemo } from "react";

const STORAGE_KEY = "ql-goal";

const load = () => {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || null; }
  catch { return null; }
};
const save = (data) => {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch {}
};

export function useGoal() {
  const [goal, setGoalState] = useState(load);

  useEffect(() => { save(goal); }, [goal]);

  const setGoal = useCallback((testDate, targetTestId) => {
    setGoalState({
      testDate,
      targetTestId,
      setAt: Date.now(),
      dismissed: false,
    });
  }, []);

  const clearGoal = useCallback(() => { setGoalState(null); }, []);

  const dismissGoal = useCallback(() => {
    setGoalState(prev => prev ? { ...prev, dismissed: true } : null);
  }, []);

  /**
   * Days remaining until test
   */
  const daysLeft = useMemo(() => {
    if (!goal?.testDate) return null;
    const target = new Date(goal.testDate);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    target.setHours(0, 0, 0, 0);
    const diff = Math.ceil((target - now) / 86400000);
    return Math.max(0, diff);
  }, [goal?.testDate]);

  /**
   * Calculate readiness score based on stats and mastery
   * @param {object} stats - ql-stats data
   * @param {function} getMasteryStats - From useMastery
   * @returns {number} 0-100 readiness score
   */
  const getReadiness = useCallback((stats, getMasteryStats) => {
    if (!goal?.targetTestId) return 0;

    const testStats = stats[goal.targetTestId];
    const mastery = getMasteryStats(goal.targetTestId);

    let score = 0;

    // 40% weight: best score achieved
    if (testStats?.bestScore) {
      score += (testStats.bestScore / 100) * 40;
    }

    // 30% weight: mastery distribution
    if (mastery.total > 0) {
      const masteryScore = (
        mastery.familiar * 0.6 +
        mastery.mastered * 1.0
      ) / mastery.total;
      score += masteryScore * 30;
    }

    // 20% weight: practice frequency (attempts in last 7 days from history)
    if (testStats?.history?.length) {
      const weekAgo = Date.now() - 7 * 86400000;
      const recentAttempts = testStats.history.filter(h =>
        h.timeSpent && (Date.now() - (testStats.history.indexOf(h) * 86400000)) > weekAgo
      ).length;
      score += Math.min(20, recentAttempts * 5);
    }

    // 10% weight: passed at least once
    if (testStats?.passed) score += 10;

    return Math.round(Math.min(100, score));
  }, [goal?.targetTestId]);

  /**
   * Get study recommendation text
   */
  const getRecommendation = useCallback((readiness) => {
    if (daysLeft === null) return "";
    if (daysLeft === 0) return "Your test is today! You've got this.";
    if (daysLeft <= 3) {
      return readiness >= 80
        ? "You're well prepared! Do a final review of weak areas."
        : "Focus on your weak areas today — every question counts.";
    }
    if (readiness >= 80) return "You're on track! Maintain your skills with daily practice.";
    if (readiness >= 50) {
      const quizzesPerDay = Math.max(1, Math.ceil((80 - readiness) / (daysLeft * 5)));
      return `Practice ${quizzesPerDay} quiz${quizzesPerDay > 1 ? "zes" : ""} per day to be ready.`;
    }
    const quizzesPerDay = Math.max(2, Math.ceil((80 - readiness) / (daysLeft * 4)));
    return `Aim for ${quizzesPerDay} quizzes daily. Focus on weak areas first.`;
  }, [daysLeft]);

  /**
   * Get urgency level for UI styling
   * @returns {"calm"|"alert"|"urgent"|"critical"}
   */
  const urgency = useMemo(() => {
    if (daysLeft === null) return "calm";
    if (daysLeft === 0) return "critical";
    if (daysLeft <= 3) return "urgent";
    if (daysLeft <= 7) return "alert";
    return "calm";
  }, [daysLeft]);

  return {
    goal,
    setGoal,
    clearGoal,
    dismissGoal,
    daysLeft,
    getReadiness,
    getRecommendation,
    urgency,
  };
}
