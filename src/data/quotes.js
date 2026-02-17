/* ═══════════════════════════════════════════
   QUIZLANE — MOTIVATIONAL QUOTES
   Contextually selected based on user state
   ═══════════════════════════════════════════ */

export const QUOTES = {
  newcomer: [
    { text: "Every expert was once a beginner.", author: "Helen Hayes" },
    { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
    { text: "A journey of a thousand miles begins with a single step.", author: "Lao Tzu" },
    { text: "You don't have to be great to start, but you have to start to be great.", author: "Zig Ziglar" },
    { text: "The beginning is always today.", author: "Mary Shelley" },
  ],
  streak: [
    { text: "Success is the sum of small efforts, repeated day in and day out.", author: "Robert Collier" },
    { text: "We are what we repeatedly do. Excellence is not an act, but a habit.", author: "Aristotle" },
    { text: "Consistency is the true foundation of trust.", author: "Roy T. Bennett" },
    { text: "It's not what we do once in a while that shapes our lives, but what we do consistently.", author: "Tony Robbins" },
    { text: "Small daily improvements are the key to staggering long-term results.", author: "Robin Sharma" },
  ],
  persistence: [
    { text: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius" },
    { text: "Perseverance is not a long race; it is many short races one after the other.", author: "Walter Elliot" },
    { text: "Our greatest glory is not in never falling, but in rising every time we fall.", author: "Confucius" },
    { text: "The only way to guarantee failure is to quit.", author: "John C. Maxwell" },
    { text: "Difficult roads often lead to beautiful destinations.", author: "Zig Ziglar" },
  ],
  failure: [
    { text: "Failure is simply the opportunity to begin again, this time more intelligently.", author: "Henry Ford" },
    { text: "I have not failed. I've just found 10,000 ways that won't work.", author: "Thomas Edison" },
    { text: "Every strike brings me closer to the next home run.", author: "Babe Ruth" },
    { text: "The only real mistake is the one from which we learn nothing.", author: "Henry Ford" },
    { text: "Fall seven times, stand up eight.", author: "Japanese Proverb" },
  ],
  success: [
    { text: "The more you know, the more you grow.", author: "Dr. Seuss" },
    { text: "Education is the passport to the future.", author: "Malcolm X" },
    { text: "Learning is a treasure that will follow its owner everywhere.", author: "Chinese Proverb" },
    { text: "The beautiful thing about learning is that no one can take it away from you.", author: "B.B. King" },
    { text: "An investment in knowledge pays the best interest.", author: "Benjamin Franklin" },
  ],
};

/**
 * Get a contextually relevant quote based on user state
 * @param {object} gameState - Current game state
 * @param {number|null} lastScore - Last quiz score (null if none)
 * @returns {{ text: string, author: string }}
 */
export function getContextualQuote(gameState, lastScore = null) {
  // Determine context
  let category;
  const hasQuizzed = (gameState?.xp || 0) > 0;
  const streak = gameState?.streak || 0;

  if (!hasQuizzed) {
    category = "newcomer";
  } else if (lastScore !== null && lastScore < 60) {
    category = "failure";
  } else if (lastScore !== null && lastScore >= 90) {
    category = "success";
  } else if (streak >= 3) {
    category = "streak";
  } else {
    category = "persistence";
  }

  // Deterministic daily selection
  const quotes = QUOTES[category];
  const seed = new Date().toDateString().split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return quotes[seed % quotes.length];
}
