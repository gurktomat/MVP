import { useState, useEffect, useCallback, useRef } from "react";
import { Heart, Zap, Timer, XCircle, CheckCircle2, ArrowRight, RotateCcw } from "lucide-react";
import { questionBank, testCategories } from "../data/questions.js";

/* -----------------------------------------------
   Constants
   ----------------------------------------------- */
const MAX_QUESTIONS = 20;
const TIME_PER_Q = 15;
const LIVES_TOTAL = 3;
const XP_PER_CORRECT = 5;
const SURVIVAL_BONUS = 100;
const FLASH_DURATION = 500; // ms

/* -----------------------------------------------
   Circular timer ring
   ----------------------------------------------- */
const TimerRing = ({ timeLeft, total, pulsing }) => {
  const size = 56;
  const stroke = 4;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - timeLeft / total);

  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke="var(--border)" strokeWidth={stroke} opacity={0.3} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={timeLeft <= 5 ? "var(--danger)" : "var(--accent)"}
          strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.3s linear, stroke 0.3s" }}
        />
      </svg>
      <div style={{
        position: "absolute", inset: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "var(--font-heading)", fontWeight: 800,
        fontSize: 18,
        color: timeLeft <= 5 ? "var(--danger)" : "var(--ink)",
        animation: pulsing ? "qfPulse 0.6s ease-in-out infinite" : "none",
      }}>
        {timeLeft}
      </div>
    </div>
  );
};

/* -----------------------------------------------
   QuickFire Component
   ----------------------------------------------- */
const QuickFire = ({ testId, onNavigate, onComplete, bp, gameState }) => {
  const testInfo = testCategories.flatMap((c) => c.tests).find((t) => t.id === testId);
  const allQuestions = questionBank[testId] || questionBank["car-permit"] || [];

  const [questions] = useState(() => {
    const shuffled = [...allQuestions].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, MAX_QUESTIONS);
  });

  const [currentQ, setCurrentQ] = useState(0);
  const [lives, setLives] = useState(LIVES_TOTAL);
  const [timeLeft, setTimeLeft] = useState(TIME_PER_Q);
  const [correct, setCorrect] = useState(0);
  const [total, setTotal] = useState(0);
  const [flash, setFlash] = useState(null); // "correct" | "wrong" | null
  const [gameOver, setGameOver] = useState(false);
  const [survived, setSurvived] = useState(false);
  const timerRef = useRef(null);
  const flashTimeoutRef = useRef(null);

  const is4k = bp === "4k";
  const isDesktop = bp === "desktop" || is4k;

  // Reset timer on new question
  useEffect(() => {
    if (gameOver || flash) return;
    setTimeLeft(TIME_PER_Q);

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          // Time's up - wrong answer
          handleTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [currentQ, gameOver]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleTimeout = useCallback(() => {
    clearInterval(timerRef.current);
    const newLives = lives - 1;
    setLives(newLives);
    setTotal((p) => p + 1);
    setFlash("wrong");

    flashTimeoutRef.current = setTimeout(() => {
      setFlash(null);
      if (newLives <= 0) {
        setGameOver(true);
      } else if (currentQ + 1 >= questions.length) {
        setSurvived(true);
        setGameOver(true);
      } else {
        setCurrentQ((p) => p + 1);
      }
    }, FLASH_DURATION);
  }, [lives, currentQ, questions.length]);

  const pick = useCallback((idx) => {
    if (flash || gameOver) return;
    clearInterval(timerRef.current);

    const isCorrect = idx === questions[currentQ].correct;
    setTotal((p) => p + 1);

    if (isCorrect) {
      setCorrect((p) => p + 1);
      setFlash("correct");
    } else {
      const newLives = lives - 1;
      setLives(newLives);
      setFlash("wrong");
    }

    flashTimeoutRef.current = setTimeout(() => {
      setFlash(null);
      const newLives = isCorrect ? lives : lives - 1;
      if (!isCorrect && newLives <= 0) {
        setGameOver(true);
      } else if (currentQ + 1 >= questions.length) {
        setSurvived(true);
        setGameOver(true);
      } else {
        setCurrentQ((p) => p + 1);
      }
    }, FLASH_DURATION);
  }, [flash, gameOver, currentQ, questions, lives]);

  // Keyboard support (1-4)
  useEffect(() => {
    const handler = (e) => {
      if (gameOver || flash) return;
      const num = parseInt(e.key);
      if (num >= 1 && num <= 4 && num <= questions[currentQ]?.options?.length) {
        pick(num - 1);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [gameOver, flash, currentQ, pick, questions]);

  // Cleanup
  useEffect(() => {
    return () => {
      clearInterval(timerRef.current);
      clearTimeout(flashTimeoutRef.current);
    };
  }, []);

  // Complete callback
  useEffect(() => {
    if (gameOver && onComplete) {
      const xp = correct * XP_PER_CORRECT + (survived ? SURVIVAL_BONUS : 0);
      onComplete(testId, {
        score: total > 0 ? Math.round((correct / total) * 100) : 0,
        correct,
        total,
        survived,
        livesRemaining: lives,
        xpEarned: xp,
        mode: "quickfire",
      });
    }
  }, [gameOver]); // eslint-disable-line react-hooks/exhaustive-deps

  const restart = () => {
    setCurrentQ(0);
    setLives(LIVES_TOTAL);
    setCorrect(0);
    setTotal(0);
    setFlash(null);
    setGameOver(false);
    setSurvived(false);
    setTimeLeft(TIME_PER_Q);
  };

  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
  const totalXp = correct * XP_PER_CORRECT + (survived ? SURVIVAL_BONUS : 0);

  /* -----------------------------------------------
     Game Over screen
     ----------------------------------------------- */
  if (gameOver) {
    return (
      <>
        <style>{`
          @keyframes qfGameOverIn {
            from { opacity: 0; transform: scale(0.92); }
            to   { opacity: 1; transform: scale(1); }
          }
        `}</style>
        <div style={{
          minHeight: "100vh",
          background: "var(--surface-sunken)",
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: bp === "mobile" ? 16 : 32,
        }}>
          <div style={{
            maxWidth: is4k ? 560 : 480, width: "100%",
            background: "var(--surface-raised)", borderRadius: 24,
            border: "1.5px solid var(--border)", overflow: "hidden",
            boxShadow: "var(--shadow-lg)",
            animation: "qfGameOverIn 0.5s cubic-bezier(0.22,1,0.36,1) both",
          }}>
            {/* Header */}
            <div style={{
              padding: is4k ? 48 : 40, textAlign: "center",
              background: survived ? "var(--success-soft)" : "var(--danger-soft)",
            }}>
              {survived ? (
                <Zap size={52} style={{ color: "var(--success)", marginBottom: 12 }} />
              ) : (
                <XCircle size={52} style={{ color: "var(--danger)", marginBottom: 12 }} />
              )}
              <h2 style={{
                fontFamily: "var(--font-heading)", fontWeight: 800,
                fontSize: is4k ? 30 : 26, marginBottom: 6,
              }}>
                {survived ? "You Survived!" : "Game Over"}
              </h2>
              <p style={{ fontSize: 14, color: "var(--ink-light)" }}>
                {survived ? "All 20 questions conquered!" : `You lost all ${LIVES_TOTAL} lives`}
              </p>
            </div>

            {/* Stats */}
            <div style={{ padding: is4k ? 32 : 24 }}>
              <div style={{
                display: "grid", gridTemplateColumns: "repeat(3, 1fr)",
                gap: 12, marginBottom: 20,
              }}>
                {[
                  { label: "Survived", value: `${total}/${MAX_QUESTIONS}`, color: "var(--accent)" },
                  { label: "Accuracy", value: `${accuracy}%`, color: "var(--success)" },
                  { label: "Lives Left", value: lives, color: lives > 0 ? "var(--danger)" : "var(--ink-muted)" },
                ].map((s, i) => (
                  <div key={i} style={{
                    textAlign: "center", padding: 16,
                    background: "var(--surface-sunken)", borderRadius: 14,
                  }}>
                    <div style={{
                      fontSize: is4k ? 28 : 24, fontWeight: 700,
                      fontFamily: "var(--font-heading)", color: s.color,
                    }}>{s.value}</div>
                    <div style={{ fontSize: 12, color: "var(--ink-muted)", marginTop: 2 }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* XP */}
              <div style={{
                background: "var(--xp-violet-soft)", borderRadius: 14,
                padding: 16, marginBottom: 20,
                border: "1px solid var(--xp-violet)",
              }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--xp-violet)", marginBottom: 6 }}>XP Earned</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 6 }}>
                  <span style={{
                    fontSize: 12, background: "var(--surface-raised)",
                    padding: "4px 10px", borderRadius: 8,
                    color: "var(--ink-light)", display: "inline-flex", alignItems: "center", gap: 4,
                  }}>
                    <CheckCircle2 size={12} /> Correct: +{correct * XP_PER_CORRECT}
                  </span>
                  {survived && (
                    <span style={{
                      fontSize: 12, background: "var(--surface-raised)",
                      padding: "4px 10px", borderRadius: 8,
                      color: "var(--ink-light)", display: "inline-flex", alignItems: "center", gap: 4,
                    }}>
                      <Zap size={12} /> Survival: +{SURVIVAL_BONUS}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 18, fontWeight: 800, color: "var(--xp-violet)" }}>Total: +{totalXp} XP</div>
              </div>

              {/* Buttons */}
              <div style={{ display: "flex", gap: 12, flexDirection: bp === "mobile" ? "column" : "row" }}>
                <button onClick={restart} style={{
                  flex: 1, padding: "15px 24px", borderRadius: 14,
                  border: "none", cursor: "pointer",
                  background: "var(--gradient-accent)", color: "#fff",
                  fontFamily: "var(--font-body)", fontSize: 15, fontWeight: 600,
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  boxShadow: "0 4px 16px rgba(37,99,235,0.25)",
                }}>
                  <RotateCcw size={16} /> Try Again
                </button>
                <button onClick={() => onNavigate("categories")} style={{
                  flex: 1, padding: "15px 24px", borderRadius: 14,
                  cursor: "pointer",
                  background: "var(--surface-sunken)", color: "var(--ink)",
                  fontFamily: "var(--font-body)", fontSize: 15, fontWeight: 600,
                  border: "1.5px solid var(--border)",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                }}>
                  <ArrowRight size={16} /> Other Tests
                </button>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  /* -----------------------------------------------
     Active quiz
     ----------------------------------------------- */
  const q = questions[currentQ];
  if (!q) return null;

  const flashBg = flash === "correct"
    ? "rgba(34,197,94,0.12)"
    : flash === "wrong"
      ? "rgba(239,68,68,0.12)"
      : "transparent";

  return (
    <>
      <style>{`
        @keyframes qfPulse {
          0%, 100% { transform: scale(1); }
          50%      { transform: scale(1.12); }
        }
        @keyframes qfFlashCorrect {
          0%   { background: rgba(34,197,94,0.25); }
          100% { background: transparent; }
        }
        @keyframes qfFlashWrong {
          0%   { background: rgba(239,68,68,0.25); }
          100% { background: transparent; }
        }
        @keyframes qfCardIn {
          from { opacity: 0; transform: translateX(20px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>

      <div style={{
        minHeight: "100vh",
        background: "var(--surface-sunken)",
        transition: "background 0.3s",
        ...(flash ? { background: flashBg } : {}),
      }}>
        <div style={{
          maxWidth: is4k ? 720 : 600, margin: "0 auto",
          padding: isDesktop ? "32px 32px" : "16px 16px 100px",
        }}>
          {/* Top bar */}
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            marginBottom: 20,
          }}>
            {/* Exit */}
            <button onClick={() => onNavigate("categories")} style={{
              background: "none", border: "none", cursor: "pointer",
              fontSize: 14, color: "var(--ink-muted)", fontFamily: "var(--font-body)",
              display: "flex", alignItems: "center", gap: 4,
            }}>
              <XCircle size={16} /> Exit
            </button>

            {/* Mode badge */}
            <div style={{
              display: "flex", alignItems: "center", gap: 6,
              background: "var(--danger-soft)", border: "1px solid var(--danger)",
              borderRadius: 100, padding: "4px 12px",
              fontSize: 12, fontWeight: 700, color: "var(--danger)",
            }}>
              <Zap size={13} /> QUICK FIRE
            </div>

            {/* Lives */}
            <div style={{ display: "flex", gap: 4 }}>
              {Array.from({ length: LIVES_TOTAL }).map((_, i) => (
                <Heart
                  key={i}
                  size={22}
                  fill={i < lives ? "var(--danger)" : "none"}
                  style={{
                    color: i < lives ? "var(--danger)" : "var(--border)",
                    transition: "all 0.3s",
                  }}
                />
              ))}
            </div>
          </div>

          {/* Progress */}
          <div style={{
            display: "flex", alignItems: "center", gap: 12, marginBottom: 20,
          }}>
            <span style={{
              fontSize: 14, fontWeight: 600, color: "var(--ink-light)",
              fontFamily: "var(--font-body)",
            }}>
              {currentQ + 1}/{questions.length}
            </span>
            <div style={{
              flex: 1, height: 5, background: "var(--border)",
              borderRadius: 4, overflow: "hidden",
            }}>
              <div style={{
                height: "100%",
                width: `${((currentQ + 1) / questions.length) * 100}%`,
                background: "var(--gradient-accent)", borderRadius: 4,
                transition: "width 0.4s cubic-bezier(0.22,1,0.36,1)",
              }} />
            </div>
            <TimerRing timeLeft={timeLeft} total={TIME_PER_Q} pulsing={timeLeft <= 5} />
          </div>

          {/* Question card */}
          <div
            key={currentQ}
            style={{
              background: "var(--surface-raised)", borderRadius: 22,
              border: flash === "correct"
                ? "2px solid var(--success)"
                : flash === "wrong"
                  ? "2px solid var(--danger)"
                  : "1.5px solid var(--border)",
              padding: is4k ? 36 : bp === "mobile" ? 20 : 28,
              boxShadow: "var(--shadow-md)",
              animation: "qfCardIn 0.3s cubic-bezier(0.22,1,0.36,1) both",
              transition: "border-color 0.2s",
            }}
          >
            <h2 style={{
              fontFamily: "var(--font-heading)", fontWeight: 700,
              fontSize: is4k ? 22 : bp === "mobile" ? 18 : 20,
              lineHeight: 1.4, marginBottom: 24, color: "var(--ink)",
            }}>
              {q.question}
            </h2>

            <div style={{ display: "grid", gap: 10 }}>
              {q.options.map((opt, i) => {
                let optBg = "var(--surface-raised)";
                let optBorder = "var(--border)";
                let optColor = "var(--ink)";

                if (flash === "correct" && i === q.correct) {
                  optBg = "var(--success-soft)";
                  optBorder = "var(--success)";
                } else if (flash === "wrong" && i === q.correct) {
                  optBg = "var(--success-soft)";
                  optBorder = "var(--success)";
                }

                return (
                  <button
                    key={i}
                    onClick={() => pick(i)}
                    disabled={!!flash}
                    style={{
                      width: "100%", textAlign: "left",
                      padding: is4k ? "18px 20px" : "15px 16px",
                      borderRadius: 14, border: `1.5px solid ${optBorder}`,
                      background: optBg, cursor: flash ? "default" : "pointer",
                      display: "flex", alignItems: "center", gap: 12,
                      transition: "all 0.2s",
                      fontFamily: "var(--font-body)",
                    }}
                  >
                    <span style={{
                      width: 28, height: 28, borderRadius: 9, flexShrink: 0,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 12, fontWeight: 700,
                      background: "var(--surface-sunken)",
                      color: "var(--ink-light)",
                    }}>
                      {String.fromCharCode(65 + i)}
                    </span>
                    <span style={{
                      fontSize: is4k ? 16 : 14, color: optColor, lineHeight: 1.55,
                    }}>{opt}</span>
                  </button>
                );
              })}
            </div>

            {/* Keyboard hint */}
            {isDesktop && !flash && (
              <div style={{
                marginTop: 12, textAlign: "center",
                fontSize: 11, color: "var(--ink-muted)",
              }}>
                Press 1-{q.options.length} to select
              </div>
            )}
          </div>

          {/* Score bar */}
          <div style={{
            marginTop: 16, display: "flex", justifyContent: "center", gap: 16,
            fontSize: 13, fontWeight: 600, color: "var(--ink-muted)",
          }}>
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <CheckCircle2 size={14} style={{ color: "var(--success)" }} /> {correct}
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <XCircle size={14} style={{ color: "var(--danger)" }} /> {total - correct}
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <Timer size={14} /> {currentQ + 1}/{questions.length}
            </span>
          </div>
        </div>
      </div>
    </>
  );
};

export default QuickFire;
