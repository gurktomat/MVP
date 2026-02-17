/* ═══════════════════════════════════════════
   STATE DMV LANDING PAGE
   Unique SEO content for each state's DMV test
   Shows state info, FAQs, sample questions before quiz
   ═══════════════════════════════════════════ */

import { useState } from "react";
import { STATE_INFO } from "../data/stateInfo.js";
import { getStateFullName } from "../utils/routes.js";
import { questionBank } from "../data/questions.js";

const YEAR = new Date().getFullYear();

export default function StateLandingPage({ testId, stateAbbrev, onStartQuiz, onNavigate, bp }) {
  const info = STATE_INFO[stateAbbrev];
  const stateName = getStateFullName(stateAbbrev) || stateAbbrev;
  const is4k = bp === "4k";
  const isDesktop = bp === "desktop" || is4k;
  const isMobile = bp === "mobile";

  // Get 3 sample questions
  const questions = questionBank[testId] || [];
  const sampleQuestions = questions.slice(0, 3);

  const [expandedFaq, setExpandedFaq] = useState(null);
  const [showSamples, setShowSamples] = useState(false);

  if (!info) {
    // Fallback: just start quiz immediately
    onStartQuiz();
    return null;
  }

  const maxW = is4k ? 900 : 780;
  const pad = isMobile ? 16 : isDesktop ? 48 : 32;

  return (
    <div style={{ maxWidth: maxW, margin: "0 auto", padding: `${pad}px ${isMobile ? 16 : 0}px ${isMobile ? 100 : pad}px` }}>
      {/* Breadcrumb */}
      <nav style={{ fontSize: 13, color: "var(--ink-muted)", marginBottom: 16, display: "flex", gap: 6, flexWrap: "wrap" }}>
        <span style={{ cursor: "pointer", textDecoration: "underline" }} onClick={() => onNavigate("home")}>Home</span>
        <span>/</span>
        <span style={{ cursor: "pointer", textDecoration: "underline" }} onClick={() => onNavigate("categories")}>Practice Tests</span>
        <span>/</span>
        <span style={{ cursor: "pointer", textDecoration: "underline" }} onClick={() => onNavigate("category", "driving")}>Driving</span>
        <span>/</span>
        <span style={{ color: "var(--ink)" }}>{stateName} DMV</span>
      </nav>

      {/* Hero */}
      <div style={{
        background: "var(--surface-raised)", borderRadius: 20, border: "1.5px solid var(--border)",
        padding: isMobile ? 24 : 40, marginBottom: 24, boxShadow: "var(--shadow-lg)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
          <span style={{ fontSize: 40 }}>🚗</span>
          <div>
            <h1 style={{ fontSize: isMobile ? 22 : 28, fontWeight: 800, color: "var(--ink)", margin: 0, lineHeight: 1.2 }}>
              Free {stateName} DMV Practice Test {YEAR}
            </h1>
            <p style={{ fontSize: 14, color: "var(--ink-muted)", margin: "4px 0 0" }}>
              {info.dmvName}
            </p>
          </div>
        </div>

        <p style={{ fontSize: 15, color: "var(--ink-light)", lineHeight: 1.6, margin: "0 0 24px" }}>
          {info.description}
        </p>

        <button
          onClick={onStartQuiz}
          style={{
            width: "100%", padding: "16px 24px", fontSize: 17, fontWeight: 700,
            background: "var(--gradient-accent)", color: "#fff", border: "none",
            borderRadius: 14, cursor: "pointer", transition: "transform 0.15s, box-shadow 0.15s",
            boxShadow: "0 4px 14px rgba(59,130,246,0.3)",
          }}
          onMouseEnter={e => { e.target.style.transform = "translateY(-2px)"; e.target.style.boxShadow = "0 6px 20px rgba(59,130,246,0.4)"; }}
          onMouseLeave={e => { e.target.style.transform = ""; e.target.style.boxShadow = "0 4px 14px rgba(59,130,246,0.3)"; }}
        >
          Start {stateName} Practice Test →
        </button>
      </div>

      {/* Quick Facts Grid */}
      <div style={{
        display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)",
        gap: 12, marginBottom: 24,
      }}>
        {[
          { label: "Questions", value: info.writtenTestQuestions, icon: "📝" },
          { label: "Pass Score", value: `${info.passingPercent}%`, icon: "✅" },
          { label: "Min Age", value: info.minPermitAge, icon: "🎂" },
          { label: "Permit Fee", value: info.permitFee, icon: "💰" },
        ].map((fact, i) => (
          <div key={i} style={{
            background: "var(--surface-raised)", borderRadius: 14, border: "1px solid var(--border)",
            padding: isMobile ? "14px 12px" : "16px", textAlign: "center",
          }}>
            <div style={{ fontSize: 24, marginBottom: 4 }}>{fact.icon}</div>
            <div style={{ fontSize: isMobile ? 18 : 20, fontWeight: 800, color: "var(--ink)" }}>{fact.value}</div>
            <div style={{ fontSize: 12, color: "var(--ink-muted)", marginTop: 2 }}>{fact.label}</div>
          </div>
        ))}
      </div>

      {/* What to Expect Section */}
      <div style={{
        background: "var(--surface-raised)", borderRadius: 16, border: "1px solid var(--border)",
        padding: isMobile ? 20 : 28, marginBottom: 24,
      }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--ink)", margin: "0 0 12px" }}>
          What to Expect on the {stateName} Written Test
        </h2>
        <p style={{ fontSize: 14, color: "var(--ink-light)", lineHeight: 1.7, margin: 0 }}>
          The {stateName} {info.dmvName.split("(")[0].trim()} written knowledge test consists of {info.writtenTestQuestions} multiple-choice
          questions covering road signs, traffic laws, safe driving practices, and {stateName}-specific regulations. You need to answer at
          least {info.passingScore} questions correctly ({info.passingPercent}%) to pass. Our practice test mirrors the format and difficulty
          of the actual exam, with instant feedback and detailed explanations for every question.
        </p>
      </div>

      {/* Sample Questions */}
      {sampleQuestions.length > 0 && (
        <div style={{
          background: "var(--surface-raised)", borderRadius: 16, border: "1px solid var(--border)",
          padding: isMobile ? 20 : 28, marginBottom: 24,
        }}>
          <button
            onClick={() => setShowSamples(!showSamples)}
            style={{
              display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%",
              background: "none", border: "none", cursor: "pointer", padding: 0,
            }}
          >
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--ink)", margin: 0 }}>
              Sample Questions
            </h2>
            <span style={{ fontSize: 20, color: "var(--ink-muted)", transform: showSamples ? "rotate(180deg)" : "", transition: "transform 0.2s" }}>
              ▼
            </span>
          </button>

          {showSamples && (
            <div style={{ marginTop: 16 }}>
              {sampleQuestions.map((q, i) => (
                <div key={i} style={{
                  padding: "14px 0",
                  borderBottom: i < sampleQuestions.length - 1 ? "1px solid var(--border)" : "none",
                }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)", margin: "0 0 8px" }}>
                    {i + 1}. {q.question}
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {q.options.map((opt, j) => (
                      <span key={j} style={{
                        fontSize: 13, color: j === q.correct ? "var(--success)" : "var(--ink-muted)",
                        fontWeight: j === q.correct ? 600 : 400,
                        paddingLeft: 12,
                      }}>
                        {String.fromCharCode(65 + j)}. {opt} {j === q.correct ? " ✓" : ""}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* FAQ Section */}
      {info.faqs?.length > 0 && (
        <div style={{
          background: "var(--surface-raised)", borderRadius: 16, border: "1px solid var(--border)",
          padding: isMobile ? 20 : 28, marginBottom: 24,
        }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--ink)", margin: "0 0 16px" }}>
            Frequently Asked Questions
          </h2>
          {info.faqs.map((faq, i) => (
            <details
              key={i}
              open={expandedFaq === i}
              onToggle={(e) => setExpandedFaq(e.target.open ? i : null)}
              style={{
                borderBottom: i < info.faqs.length - 1 ? "1px solid var(--border)" : "none",
                padding: "12px 0",
              }}
            >
              <summary style={{
                fontSize: 14, fontWeight: 600, color: "var(--ink)", cursor: "pointer",
                listStyle: "none", display: "flex", alignItems: "center", justifyContent: "space-between",
              }}>
                <span>{faq.q}</span>
                <span style={{ fontSize: 16, color: "var(--ink-muted)", flexShrink: 0, marginLeft: 12 }}>
                  {expandedFaq === i ? "−" : "+"}
                </span>
              </summary>
              <p style={{ fontSize: 13, color: "var(--ink-light)", lineHeight: 1.7, margin: "8px 0 0", paddingLeft: 0 }}>
                {faq.a}
              </p>
            </details>
          ))}
        </div>
      )}

      {/* Official DMV Link */}
      <div style={{
        background: "var(--surface-sunken)", borderRadius: 14, border: "1px solid var(--border)",
        padding: isMobile ? 16 : 20, marginBottom: 24, display: "flex", alignItems: "center",
        gap: 12, flexWrap: "wrap",
      }}>
        <span style={{ fontSize: 20 }}>🏛️</span>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ fontSize: 13, color: "var(--ink-muted)" }}>Official Website</div>
          <a
            href={info.officialUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: 14, color: "var(--accent)", fontWeight: 600, textDecoration: "none" }}
          >
            Visit {info.dmvName.split("(")[0].trim()} →
          </a>
        </div>
      </div>

      {/* Bottom CTA */}
      <button
        onClick={onStartQuiz}
        style={{
          width: "100%", padding: "16px 24px", fontSize: 17, fontWeight: 700,
          background: "var(--gradient-accent)", color: "#fff", border: "none",
          borderRadius: 14, cursor: "pointer", marginBottom: 16,
          boxShadow: "0 4px 14px rgba(59,130,246,0.3)",
        }}
      >
        Start Free {stateName} Practice Test →
      </button>

      <p style={{ textAlign: "center", fontSize: 12, color: "var(--ink-muted)" }}>
        No account needed • 100% free • Instant results
      </p>
    </div>
  );
}
