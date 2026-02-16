import { useState, useEffect, useCallback, useRef } from "react";

/* ═══════════════════════════════════════════
   DATA
   ═══════════════════════════════════════════ */
const testCategories = [
  {
    id: "driving", name: "Driving License", icon: "🚗",
    description: "Car, motorcycle & CDL practice tests",
    gradient: "from-sky-400 to-blue-600",
    accent: "#2563eb",
    tests: [
      { id: "car-permit", name: "Car Permit Test", icon: "🚙", questionCount: 25, passingScore: 80, timeLimit: 25, description: "Practice for your DMV written knowledge test" },
      { id: "motorcycle", name: "Motorcycle Permit", icon: "🏍️", questionCount: 25, passingScore: 80, timeLimit: 25, description: "Motorcycle endorsement knowledge test" },
      { id: "cdl", name: "CDL General Knowledge", icon: "🚛", questionCount: 25, passingScore: 80, timeLimit: 30, description: "Commercial Driver License general knowledge" },
    ],
  },
  {
    id: "citizenship", name: "US Citizenship", icon: "🇺🇸",
    description: "Civics & naturalization test prep",
    gradient: "from-rose-400 to-red-600",
    accent: "#dc2626",
    tests: [
      { id: "civics", name: "Civics Test", icon: "🏛️", questionCount: 20, passingScore: 60, timeLimit: 20, description: "100 civics questions for naturalization" },
    ],
  },
  {
    id: "real-estate", name: "Real Estate", icon: "🏠",
    description: "Real estate license exam prep",
    gradient: "from-emerald-400 to-green-600",
    accent: "#16a34a",
    tests: [
      { id: "re-national", name: "National Exam Prep", icon: "📋", questionCount: 20, passingScore: 75, timeLimit: 30, description: "National real estate exam practice" },
    ],
  },
  {
    id: "food-handler", name: "Food Handler", icon: "🍽️",
    description: "Food safety certification prep",
    gradient: "from-amber-400 to-orange-600",
    accent: "#d97706",
    tests: [
      { id: "food-safety", name: "Food Safety Test", icon: "🧑‍🍳", questionCount: 20, passingScore: 75, timeLimit: 20, description: "ServSafe-style food handler test" },
    ],
  },
];

const questionBank = {
  "car-permit": [
    { id: 1, question: "What does a flashing red traffic light mean?", options: ["Stop and wait for green", "Stop, then proceed when safe (treat as stop sign)", "Slow down and proceed with caution", "The signal is broken, proceed normally"], correct: 1, explanation: "A flashing red light must be treated the same as a stop sign. Stop completely, yield to traffic and pedestrians, then proceed when safe." },
    { id: 2, question: "When approaching a school bus with flashing red lights and extended stop arm, you must:", options: ["Slow down to 15 mph", "Stop only if children are visible", "Stop regardless of your direction of travel", "Honk and pass carefully"], correct: 2, explanation: "You must stop for a school bus with flashing red lights. This applies in both directions unless separated by a physical median." },
    { id: 3, question: "What is the legal BAC limit for drivers 21+ in most states?", options: ["0.05%", "0.08%", "0.10%", "0.02%"], correct: 1, explanation: "In most U.S. states, the legal BAC limit for drivers 21+ is 0.08%." },
    { id: 4, question: "What should you do when you see a yellow traffic light?", options: ["Speed up to clear the intersection", "Stop immediately", "Slow down and prepare to stop", "Flash your headlights"], correct: 2, explanation: "A yellow light means the signal is about to turn red. Slow down and prepare to stop unless too close to stop safely." },
    { id: 5, question: "When parking uphill with a curb, which way should you turn your wheels?", options: ["Away from the curb (left)", "Toward the curb (right)", "Keep them straight", "It doesn't matter"], correct: 0, explanation: "Turn wheels away from curb (left) when parking uphill. If the car rolls backward, the tire catches the curb." },
    { id: 6, question: "What does a solid white line between lanes mean?", options: ["Change lanes freely", "Lane changes discouraged but not prohibited", "Only left turns allowed", "Road is about to end"], correct: 1, explanation: "A solid white line discourages lane changes but doesn't prohibit them. Double solid white means prohibited." },
    { id: 7, question: "What is the recommended following distance in normal conditions?", options: ["1 second", "2 seconds", "3-4 seconds", "5-6 seconds"], correct: 2, explanation: "Maintain at least 3-4 seconds following distance. Increase in poor weather or road conditions." },
    { id: 8, question: "At an intersection with no signs or signals, who has the right of way?", options: ["Driver on the left", "Driver on the right", "Driver going straight", "First to arrive always"], correct: 1, explanation: "At an uncontrolled intersection, yield to the vehicle on your right." },
    { id: 9, question: "When is it legal to pass using the right lane?", options: ["Never", "When the vehicle ahead is turning left", "Only on highways", "Anytime you want"], correct: 1, explanation: "Pass on the right when the vehicle ahead is turning left, on one-way streets, or multi-lane roads." },
    { id: 10, question: "What should you do if your vehicle hydroplanes?", options: ["Brake hard immediately", "Accelerate to gain traction", "Ease off gas and steer straight", "Turn sharply to shoulder"], correct: 2, explanation: "Ease off the gas and steer straight. Don't brake hard or turn suddenly." },
    { id: 11, question: "What does a pentagon-shaped sign indicate?", options: ["Railroad crossing", "School zone", "Construction zone", "Yield ahead"], correct: 1, explanation: "Pentagon-shaped signs indicate school zones." },
    { id: 12, question: "How far before a turn should you signal?", options: ["50 feet", "100 feet", "200 feet", "At the intersection"], correct: 1, explanation: "Signal at least 100 feet before turning. On highways, signal earlier." },
    { id: 13, question: "What is the primary purpose of ABS?", options: ["Stop the car faster", "Prevent wheels from locking during hard braking", "Reduce brake pad wear", "Help with parking"], correct: 1, explanation: "ABS prevents wheel lock-up during hard braking, maintaining steering control." },
    { id: 14, question: "When driving in fog, you should use:", options: ["High beam headlights", "Low beam headlights", "Parking lights only", "No lights"], correct: 1, explanation: "Use low beams in fog. High beams reflect off fog creating glare." },
    { id: 15, question: "What does a double yellow center line mean?", options: ["Passing allowed both directions", "No passing in either direction", "Only your lane can pass", "Carpool lane"], correct: 1, explanation: "Double solid yellow means no passing in either direction." },
    { id: 16, question: "If you miss your highway exit, you should:", options: ["Back up to the exit", "Stop and wait for a gap", "Continue to the next exit", "Make a U-turn"], correct: 2, explanation: "Continue to the next exit. Never back up, stop, or U-turn on a highway." },
    { id: 17, question: "When an emergency vehicle with flashing lights approaches:", options: ["Speed up to clear the way", "Stop where you are", "Pull over to the right and stop", "Continue at the same speed"], correct: 2, explanation: "Pull to the right and stop until it passes." },
    { id: 18, question: "Blind spots are areas around your vehicle that:", options: ["Are visible in mirrors", "Cannot be seen in mirrors", "Only exist on the left", "Disappear at low speed"], correct: 1, explanation: "Blind spots can't be seen in mirrors. Always turn your head before changing lanes." },
    { id: 19, question: "What is the move-over law?", options: ["Move for pedestrians always", "Slow down or change lanes for stopped emergency vehicles", "Move to the left lane on highways", "Let faster traffic pass"], correct: 1, explanation: "Change lanes or slow down when approaching stopped emergency or service vehicles." },
    { id: 20, question: "When making a right turn on red, you must:", options: ["Turn immediately if clear", "Come to a complete stop first, then turn when safe", "Slow down and turn", "Always wait for green"], correct: 1, explanation: "Stop completely, yield to pedestrians and cross traffic, then turn when safe." },
    { id: 21, question: "What is the safest way to enter a highway?", options: ["Stop at the ramp end", "Merge slowly", "Accelerate to match traffic speed, then merge", "Use the shoulder"], correct: 2, explanation: "Use the acceleration lane to match speed, check mirrors and blind spots, merge smoothly." },
    { id: 22, question: "A diamond-shaped sign indicates:", options: ["School zone", "A warning", "A regulation", "Construction"], correct: 1, explanation: "Diamond signs warn about hazards ahead." },
    { id: 23, question: "What does a flashing yellow traffic light mean?", options: ["Stop and wait", "About to turn red", "Slow down and proceed with caution", "Yield to traffic on right"], correct: 2, explanation: "Flashing yellow means proceed with caution. You don't need to stop." },
    { id: 24, question: "When parallel parking, how close to the curb?", options: ["6 inches", "12 inches", "18 inches (1.5 feet)", "24 inches"], correct: 2, explanation: "No more than 18 inches from the curb in most states." },
    { id: 25, question: "What should you do if a tire blows out?", options: ["Brake hard", "Grip wheel firmly, ease off gas, coast to a stop", "Accelerate", "Turn off the engine"], correct: 1, explanation: "Grip the wheel, ease off gas, coast to a safe stop. Don't brake hard." },
  ],
  motorcycle: [
    { id: 1, question: "Best lane position for visibility?", options: ["Left portion", "Center", "Right portion", "It varies with the situation"], correct: 3, explanation: "Best position varies. Adjust for visibility and space cushion." },
    { id: 2, question: "Recommended group riding formation?", options: ["Single file", "Side by side", "Staggered formation", "Any formation"], correct: 2, explanation: "Staggered formation gives adequate space and escape routes." },
  ],
  civics: [
    { id: 1, question: "What is the supreme law of the land?", options: ["Declaration of Independence", "The Constitution", "The Bill of Rights", "Federal law"], correct: 1, explanation: "The Constitution is the supreme law of the land." },
    { id: 2, question: "How many amendments does the Constitution have?", options: ["10", "21", "27", "33"], correct: 2, explanation: "27 amendments. The first 10 are the Bill of Rights." },
  ],
};

/* ═══════════════════════════════════════════
   HOOKS
   ═══════════════════════════════════════════ */
const useBreakpoint = () => {
  const [bp, setBp] = useState("mobile");
  useEffect(() => {
    const check = () => {
      const w = window.innerWidth;
      if (w >= 1536) setBp("4k");
      else if (w >= 1280) setBp("desktop");
      else if (w >= 768) setBp("tablet");
      else setBp("mobile");
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return bp;
};

/* ═══════════════════════════════════════════
   GLOBAL STYLES
   ═══════════════════════════════════════════ */
const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,600;0,9..144,700;0,9..144,800;1,9..144,400&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --font-heading: 'Fraunces', Georgia, serif;
      --font-body: 'DM Sans', system-ui, sans-serif;
      --ink: #1a1a2e;
      --ink-light: #4a4a6a;
      --ink-muted: #8888a4;
      --surface: #fafaf8;
      --surface-raised: #ffffff;
      --surface-sunken: #f0f0ec;
      --border: #e8e8e2;
      --border-light: #f0f0ec;
      --accent: #2563eb;
      --accent-soft: #eff4ff;
      --success: #16a34a;
      --success-soft: #f0fdf4;
      --danger: #dc2626;
      --danger-soft: #fef2f2;
      --warm: #f59e0b;
      --warm-soft: #fffbeb;
    }
    body { font-family: var(--font-body); background: var(--surface); color: var(--ink); -webkit-font-smoothing: antialiased; }
    h1, h2, h3 { font-family: var(--font-heading); }
    .hide-scrollbar::-webkit-scrollbar { display: none; }
    .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
    @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
    .anim-fade-up { animation: fadeUp 0.5s ease-out both; }
    .anim-scale-in { animation: scaleIn 0.35s ease-out both; }
    .anim-d1 { animation-delay: 0.05s; }
    .anim-d2 { animation-delay: 0.1s; }
    .anim-d3 { animation-delay: 0.15s; }
    .anim-d4 { animation-delay: 0.2s; }
    .anim-d5 { animation-delay: 0.25s; }
    .anim-d6 { animation-delay: 0.3s; }
    .tap-target { min-height: 48px; min-width: 48px; }
    @media (hover: hover) { .hover-lift:hover { transform: translateY(-3px); } }
    .grain { position: fixed; inset: 0; pointer-events: none; opacity: 0.03; z-index: 9999;
      background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
    }
  `}</style>
);

/* ═══════════════════════════════════════════
   MOBILE BOTTOM NAV
   ═══════════════════════════════════════════ */
const MobileNav = ({ currentView, onNavigate }) => (
  <nav style={{
    position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 100,
    background: "rgba(255,255,255,0.92)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
    borderTop: "1px solid var(--border)", paddingBottom: "env(safe-area-inset-bottom, 0px)",
  }}>
    <div style={{ display: "flex", justifyContent: "space-around", padding: "6px 0 4px" }}>
      {[
        { id: "home", label: "Home", icon: "🏠" },
        { id: "categories", label: "Tests", icon: "📝" },
        { id: "progress", label: "Progress", icon: "📊" },
      ].map((item) => {
        const active = currentView === item.id || (item.id === "categories" && (currentView === "category" || currentView === "quiz"));
        return (
          <button key={item.id} onClick={() => onNavigate(item.id)}
            className="tap-target"
            style={{
              display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
              background: "none", border: "none", cursor: "pointer", padding: "8px 16px",
              color: active ? "var(--accent)" : "var(--ink-muted)",
              fontFamily: "var(--font-body)", fontSize: 10, fontWeight: active ? 600 : 400,
              transition: "color 0.2s",
            }}>
            <span style={{ fontSize: 22 }}>{item.icon}</span>
            <span>{item.label}</span>
          </button>
        );
      })}
    </div>
  </nav>
);

/* ═══════════════════════════════════════════
   TABLET SIDEBAR
   ═══════════════════════════════════════════ */
const TabletSidebar = ({ currentView, onNavigate }) => (
  <aside style={{
    position: "fixed", left: 0, top: 0, bottom: 0, width: 72, zIndex: 100,
    background: "var(--surface-raised)", borderRight: "1px solid var(--border)",
    display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 16, gap: 4,
  }}>
    <button onClick={() => onNavigate("home")} style={{
      width: 44, height: 44, borderRadius: 14, border: "none", cursor: "pointer", marginBottom: 20,
      background: "linear-gradient(135deg, #2563eb, #7c3aed)", display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <span style={{ color: "white", fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 18 }}>Q</span>
    </button>
    {[
      { id: "home", icon: "🏠", label: "Home" },
      { id: "categories", icon: "📝", label: "Tests" },
      { id: "progress", icon: "📊", label: "Stats" },
    ].map((item) => {
      const active = currentView === item.id || (item.id === "categories" && (currentView === "category" || currentView === "quiz"));
      return (
        <button key={item.id} onClick={() => onNavigate(item.id)}
          className="tap-target"
          style={{
            width: 56, padding: "10px 0", borderRadius: 12, border: "none", cursor: "pointer",
            background: active ? "var(--accent-soft)" : "transparent",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
            transition: "background 0.2s",
          }}>
          <span style={{ fontSize: 20 }}>{item.icon}</span>
          <span style={{ fontSize: 10, fontFamily: "var(--font-body)", fontWeight: active ? 600 : 400, color: active ? "var(--accent)" : "var(--ink-muted)" }}>{item.label}</span>
        </button>
      );
    })}
  </aside>
);

/* ═══════════════════════════════════════════
   DESKTOP HEADER
   ═══════════════════════════════════════════ */
const DesktopHeader = ({ currentView, onNavigate, is4k }) => (
  <header style={{
    position: "sticky", top: 0, zIndex: 100,
    background: "rgba(250,250,248,0.88)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
    borderBottom: "1px solid var(--border)",
  }}>
    <div style={{
      maxWidth: is4k ? 1600 : 1200, margin: "0 auto", padding: is4k ? "0 48px" : "0 32px",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      height: is4k ? 80 : 64,
    }}>
      <button onClick={() => onNavigate("home")} style={{ display: "flex", alignItems: "center", gap: 12, background: "none", border: "none", cursor: "pointer" }}>
        <div style={{
          width: is4k ? 44 : 36, height: is4k ? 44 : 36, borderRadius: 12,
          background: "linear-gradient(135deg, #2563eb, #7c3aed)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <span style={{ color: "white", fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: is4k ? 20 : 16 }}>Q</span>
        </div>
        <span style={{ fontFamily: "var(--font-heading)", fontSize: is4k ? 26 : 22, fontWeight: 700, color: "var(--ink)" }}>QuizLane</span>
      </button>
      <nav style={{ display: "flex", gap: 4 }}>
        {[
          { id: "home", label: "Home" },
          { id: "categories", label: "Practice Tests" },
          { id: "progress", label: "My Progress" },
        ].map((item) => {
          const active = currentView === item.id;
          return (
            <button key={item.id} onClick={() => onNavigate(item.id)} style={{
              padding: is4k ? "10px 24px" : "8px 18px", borderRadius: 10, border: "none", cursor: "pointer",
              background: active ? "var(--accent-soft)" : "transparent",
              color: active ? "var(--accent)" : "var(--ink-light)",
              fontFamily: "var(--font-body)", fontSize: is4k ? 16 : 14, fontWeight: active ? 600 : 500,
              transition: "all 0.2s",
            }}>
              {item.label}
            </button>
          );
        })}
      </nav>
    </div>
  </header>
);

/* ═══════════════════════════════════════════
   RESPONSIVE CONTAINER
   ═══════════════════════════════════════════ */
const Container = ({ children, bp, noPad }) => {
  const styles = {
    mobile: { maxWidth: "100%", padding: noPad ? 0 : "0 16px", margin: "0 auto" },
    tablet: { maxWidth: "100%", padding: noPad ? 0 : "0 24px", margin: "0 auto", marginLeft: 72 },
    desktop: { maxWidth: 1200, padding: noPad ? 0 : "0 32px", margin: "0 auto" },
    "4k": { maxWidth: 1600, padding: noPad ? 0 : "0 48px", margin: "0 auto" },
  };
  return <div style={styles[bp]}>{children}</div>;
};

/* ═══════════════════════════════════════════
   HOME PAGE
   ═══════════════════════════════════════════ */
const HomePage = ({ onNavigate, bp }) => {
  const is4k = bp === "4k";
  const isDesktop = bp === "desktop" || is4k;
  const isTablet = bp === "tablet";

  return (
    <div>
      {/* Hero */}
      <section style={{ padding: isDesktop ? "80px 0 72px" : isTablet ? "56px 0 48px" : "40px 0 36px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        {/* Decorative circles */}
        <div style={{ position: "absolute", top: "-20%", right: "-10%", width: isDesktop ? 500 : 300, height: isDesktop ? 500 : 300, borderRadius: "50%", background: "radial-gradient(circle, rgba(37,99,235,0.06) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: "-30%", left: "-10%", width: isDesktop ? 400 : 250, height: isDesktop ? 400 : 250, borderRadius: "50%", background: "radial-gradient(circle, rgba(124,58,237,0.05) 0%, transparent 70%)", pointerEvents: "none" }} />

        <Container bp={bp}>
          <div className="anim-fade-up" style={{ position: "relative", zIndex: 1 }}>
            {/* Badge */}
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              background: "var(--accent-soft)", border: "1px solid #dbeafe",
              borderRadius: 100, padding: "6px 16px", marginBottom: isDesktop ? 28 : 20,
              fontSize: is4k ? 15 : 13, fontWeight: 500, color: "var(--accent)",
            }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--accent)", display: "inline-block" }} />
              100% Free — No account needed
            </div>

            {/* Heading */}
            <h1 style={{
              fontFamily: "var(--font-heading)", fontWeight: 800, color: "var(--ink)",
              fontSize: is4k ? 64 : isDesktop ? 52 : isTablet ? 44 : 32,
              lineHeight: 1.15, letterSpacing: "-0.02em",
              maxWidth: is4k ? 900 : isDesktop ? 720 : 600, margin: "0 auto",
              marginBottom: isDesktop ? 20 : 14,
            }}>
              Pass your test on the{" "}
              <span style={{ fontStyle: "italic", background: "linear-gradient(135deg, #2563eb, #7c3aed)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>first try</span>
            </h1>

            {/* Subtitle */}
            <p style={{
              fontSize: is4k ? 20 : isDesktop ? 18 : 16, lineHeight: 1.6,
              color: "var(--ink-muted)", maxWidth: is4k ? 640 : 520, margin: "0 auto",
              marginBottom: isDesktop ? 36 : 28,
            }}>
              Practice with real questions, track your progress, and feel confident on exam day.
            </p>

            {/* CTA Buttons */}
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginBottom: isDesktop ? 48 : 32 }}>
              <button onClick={() => onNavigate("categories")} className="tap-target" style={{
                padding: is4k ? "16px 36px" : "14px 28px", borderRadius: 14, border: "none", cursor: "pointer",
                background: "var(--ink)", color: "white",
                fontFamily: "var(--font-body)", fontSize: is4k ? 17 : 15, fontWeight: 600,
                transition: "transform 0.2s, box-shadow 0.2s",
                boxShadow: "0 4px 24px rgba(26,26,46,0.15)",
              }}>
                Start Practicing →
              </button>
              <button onClick={() => onNavigate("progress")} className="tap-target" style={{
                padding: is4k ? "16px 36px" : "14px 28px", borderRadius: 14, cursor: "pointer",
                background: "var(--surface-raised)", color: "var(--ink)",
                fontFamily: "var(--font-body)", fontSize: is4k ? 17 : 15, fontWeight: 600,
                border: "1.5px solid var(--border)",
                transition: "transform 0.2s, border-color 0.2s",
              }}>
                View Progress
              </button>
            </div>

            {/* Stats row */}
            <div style={{
              display: "flex", justifyContent: "center", gap: isDesktop ? 32 : 16, flexWrap: "wrap",
            }}>
              {[
                { icon: "📝", label: "Questions", value: "100+" },
                { icon: "🎯", label: "Pass Rate", value: "94%" },
                { icon: "🇺🇸", label: "Region", value: "USA" },
                { icon: "⏱️", label: "Avg Time", value: "15 min" },
              ].map((s, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "center", gap: 8,
                  fontSize: is4k ? 14 : 13, color: "var(--ink-light)",
                }}>
                  <span style={{ fontSize: is4k ? 18 : 16 }}>{s.icon}</span>
                  <span><strong style={{ color: "var(--ink)" }}>{s.value}</strong> {s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </section>

      {/* Category Cards */}
      <section style={{ paddingBottom: bp === "mobile" ? 100 : isDesktop ? 80 : 60 }}>
        <Container bp={bp}>
          <h2 className="anim-fade-up" style={{
            fontFamily: "var(--font-heading)", fontWeight: 700,
            fontSize: is4k ? 36 : isDesktop ? 30 : 24,
            marginBottom: 8, color: "var(--ink)",
          }}>Choose your test</h2>
          <p className="anim-fade-up anim-d1" style={{ fontSize: is4k ? 17 : 15, color: "var(--ink-muted)", marginBottom: isDesktop ? 32 : 24 }}>
            Start with any category and track your improvement
          </p>

          <div style={{
            display: "grid",
            gridTemplateColumns: is4k ? "repeat(4, 1fr)" : isDesktop ? "repeat(4, 1fr)" : isTablet ? "repeat(2, 1fr)" : "1fr",
            gap: is4k ? 20 : 16,
          }}>
            {testCategories.map((cat, i) => (
              <button key={cat.id} onClick={() => onNavigate("category", cat.id)}
                className={`anim-fade-up anim-d${i + 1} hover-lift tap-target`}
                style={{
                  textAlign: "left", padding: is4k ? 28 : isDesktop ? 24 : 20,
                  borderRadius: 20, border: "1.5px solid var(--border)",
                  background: "var(--surface-raised)", cursor: "pointer",
                  transition: "all 0.3s ease",
                }}>
                <div style={{
                  width: is4k ? 56 : 48, height: is4k ? 56 : 48, borderRadius: 16,
                  background: `linear-gradient(135deg, ${cat.accent}15, ${cat.accent}08)`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: is4k ? 26 : 24, marginBottom: 16,
                  border: `1px solid ${cat.accent}20`,
                }}>
                  {cat.icon}
                </div>
                <h3 style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: is4k ? 20 : 18, marginBottom: 4, color: "var(--ink)" }}>{cat.name}</h3>
                <p style={{ fontSize: is4k ? 14 : 13, color: "var(--ink-muted)", lineHeight: 1.5, marginBottom: 12 }}>{cat.description}</p>
                <span style={{ fontSize: is4k ? 14 : 13, fontWeight: 600, color: cat.accent }}>
                  {cat.tests.length} test{cat.tests.length > 1 ? "s" : ""} →
                </span>
              </button>
            ))}
          </div>
        </Container>
      </section>

      {/* Features */}
      <section style={{ background: "var(--surface-sunken)", borderTop: "1px solid var(--border)", padding: isDesktop ? "72px 0" : "48px 0", marginBottom: bp === "mobile" ? 60 : 0 }}>
        <Container bp={bp}>
          <div style={{ textAlign: "center", marginBottom: isDesktop ? 40 : 28 }}>
            <h2 style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: is4k ? 32 : isDesktop ? 28 : 22, marginBottom: 8, color: "var(--ink)" }}>Why QuizLane?</h2>
            <p style={{ fontSize: is4k ? 17 : 15, color: "var(--ink-muted)" }}>Built for results, not just practice</p>
          </div>
          <div style={{
            display: "grid",
            gridTemplateColumns: isDesktop ? "repeat(3, 1fr)" : isTablet ? "repeat(3, 1fr)" : "1fr",
            gap: is4k ? 24 : 16,
          }}>
            {[
              { icon: "🎯", title: "Real Questions", desc: "Modeled after the actual exam format and difficulty level." },
              { icon: "📊", title: "Smart Tracking", desc: "See weak areas, track improvement, know when you're ready." },
              { icon: "💡", title: "Learn Why", desc: "Detailed explanations so you understand, not just memorize." },
            ].map((f, i) => (
              <div key={i} className={`anim-fade-up anim-d${i + 1}`} style={{
                background: "var(--surface-raised)", borderRadius: 18, padding: is4k ? 32 : 24,
                border: "1px solid var(--border)",
              }}>
                <span style={{ fontSize: is4k ? 32 : 28, display: "block", marginBottom: 14 }}>{f.icon}</span>
                <h3 style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: is4k ? 20 : 18, marginBottom: 6, color: "var(--ink)" }}>{f.title}</h3>
                <p style={{ fontSize: is4k ? 15 : 14, color: "var(--ink-muted)", lineHeight: 1.6 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>
    </div>
  );
};

/* ═══════════════════════════════════════════
   CATEGORIES PAGE
   ═══════════════════════════════════════════ */
const CategoriesPage = ({ onNavigate, stats, bp }) => {
  const is4k = bp === "4k";
  const isDesktop = bp === "desktop" || is4k;
  const isTablet = bp === "tablet";
  return (
    <Container bp={bp}>
      <div style={{ padding: isDesktop ? "40px 0 80px" : "24px 0 100px" }}>
        <h1 className="anim-fade-up" style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: is4k ? 36 : isDesktop ? 30 : 24, marginBottom: 4 }}>All Practice Tests</h1>
        <p className="anim-fade-up anim-d1" style={{ fontSize: is4k ? 17 : 15, color: "var(--ink-muted)", marginBottom: isDesktop ? 32 : 24 }}>Choose a category to get started</p>
        <div style={{
          display: "grid",
          gridTemplateColumns: is4k ? "repeat(2, 1fr)" : isDesktop ? "repeat(2, 1fr)" : isTablet ? "repeat(2, 1fr)" : "1fr",
          gap: is4k ? 20 : 16,
        }}>
          {testCategories.map((cat, i) => {
            const total = cat.tests.reduce((s, t) => s + (stats[t.id]?.attempts || 0), 0);
            return (
              <button key={cat.id} onClick={() => onNavigate("category", cat.id)}
                className={`anim-fade-up anim-d${i + 1} hover-lift tap-target`}
                style={{
                  textAlign: "left", padding: is4k ? 28 : 24,
                  borderRadius: 20, border: "1.5px solid var(--border)",
                  background: "var(--surface-raised)", cursor: "pointer",
                  transition: "all 0.3s ease",
                }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 16 }}>
                  <div style={{
                    width: 52, height: 52, borderRadius: 16,
                    background: `linear-gradient(135deg, ${cat.accent}15, ${cat.accent}08)`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 26, border: `1px solid ${cat.accent}20`,
                  }}>{cat.icon}</div>
                  {total > 0 && <span style={{ fontSize: 12, fontWeight: 600, color: "var(--accent)", background: "var(--accent-soft)", padding: "4px 10px", borderRadius: 20 }}>{total} attempt{total > 1 ? "s" : ""}</span>}
                </div>
                <h3 style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: is4k ? 22 : 19, marginBottom: 4 }}>{cat.name}</h3>
                <p style={{ fontSize: 14, color: "var(--ink-muted)", marginBottom: 12, lineHeight: 1.5 }}>{cat.description}</p>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 13, color: "var(--ink-muted)" }}>{cat.tests.length} test{cat.tests.length > 1 ? "s" : ""}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: cat.accent }}>Practice →</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </Container>
  );
};

/* ═══════════════════════════════════════════
   CATEGORY DETAIL PAGE
   ═══════════════════════════════════════════ */
const CategoryPage = ({ categoryId, onNavigate, stats, bp }) => {
  const cat = testCategories.find((c) => c.id === categoryId);
  if (!cat) return null;
  const is4k = bp === "4k";
  const isDesktop = bp === "desktop" || is4k;
  return (
    <Container bp={bp}>
      <div style={{ maxWidth: is4k ? 900 : 740, padding: isDesktop ? "40px 0 80px" : "20px 0 100px" }}>
        <button onClick={() => onNavigate("categories")} className="tap-target anim-fade-up" style={{
          background: "none", border: "none", cursor: "pointer", fontSize: 14,
          color: "var(--ink-muted)", marginBottom: 20, fontFamily: "var(--font-body)",
          display: "flex", alignItems: "center", gap: 6,
        }}>← Back to all tests</button>
        <div className="anim-fade-up anim-d1" style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 28 }}>
          <div style={{
            width: is4k ? 68 : 56, height: is4k ? 68 : 56, borderRadius: 18,
            background: `linear-gradient(135deg, ${cat.accent}15, ${cat.accent}08)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: is4k ? 32 : 28, border: `1px solid ${cat.accent}20`,
          }}>{cat.icon}</div>
          <div>
            <h1 style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: is4k ? 32 : 26, lineHeight: 1.2 }}>{cat.name}</h1>
            <p style={{ fontSize: is4k ? 16 : 14, color: "var(--ink-muted)", marginTop: 2 }}>{cat.description}</p>
          </div>
        </div>
        <div style={{ display: "grid", gap: 12 }}>
          {cat.tests.map((test, i) => {
            const ts = stats[test.id]; const attempts = ts?.attempts || 0; const best = ts?.bestScore || 0;
            return (
              <div key={test.id} className={`anim-fade-up anim-d${i + 2}`} style={{
                background: "var(--surface-raised)", borderRadius: 18, padding: is4k ? 28 : 20,
                border: "1.5px solid var(--border)",
              }}>
                <div style={{ display: "flex", flexDirection: bp === "mobile" ? "column" : "row", justifyContent: "space-between", alignItems: bp === "mobile" ? "stretch" : "center", gap: 16 }}>
                  <div style={{ display: "flex", gap: 14, alignItems: "start" }}>
                    <span style={{ fontSize: is4k ? 36 : 30, lineHeight: 1 }}>{test.icon}</span>
                    <div>
                      <h3 style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: is4k ? 20 : 17, marginBottom: 4 }}>{test.name}</h3>
                      <p style={{ fontSize: 13, color: "var(--ink-muted)", marginBottom: 10 }}>{test.description}</p>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                        {[`${test.questionCount} Qs`, `⏱ ${test.timeLimit} min`, `🎯 ${test.passingScore}%`].map((tag, j) => (
                          <span key={j} style={{ fontSize: 12, fontWeight: 500, background: "var(--surface-sunken)", color: "var(--ink-light)", padding: "3px 10px", borderRadius: 8 }}>{tag}</span>
                        ))}
                        {attempts > 0 && <span style={{ fontSize: 12, fontWeight: 600, background: best >= test.passingScore ? "var(--success-soft)" : "var(--warm-soft)", color: best >= test.passingScore ? "var(--success)" : "var(--warm)", padding: "3px 10px", borderRadius: 8 }}>Best: {best}%</span>}
                      </div>
                    </div>
                  </div>
                  <button onClick={() => onNavigate("quiz", test.id)} className="tap-target" style={{
                    padding: "12px 24px", borderRadius: 12, border: "none", cursor: "pointer",
                    background: "var(--ink)", color: "white",
                    fontFamily: "var(--font-body)", fontSize: 14, fontWeight: 600, whiteSpace: "nowrap",
                    transition: "transform 0.2s", flexShrink: 0,
                  }}>{attempts > 0 ? "Try Again" : "Start Test"}</button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Container>
  );
};

/* ═══════════════════════════════════════════
   QUIZ PAGE
   ═══════════════════════════════════════════ */
const QuizPage = ({ testId, onNavigate, onComplete, bp }) => {
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState(null);
  const [showExp, setShowExp] = useState(false);
  const [answers, setAnswers] = useState([]);
  const [done, setDone] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);
  const [startTime] = useState(Date.now());
  const questions = questionBank[testId] || questionBank["car-permit"].slice(0, 10);
  const testInfo = testCategories.flatMap((c) => c.tests).find((t) => t.id === testId);
  const is4k = bp === "4k";
  const isDesktop = bp === "desktop" || is4k;

  useEffect(() => { if (testInfo) setTimeLeft(testInfo.timeLimit * 60); }, [testInfo]);
  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0 || done) return;
    const t = setInterval(() => setTimeLeft((v) => { if (v <= 1) { clearInterval(t); setDone(true); return 0; } return v - 1; }), 1000);
    return () => clearInterval(t);
  }, [timeLeft, done]);

  const pick = (i) => { if (showExp) return; setSelected(i); setShowExp(true); setAnswers([...answers, { qId: questions[currentQ].id, sel: i, cor: questions[currentQ].correct }]); };
  const next = () => { if (currentQ < questions.length - 1) { setCurrentQ(currentQ + 1); setSelected(null); setShowExp(false); } else setDone(true); };
  const fmt = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
  const correctN = answers.filter((a) => a.sel === a.cor).length;
  const score = Math.round((correctN / questions.length) * 100);
  const passed = testInfo && score >= testInfo.passingScore;

  useEffect(() => { if (done && testInfo) onComplete(testId, { score, correct: correctN, total: questions.length, timeSpent: Math.round((Date.now() - startTime) / 1000), passed }); }, [done]);

  if (done) {
    return (
      <Container bp={bp}>
        <div style={{ maxWidth: is4k ? 720 : 600, margin: "0 auto", padding: isDesktop ? "48px 0" : "20px 0 100px" }}>
          <div className="anim-scale-in" style={{ background: "var(--surface-raised)", borderRadius: 24, border: "1.5px solid var(--border)", overflow: "hidden" }}>
            <div style={{ padding: is4k ? 48 : 36, textAlign: "center", background: passed ? "var(--success-soft)" : "var(--warm-soft)" }}>
              <div style={{ fontSize: is4k ? 64 : 52, marginBottom: 12 }}>{passed ? "🎉" : "💪"}</div>
              <h2 style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: is4k ? 30 : 24, marginBottom: 8 }}>{passed ? "You Passed!" : "Keep Practicing!"}</h2>
              <p style={{ fontSize: is4k ? 16 : 14, color: "var(--ink-light)" }}>{passed ? "You're ready for the real test!" : `You need ${testInfo?.passingScore}% to pass.`}</p>
            </div>
            <div style={{ padding: is4k ? 36 : 28 }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 24 }}>
                {[{ v: `${score}%`, l: "Score", c: "var(--ink)" },{ v: correctN, l: "Correct", c: "var(--success)" },{ v: questions.length - correctN, l: "Wrong", c: "var(--danger)" }].map((s, i) => (
                  <div key={i} style={{ textAlign: "center", padding: is4k ? 20 : 16, background: "var(--surface-sunken)", borderRadius: 14 }}>
                    <div style={{ fontSize: is4k ? 30 : 26, fontWeight: 700, color: s.c, fontFamily: "var(--font-heading)" }}>{s.v}</div>
                    <div style={{ fontSize: 12, color: "var(--ink-muted)", marginTop: 2 }}>{s.l}</div>
                  </div>
                ))}
              </div>
              {answers.filter((a) => a.sel !== a.cor).length > 0 && (
                <div style={{ marginBottom: 24 }}>
                  <h3 style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 16, marginBottom: 12 }}>Review Missed:</h3>
                  <div style={{ display: "grid", gap: 10 }}>
                    {answers.filter((a) => a.sel !== a.cor).map((a, i) => {
                      const q = questions.find((q) => q.id === a.qId);
                      return (
                        <div key={i} style={{ background: "var(--danger-soft)", borderRadius: 14, padding: is4k ? 20 : 16, border: "1px solid #fecaca" }}>
                          <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 6, color: "var(--ink)" }}>{q.question}</p>
                          <p style={{ fontSize: 12, color: "var(--danger)", marginBottom: 3 }}>Your answer: {q.options[a.sel]}</p>
                          <p style={{ fontSize: 12, color: "var(--success)", marginBottom: 6 }}>Correct: {q.options[q.correct]}</p>
                          <p style={{ fontSize: 12, color: "var(--ink-light)", lineHeight: 1.5 }}>{q.explanation}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              <div style={{ display: "flex", gap: 12, flexDirection: bp === "mobile" ? "column" : "row" }}>
                <button onClick={() => { setCurrentQ(0); setSelected(null); setShowExp(false); setAnswers([]); setDone(false); setTimeLeft(testInfo ? testInfo.timeLimit * 60 : 1500); }}
                  className="tap-target" style={{ flex: 1, padding: "14px 24px", borderRadius: 14, border: "none", cursor: "pointer", background: "var(--ink)", color: "white", fontFamily: "var(--font-body)", fontSize: 15, fontWeight: 600 }}>Try Again</button>
                <button onClick={() => onNavigate("categories")} className="tap-target" style={{ flex: 1, padding: "14px 24px", borderRadius: 14, cursor: "pointer", background: "var(--surface-raised)", color: "var(--ink)", fontFamily: "var(--font-body)", fontSize: 15, fontWeight: 600, border: "1.5px solid var(--border)" }}>Other Tests</button>
              </div>
            </div>
          </div>
        </div>
      </Container>
    );
  }

  const q = questions[currentQ];
  const progress = ((currentQ + (showExp ? 1 : 0)) / questions.length) * 100;

  return (
    <Container bp={bp}>
      <div style={{ maxWidth: is4k ? 720 : 600, margin: "0 auto", padding: isDesktop ? "32px 0" : "16px 0 100px" }}>
        {/* Top bar */}
        <div className="anim-fade-up" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <button onClick={() => onNavigate("categories")} className="tap-target" style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, color: "var(--ink-muted)", fontFamily: "var(--font-body)" }}>✕ Exit</button>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: "var(--ink-light)" }}>{currentQ + 1}/{questions.length}</span>
            {timeLeft !== null && (
              <span style={{
                fontSize: 13, fontFamily: "monospace", fontWeight: 600,
                padding: "4px 12px", borderRadius: 8,
                background: timeLeft < 60 ? "var(--danger-soft)" : "var(--surface-sunken)",
                color: timeLeft < 60 ? "var(--danger)" : "var(--ink-light)",
              }}>⏱ {fmt(timeLeft)}</span>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ width: "100%", height: 4, background: "var(--surface-sunken)", borderRadius: 4, marginBottom: 28, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${progress}%`, background: "var(--ink)", borderRadius: 4, transition: "width 0.5s ease" }} />
        </div>

        {/* Question card */}
        <div className="anim-scale-in" style={{ background: "var(--surface-raised)", borderRadius: 22, border: "1.5px solid var(--border)", padding: is4k ? 36 : bp === "mobile" ? 20 : 28, marginBottom: 14 }}>
          <h2 style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: is4k ? 22 : bp === "mobile" ? 17 : 19, lineHeight: 1.4, marginBottom: 24, color: "var(--ink)" }}>{q.question}</h2>
          <div style={{ display: "grid", gap: 10 }}>
            {q.options.map((opt, i) => {
              let bg = "var(--surface-raised)", border = "var(--border)", ring = "none";
              if (showExp) {
                if (i === q.correct) { bg = "var(--success-soft)"; border = "#86efac"; ring = "0 0 0 2px #22c55e"; }
                else if (i === selected) { bg = "var(--danger-soft)"; border = "#fca5a5"; ring = "0 0 0 2px #ef4444"; }
                else { bg = "var(--surface-sunken)"; border = "var(--border-light)"; }
              }
              return (
                <button key={i} onClick={() => pick(i)} disabled={showExp}
                  className="tap-target"
                  style={{
                    width: "100%", textAlign: "left",
                    padding: is4k ? "18px 20px" : "14px 16px",
                    borderRadius: 14, border: `1.5px solid ${border}`,
                    background: bg, cursor: showExp ? "default" : "pointer",
                    display: "flex", alignItems: "start", gap: 12,
                    transition: "all 0.2s", boxShadow: ring !== "none" ? ring : "none",
                    opacity: showExp && i !== q.correct && i !== selected ? 0.45 : 1,
                    fontFamily: "var(--font-body)",
                  }}>
                  <span style={{
                    width: is4k ? 32 : 28, height: is4k ? 32 : 28, borderRadius: 9, flexShrink: 0,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 12, fontWeight: 700, marginTop: 1,
                    background: showExp && i === q.correct ? "var(--success)" : showExp && i === selected ? "var(--danger)" : "var(--surface-sunken)",
                    color: (showExp && (i === q.correct || i === selected)) ? "white" : "var(--ink-light)",
                  }}>
                    {showExp && i === q.correct ? "✓" : showExp && i === selected ? "✗" : String.fromCharCode(65 + i)}
                  </span>
                  <span style={{ fontSize: is4k ? 16 : 14, color: "var(--ink)", lineHeight: 1.5 }}>{opt}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Explanation */}
        {showExp && (
          <div className="anim-fade-up" style={{ background: "var(--accent-soft)", borderRadius: 18, border: "1px solid #bfdbfe", padding: is4k ? 24 : 18, marginBottom: 14 }}>
            <div style={{ display: "flex", gap: 10, alignItems: "start" }}>
              <span style={{ fontSize: 18 }}>💡</span>
              <div>
                <h4 style={{ fontWeight: 600, fontSize: 13, marginBottom: 4, color: "var(--ink)" }}>Explanation</h4>
                <p style={{ fontSize: is4k ? 15 : 14, color: "var(--ink-light)", lineHeight: 1.6 }}>{q.explanation}</p>
              </div>
            </div>
          </div>
        )}

        {/* Next button */}
        {showExp && (
          <button onClick={next} className="tap-target anim-fade-up" style={{
            width: "100%", padding: "16px", borderRadius: 14, border: "none", cursor: "pointer",
            background: "var(--ink)", color: "white",
            fontFamily: "var(--font-body)", fontSize: 15, fontWeight: 600,
          }}>
            {currentQ < questions.length - 1 ? "Next Question →" : "See Results"}
          </button>
        )}
      </div>
    </Container>
  );
};

/* ═══════════════════════════════════════════
   PROGRESS PAGE
   ═══════════════════════════════════════════ */
const ProgressPage = ({ stats, onNavigate, bp }) => {
  const all = testCategories.flatMap((c) => c.tests);
  const completed = all.filter((t) => stats[t.id]?.attempts > 0);
  const totalA = Object.values(stats).reduce((s, v) => s + (v.attempts || 0), 0);
  const avg = completed.length > 0 ? Math.round(completed.reduce((s, t) => s + (stats[t.id]?.bestScore || 0), 0) / completed.length) : 0;
  const is4k = bp === "4k";
  const isDesktop = bp === "desktop" || is4k;
  const isTablet = bp === "tablet";

  return (
    <Container bp={bp}>
      <div style={{ padding: isDesktop ? "40px 0 80px" : "24px 0 100px" }}>
        <h1 className="anim-fade-up" style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: is4k ? 36 : isDesktop ? 30 : 24, marginBottom: 4 }}>Your Progress</h1>
        <p className="anim-fade-up anim-d1" style={{ fontSize: is4k ? 17 : 15, color: "var(--ink-muted)", marginBottom: isDesktop ? 32 : 24 }}>Track performance across all tests</p>

        {/* Stats grid */}
        <div className="anim-fade-up anim-d2" style={{
          display: "grid",
          gridTemplateColumns: bp === "mobile" ? "repeat(2, 1fr)" : "repeat(4, 1fr)",
          gap: is4k ? 20 : 12, marginBottom: isDesktop ? 40 : 28,
        }}>
          {[{ l: "Tests Taken", v: totalA, i: "📝" },{ l: "Passed", v: Object.values(stats).filter((s) => s.passed).length, i: "✅" },{ l: "Avg Score", v: `${avg}%`, i: "📊" },{ l: "Coverage", v: `${completed.length}/${all.length}`, i: "🎯" }].map((s, idx) => (
            <div key={idx} style={{ background: "var(--surface-raised)", borderRadius: 18, padding: is4k ? 28 : 20, border: "1px solid var(--border)", textAlign: "center" }}>
              <span style={{ fontSize: is4k ? 28 : 24, display: "block", marginBottom: 8 }}>{s.i}</span>
              <div style={{ fontSize: is4k ? 28 : 24, fontWeight: 700, fontFamily: "var(--font-heading)", color: "var(--ink)" }}>{s.v}</div>
              <div style={{ fontSize: 12, color: "var(--ink-muted)", marginTop: 2 }}>{s.l}</div>
            </div>
          ))}
        </div>

        <h2 className="anim-fade-up anim-d3" style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: is4k ? 22 : 18, marginBottom: 14 }}>Test History</h2>
        {completed.length === 0 ? (
          <div className="anim-fade-up anim-d4" style={{ background: "var(--surface-raised)", borderRadius: 22, border: "1.5px solid var(--border)", padding: isDesktop ? 64 : 48, textAlign: "center" }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>📋</div>
            <h3 style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 18, marginBottom: 8 }}>No tests taken yet</h3>
            <p style={{ fontSize: 14, color: "var(--ink-muted)", marginBottom: 24 }}>Take your first test to start tracking!</p>
            <button onClick={() => onNavigate("categories")} className="tap-target" style={{ padding: "12px 24px", borderRadius: 12, border: "none", cursor: "pointer", background: "var(--ink)", color: "white", fontFamily: "var(--font-body)", fontSize: 14, fontWeight: 600 }}>Browse Tests</button>
          </div>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {completed.map((test, i) => {
              const s = stats[test.id];
              return (
                <div key={test.id} className={`anim-fade-up anim-d${i + 4}`} style={{
                  background: "var(--surface-raised)", borderRadius: 16, padding: is4k ? 24 : 18,
                  border: "1px solid var(--border)",
                  display: "flex", flexDirection: bp === "mobile" ? "column" : "row",
                  alignItems: bp === "mobile" ? "stretch" : "center",
                  justifyContent: "space-between", gap: 12,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ fontSize: 24 }}>{test.icon}</span>
                    <div>
                      <h3 style={{ fontWeight: 600, fontSize: is4k ? 16 : 15 }}>{test.name}</h3>
                      <p style={{ fontSize: 12, color: "var(--ink-muted)" }}>{s.attempts} attempt{s.attempts > 1 ? "s" : ""} • Best: {s.bestScore}%</p>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: is4k ? 160 : 120, height: 6, background: "var(--surface-sunken)", borderRadius: 4, overflow: "hidden" }}>
                      <div style={{ height: "100%", borderRadius: 4, width: `${s.bestScore}%`, background: s.bestScore >= test.passingScore ? "var(--success)" : "var(--warm)", transition: "width 0.5s" }} />
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 700, minWidth: 36, color: s.bestScore >= test.passingScore ? "var(--success)" : "var(--warm)" }}>{s.bestScore}%</span>
                    <button onClick={() => onNavigate("quiz", test.id)} className="tap-target" style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, color: "var(--accent)", fontFamily: "var(--font-body)", whiteSpace: "nowrap" }}>Retry →</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Container>
  );
};

/* ═══════════════════════════════════════════
   FOOTER
   ═══════════════════════════════════════════ */
const Footer = ({ bp }) => {
  if (bp === "mobile") return null;
  return (
    <footer style={{ borderTop: "1px solid var(--border)", padding: "24px 0", marginTop: "auto" }}>
      <Container bp={bp}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 24, height: 24, borderRadius: 8, background: "linear-gradient(135deg, #2563eb, #7c3aed)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: "white", fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 12 }}>Q</span>
            </div>
            <span style={{ fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 14, color: "var(--ink-light)" }}>QuizLane</span>
          </div>
          <p style={{ fontSize: 13, color: "var(--ink-muted)" }}>© 2026 QuizLane. Free test prep for everyone.</p>
        </div>
      </Container>
    </footer>
  );
};

/* ═══════════════════════════════════════════
   MAIN APP
   ═══════════════════════════════════════════ */
export default function App() {
  const bp = useBreakpoint();
  const [view, setView] = useState("home");
  const [viewData, setViewData] = useState(null);
  const [stats, setStats] = useState({});

  const nav = useCallback((v, d = null) => { setView(v); setViewData(d); window.scrollTo({ top: 0, behavior: "smooth" }); }, []);
  const onDone = useCallback((id, r) => { setStats((p) => { const e = p[id] || { attempts: 0, bestScore: 0, passed: false, history: [] }; return { ...p, [id]: { attempts: e.attempts + 1, bestScore: Math.max(e.bestScore, r.score), passed: e.passed || r.passed, lastScore: r.score, history: [...(e.history || []), r] } }; }); }, []);

  const renderView = () => {
    switch (view) {
      case "home": return <HomePage onNavigate={nav} bp={bp} />;
      case "categories": return <CategoriesPage onNavigate={nav} stats={stats} bp={bp} />;
      case "category": return <CategoryPage categoryId={viewData} onNavigate={nav} stats={stats} bp={bp} />;
      case "quiz": return <QuizPage testId={viewData} onNavigate={nav} onComplete={onDone} bp={bp} />;
      case "progress": return <ProgressPage stats={stats} onNavigate={nav} bp={bp} />;
      default: return <HomePage onNavigate={nav} bp={bp} />;
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", position: "relative" }}>
      <GlobalStyles />
      <div className="grain" />

      {/* Navigation: Mobile = bottom bar, Tablet = sidebar, Desktop/4K = top header */}
      {bp === "mobile" && <MobileNav currentView={view} onNavigate={nav} />}
      {bp === "tablet" && <TabletSidebar currentView={view} onNavigate={nav} />}
      {(bp === "desktop" || bp === "4k") && <DesktopHeader currentView={view} onNavigate={nav} is4k={bp === "4k"} />}

      <main style={{ flex: 1 }}>{renderView()}</main>
      <Footer bp={bp} />
    </div>
  );
}
