import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Brain, TrendingUp, Clock, CheckCircle2, XCircle, ArrowRight, Square, BarChart3 } from "lucide-react";
import { questionBank, testCategories } from "../data/questions.js";

/* -----------------------------------------------
   Constants & helpers
   ----------------------------------------------- */
const MASTERY_COLORS = ["var(--ink-muted)", "var(--warm)", "var(--accent)", "var(--success)"];
const MASTERY_LABELS = ["New", "Learning", "Familiar", "Mastered"];
const DIFFICULTY_LABELS = ["Easy", "Medium", "Hard"];
const DIFFICULTY_COLORS = ["var(--success)", "var(--warm)", "var(--danger)"];

const fmtTime = (s) => {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
};

/* -----------------------------------------------
   Adaptive question picker
   ----------------------------------------------- */
const pickQuestion = (allQuestions, mastery, testId, streak, wrongRecent, used) => {
  // Categorise questions into pools
  const newPool = [];
  const learningPool = [];
  const familiarPool = [];

  for (const q of allQuestions) {
    if (used.has(q.id)) continue;
    const key = `${testId}:${q.id}`;
    const entry = mastery?.[key];
    const level = entry?.level ?? 0;
    if (level === 0) newPool.push(q);
    else if (level === 1) learningPool.push(q);
    else familiarPool.push(q);
  }

  let pool;
  let difficulty;

  if (streak >= 3 && newPool.length > 0) {
    // Student is doing well: challenge with new/unknown
    pool = newPool;
    difficulty = 2; // Hard
  } else if (wrongRecent >= 2 && familiarPool.length > 0) {
    // Struggling: give them familiar questions to rebuild confidence
    pool = familiarPool;
    difficulty = 0; // Easy
  } else {
    // Default: learning pool
    pool = learningPool.length > 0 ? learningPool : newPool.length > 0 ? newPool : familiarPool;
    difficulty = 1; // Medium
  }

  if (!pool || pool.length === 0) {
    // Fallback: any unused question
    const remaining = allQuestions.filter((q) => !used.has(q.id));
    if (remaining.length === 0) return { question: null, difficulty: 1 };
    pool = remaining;
    difficulty = 1;
  }

  const idx = Math.floor(Math.random() * pool.length);
  return { question: pool[idx], difficulty };
};

/* -----------------------------------------------
   SmartStudy Component
   ----------------------------------------------- */
const SmartStudy = ({ testId, onNavigate, onComplete, bp, gameState, recordAnswer, getWeakQuestions, mastery }) => {
  const testInfo = testCategories.flatMap((c) => c.tests).find((t) => t.id === testId);
  const allQuestions = useMemo(() => questionBank[testId] || questionBank["car-permit"] || [], [testId]);

  const [currentQ, setCurrentQ] = useState(null);
  const [difficulty, setDifficulty] = useState(1);
  const [selected, setSelected] = useState(null);
  const [showExp, setShowExp] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [wrongRecent, setWrongRecent] = useState(0); // wrong in last 3
  const [recentAnswers, setRecentAnswers] = useState([]); // last 3 results
  const [usedIds, setUsedIds] = useState(new Set());
  const [sessionDone, setSessionDone] = useState(false);
  const [startTime] = useState(Date.now());
  const [elapsedSec, setElapsedSec] = useState(0);
  const [difficultyHistory, setDifficultyHistory] = useState([]); // [{difficulty, correct}]

  const is4k = bp === "4k";
  const isDesktop = bp === "desktop" || is4k;

  // Session timer
  useEffect(() => {
    if (sessionDone) return;
    const t = setInterval(() => setElapsedSec(Math.floor((Date.now() - startTime) / 1000)), 1000);
    return () => clearInterval(t);
  }, [startTime, sessionDone]);

  // Pick first question
  useEffect(() => {
    const { question, difficulty: d } = pickQuestion(allQuestions, mastery, testId, 0, 0, new Set());
    setCurrentQ(question);
    setDifficulty(d);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const pick = (i) => {
    if (showExp || !currentQ) return;
    setSelected(i);
    setShowExp(true);

    const isCorrect = i === currentQ.correct;
    setTotalCount((p) => p + 1);
    if (isCorrect) {
      setCorrectCount((p) => p + 1);
      setStreak((p) => p + 1);
    } else {
      setStreak(0);
    }

    // Track recent
    const updated = [...recentAnswers, isCorrect].slice(-3);
    setRecentAnswers(updated);
    setWrongRecent(updated.filter((r) => !r).length);

    // Track difficulty history
    setDifficultyHistory((p) => [...p, { difficulty, correct: isCorrect }]);

    // Record mastery
    if (recordAnswer) {
      recordAnswer(testId, currentQ.id, isCorrect);
    }
  };

  const next = () => {
    const newUsed = new Set(usedIds);
    newUsed.add(currentQ.id);
    setUsedIds(newUsed);

    const nextStreak = recentAnswers.length > 0 && recentAnswers[recentAnswers.length - 1] ? streak : 0;
    const { question, difficulty: d } = pickQuestion(allQuestions, mastery, testId, nextStreak, wrongRecent, newUsed);

    if (!question) {
      // No more questions available
      setSessionDone(true);
      return;
    }

    setCurrentQ(question);
    setDifficulty(d);
    setSelected(null);
    setShowExp(false);
  };

  const endSession = () => {
    setSessionDone(true);
    if (onComplete) {
      onComplete(testId, {
        correct: correctCount,
        total: totalCount,
        score: totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0,
        timeSpent: elapsedSec,
        mode: "smartstudy",
        xpEarned: correctCount * 10,
      });
    }
  };

  // Keyboard support
  useEffect(() => {
    const handler = (e) => {
      if (sessionDone) return;
      if (!showExp && e.key >= "1" && e.key <= "4" && currentQ) {
        const idx = parseInt(e.key) - 1;
        if (idx < currentQ.options.length) pick(idx);
      }
      if (showExp && (e.key === "Enter" || e.key === " ")) {
        e.preventDefault();
        next();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [showExp, sessionDone, currentQ, streak, wrongRecent, recentAnswers]); // eslint-disable-line react-hooks/exhaustive-deps

  const accuracy = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;

  /* -----------------------------------------------
     Session summary
     ----------------------------------------------- */
  if (sessionDone) {
    // Difficulty curve: group every 5 questions
    const chunkSize = 5;
    const chunks = [];
    for (let i = 0; i < difficultyHistory.length; i += chunkSize) {
      const chunk = difficultyHistory.slice(i, i + chunkSize);
      const avgDiff = chunk.reduce((s, c) => s + c.difficulty, 0) / chunk.length;
      const chunkAcc = chunk.filter((c) => c.correct).length / chunk.length;
      chunks.push({ avgDiff, accuracy: chunkAcc, count: chunk.length });
    }

    return (
      <>
        <style>{`
          @keyframes ssResultIn {
            from { opacity: 0; transform: translateY(12px); }
            to   { opacity: 1; transform: translateY(0); }
          }
        `}</style>
        <div style={{
          minHeight: "100vh",
          background: "var(--surface)",
          padding: bp === "mobile" ? "16px 16px 100px" : "32px",
        }}>
          <div style={{
            maxWidth: is4k ? 640 : 540, margin: "0 auto",
            animation: "ssResultIn 0.5s cubic-bezier(0.22,1,0.36,1) both",
          }}>
            {/* Header */}
            <div style={{
              background: "var(--surface-raised)", borderRadius: 24,
              border: "1.5px solid var(--border)", overflow: "hidden",
              boxShadow: "var(--shadow-lg)", marginBottom: 20,
            }}>
              <div style={{
                padding: is4k ? 48 : 40, textAlign: "center",
                background: "var(--accent-soft)",
              }}>
                <Brain size={44} style={{ color: "var(--accent)", marginBottom: 12 }} />
                <h2 style={{
                  fontFamily: "var(--font-heading)", fontWeight: 800,
                  fontSize: is4k ? 28 : 24, marginBottom: 6,
                }}>Study Session Complete</h2>
                <p style={{ fontSize: 14, color: "var(--ink-light)" }}>
                  {testInfo?.name || testId}
                </p>
              </div>

              <div style={{ padding: is4k ? 32 : 24 }}>
                {/* Stats grid */}
                <div style={{
                  display: "grid", gridTemplateColumns: "repeat(2, 1fr)",
                  gap: 12, marginBottom: 20,
                }}>
                  {[
                    { label: "Questions", value: totalCount, icon: CheckCircle2, color: "var(--accent)" },
                    { label: "Accuracy", value: `${accuracy}%`, icon: TrendingUp, color: "var(--success)" },
                    { label: "Time", value: fmtTime(elapsedSec), icon: Clock, color: "var(--ink-light)" },
                    { label: "XP Earned", value: `+${correctCount * 10}`, icon: Brain, color: "var(--xp-violet)" },
                  ].map((s, i) => (
                    <div key={i} style={{
                      textAlign: "center", padding: 16,
                      background: "var(--surface-sunken)", borderRadius: 14,
                    }}>
                      <s.icon size={18} style={{ color: s.color, marginBottom: 6 }} />
                      <div style={{
                        fontSize: is4k ? 24 : 20, fontWeight: 700,
                        fontFamily: "var(--font-heading)", color: s.color,
                      }}>{s.value}</div>
                      <div style={{ fontSize: 12, color: "var(--ink-muted)", marginTop: 2 }}>{s.label}</div>
                    </div>
                  ))}
                </div>

                {/* Difficulty curve */}
                {chunks.length > 1 && (
                  <div style={{ marginBottom: 20 }}>
                    <div style={{
                      display: "flex", alignItems: "center", gap: 6,
                      marginBottom: 10,
                    }}>
                      <BarChart3 size={15} style={{ color: "var(--ink-muted)" }} />
                      <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ink-light)" }}>Difficulty Curve</span>
                    </div>
                    <div style={{
                      display: "flex", gap: 6, alignItems: "flex-end",
                      height: 80, padding: "0 4px",
                    }}>
                      {chunks.map((c, i) => (
                        <div key={i} style={{
                          flex: 1, display: "flex", flexDirection: "column",
                          alignItems: "center", gap: 4,
                        }}>
                          <div style={{
                            width: "100%", borderRadius: 6,
                            height: `${Math.max(15, c.accuracy * 60)}px`,
                            background: DIFFICULTY_COLORS[Math.round(c.avgDiff)] || "var(--accent)",
                            transition: "height 0.5s",
                          }} />
                          <span style={{ fontSize: 9, color: "var(--ink-muted)" }}>
                            {i * chunkSize + 1}-{Math.min((i + 1) * chunkSize, difficultyHistory.length)}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div style={{
                      display: "flex", gap: 12, justifyContent: "center",
                      marginTop: 8,
                    }}>
                      {DIFFICULTY_LABELS.map((l, i) => (
                        <div key={i} style={{
                          display: "flex", alignItems: "center", gap: 4, fontSize: 10,
                          color: "var(--ink-muted)",
                        }}>
                          <div style={{
                            width: 8, height: 8, borderRadius: 2,
                            background: DIFFICULTY_COLORS[i],
                          }} />
                          {l}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Buttons */}
                <div style={{ display: "flex", gap: 12, flexDirection: bp === "mobile" ? "column" : "row" }}>
                  <button onClick={() => {
                    setSessionDone(false);
                    setCorrectCount(0);
                    setTotalCount(0);
                    setStreak(0);
                    setWrongRecent(0);
                    setRecentAnswers([]);
                    setUsedIds(new Set());
                    setDifficultyHistory([]);
                    setSelected(null);
                    setShowExp(false);
                    const { question, difficulty: d } = pickQuestion(allQuestions, mastery, testId, 0, 0, new Set());
                    setCurrentQ(question);
                    setDifficulty(d);
                  }} style={{
                    flex: 1, padding: "15px 24px", borderRadius: 14,
                    border: "none", cursor: "pointer",
                    background: "var(--gradient-accent)", color: "#fff",
                    fontFamily: "var(--font-body)", fontSize: 15, fontWeight: 600,
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  }}>
                    <Brain size={16} /> Study Again
                  </button>
                  <button onClick={() => onNavigate("categories")} style={{
                    flex: 1, padding: "15px 24px", borderRadius: 14,
                    cursor: "pointer",
                    background: "var(--surface-sunken)", color: "var(--ink)",
                    fontFamily: "var(--font-body)", fontSize: 15, fontWeight: 600,
                    border: "1.5px solid var(--border)",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  }}>
                    <ArrowRight size={16} /> Back to Tests
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  /* -----------------------------------------------
     Active study session
     ----------------------------------------------- */
  if (!currentQ) return null;

  const masteryKey = `${testId}:${currentQ.id}`;
  const masteryLevel = mastery?.[masteryKey]?.level ?? 0;

  return (
    <>
      <style>{`
        @keyframes ssCardIn {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      <div style={{
        minHeight: "100vh", background: "var(--surface)",
      }}>
        <div style={{
          maxWidth: is4k ? 720 : 600, margin: "0 auto",
          padding: isDesktop ? "32px 32px" : "16px 16px 100px",
        }}>
          {/* Top bar with End Session */}
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            marginBottom: 16,
          }}>
            <button onClick={endSession} style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "8px 14px", borderRadius: 10,
              background: "var(--danger-soft)", border: "1px solid var(--danger)",
              color: "var(--danger)", fontSize: 13, fontWeight: 600,
              fontFamily: "var(--font-body)", cursor: "pointer",
            }}>
              <Square size={13} /> End Session
            </button>

            <div style={{
              display: "flex", alignItems: "center", gap: 6,
              background: "var(--accent-soft)", border: "1px solid var(--accent)",
              borderRadius: 100, padding: "4px 12px",
              fontSize: 12, fontWeight: 700, color: "var(--accent)",
            }}>
              <Brain size={13} /> SMART STUDY
            </div>
          </div>

          {/* Running stats bar */}
          <div style={{
            display: "flex", justifyContent: "center", gap: 16,
            marginBottom: 20, padding: "10px 16px",
            background: "var(--surface-raised)", borderRadius: 14,
            border: "1px solid var(--border)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 13, fontWeight: 600 }}>
              <CheckCircle2 size={14} style={{ color: "var(--success)" }} />
              <span style={{ color: "var(--ink-light)" }}>{correctCount}/{totalCount}</span>
            </div>
            <div style={{ width: 1, height: 16, background: "var(--border)" }} />
            <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 13, fontWeight: 600 }}>
              <TrendingUp size={14} style={{ color: streak >= 3 ? "var(--success)" : "var(--ink-muted)" }} />
              <span style={{ color: streak >= 3 ? "var(--success)" : "var(--ink-light)" }}>{streak} streak</span>
            </div>
            <div style={{ width: 1, height: 16, background: "var(--border)" }} />
            <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 13, fontWeight: 600 }}>
              <Clock size={14} style={{ color: "var(--ink-muted)" }} />
              <span style={{ color: "var(--ink-light)" }}>{fmtTime(elapsedSec)}</span>
            </div>
          </div>

          {/* Question card */}
          <div
            key={currentQ.id}
            style={{
              background: "var(--surface-raised)", borderRadius: 22,
              border: "1.5px solid var(--border)",
              padding: is4k ? 36 : bp === "mobile" ? 20 : 28,
              marginBottom: 14, position: "relative",
              animation: "ssCardIn 0.35s cubic-bezier(0.22,1,0.36,1) both",
            }}
          >
            {/* Difficulty + mastery badges */}
            <div style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              marginBottom: 16,
            }}>
              <span style={{
                fontSize: 11, fontWeight: 700,
                padding: "3px 10px", borderRadius: 100,
                background: difficulty === 0
                  ? "var(--success-soft)"
                  : difficulty === 1
                    ? "var(--warm-soft)"
                    : "var(--danger-soft)",
                color: DIFFICULTY_COLORS[difficulty],
                border: `1px solid ${DIFFICULTY_COLORS[difficulty]}`,
              }}>
                {DIFFICULTY_LABELS[difficulty]}
              </span>

              <div style={{
                display: "flex", alignItems: "center", gap: 6,
                fontSize: 11, fontWeight: 600, color: MASTERY_COLORS[masteryLevel],
              }}>
                <div style={{
                  width: 8, height: 8, borderRadius: "50%",
                  background: MASTERY_COLORS[masteryLevel],
                }} />
                {MASTERY_LABELS[masteryLevel]}
              </div>
            </div>

            <h2 style={{
              fontFamily: "var(--font-heading)", fontWeight: 700,
              fontSize: is4k ? 22 : bp === "mobile" ? 17 : 19,
              lineHeight: 1.4, marginBottom: 24, color: "var(--ink)",
            }}>
              {currentQ.question}
            </h2>

            <div style={{ display: "grid", gap: 10 }}>
              {currentQ.options.map((opt, i) => {
                let bg = "var(--surface-raised)";
                let border = "var(--border)";
                let ring = "none";
                let anim = "";

                if (showExp) {
                  if (i === currentQ.correct) {
                    bg = "var(--success-soft)"; border = "var(--success)";
                    ring = "0 0 0 2px var(--success)"; anim = "correctPop 0.35s ease-out";
                  } else if (i === selected) {
                    bg = "var(--danger-soft)"; border = "var(--danger)";
                    ring = "0 0 0 2px var(--danger)"; anim = "wrongShake 0.4s ease-out";
                  } else {
                    bg = "var(--surface-sunken)"; border = "var(--border-light)";
                  }
                }

                return (
                  <button
                    key={i}
                    onClick={() => pick(i)}
                    disabled={showExp}
                    className={!showExp ? "hover-option" : undefined}
                    style={{
                      width: "100%", textAlign: "left",
                      padding: is4k ? "18px 20px" : "15px 16px",
                      borderRadius: 14, border: `1.5px solid ${border}`,
                      background: bg, cursor: showExp ? "default" : "pointer",
                      display: "flex", alignItems: "start", gap: 12,
                      transition: "all 0.25s cubic-bezier(0.22,1,0.36,1)",
                      boxShadow: ring !== "none" ? ring : "none",
                      opacity: showExp && i !== currentQ.correct && i !== selected ? 0.35 : 1,
                      fontFamily: "var(--font-body)",
                      animation: anim || "none",
                    }}
                  >
                    <span style={{
                      width: 28, height: 28, borderRadius: 9, flexShrink: 0,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 12, fontWeight: 700, marginTop: 1,
                      background: showExp && i === currentQ.correct ? "var(--success)" : showExp && i === selected ? "var(--danger)" : "var(--surface-sunken)",
                      color: (showExp && (i === currentQ.correct || i === selected)) ? "white" : "var(--ink-light)",
                    }}>
                      {showExp && i === currentQ.correct ? <CheckCircle2 size={14} /> : showExp && i === selected ? <XCircle size={14} /> : String.fromCharCode(65 + i)}
                    </span>
                    <span style={{
                      fontSize: is4k ? 16 : 14,
                      color: showExp && i !== currentQ.correct && i !== selected ? "var(--ink-muted)" : "var(--ink)",
                      lineHeight: 1.55,
                    }}>{opt}</span>
                  </button>
                );
              })}
            </div>

            {/* Keyboard hint */}
            {!showExp && isDesktop && (
              <div style={{ marginTop: 12, textAlign: "center", fontSize: 11, color: "var(--ink-muted)" }}>
                Press 1-{currentQ.options.length} to select
              </div>
            )}
          </div>

          {/* Explanation */}
          {showExp && (
            <div className="anim-fade-up" style={{
              background: "var(--accent-soft)", borderRadius: 18,
              border: "1px solid var(--accent)", borderLeft: "3px solid var(--accent)",
              padding: is4k ? 24 : 18, marginBottom: 14,
            }}>
              <div style={{ display: "flex", gap: 10, alignItems: "start" }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 10, flexShrink: 0,
                  background: "var(--surface-raised)", border: "1px solid var(--border)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Brain size={16} style={{ color: "var(--accent)" }} />
                </div>
                <div>
                  <h4 style={{ fontWeight: 600, fontSize: 13, marginBottom: 4, color: "var(--accent)" }}>Why this answer?</h4>
                  <p style={{ fontSize: is4k ? 15 : 14, color: "var(--ink-light)", lineHeight: 1.6 }}>{currentQ.explanation}</p>
                </div>
              </div>
            </div>
          )}

          {/* Next button */}
          {showExp && (
            <button onClick={next} className="anim-fade-up" style={{
              width: "100%", padding: "16px", borderRadius: 14,
              border: "none", cursor: "pointer",
              background: "var(--accent)", color: "#fff",
              fontFamily: "var(--font-body)", fontSize: 15, fontWeight: 600,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              boxShadow: "0 4px 16px rgba(37,99,235,0.25)",
            }}>
              Next Question <ArrowRight size={16} />
              {isDesktop && <span style={{ fontSize: 12, opacity: 0.7, marginLeft: 8 }}>Enter</span>}
            </button>
          )}
        </div>
      </div>
    </>
  );
};

export default SmartStudy;
