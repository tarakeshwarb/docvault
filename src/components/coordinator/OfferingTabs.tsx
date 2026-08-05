"use client";

import { useState, useEffect } from "react";
import { LayoutDashboard, CheckCircle2, Users, BarChart3 } from "lucide-react";

export function OfferingTabs({
  overviewContent,
  facultyContent,
  trackingContent,
  resultAnalysisContent,
}: {
  overviewContent: React.ReactNode;
  facultyContent: React.ReactNode;
  trackingContent: React.ReactNode;
  resultAnalysisContent?: React.ReactNode;
}) {
  const [activeTab, setActiveTab] = useState<"overview" | "faculty" | "tracking" | "result-analysis">("overview");

  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash === "#submission-tracking") {
        setActiveTab("tracking");
      } else if (window.location.hash === "#faculty-assignments") {
        setActiveTab("faculty");
      } else if (window.location.hash === "#result-analysis") {
        setActiveTab("result-analysis");
      } else {
        setActiveTab("overview");
      }
    };

    handleHashChange();
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  return (
    <div className="space-y-6">
      <div className="border-b border-black/5">
        <nav className="-mb-px flex gap-6" aria-label="Tabs">
          <button
            onClick={() => {
              setActiveTab("overview");
              window.location.hash = "overview";
            }}
            className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
              activeTab === "overview"
                ? "border-[var(--color-accent)] text-[var(--color-accent)]"
                : "border-transparent text-gray-400 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            Overview
          </button>
          <button
            onClick={() => {
              setActiveTab("tracking");
              window.location.hash = "submission-tracking";
            }}
            className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
              activeTab === "tracking"
                ? "border-[var(--color-accent)] text-[var(--color-accent)]"
                : "border-transparent text-gray-400 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            Submission Tracking
          </button>
          <button
            onClick={() => {
              setActiveTab("faculty");
              window.location.hash = "faculty-assignments";
            }}
            className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
              activeTab === "faculty"
                ? "border-[var(--color-accent)] text-[var(--color-accent)]"
                : "border-transparent text-gray-400 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <Users className="w-4 h-4" />
            Faculty & Sections
          </button>
          {resultAnalysisContent && (
            <button
              onClick={() => {
                setActiveTab("result-analysis");
                window.location.hash = "result-analysis";
              }}
              className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
                activeTab === "result-analysis"
                  ? "border-[var(--color-accent)] text-[var(--color-accent)]"
                  : "border-transparent text-gray-400 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              Result Analysis
            </button>
          )}
        </nav>
      </div>

      <div className="pt-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
        <div className={activeTab === "overview" ? "block" : "hidden"}>
          {overviewContent}
        </div>
        <div className={activeTab === "faculty" ? "block" : "hidden"}>
          {facultyContent}
        </div>
        <div className={activeTab === "tracking" ? "block" : "hidden"}>
          {trackingContent}
        </div>
        {resultAnalysisContent && (
          <div className={activeTab === "result-analysis" ? "block" : "hidden"}>
            {resultAnalysisContent}
          </div>
        )}
      </div>
    </div>
  );
}
