import { useState, useEffect, useMemo } from "react";
import { Brain, RefreshCw, CheckCircle2, XCircle, ArrowRight, Target } from "lucide-react";

/* -----------------------------------------------
   Constants
   ----------------------------------------------- */
const MASTERY_COLORS = ["var(--ink-muted)", "var(--warm)", "var(--accent)", "var(--success)"];
const MASTERY_LABELS = ["New", "Learning", "Familiar", "Mastered"];
const XP_PER_CORRECT = 10;

/* -----------------------------------------------
   WeakAreas Component
   ----------------------------------------------- */
const WeakAreas = ({ onNavigate, onComplete, bp, gameState, getWeakQuestions, recordAnswer }) => {
  const is4k = bp === "4k";
  const isDesktop = bp === "desktop" || is4k;

  // Pull weak questions once
  const [questions] = useState(() => {
    const weak = getWeakQuestions?.(15) || [];
    return weak;
  });

  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState(null);
  const [showExp, setShowExp] = useState(false);
  const [answers, setAnswers] = useState([]);
  const [done, setDone] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);

  // Keyboard support
  useEffect(() => {
    const handler = (e) => {
      if (done || questions.length === 0) return;
      const q = questions[currentQ];
      if (!q) return;
      if (!showExp && e.key >= "1" && e.key <= "4") {
        const idx = parseInt(e.key) - 1;
        if (idx < q.options.length) pick(idx);
      }
      if (showExp && (e.key === "Enter" || e.key === " ")) {
        e.preventDefault();
        next();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [currentQ, showExp, done, questions]); // eslint-disable-line react-hooks/exhaustive-deps

  const pick = (i) => {
    if (showExp) return;
    const q = questions[currentQ];
    setSelected(i);
    setShowExp(true);

    const isCorrect = i === q.correct;
    setAnswers([...answers, { qId: q.id, testId: q.testId, sel: i, cor: q.correct, isCorrect }]);

    if (isCorrect) {
      setXpEarned((p) => p + XP_PER_CORRECT);
    }

    // Record mastery
    if (recordAnswer) {
      recordAnswer(q.testId, q.id || q.questionId, isCorrect);
    }
  };

  const next = () => {
    if (currentQ < questions.length - 1) {
      setCurrentQ(currentQ + 1);
      setSelected(null);
      setShowExp(false);
    } else {
      setDone(true);
    }
  };

  // Notify completion
  useEffect(() => {
    if (done && onComplete) {
      const correctN = answers.filter((a) => a.isCorrect).length;
      onComplete(null, {
        score: answers.length > 0 ? Math.round((correctN / answers.length) * 100) : 0,
        correct: correctN,
        total: answers.length,
        xpEarned,
        mode: "weakareas",
      });
    }
  }, [done]); // eslint-disable-line react-hooks/exhaustive-deps

  /* -----------------------------------------------
     Empty state
     ----------------------------------------------- */
  if (questions.length === 0) {
    return (
      <div style={{
        minHeight: "100vh", background: "var(--surface)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: bp === "mobile" ? 24 : 40,
      }}>
        <div style={{
          textAlign: "center", maxWidth: 400,
          animation: "waFadeIn 0.5s ease both",
        }}>
          <div style={{
            width: 80, height: 80, borderRadius: 22,
            background: "var(--success-soft)", border: "1px solid var(--success)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 24px",
          }}>
            <Target size={36} style={{ color: "var(--success)" }} />
          </div>
          <h2 style={{
            fontFamily: "var(--font-heading)", fontWeight: 800,
            fontSize: is4k ? 28 : 24, marginBottom: 8,
          }}>
            No weak areas!
          </h2>
          <p style={{
            fontSize: 15, color: "var(--ink-muted)", marginBottom: 28,
            lineHeight: 1.6,
          }}>
            You're doing great. All your questions are in good shape. Keep practicing to maintain your mastery!
          </p>
          <button onClick={() => onNavigate("categories")} style={{
            padding: "14px 28px", borderRadius: 14,
            border: "none", cursor: "pointer",
            background: "var(--gradient-accent)", color: "#fff",
            fontFamily: "var(--font-body)", fontSize: 15, fontWeight: 600,
            display: "inline-flex", alignItems: "center", gap: 8,
            boxShadow: "0 4px 16px rgba(37,99,235,0.25)",
          }}>
            <ArrowRight size={16} /> Browse Tests
          </button>
        </div>
      </div>
    );
  }

  const correctN = answers.filter((a) => a.isCorrect).length;
  const accuracy = answers.length > 0 ? Math.round((correctN / answers.length) * 100) : 0;

  /* -----------------------------------------------
     Results screen
     ----------------------------------------------- */
  if (done) {
    return (
      <>
        <style>{`
          @keyframes waResultIn {
            from { opacity: 0; transform: scale(0.92); }
            to   { opacity: 1; transform: scale(1); }
          }
        `}</style>
        <div style={{
          minHeight: "100vh", background: "var(--surface)",
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: bp === "mobile" ? 16 : 32,
        }}>
          <div style={{
            maxWidth: is4k ? 560 : 480, width: "100%",
            background: "var(--surface-raised)", borderRadius: 24,
            border: "1.5px solid var(--border)", overflow: "hidden",
            boxShadow: "var(--shadow-lg)",
            animation: "waResultIn 0.5s cubic-bezier(0.22,1,0.36,1) both",
          }}>
            {/* Header */}
            <div style={{
              padding: is4k ? 48 : 40, textAlign: "center",
              background: "var(--accent-soft)",
            }}>
              <Brain size={44} style={{ color: "var(--accent)", marginBottom: 12 }} />
              <h2 style={{
                fontFamily: "var(--font-heading)", fontWeight: 800,
                fontSize: is4k ? 28 : 24, marginBottom: 6,
              }}>
                Review Complete
              </h2>
              <p style={{ fontSize: 14, color: "var(--ink-light)" }}>
                Weak areas reviewed
              </p>
            </div>

            <div style={{ padding: is4k ? 32 : 24 }}>
              {/* Stats */}
              <div style={{
                display: "grid", gridTemplateColumns: "repeat(3, 1fr)",
                gap: 12, marginBottom: 20,
              }}>
                {[
                  { label: "Reviewed", value: answers.length, color: "var(--accent)" },
                  { label: "Accuracy", value: `${accuracy}%`, color: "var(--success)" },
                  { label: "XP Earned", value: `+${xpEarned}`, color: "var(--xp-violet)" },
                ].map((s, i) => (
                  <div key={i} style={{
                    textAlign: "center", padding: 16,
                    background: "var(--surface-sunken)", borderRadius: 14,
                  }}>
                    <div style={{
                      fontSize: is4k ? 26 : 22, fontWeight: 700,
                      fontFamily: "var(--font-heading)", color: s.color,
                    }}>{s.value}</div>
                    <div style={{ fontSize: 12, color: "var(--ink-muted)", marginTop: 2 }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Mastery improvements note */}
              {correctN > 0 && (
                <div style={{
                  background: "var(--success-soft)", borderRadius: 14,
                  padding: 16, marginBottom: 20,
                  border: "1px solid var(--success)",
                }}>
                  <div style={{
                    display: "flex", alignItems: "center", gap: 8,
                    fontSize: 13, fontWeight: 600, color: "var(--success)",
                  }}>
                    <CheckCircle2 size={16} />
                    {correctN} question{correctN !== 1 ? "s" : ""} improved in mastery
                  </div>
                </div>
              )}

              {/* Buttons */}
              <div style={{
                display: "flex", gap: 12,
                flexDirection: bp === "mobile" ? "column" : "row",
              }}>
                <button onClick={() => {
                  // Restart with fresh weak questions
                  window.location.reload();
                }} style={{
                  flex: 1, padding: "15px 24px", borderRadius: 14,
                  border: "none", cursor: "pointer",
                  background: "var(--gradient-accent)", color: "#fff",
                  fontFamily: "var(--font-body)", fontSize: 15, fontWeight: 600,
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  boxShadow: "0 4px 16px rgba(37,99,235,0.25)",
                }}>
                  <RefreshCw size={16} /> Continue Reviewing
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
      </>
    );
  }

  /* -----------------------------------------------
     Active quiz
     ----------------------------------------------- */
  const q = questions[currentQ];
  if (!q) return null;

  const masteryLevel = q.masteryLevel ?? 0;

  return (
    <>
      <style>{`
        @keyframes waFadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes waCardIn {
          from { opacity: 0; transform: translateY(8px); }
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
          {/* Top bar */}
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            marginBottom: 16,
          }}>
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
              background: "var(--warm-soft)", border: "1px solid var(--warm)",
              borderRadius: 100, padding: "4px 12px",
              fontSize: 12, fontWeight: 700, color: "var(--warm)",
            }}>
              <Brain size={13} /> WEAK AREAS REVIEW
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {xpEarned > 0 && (
                <span style={{
                  fontSize: 12, fontWeight: 600, color: "var(--xp-violet)",
                  background: "var(--xp-violet-soft)", padding: "3px 8px",
                  borderRadius: 8,
                }}>+{xpEarned} XP</span>
              )}
              <span style={{ fontSize: 14, fontWeight: 600, color: "var(--ink-light)" }}>
                {currentQ + 1}/{questions.length}
              </span>
            </div>
          </div>

          {/* Progress bar */}
          <div style={{
            width: "100%", height: 5, background: "var(--surface-sunken)",
            borderRadius: 4, marginBottom: 20, overflow: "hidden",
          }}>
            <div style={{
              height: "100%",
              width: `${((currentQ + (showExp ? 1 : 0)) / questions.length) * 100}%`,
              background: "var(--gradient-accent)", borderRadius: 4,
              transition: "width 0.4s cubic-bezier(0.22,1,0.36,1)",
            }} />
          </div>

          {/* Question card */}
          <div
            key={currentQ}
            style={{
              background: "var(--surface-raised)", borderRadius: 22,
              border: "1.5px solid var(--border)",
              padding: is4k ? 36 : bp === "mobile" ? 20 : 28,
              marginBottom: 14, position: "relative",
              animation: "waCardIn 0.35s cubic-bezier(0.22,1,0.36,1) both",
            }}
          >
            {/* Mastery level dot */}
            <div style={{
              display: "flex", alignItems: "center", gap: 6,
              marginBottom: 16, fontSize: 11, fontWeight: 600,
              color: MASTERY_COLORS[masteryLevel],
            }}>
              <div style={{
                width: 8, height: 8, borderRadius: "50%",
                background: MASTERY_COLORS[masteryLevel],
              }} />
              {MASTERY_LABELS[masteryLevel]}
              {q.testId && (
                <span style={{
                  marginLeft: "auto", fontSize: 11,
                  color: "var(--ink-muted)", fontWeight: 500,
                }}>
                  {q.testId}
                </span>
              )}
            </div>

            <h2 style={{
              fontFamily: "var(--font-heading)", fontWeight: 700,
              fontSize: is4k ? 22 : bp === "mobile" ? 17 : 19,
              lineHeight: 1.4, marginBottom: 24, color: "var(--ink)",
            }}>
              {q.question}
            </h2>

            <div style={{ display: "grid", gap: 10 }}>
              {q.options.map((opt, i) => {
                let bg = "var(--surface-raised)";
                let border = "var(--border)";
                let ring = "none";
                let anim = "";

                if (showExp) {
                  if (i === q.correct) {
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
                      opacity: showExp && i !== q.correct && i !== selected ? 0.35 : 1,
                      fontFamily: "var(--font-body)",
                      animation: anim || "none",
                    }}
                  >
                    <span style={{
                      width: 28, height: 28, borderRadius: 9, flexShrink: 0,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 12, fontWeight: 700, marginTop: 1,
                      background: showExp && i === q.correct ? "var(--success)" : showExp && i === selected ? "var(--danger)" : "var(--surface-sunken)",
                      color: (showExp && (i === q.correct || i === selected)) ? "white" : "var(--ink-light)",
                    }}>
                      {showExp && i === q.correct ? <CheckCircle2 size={14} /> : showExp && i === selected ? <XCircle size={14} /> : String.fromCharCode(65 + i)}
                    </span>
                    <span style={{
                      fontSize: is4k ? 16 : 14,
                      color: showExp && i !== q.correct && i !== selected ? "var(--ink-muted)" : "var(--ink)",
                      lineHeight: 1.55,
                    }}>{opt}</span>
                  </button>
                );
              })}
            </div>

            {/* Keyboard hint */}
            {!showExp && isDesktop && (
              <div style={{ marginTop: 12, textAlign: "center", fontSize: 11, color: "var(--ink-muted)" }}>
                Press 1-{q.options.length} to select
              </div>
            )}
          </div>

          {/* Explanation */}
          {showExp && q.explanation && (
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
                  <p style={{ fontSize: is4k ? 15 : 14, color: "var(--ink-light)", lineHeight: 1.6 }}>{q.explanation}</p>
                </div>
              </div>
            </div>
          )}

          {/* Next button */}
          {showExp && (
            <button onClick={next} className="anim-fade-up" style={{
              width: "100%", padding: "16px", borderRadius: 14,
              border: "none", cursor: "pointer",
              background: currentQ < questions.length - 1 ? "var(--ink)" : "var(--gradient-accent)",
              color: "white", fontFamily: "var(--font-body)", fontSize: 15, fontWeight: 600,
              boxShadow: currentQ >= questions.length - 1 ? "0 4px 20px var(--accent-glow)" : "none",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            }}>
              {currentQ < questions.length - 1 ? "Next Question" : "See Results"}
              <ArrowRight size={16} />
              {isDesktop && <span style={{ fontSize: 12, opacity: 0.7, marginLeft: 8 }}>Enter</span>}
            </button>
          )}
        </div>
      </div>
    </>
  );
};

export default WeakAreas;
