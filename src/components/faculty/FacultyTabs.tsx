"use client";

import { useState, useEffect } from "react";
import { LayoutDashboard, FileStack, BarChart3 } from "lucide-react";

export function FacultyTabs({
  overviewContent,
  submissionsContent,
  resultsContent,
}: {
  overviewContent: React.ReactNode;
  submissionsContent: React.ReactNode;
  resultsContent: React.ReactNode;
}) {
  const [activeTab, setActiveTab] = useState<"overview" | "submissions" | "results">("overview");

  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash === "#submissions") {
        setActiveTab("submissions");
      } else if (window.location.hash === "#results") {
        setActiveTab("results");
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
              setActiveTab("submissions");
              window.location.hash = "submissions";
            }}
            className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
              activeTab === "submissions"
                ? "border-[var(--color-accent)] text-[var(--color-accent)]"
                : "border-transparent text-gray-400 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <FileStack className="w-4 h-4" />
            Submissions
          </button>
          <button
            onClick={() => {
              setActiveTab("results");
              window.location.hash = "results";
            }}
            className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
              activeTab === "results"
                ? "border-[var(--color-accent)] text-[var(--color-accent)]"
                : "border-transparent text-gray-400 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Result Upload/Analysis
          </button>
        </nav>
      </div>

      <div className="pt-2 animate-in fade-in duration-500">
        <div className={activeTab === "overview" ? "block" : "hidden"}>
          {overviewContent}
        </div>
        <div className={activeTab === "submissions" ? "block" : "hidden"}>
          {submissionsContent}
        </div>
        <div className={activeTab === "results" ? "block" : "hidden"}>
          {resultsContent}
        </div>
      </div>
    </div>
  );
}
