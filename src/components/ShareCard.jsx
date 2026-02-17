import { useState } from "react";
import { Share2, Copy, X, CheckCircle2, Flame, Trophy } from "lucide-react";

/* -----------------------------------------------
   Category gradients for card background
   ----------------------------------------------- */
const TEST_GRADIENTS = {
  driving: "linear-gradient(135deg, #2563eb, #3b82f6)",
  citizenship: "linear-gradient(135deg, #dc2626, #ef4444)",
  "real-estate": "linear-gradient(135deg, #16a34a, #22c55e)",
  "food-handler": "linear-gradient(135deg, #d97706, #f59e0b)",
  osha: "linear-gradient(135deg, #ea580c, #f97316)",
  cpr: "linear-gradient(135deg, #e11d48, #f43f5e)",
  notary: "linear-gradient(135deg, #7c3aed, #8b5cf6)",
  default: "linear-gradient(135deg, #2563eb, #7c3aed)",
};

const getTestGradient = (testName) => {
  const lower = (testName || "").toLowerCase();
  for (const key of Object.keys(TEST_GRADIENTS)) {
    if (lower.includes(key)) return TEST_GRADIENTS[key];
  }
  return TEST_GRADIENTS.default;
};

/* -----------------------------------------------
   Score ring SVG
   ----------------------------------------------- */
const ScoreRing = ({ score, passed, size = 100 }) => {
  const stroke = 8;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - score / 100);

  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke="rgba(255,255,255,0.2)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={passed ? "#22c55e" : "#f59e0b"}
          strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1s ease-out" }}
        />
      </svg>
      <div style={{
        position: "absolute", inset: 0,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
      }}>
        <span style={{
          fontSize: 28, fontWeight: 800,
          fontFamily: "var(--font-heading)", color: "#fff",
        }}>{score}%</span>
        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.7)" }}>Score</span>
      </div>
    </div>
  );
};

/* -----------------------------------------------
   ShareCard Component
   ----------------------------------------------- */
const ShareCard = ({ testName, score, passed, streak, level, xp, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);

  const shareText = `I scored ${score}% on the ${testName || "Quiz"} test on QuizLane! \uD83C\uDFAF`;
  const shareUrl = typeof window !== "undefined" ? window.location.origin : "https://quizlane.com";

  const gradient = getTestGradient(testName);
  const canShare = typeof navigator !== "undefined" && !!navigator.share;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const ta = document.createElement("textarea");
      ta.value = `${shareText}\n${shareUrl}`;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = async () => {
    if (!canShare) return;
    try {
      await navigator.share({ title: "QuizLane Results", text: shareText, url: shareUrl });
      setShared(true);
    } catch { /* user cancelled */ }
  };

  return (
    <>
      <style>{`
        @keyframes shareCardIn {
          from { opacity: 0; transform: scale(0.9) translateY(20px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes shareOverlayIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
      `}</style>

      <div
        onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
        style={{
          position: "fixed", inset: 0, zIndex: 10000,
          background: "rgba(0,0,0,0.55)",
          backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: 20,
          animation: "shareOverlayIn 0.3s ease both",
        }}
      >
        <div style={{
          width: 300, borderRadius: 24, overflow: "hidden",
          boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
          animation: "shareCardIn 0.4s cubic-bezier(0.22,1,0.36,1) both",
          position: "relative",
        }}>
          {/* Close button */}
          <button onClick={onClose} style={{
            position: "absolute", top: 12, right: 12, zIndex: 2,
            width: 32, height: 32, borderRadius: 10,
            background: "rgba(0,0,0,0.2)", border: "none",
            cursor: "pointer", display: "flex",
            alignItems: "center", justifyContent: "center",
            color: "rgba(255,255,255,0.8)", transition: "background 0.2s",
          }}>
            <X size={16} />
          </button>

          {/* Gradient header */}
          <div style={{
            background: gradient, padding: "32px 24px 28px",
            textAlign: "center", position: "relative", overflow: "hidden",
          }}>
            {/* Logo text */}
            <div style={{
              fontFamily: "var(--font-heading)", fontWeight: 800,
              fontSize: 18, color: "rgba(255,255,255,0.9)",
              marginBottom: 4, letterSpacing: "-0.01em",
            }}>
              QuizLane
            </div>
            <div style={{
              fontSize: 12, color: "rgba(255,255,255,0.6)",
              marginBottom: 20,
            }}>
              {testName || "Practice Test"}
            </div>

            {/* Score ring */}
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
              <ScoreRing score={score} passed={passed} />
            </div>

            {/* Pass/Fail badge */}
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "5px 14px", borderRadius: 100,
              background: passed ? "rgba(34,197,94,0.2)" : "rgba(245,158,11,0.2)",
              border: `1px solid ${passed ? "rgba(34,197,94,0.4)" : "rgba(245,158,11,0.4)"}`,
              fontSize: 12, fontWeight: 700,
              color: passed ? "#86efac" : "#fde68a",
            }}>
              {passed ? <CheckCircle2 size={13} /> : <Trophy size={13} />}
              {passed ? "PASSED" : "KEEP PRACTICING"}
            </div>
          </div>

          {/* Body */}
          <div style={{
            background: "var(--surface-raised)",
            padding: "20px 24px 24px",
          }}>
            {/* Streak + Level */}
            <div style={{
              display: "flex", justifyContent: "center", gap: 12,
              marginBottom: 20,
            }}>
              {streak > 0 && (
                <div style={{
                  display: "flex", alignItems: "center", gap: 5,
                  background: "var(--streak-orange-soft)",
                  border: "1px solid var(--streak-orange)",
                  borderRadius: 100, padding: "4px 12px",
                  fontSize: 12, fontWeight: 600, color: "var(--streak-orange)",
                }}>
                  <Flame size={13} /> {streak} day streak
                </div>
              )}
              {level && (
                <div style={{
                  display: "flex", alignItems: "center", gap: 5,
                  background: "var(--xp-violet-soft)",
                  border: "1px solid var(--xp-violet)",
                  borderRadius: 100, padding: "4px 12px",
                  fontSize: 12, fontWeight: 600, color: "var(--xp-violet)",
                }}>
                  <Trophy size={13} /> {level}
                </div>
              )}
            </div>

            {/* Share buttons */}
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={handleCopy} style={{
                flex: 1, padding: "12px 16px", borderRadius: 12,
                border: "1.5px solid var(--border)", cursor: "pointer",
                background: copied ? "var(--success-soft)" : "var(--surface-sunken)",
                color: copied ? "var(--success)" : "var(--ink)",
                fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 600,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                transition: "all 0.2s",
              }}>
                {copied ? <CheckCircle2 size={15} /> : <Copy size={15} />}
                {copied ? "Copied!" : "Copy Link"}
              </button>
              {canShare && (
                <button onClick={handleShare} style={{
                  flex: 1, padding: "12px 16px", borderRadius: 12,
                  border: "none", cursor: "pointer",
                  background: "var(--gradient-accent)", color: "#fff",
                  fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 600,
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  boxShadow: "0 4px 12px rgba(37,99,235,0.25)",
                }}>
                  <Share2 size={15} />
                  {shared ? "Shared!" : "Share"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ShareCard;
