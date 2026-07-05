"use client";

import React, { useEffect } from "react";
import { useIntelligence } from "@/context/IntelligenceContext";
import DashboardPage from "@/app/dashboard/page";

export default function DocumentVerificationPage() {
  const { setActiveTab } = useIntelligence();

  useEffect(() => {
    setActiveTab("verification-document");
  }, [setActiveTab]);

  return <DashboardPage />;
}
