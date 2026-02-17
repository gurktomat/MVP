import { useState, useEffect, useMemo } from "react";
import { ChevronRight, Calendar, BookOpen, Target, ArrowRight, CheckCircle2 } from "lucide-react";
import { questionBank } from "../data/questions.js";

/* -----------------------------------------------
   Category icons (inline SVG-style Lucide map)
   ----------------------------------------------- */
const CAT_ICON_MAP = {
  driving: BookOpen,
  citizenship: Target,
  "real-estate": BookOpen,
  "food-handler": BookOpen,
  osha: Target,
  cpr: Target,
  notary: BookOpen,
};

/* -----------------------------------------------
   Step indicator dots
   ----------------------------------------------- */
const StepDots = ({ current, total }) => (
  <div style={{
    display: "flex", gap: 8, justifyContent: "center", marginBottom: 32,
  }}>
    {Array.from({ length: total }).map((_, i) => (
      <div
        key={i}
        style={{
          width: i === current ? 24 : 10,
          height: 10,
          borderRadius: 5,
          background: i === current
            ? "var(--accent)"
            : i < current
              ? "var(--success)"
              : "var(--border)",
          transition: "all 0.4s cubic-bezier(0.22,1,0.36,1)",
        }}
      />
    ))}
  </div>
);

/* -----------------------------------------------
   Step 1: Category Selection
   ----------------------------------------------- */
const StepCategory = ({ testCategories, onSelect, bp }) => {
  const is4k = bp === "4k";
  const isDesktop = bp === "desktop" || is4k;

  return (
    <div style={{ animation: "obFadeIn 0.5s ease both" }}>
      <h1 style={{
        fontFamily: "var(--font-heading)", fontWeight: 800,
        fontSize: is4k ? 32 : isDesktop ? 28 : 24,
        textAlign: "center", marginBottom: 8,
      }}>
        What test are you preparing for?
      </h1>
      <p style={{
        textAlign: "center", fontSize: 15,
        color: "var(--ink-muted)", marginBottom: 32,
      }}>
        Choose a category to get started
      </p>

      <div style={{
        display: "grid",
        gridTemplateColumns: isDesktop ? "repeat(3, 1fr)" : bp === "tablet" ? "repeat(2, 1fr)" : "1fr",
        gap: 14,
      }}>
        {testCategories.map((cat) => {
          const CatIcon = CAT_ICON_MAP[cat.id] || BookOpen;
          return (
            <button
              key={cat.id}
              onClick={() => onSelect(cat)}
              className="hover-glow"
              style={{
                padding: 20, borderRadius: 18,
                background: "var(--surface-raised)",
                border: "1.5px solid var(--border)",
                cursor: "pointer",
                display: "flex", flexDirection: "column",
                alignItems: "center", gap: 10,
                transition: "all 0.3s cubic-bezier(0.22,1,0.36,1)",
                textAlign: "center",
              }}
            >
              <div style={{
                width: 48, height: 48, borderRadius: 14,
                background: `${cat.accent}15`,
                border: `1px solid ${cat.accent}40`,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <CatIcon size={24} style={{ color: cat.accent }} />
              </div>
              <div>
                <div style={{
                  fontFamily: "var(--font-heading)", fontWeight: 700,
                  fontSize: 15, color: "var(--ink)", marginBottom: 2,
                }}>
                  {cat.name}
                </div>
                <div style={{ fontSize: 12, color: "var(--ink-muted)" }}>
                  {cat.description}
                </div>
              </div>
              <ChevronRight size={16} style={{ color: "var(--ink-muted)" }} />
            </button>
          );
        })}
      </div>
    </div>
  );
};

/* -----------------------------------------------
   Step 2: Date Picker
   ----------------------------------------------- */
const StepDate = ({ onSelect, onSkip, bp }) => {
  const [date, setDate] = useState("");
  const is4k = bp === "4k";
  const isDesktop = bp === "desktop" || is4k;

  // Minimum date = tomorrow
  const minDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  }, []);

  return (
    <div style={{ animation: "obFadeIn 0.5s ease both", maxWidth: 440, margin: "0 auto" }}>
      <div style={{
        width: 64, height: 64, borderRadius: 18,
        background: "var(--accent-soft)", border: "1px solid var(--accent)",
        display: "flex", alignItems: "center", justifyContent: "center",
        margin: "0 auto 24px",
      }}>
        <Calendar size={30} style={{ color: "var(--accent)" }} />
      </div>

      <h1 style={{
        fontFamily: "var(--font-heading)", fontWeight: 800,
        fontSize: is4k ? 32 : isDesktop ? 28 : 24,
        textAlign: "center", marginBottom: 8,
      }}>
        When is your test?
      </h1>
      <p style={{
        textAlign: "center", fontSize: 15,
        color: "var(--ink-muted)", marginBottom: 32,
      }}>
        We'll create a study plan tailored to your deadline
      </p>

      <div style={{ marginBottom: 24 }}>
        <input
          type="date"
          value={date}
          min={minDate}
          onChange={(e) => setDate(e.target.value)}
          style={{
            width: "100%", padding: "16px 18px", borderRadius: 14,
            border: "1.5px solid var(--border)",
            background: "var(--surface-raised)", color: "var(--ink)",
            fontFamily: "var(--font-body)", fontSize: 16,
            outline: "none", transition: "border-color 0.2s",
          }}
          onFocus={(e) => e.target.style.borderColor = "var(--accent)"}
          onBlur={(e) => e.target.style.borderColor = "var(--border)"}
        />
      </div>

      <button
        onClick={() => onSelect(date)}
        disabled={!date}
        style={{
          width: "100%", padding: "16px", borderRadius: 14,
          border: "none", cursor: date ? "pointer" : "default",
          background: date ? "var(--gradient-accent)" : "var(--surface-sunken)",
          color: date ? "#fff" : "var(--ink-muted)",
          fontFamily: "var(--font-body)", fontSize: 16, fontWeight: 600,
          transition: "all 0.3s",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          boxShadow: date ? "0 4px 16px rgba(37,99,235,0.25)" : "none",
          marginBottom: 14,
        }}
      >
        Continue <ArrowRight size={16} />
      </button>

      <button onClick={onSkip} style={{
        width: "100%", padding: "14px", borderRadius: 14,
        background: "none", border: "1.5px solid var(--border)",
        color: "var(--ink-muted)", fontFamily: "var(--font-body)",
        fontSize: 14, fontWeight: 500, cursor: "pointer",
      }}>
        I'm just exploring
      </button>
    </div>
  );
};

/* -----------------------------------------------
   Step 3: Diagnostic Mini Quiz
   ----------------------------------------------- */
const StepDiagnostic = ({ category, onComplete, bp }) => {
  const is4k = bp === "4k";
  const isDesktop = bp === "desktop" || is4k;

  // Pull 5 random questions from the first test in the category
  const testId = category.tests[0]?.id;
  const [questions] = useState(() => {
    const bank = questionBank[testId] || [];
    const shuffled = [...bank].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 5);
  });

  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [answers, setAnswers] = useState([]);
  const [done, setDone] = useState(false);

  const pick = (i) => {
    if (showResult) return;
    setSelected(i);
    setShowResult(true);
    setAnswers([...answers, { sel: i, cor: questions[currentQ].correct }]);
  };

  const next = () => {
    if (currentQ < questions.length - 1) {
      setCurrentQ(currentQ + 1);
      setSelected(null);
      setShowResult(false);
    } else {
      setDone(true);
    }
  };

  useEffect(() => {
    if (done) {
      const correctN = answers.filter((a) => a.sel === a.cor).length;
      const score = questions.length > 0 ? Math.round((correctN / questions.length) * 100) : 0;
      // Short delay so user sees the last result
      setTimeout(() => onComplete(score), 800);
    }
  }, [done]); // eslint-disable-line react-hooks/exhaustive-deps

  if (questions.length === 0) {
    // No questions available, skip diagnostic
    useEffect(() => { onComplete(0); }, []); // eslint-disable-line react-hooks/exhaustive-deps
    return null;
  }

  const q = questions[currentQ];

  return (
    <div style={{ animation: "obFadeIn 0.5s ease both", maxWidth: 560, margin: "0 auto" }}>
      <div style={{
        width: 64, height: 64, borderRadius: 18,
        background: "var(--success-soft)", border: "1px solid var(--success)",
        display: "flex", alignItems: "center", justifyContent: "center",
        margin: "0 auto 24px",
      }}>
        <Target size={30} style={{ color: "var(--success)" }} />
      </div>

      <h1 style={{
        fontFamily: "var(--font-heading)", fontWeight: 800,
        fontSize: is4k ? 28 : isDesktop ? 24 : 22,
        textAlign: "center", marginBottom: 8,
      }}>
        Let's see where you stand!
      </h1>
      <p style={{
        textAlign: "center", fontSize: 14,
        color: "var(--ink-muted)", marginBottom: 24,
      }}>
        Quick 5-question diagnostic from {category.name}
      </p>

      {/* Progress */}
      <div style={{
        display: "flex", alignItems: "center", gap: 8, marginBottom: 20,
      }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ink-light)" }}>
          {currentQ + 1}/{questions.length}
        </span>
        <div style={{
          flex: 1, height: 5, background: "var(--surface-sunken)",
          borderRadius: 4, overflow: "hidden",
        }}>
          <div style={{
            height: "100%",
            width: `${((currentQ + (showResult ? 1 : 0)) / questions.length) * 100}%`,
            background: "var(--gradient-accent)", borderRadius: 4,
            transition: "width 0.4s cubic-bezier(0.22,1,0.36,1)",
          }} />
        </div>
      </div>

      {/* Question card */}
      <div style={{
        background: "var(--surface-raised)", borderRadius: 22,
        border: "1.5px solid var(--border)",
        padding: bp === "mobile" ? 20 : 28,
        marginBottom: 14,
      }}>
        <h2 style={{
          fontFamily: "var(--font-heading)", fontWeight: 700,
          fontSize: bp === "mobile" ? 16 : 18,
          lineHeight: 1.4, marginBottom: 20, color: "var(--ink)",
        }}>
          {q.question}
        </h2>

        <div style={{ display: "grid", gap: 10 }}>
          {q.options.map((opt, i) => {
            let bg = "var(--surface-raised)";
            let border = "var(--border)";

            if (showResult) {
              if (i === q.correct) { bg = "var(--success-soft)"; border = "var(--success)"; }
              else if (i === selected && i !== q.correct) { bg = "var(--danger-soft)"; border = "var(--danger)"; }
              else { bg = "var(--surface-sunken)"; border = "var(--border-light)"; }
            }

            return (
              <button
                key={i}
                onClick={() => pick(i)}
                disabled={showResult}
                className={!showResult ? "hover-option" : undefined}
                style={{
                  width: "100%", textAlign: "left",
                  padding: "14px 16px", borderRadius: 14,
                  border: `1.5px solid ${border}`,
                  background: bg, cursor: showResult ? "default" : "pointer",
                  display: "flex", alignItems: "center", gap: 12,
                  transition: "all 0.25s",
                  opacity: showResult && i !== q.correct && i !== selected ? 0.4 : 1,
                  fontFamily: "var(--font-body)",
                }}
              >
                <span style={{
                  width: 26, height: 26, borderRadius: 8, flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 12, fontWeight: 700,
                  background: showResult && i === q.correct ? "var(--success)" : showResult && i === selected ? "var(--danger)" : "var(--surface-sunken)",
                  color: showResult && (i === q.correct || i === selected) ? "#fff" : "var(--ink-light)",
                }}>
                  {showResult && i === q.correct ? <CheckCircle2 size={13} /> : String.fromCharCode(65 + i)}
                </span>
                <span style={{ fontSize: 14, color: "var(--ink)", lineHeight: 1.5 }}>{opt}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Next */}
      {showResult && !done && (
        <button onClick={next} className="anim-fade-up" style={{
          width: "100%", padding: "14px", borderRadius: 14,
          border: "none", cursor: "pointer",
          background: "var(--accent)", color: "#fff",
          fontFamily: "var(--font-body)", fontSize: 15, fontWeight: 600,
          display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          boxShadow: "0 4px 16px rgba(37,99,235,0.25)",
        }}>
          {currentQ < questions.length - 1 ? "Next" : "Finish"} <ArrowRight size={16} />
        </button>
      )}
    </div>
  );
};

/* -----------------------------------------------
   Onboarding Main Component
   ----------------------------------------------- */
const Onboarding = ({ onComplete, testCategories }) => {
  const [step, setStep] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [testDate, setTestDate] = useState(null);

  const handleCategorySelect = (cat) => {
    setSelectedCategory(cat);
    setStep(1);
  };

  const handleDateSelect = (date) => {
    setTestDate(date);
    setStep(2);
  };

  const handleDateSkip = () => {
    setTestDate(null);
    setStep(2);
  };

  const handleDiagnosticComplete = (score) => {
    onComplete({
      categoryId: selectedCategory?.id,
      testId: selectedCategory?.tests?.[0]?.id,
      testDate,
      diagnosticScore: score,
    });
  };

  return (
    <>
      <style>{`
        @keyframes obFadeIn {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div style={{
        minHeight: "100vh",
        background: "var(--surface)",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        padding: 24,
      }}>
        {/* Logo */}
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          marginBottom: 40,
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: "var(--gradient-accent)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 2px 8px rgba(37,99,235,0.3)",
          }}>
            <span style={{
              color: "#fff", fontFamily: "var(--font-heading)",
              fontWeight: 700, fontSize: 18,
            }}>Q</span>
          </div>
          <span style={{
            fontFamily: "var(--font-heading)", fontSize: 24,
            fontWeight: 700, color: "var(--ink)",
          }}>QuizLane</span>
        </div>

        {/* Step dots */}
        <StepDots current={step} total={3} />

        {/* Step content */}
        <div style={{ width: "100%", maxWidth: 680 }}>
          {step === 0 && (
            <StepCategory
              testCategories={testCategories}
              onSelect={handleCategorySelect}
              bp="mobile"
            />
          )}
          {step === 1 && (
            <StepDate
              onSelect={handleDateSelect}
              onSkip={handleDateSkip}
              bp="mobile"
            />
          )}
          {step === 2 && selectedCategory && (
            <StepDiagnostic
              category={selectedCategory}
              onComplete={handleDiagnosticComplete}
              bp="mobile"
            />
          )}
        </div>
      </div>
    </>
  );
};

export default Onboarding;
