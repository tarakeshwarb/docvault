"use client";

import { useState } from "react";
import { Archive, Loader2, CheckCircle2, Bell } from "lucide-react";

export function CoordinatorToolbar({
  offering_id,
}: {
  offering_id: string;
}) {
  const [zipLoading, setZipLoading] = useState(false);
  const [zipDone, setZipDone] = useState(false);
  const [zipError, setZipError] = useState<string | null>(null);

  const [reminderLoading, setReminderLoading] = useState(false);
  const [reminderMsg, setReminderMsg] = useState<string | null>(null);
  const [reminderError, setReminderError] = useState<string | null>(null);

  async function handleDownloadZip() {
    setZipLoading(true);
    setZipError(null);
    setZipDone(false);

    try {
      const res = await fetch("/api/generate-zip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ offering_id }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate ZIP");

      const link = document.createElement("a");
      link.href = data.zip_url;
      link.download = `all-submissions.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setZipDone(true);
      setTimeout(() => setZipDone(false), 3000);
    } catch (err) {
      setZipError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setZipLoading(false);
    }
  }

  async function handleSendReminders() {
    setReminderLoading(true);
    setReminderMsg(null);
    setReminderError(null);

    try {
      const res = await fetch("/api/send-reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ offering_id }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send reminders");
      setReminderMsg(data.message);
    } catch (err) {
      setReminderError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setReminderLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-3">
        {/* Download all as ZIP */}
        <button
          onClick={handleDownloadZip}
          disabled={zipLoading}
          className="inline-flex items-center gap-2 rounded-full bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[var(--color-accent)]/90 transition-all disabled:opacity-60"
        >
          {zipLoading ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Generating ZIP...</>
          ) : zipDone ? (
            <><CheckCircle2 className="w-4 h-4" /> Downloaded!</>
          ) : (
            <><Archive className="w-4 h-4" /> Download All as ZIP</>
          )}
        </button>

        {/* Send deadline reminders */}
        <button
          onClick={handleSendReminders}
          disabled={reminderLoading}
          className="inline-flex items-center gap-2 rounded-full border border-orange-300 bg-orange-50 px-4 py-2 text-sm font-semibold text-orange-700 hover:bg-orange-100 transition-all disabled:opacity-60"
        >
          {reminderLoading ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</>
          ) : (
            <><Bell className="w-4 h-4" /> Send Reminders to Pending Faculty</>
          )}
        </button>
      </div>

      {/* Feedback messages */}
      {zipError && <p className="text-xs text-red-500">{zipError}</p>}
      {reminderMsg && <p className="text-xs text-green-600 font-medium">{reminderMsg}</p>}
      {reminderError && <p className="text-xs text-red-500">{reminderError}</p>}
    </div>
  );
}