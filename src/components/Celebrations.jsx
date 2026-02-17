import { useState, useEffect, useMemo } from "react";
import { Flame, Crown, Trophy, Star, Sparkles, Target, Gem } from "lucide-react";

/* -----------------------------------------------
   Celebration config per type
   ----------------------------------------------- */
const CELEBRATION_CONFIG = {
  "streak-3": {
    icon: Flame,
    iconColor: "var(--streak-orange)",
    headline: "3-Day Streak!",
    subtitle: "You're building a habit!",
    particleCount: 30,
    particleStyle: "confetti",
    bgGradient: "linear-gradient(135deg, rgba(251,146,60,0.15), rgba(249,115,22,0.08))",
  },
  "streak-7": {
    icon: Flame,
    iconColor: "var(--streak-orange)",
    headline: "7-Day Streak!",
    subtitle: "A full week of dedication!",
    particleCount: 40,
    particleStyle: "fireworks",
    bgGradient: "linear-gradient(135deg, rgba(251,146,60,0.2), rgba(234,88,12,0.1))",
  },
  "streak-14": {
    icon: Crown,
    iconColor: "var(--badge-gold)",
    headline: "14-Day Streak!",
    subtitle: "Two weeks strong!",
    particleCount: 45,
    particleStyle: "gold",
    bgGradient: "linear-gradient(135deg, rgba(250,204,21,0.2), rgba(234,179,8,0.1))",
  },
  "streak-30": {
    icon: Crown,
    iconColor: "var(--badge-gold)",
    headline: "30-Day Streak!",
    subtitle: "Legendary consistency!",
    particleCount: 50,
    particleStyle: "gold",
    bgGradient: "linear-gradient(135deg, rgba(250,204,21,0.25), rgba(234,179,8,0.15))",
  },
  "perfect-score": {
    icon: Gem,
    iconColor: "var(--success)",
    headline: "Perfect Score!",
    subtitle: "Not a single mistake!",
    particleCount: 40,
    particleStyle: "confetti",
    bgGradient: "linear-gradient(135deg, rgba(34,197,94,0.15), rgba(22,163,74,0.08))",
  },
  "level-up": {
    icon: Star,
    iconColor: "var(--xp-violet)",
    headline: "Level Up!",
    subtitle: null, // filled dynamically from data
    particleCount: 40,
    particleStyle: "fireworks",
    bgGradient: "linear-gradient(135deg, rgba(167,139,250,0.2), rgba(139,92,246,0.1))",
  },
  "first-quiz": {
    icon: Target,
    iconColor: "var(--accent)",
    headline: "First Quiz Complete!",
    subtitle: "Your journey begins!",
    particleCount: 30,
    particleStyle: "confetti",
    bgGradient: "linear-gradient(135deg, rgba(59,130,246,0.15), rgba(37,99,235,0.08))",
  },
  "test-mastered": {
    icon: Trophy,
    iconColor: "var(--badge-gold)",
    headline: "Test Mastered!",
    subtitle: "You've conquered this test!",
    particleCount: 45,
    particleStyle: "gold",
    bgGradient: "linear-gradient(135deg, rgba(250,204,21,0.2), rgba(234,179,8,0.1))",
  },
};

const PARTICLE_COLORS = {
  confetti: ["var(--accent)", "var(--success)", "var(--xp-violet)", "var(--streak-orange)", "var(--badge-gold)", "var(--danger)"],
  fireworks: ["var(--accent)", "var(--xp-violet)", "var(--badge-gold)", "#fff", "var(--streak-orange)"],
  gold: ["var(--badge-gold)", "#fde68a", "#fbbf24", "#d97706", "#fff"],
};

/* -----------------------------------------------
   Particle generator
   ----------------------------------------------- */
const generateParticles = (count, style) => {
  const colors = PARTICLE_COLORS[style] || PARTICLE_COLORS.confetti;
  return Array.from({ length: count }, (_, i) => {
    const angle = Math.random() * 360;
    const distance = 40 + Math.random() * 260;
    const size = style === "gold" ? 4 + Math.random() * 8 : 4 + Math.random() * 10;
    const duration = 1.2 + Math.random() * 1.8;
    const delay = Math.random() * 0.6;
    const rotEnd = Math.random() * 720 - 360;
    const shape = style === "gold"
      ? "50%"
      : i % 3 === 0
        ? "50%"
        : i % 3 === 1
          ? "2px"
          : "0";

    return {
      id: i,
      color: colors[i % colors.length],
      size,
      shape,
      angle,
      distance,
      duration,
      delay,
      rotEnd,
      dx: Math.cos((angle * Math.PI) / 180) * distance,
      dy: Math.sin((angle * Math.PI) / 180) * distance - (style === "gold" ? distance * 0.3 : 0),
    };
  });
};

/* -----------------------------------------------
   CelebrationOverlay Component
   ----------------------------------------------- */
export const CelebrationOverlay = ({ type, data, onDismiss }) => {
  const [visible, setVisible] = useState(true);

  const config = CELEBRATION_CONFIG[type] || CELEBRATION_CONFIG["first-quiz"];
  const IconComp = config.icon;
  const subtitle = type === "level-up" && data?.levelName
    ? `You're now a ${data.levelName}!`
    : config.subtitle;

  const particles = useMemo(
    () => generateParticles(config.particleCount, config.particleStyle),
    [type] // eslint-disable-line react-hooks/exhaustive-deps
  );

  // Auto-dismiss
  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onDismiss?.(), 400);
    }, 3500);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  const dismiss = () => {
    setVisible(false);
    setTimeout(() => onDismiss?.(), 300);
  };

  // Unique keyframe names to avoid collisions
  const particleKeyframes = particles
    .map(
      (p) => `
    @keyframes celebP${p.id} {
      0% {
        opacity: 1;
        transform: translate(0, 0) rotate(0deg) scale(1);
      }
      80% {
        opacity: 0.8;
      }
      100% {
        opacity: 0;
        transform: translate(${p.dx}px, ${p.dy}px) rotate(${p.rotEnd}deg) scale(0.2);
      }
    }`
    )
    .join("\n");

  return (
    <>
      <style>{`
        @keyframes celebOverlayIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes celebOverlayOut {
          from { opacity: 1; }
          to   { opacity: 0; }
        }
        @keyframes celebIconIn {
          0%   { opacity: 0; transform: scale(0.3) rotate(-20deg); }
          60%  { transform: scale(1.2) rotate(5deg); }
          100% { opacity: 1; transform: scale(1) rotate(0deg); }
        }
        @keyframes celebTextIn {
          0%   { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes celebIconPulse {
          0%, 100% { transform: scale(1); }
          50%      { transform: scale(1.08); }
        }
        ${particleKeyframes}
      `}</style>

      <div
        onClick={dismiss}
        style={{
          position: "fixed", inset: 0, zIndex: 10001,
          background: "rgba(0,0,0,0.55)",
          backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)",
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          cursor: "pointer",
          animation: visible
            ? "celebOverlayIn 0.4s ease both"
            : "celebOverlayOut 0.35s ease both",
        }}
      >
        {/* Particles */}
        <div style={{
          position: "absolute",
          top: "50%", left: "50%",
          width: 0, height: 0,
          pointerEvents: "none",
        }}>
          {particles.map((p) => (
            <div
              key={p.id}
              style={{
                position: "absolute",
                width: p.size,
                height: p.size,
                borderRadius: p.shape,
                background: p.color,
                animation: `celebP${p.id} ${p.duration}s ease-out ${p.delay}s both`,
              }}
            />
          ))}
        </div>

        {/* Icon */}
        <div style={{
          width: 100, height: 100,
          borderRadius: 28,
          background: config.bgGradient,
          border: `2px solid ${config.iconColor}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          marginBottom: 24,
          animation: "celebIconIn 0.6s cubic-bezier(0.22,1,0.36,1) both, celebIconPulse 2s ease-in-out 0.8s infinite",
          boxShadow: `0 0 60px ${config.iconColor}33`,
        }}>
          <IconComp size={48} style={{ color: config.iconColor }} />
        </div>

        {/* Headline */}
        <h1 style={{
          fontFamily: "var(--font-heading)", fontWeight: 800,
          fontSize: 32, color: "#fff",
          textAlign: "center",
          animation: "celebTextIn 0.5s ease 0.3s both",
          textShadow: "0 2px 16px rgba(0,0,0,0.3)",
        }}>
          {config.headline}
        </h1>

        {/* Subtitle */}
        {subtitle && (
          <p style={{
            fontFamily: "var(--font-body)", fontSize: 17,
            color: "rgba(255,255,255,0.75)", marginTop: 10,
            textAlign: "center",
            animation: "celebTextIn 0.5s ease 0.5s both",
          }}>
            {subtitle}
          </p>
        )}

        {/* Tap to dismiss hint */}
        <p style={{
          fontFamily: "var(--font-body)", fontSize: 12,
          color: "rgba(255,255,255,0.35)", marginTop: 40,
          animation: "celebTextIn 0.5s ease 1s both",
        }}>
          Tap anywhere to continue
        </p>
      </div>
    </>
  );
};

export default CelebrationOverlay;
