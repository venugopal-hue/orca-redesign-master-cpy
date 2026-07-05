"use client";

import React, { useState } from "react";

const ORCA = {
  navy:      "#001f3f",
  navyMid:   "#002855",
  navyLight: "#003366",
  gold:      "#FF9933",
  white:     "#ffffff",
  offWhite:  "#f8fafc",
  textDark:  "#1e293b",
  textGray:  "#475569",
  textMuted: "#94a3b8",
  border:    "#cbd5e1",
  red:       "#ef4444",
  green:     "#10b981",
  shadow:    "0 1px 3px rgba(0,0,0,0.08)",
};

interface FAQItem {
  q: string;
  a: string;
  cat: string;
}

const FAQS: FAQItem[] = [
  {
    q: "How do I request a password reset or change?",
    a: "If you have mapped your official KSP email, use the 'Forgot Password' link on the login screen. For security reasons, standard password resets require verification. If you are locked out, contact your district administrator or use the support form below.",
    cat: "Account & Login"
  },
  {
    q: "Why am I seeing 'Badge ID Mapping Failed' during registration?",
    a: "This happens when the Badge ID entered does not match the official KSP personnel registry. Ensure your first name, last name, and Badge ID are typed exactly as they appear in your service records. If the problem persists, your unit records officer may need to update your details.",
    cat: "Registration"
  },
  {
    q: "What browsers are officially supported?",
    a: "O.R.C.A is optimized for modern web browsers. We officially support Google Chrome (v110+), Microsoft Edge (v110+), and Mozilla Firefox (v108+). We do not recommend using legacy Internet Explorer or older Android stock browsers as dynamic AI modules will not render properly.",
    cat: "Technical Requirements"
  },
  {
    q: "Are the AI Assistant answers legally binding?",
    a: "No. The O.R.C.A AI Assistant (ZIA) is an investigative aid designed to process, search, and map complex records. All intelligence reports, criminal relationships, and summaries are indicators only and must be independently verified by the investigating officer before submission to court.",
    cat: "Platform Usage"
  },
  {
    q: "How long are inactive sessions maintained?",
    a: "For security compliance, user sessions are automatically logged out after 15 minutes of inactivity. All unsaved intelligence query records or drafts will be cleared from session memory to prevent unauthorized access.",
    cat: "Security"
  }
];

export default function TechnicalSupportPage() {
  const [mounted, setMounted] = useState(false);
  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState("All");
  const [name, setName] = useState("");
  const [badgeId, setBadgeId] = useState("");
  const [email, setEmail] = useState("");
  const [issueType, setIssueType] = useState("Login Issues");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  // Toggle FAQ visibility
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div style={{
        display: "flex", flexDirection: "column",
        height: "100vh", width: "100vw", overflow: "hidden",
        background: ORCA.offWhite, fontFamily: "'Inter', sans-serif",
        justifyContent: "center", alignItems: "center", color: ORCA.navy
      }}>
        <span>Initializing Support Portal...</span>
      </div>
    );
  }

  const categories = ["All", "Account & Login", "Registration", "Technical Requirements", "Platform Usage", "Security"];

  const filteredFaqs = FAQS.filter(faq => {
    const matchesCat = activeCat === "All" || faq.cat === activeCat;
    const matchesSearch = faq.q.toLowerCase().includes(search.toLowerCase()) || 
                          faq.a.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !badgeId || !email || !message) {
      alert("Please fill in all required fields.");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
      setName("");
      setBadgeId("");
      setEmail("");
      setMessage("");
    }, 1200);
  };

  return (
    <div style={{
      display: "flex", flexDirection: "column",
      height: "100vh", width: "100vw", overflow: "hidden",
      background: ORCA.offWhite, fontFamily: "'Inter', sans-serif",
    }}>
      {/* ── Top Bar ─────────────────────────────────────────────── */}
      <header style={{
        background: ORCA.navy, color: ORCA.white,
        padding: "0 32px", height: 56, flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        boxShadow: "0 2px 8px rgba(0,0,0,0.2)", zIndex: 100,
      }}>
        <a href="/orca-ai.html" style={{
          display: "flex", alignItems: "center", gap: 10,
          textDecoration: "none", color: "inherit",
        }}>
          <img src="/logo.png" alt="ORCA" style={{ height: 32, width: 32, objectFit: "contain" }} />
          <span style={{ fontFamily: "'Libre Baskerville', serif", fontSize: 14, fontWeight: 700, letterSpacing: "0.04em" }}>
            O.R.C.A
          </span>
          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", fontFamily: "JetBrains Mono, monospace", letterSpacing: "0.06em" }}>
            ORGANIZED CRIME ANALYSIS AUTHORITY
          </span>
        </a>
        <a href="/orca-ai.html" style={{
          background: "rgba(255,255,255,0.1)",
          border: "1px solid rgba(255,255,255,0.2)",
          color: "#fff", borderRadius: 6, padding: "6px 12px",
          cursor: "pointer", fontSize: 12, textDecoration: "none",
        }}>
          ← Home
        </a>
      </header>

      {/* ── Page Banner ─────────────────────────────────────────── */}
      <div style={{
        background: ORCA.navyMid, color: ORCA.white,
        padding: "24px 32px", flexShrink: 0,
        borderBottom: `3px solid ${ORCA.gold}`,
      }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div>
            <span style={{
              display: "inline-block", fontSize: 9, fontWeight: 800,
              letterSpacing: "0.12em", color: ORCA.gold,
              fontFamily: "JetBrains Mono, monospace",
              background: "rgba(255,153,51,0.15)", padding: "3px 10px",
              borderRadius: 4, marginBottom: 8, border: "1px solid rgba(255,153,51,0.3)",
            }}>
              HELP DESK
            </span>
            <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, letterSpacing: "-0.01em" }}>
              Technical Support Portal
            </h1>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.65)", margin: "4px 0 0" }}>
              Karnataka Police ISD Systems Support Cell
            </p>
          </div>
          <div style={{ display: "flex", gap: 20 }}>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 10, color: ORCA.gold, fontWeight: 700, fontFamily: "JetBrains Mono, monospace" }}>TECH HELPLINE</div>
              <div style={{ fontSize: 14, fontWeight: 700 }}>+91-80-2294-3000</div>
            </div>
            <div style={{ textAlign: "right", borderLeft: `1px solid rgba(255,255,255,0.15)`, paddingLeft: 20 }}>
              <div style={{ fontSize: 10, color: ORCA.gold, fontWeight: 700, fontFamily: "JetBrains Mono, monospace" }}>ISD SUPPORT EMAIL</div>
              <div style={{ fontSize: 14, fontWeight: 700 }}>isd.helpdesk@ksp.gov.in</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Content Body ────────────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: "auto", padding: "32px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "grid", gridTemplateColumns: "7fr 5fr", gap: 32 }}>
          
          {/* Left Column: FAQ Section */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: ORCA.navy, margin: 0 }}>
                Frequently Asked Questions
              </h2>
              <input
                type="search"
                placeholder="Search FAQs..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  padding: "6px 12px", fontSize: 12, borderRadius: 6,
                  border: `1px solid ${ORCA.border}`, outline: "none",
                  width: 200,
                }}
              />
            </div>

            {/* Category Filter Pills */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCat(cat)}
                  style={{
                    background: activeCat === cat ? ORCA.navy : ORCA.white,
                    color: activeCat === cat ? ORCA.white : ORCA.textGray,
                    border: `1px solid ${activeCat === cat ? ORCA.navy : ORCA.border}`,
                    borderRadius: 20, padding: "5px 12px", fontSize: 11, fontWeight: 600,
                    cursor: "pointer", transition: "all 0.15s ease",
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* FAQ List */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {filteredFaqs.length > 0 ? (
                filteredFaqs.map((faq, index) => {
                  const isExpanded = expandedFaq === index;
                  return (
                    <div
                      key={index}
                      style={{
                        background: ORCA.white, border: `1px solid ${ORCA.border}`,
                        borderRadius: 8, overflow: "hidden", transition: "all 0.2s ease",
                        boxShadow: isExpanded ? "0 4px 12px rgba(0,0,0,0.04)" : "none",
                      }}
                    >
                      <button
                        onClick={() => setExpandedFaq(isExpanded ? null : index)}
                        style={{
                          width: "100%", padding: "16px 20px", display: "flex",
                          justifyContent: "space-between", alignItems: "center",
                          background: "none", border: "none", textAlign: "left",
                          cursor: "pointer", fontWeight: 700, color: ORCA.navy,
                          fontSize: 13.5,
                        }}
                      >
                        <span>{faq.q}</span>
                        <span style={{ fontSize: 16, color: ORCA.textMuted }}>
                          {isExpanded ? "−" : "+"}
                        </span>
                      </button>
                      {isExpanded && (
                        <div style={{
                          padding: "0 20px 16px", fontSize: 13,
                          color: ORCA.textGray, lineHeight: 1.6,
                          borderTop: `1px solid ${ORCA.offWhite}`,
                          animation: "fadeIn 0.2s ease",
                        }}>
                          <p style={{ margin: 0 }}>{faq.a}</p>
                          <span style={{
                            display: "inline-block", fontSize: 9, color: ORCA.gold,
                            fontFamily: "JetBrains Mono, monospace", fontWeight: 700,
                            marginTop: 10, background: "rgba(255,153,51,0.06)",
                            padding: "2px 6px", borderRadius: 4,
                          }}>
                            {faq.cat.toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div style={{ textAlign: "center", padding: "40px", background: ORCA.white, border: `1px solid ${ORCA.border}`, borderRadius: 8, color: ORCA.textMuted }}>
                  No FAQs found matching your search.
                </div>
              )}
            </div>

            {/* Helpline Info Box */}
            <div style={{
              background: "rgba(0,31,63,0.03)", border: `1px solid ${ORCA.border}`,
              borderRadius: 8, padding: "20px", marginTop: 24, display: "flex", gap: 16,
              alignItems: "center",
            }}>
              <span style={{ fontSize: 24 }}>📞</span>
              <div>
                <h4 style={{ margin: 0, fontSize: 13.5, color: ORCA.navy, fontWeight: 700 }}>Emergency Lockouts & Critical Support</h4>
                <p style={{ margin: "4px 0 0", fontSize: 12.5, color: ORCA.textGray, lineHeight: 1.5 }}>
                  If you are locked out of your account during a critical operational case, call the ISD Operations Control Center at <strong>+91-80-2294-3012</strong>. Vetting is mandatory for bypass authentication codes.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Support Ticket Form */}
          <div>
            <div style={{ background: ORCA.white, border: `1px solid ${ORCA.border}`, borderRadius: 8, padding: "24px", boxShadow: ORCA.shadow }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: ORCA.navy, margin: "0 0 16px 0" }}>
                Submit a Support Ticket
              </h3>

              {submitted ? (
                <div style={{ textAlign: "center", padding: "20px 0" }}>
                  <div style={{ fontSize: 32, color: ORCA.green, marginBottom: 12 }}>✓</div>
                  <h4 style={{ margin: "0 0 8px 0", fontSize: 15, color: ORCA.navy, fontWeight: 700 }}>Ticket Submitted Successfully</h4>
                  <p style={{ margin: 0, fontSize: 13, color: ORCA.textGray, lineHeight: 1.6 }}>
                    Your support request has been logged in the ISD Cell registry. An technical analyst will review it and coordinate via email/phone shortly.
                  </p>
                  <button
                    onClick={() => setSubmitted(false)}
                    style={{
                      marginTop: 20, background: ORCA.navy, color: ORCA.white,
                      border: "none", borderRadius: 6, padding: "8px 16px",
                      fontSize: 12, fontWeight: 600, cursor: "pointer",
                    }}
                  >
                    Submit Another Request
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <label style={{ fontSize: 11, fontWeight: 700, color: ORCA.textGray }}>OFFICER FULL NAME *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Inspector Ramesh Kumar"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      style={{
                        padding: "8px 12px", fontSize: 13, borderRadius: 6,
                        border: `1px solid ${ORCA.border}`, outline: "none",
                      }}
                    />
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <label style={{ fontSize: 11, fontWeight: 700, color: ORCA.textGray }}>OFFICER BADGE / SERVICE ID *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. KSP-10928"
                      value={badgeId}
                      onChange={e => setBadgeId(e.target.value)}
                      style={{
                        padding: "8px 12px", fontSize: 13, borderRadius: 6,
                        border: `1px solid ${ORCA.border}`, outline: "none",
                      }}
                    />
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <label style={{ fontSize: 11, fontWeight: 700, color: ORCA.textGray }}>OFFICIAL EMAIL ADDRESS *</label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. ramesh.kumar@ksp.gov.in"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      style={{
                        padding: "8px 12px", fontSize: 13, borderRadius: 6,
                        border: `1px solid ${ORCA.border}`, outline: "none",
                      }}
                    />
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <label style={{ fontSize: 11, fontWeight: 700, color: ORCA.textGray }}>ISSUE CATEGORY *</label>
                    <select
                      value={issueType}
                      onChange={e => setIssueType(e.target.value)}
                      style={{
                        padding: "8px 12px", fontSize: 13, borderRadius: 6,
                        border: `1px solid ${ORCA.border}`, outline: "none",
                        background: ORCA.white,
                      }}
                    >
                      <option value="Login Issues">Login / Locked Account</option>
                      <option value="Registration Issues">Badge Verification Failure</option>
                      <option value="AI Errors">AI Assistant (ZIA) Glitches</option>
                      <option value="Map Problems">Geospatial Heatmap Loading Errors</option>
                      <option value="Data Inaccuracy">Inaccurate Criminal/Case Records</option>
                      <option value="Other">Other Technical Issues</option>
                    </select>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <label style={{ fontSize: 11, fontWeight: 700, color: ORCA.textGray }}>DETAILED DESCRIPTION *</label>
                    <textarea
                      required
                      rows={4}
                      placeholder="Describe the issue, including error messages seen or details regarding case/records affected."
                      value={message}
                      onChange={e => setMessage(e.target.value)}
                      style={{
                        padding: "8px 12px", fontSize: 13, borderRadius: 6,
                        border: `1px solid ${ORCA.border}`, outline: "none",
                        resize: "vertical", fontFamily: "inherit",
                      }}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      background: ORCA.navy, color: ORCA.white, border: "none",
                      borderRadius: 6, padding: "10px 16px", fontSize: 13,
                      fontWeight: 700, cursor: "pointer", transition: "all 0.15s ease",
                      marginTop: 6, display: "flex", justifyContent: "center", alignItems: "center",
                    }}
                  >
                    {loading ? "Registering Ticket..." : "Submit Ticket"}
                  </button>
                </form>
              )}
            </div>
          </div>
          
        </div>
      </div>

      {/* ── Footer ──────────────────────────────────────────────── */}
      <footer style={{
        background: ORCA.navy, color: "rgba(255,255,255,0.45)",
        padding: "16px 32px", fontSize: 11, flexShrink: 0,
        display: "flex", justifyContent: "space-between", alignItems: "center",
        borderTop: `1px solid rgba(255,255,255,0.08)`,
      }}>
        <span>© 2026 Karnataka State Police · Internal Security Division</span>
        <div style={{ display: "flex", gap: 16 }}>
          <a href="/privacy" style={{ color: "rgba(255,255,255,0.45)", textDecoration: "none" }}>Privacy</a>
          <a href="/terms" style={{ color: "rgba(255,255,255,0.45)", textDecoration: "none" }}>Terms</a>
          <a href="/accessibility" style={{ color: "rgba(255,255,255,0.45)", textDecoration: "none" }}>Accessibility</a>
          <a href="/rti" style={{ color: "rgba(255,255,255,0.45)", textDecoration: "none" }}>RTI</a>
        </div>
      </footer>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: none; }
        }
      `}</style>
    </div>
  );
}
