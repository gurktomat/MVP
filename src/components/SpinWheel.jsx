import { useState, useEffect, useMemo } from "react";
import { Gift, Sparkles, Shield, Award, Zap } from "lucide-react";
import { SPIN_SEGMENTS } from "../data/rewards.js";

/* -----------------------------------------------
   Seeded PRNG: deterministic per day + XP
   ----------------------------------------------- */
const seededRandom = (seed) => {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  s = (s * 16807) % 2147483647;
  return (s - 1) / 2147483646;
};

const pickSegment = (gameState) => {
  const dateStr = new Date().toDateString();
  const seed =
    dateStr.split("").reduce((a, c) => a + c.charCodeAt(0), 0) +
    (gameState?.xp || 0);
  const r = seededRandom(seed) * 100;
  let cumulative = 0;
  for (let i = 0; i < SPIN_SEGMENTS.length; i++) {
    cumulative += SPIN_SEGMENTS[i].weight;
    if (r < cumulative) return i;
  }
  return 0;
};

const SEGMENT_ICONS = {
  xp: Zap,
  multiplier: Sparkles,
  shield: Shield,
  badge: Award,
};

const SpinWheel = ({ show, onClose, onReward, gameState }) => {
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState(null);

  const winIndex = useMemo(() => pickSegment(gameState), [gameState]);
  const segCount = SPIN_SEGMENTS.length;
  const segAngle = 360 / segCount;

  useEffect(() => {
    if (!show) {
      setSpinning(false);
      setResult(null);
      setRotation(0);
    }
  }, [show]);

  const spin = () => {
    if (spinning) return;
    setSpinning(true);
    setResult(null);

    // Land on winning segment: pointer at top (0 deg) means the
    // segment at "top" after rotation. We compute so that the centre
    // of winIndex ends up under the pointer.
    const targetAngle = 360 - winIndex * segAngle - segAngle / 2;
    const totalRotation = 360 * 6 + targetAngle; // 6 full spins + offset

    setRotation(totalRotation);

    setTimeout(() => {
      setSpinning(false);
      setResult(SPIN_SEGMENTS[winIndex]);
    }, 4200);
  };

  const claim = () => {
    if (result && onReward) onReward(result);
    if (onClose) onClose();
  };

  if (!show) return null;

  // Build conic-gradient string. Because CSS vars can't be resolved
  // inside conic-gradient at build time, we use fallback hex colours
  // that are close approximations for the gradient rendering.
  const fallbackColors = [
    "#f0f0ec", "#eff4ff", "#f3f0ff", "#f0fdf4",
    "#fffbeb", "#fff7ed", "#fefce8", "#2563eb",
  ];

  const conicStops = SPIN_SEGMENTS.map((seg, i) => {
    const start = i * segAngle;
    const end = start + segAngle;
    const color = fallbackColors[i] || "#e5e5e5";
    return `${color} ${start}deg ${end}deg`;
  }).join(", ");

  const wheelSize = 300;

  return (
    <>
      <style>{`
        @keyframes spinWheel {
          from { transform: rotate(0deg); }
          to   { transform: rotate(var(--spin-to)); }
        }
        @keyframes resultReveal {
          0%   { opacity: 0; transform: scale(0.5); }
          60%  { transform: scale(1.15); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes pointerBounce {
          0%, 100% { transform: translateX(-50%) translateY(0); }
          50%      { transform: translateX(-50%) translateY(4px); }
        }
        @keyframes overlayIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
      `}</style>

      <div
        onClick={(e) => { if (e.target === e.currentTarget && !spinning) onClose(); }}
        style={{
          position: "fixed", inset: 0, zIndex: 10000,
          background: "rgba(0,0,0,0.6)",
          backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          animation: "overlayIn 0.3s ease both",
        }}
      >
        {/* Title */}
        <div style={{
          display: "flex", alignItems: "center", gap: 10, marginBottom: 28,
        }}>
          <Gift size={28} style={{ color: "var(--badge-gold)" }} />
          <h2 style={{
            fontFamily: "var(--font-heading)", fontWeight: 800,
            fontSize: 28, color: "#fff",
          }}>Daily Spin</h2>
          <Sparkles size={22} style={{ color: "var(--xp-violet)" }} />
        </div>

        {/* Wheel container */}
        <div style={{ position: "relative", width: wheelSize, height: wheelSize }}>
          {/* Pointer triangle at top */}
          <div style={{
            position: "absolute", top: -18, left: "50%",
            transform: "translateX(-50%)",
            width: 0, height: 0,
            borderLeft: "14px solid transparent",
            borderRight: "14px solid transparent",
            borderTop: "22px solid var(--badge-gold)",
            filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.3))",
            zIndex: 3,
            animation: spinning ? "none" : "pointerBounce 1.2s ease-in-out infinite",
          }} />

          {/* Wheel */}
          <div style={{
            width: wheelSize, height: wheelSize,
            borderRadius: "50%",
            background: `conic-gradient(${conicStops})`,
            border: "4px solid var(--border)",
            boxShadow: "0 0 40px rgba(37,99,235,0.2), inset 0 0 20px rgba(0,0,0,0.08)",
            transition: spinning ? "none" : "transform 0.1s",
            transform: `rotate(${rotation}deg)`,
            ...(spinning ? {
              transition: `transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)`,
            } : {}),
            position: "relative",
            overflow: "hidden",
          }}>
            {/* Segment labels */}
            {SPIN_SEGMENTS.map((seg, i) => {
              const angle = i * segAngle + segAngle / 2;
              const rad = (angle * Math.PI) / 180;
              const labelR = wheelSize * 0.35;
              const x = wheelSize / 2 + Math.sin(rad) * labelR;
              const y = wheelSize / 2 - Math.cos(rad) * labelR;
              const SegIcon = SEGMENT_ICONS[seg.type] || Zap;
              return (
                <div key={i} style={{
                  position: "absolute",
                  left: x, top: y,
                  transform: `translate(-50%, -50%) rotate(${angle}deg)`,
                  display: "flex", flexDirection: "column",
                  alignItems: "center", gap: 2,
                  pointerEvents: "none",
                }}>
                  <SegIcon size={14} style={{ color: seg.type === "xp" && seg.value >= 100 ? "var(--success)" : "var(--ink-light)" }} />
                  <span style={{
                    fontSize: seg.label === "JACKPOT" ? 9 : 10,
                    fontWeight: 700,
                    fontFamily: "var(--font-body)",
                    color: seg.label === "JACKPOT" ? "#fff" : "var(--ink-light)",
                    whiteSpace: "nowrap",
                  }}>{seg.label}</span>
                </div>
              );
            })}
          </div>

          {/* Centre SPIN button */}
          <button
            onClick={spin}
            disabled={spinning || result !== null}
            style={{
              position: "absolute",
              top: "50%", left: "50%",
              transform: "translate(-50%, -50%)",
              width: 72, height: 72,
              borderRadius: "50%",
              border: "3px solid var(--border)",
              background: spinning || result ? "var(--surface-sunken)" : "var(--gradient-accent)",
              color: spinning || result ? "var(--ink-muted)" : "#fff",
              fontFamily: "var(--font-heading)", fontWeight: 800,
              fontSize: 15, cursor: spinning || result ? "default" : "pointer",
              boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
              zIndex: 2,
              transition: "background 0.3s, color 0.3s",
            }}
          >
            {spinning ? "..." : result ? "" : "SPIN!"}
          </button>
        </div>

        {/* Result reveal */}
        {result && (
          <div style={{
            marginTop: 32,
            display: "flex", flexDirection: "column", alignItems: "center",
            animation: "resultReveal 0.5s cubic-bezier(0.22, 1, 0.36, 1) both",
          }}>
            <div style={{
              fontSize: 36, fontWeight: 800, fontFamily: "var(--font-heading)",
              color: result.label === "JACKPOT" ? "var(--badge-gold)" : "var(--xp-violet)",
              marginBottom: 8, textShadow: "0 2px 12px rgba(0,0,0,0.3)",
            }}>
              {result.label === "JACKPOT" ? "JACKPOT! +500 XP" : `You won ${result.label}!`}
            </div>
            <button
              onClick={claim}
              style={{
                padding: "14px 40px", borderRadius: 14,
                border: "none", cursor: "pointer",
                background: "var(--gradient-accent)", color: "#fff",
                fontFamily: "var(--font-body)", fontSize: 16, fontWeight: 600,
                boxShadow: "0 4px 20px rgba(37,99,235,0.3)",
                transition: "transform 0.2s",
              }}
            >
              Claim Reward
            </button>
          </div>
        )}

        {/* Close hint */}
        {!spinning && !result && (
          <button onClick={onClose} style={{
            marginTop: 24, background: "none", border: "none",
            color: "rgba(255,255,255,0.5)", fontSize: 13,
            fontFamily: "var(--font-body)", cursor: "pointer",
          }}>
            Close
          </button>
        )}
      </div>
    </>
  );
};

export default SpinWheel;
