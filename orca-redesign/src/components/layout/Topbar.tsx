import React, { useState, useEffect } from "react";
import { Search, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { OrcaBrand } from "./OrcaBrand";

export const Topbar: React.FC = () => {
  const { isLoggedIn, officerProfile, logout } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [searchText, setSearchText] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  const activeLoggedIn = mounted ? isLoggedIn : true;

  return (
    /* O.C.R.A Top Navbar: 60px height, #002855 navy-mid bg, subtle white border */
    <header style={{
      height: "60px",
      background: "#002855",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0 24px",
      borderBottom: "1px solid rgba(255,255,255,0.1)",
      flexShrink: 0,
      zIndex: 50
    }}>
      
      {/* ORCA Logo */}
      <div style={{
        display: "flex",
        alignItems: "center",
        flexShrink: 0,
      }}>
        <OrcaBrand />
      </div>


      {/* Right side: secure link + officer profile — matches O.C.R.A .top-right */}
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        
        {/* Secure link badge — matches O.C.R.A .secure-link */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          fontFamily: "JetBrains Mono, monospace",
          fontSize: 11,
          color: activeLoggedIn ? "#10b981" : "#f87171",
          background: activeLoggedIn ? "rgba(16,185,129,0.1)" : "rgba(248,113,113,0.1)",
          padding: "4px 8px",
          borderRadius: 4
        }}>
          <span style={{
            width: 7,
            height: 7,
            borderRadius: "50%",
            background: activeLoggedIn ? "#10b981" : "#f87171",
            display: "inline-block",
            animation: "pulse 2s infinite"
          }} />
          {activeLoggedIn
            ? `SECURE LINK // ${officerProfile?.clearanceLevel || "ISD-LEVEL-IV"}`
            : "SECURE LINK // INGRESS PENDING"
          }
        </div>

        {/* Officer profile — matches O.C.R.A .user-profile */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, color: "white", textAlign: "right" }}>
          {isLoggedIn ? (
            <>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>
                  {officerProfile?.name || "DSP R. K. Shastry, IPS"}
                </span>
                <span style={{ fontSize: 10, color: "rgba(255,255,255,0.6)" }}>
                  {officerProfile?.rank || "Superintendent of Police"} • {officerProfile?.role || "ADMIN"}
                </span>
                <button
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent("orca_initiate_logout"));
                  }}
                  style={{
                    fontSize: 9,
                    color: "#f87171",
                    fontFamily: "JetBrains Mono, monospace",
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    textAlign: "right",
                    padding: 0,
                    marginTop: 2,
                    lineHeight: 1,
                    textDecoration: "none"
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.textDecoration = "underline"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.textDecoration = "none"; }}
                >
                  [SIGN OUT INGRESS]
                </button>
              </div>
              {/* Gold avatar — matches O.C.R.A .avatar */}
              <div style={{
                width: 32,
                height: 32,
                background: "#FF9933",
                color: "#001f3f",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                fontSize: 14,
                flexShrink: 0,
                userSelect: "none",
                overflow: "hidden"
              }}>
                {officerProfile?.photoUrl ? (
                  <img src={officerProfile.photoUrl} alt="Avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : officerProfile?.name ? (
                  officerProfile.name.split(" ").filter(n => n.length > 0 && /^[a-zA-Z]/.test(n)).map(n => n[0]).join("").substring(0, 3).toUpperCase()
                ) : (
                  "RKS"
                )}
              </div>
            </>
          ) : (
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              color: "rgba(255,255,255,0.5)",
              fontFamily: "JetBrains Mono, monospace",
              fontSize: 11
            }}>
              <span>AWAITING INGRESS</span>
            </div>
          )}
        </div>
      </div>

    </header>
  );
};
