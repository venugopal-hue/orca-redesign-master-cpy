import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { IntelligenceProvider } from "@/context/IntelligenceContext";

export const metadata: Metadata = {
  title: "O.R.C.A — Operational Crime & Records Analysis",
  description: "Secure operational command center and intelligence auditing workspace for Karnataka State Crime Intelligence Portal.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full w-full antialiased" suppressHydrationWarning>
      {/* O.C.R.A body: #f8fafc off-white background, Inter font, navy text */}
      <body
        className="h-screen w-screen overflow-hidden flex flex-col"
        style={{
          fontFamily: "'Inter', sans-serif",
          color: "#1e293b",
          backgroundColor: "#f8fafc"
        }}
      >
        <AuthProvider>
          <IntelligenceProvider>
            {children}
          </IntelligenceProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
