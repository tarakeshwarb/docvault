"use client";

import { useState } from "react";
import { Loader2, Mail } from "lucide-react";
import { sendRemindersForComponent } from "@/app/main-coordinator/actions";

export function SendComponentReminderButton({
  offering_id,
  component_id,
}: {
  offering_id: string;
  component_id: string;
}) {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  async function handleSend() {
    setLoading(true);
    setMsg(null);
    setIsError(false);
    try {
      const res = await sendRemindersForComponent(offering_id, component_id);
      setMsg(res.message);
      if (!res.success) {
        setIsError(true);
      }
      setTimeout(() => {
        setMsg(null);
        setIsError(false);
      }, 5000);
    } catch (err) {
      setIsError(true);
      setMsg("Failed to send reminders.");
      setTimeout(() => {
        setMsg(null);
        setIsError(false);
      }, 5000);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handleSend}
        disabled={loading}
        title="Send reminder to unsubmitted faculties"
        className="inline-flex items-center gap-1 rounded-md bg-red-50 px-2.5 py-1 text-[10px] font-semibold text-red-700 ring-1 ring-inset ring-red-700/10 hover:bg-red-100 transition-colors disabled:opacity-60"
      >
        {loading ? (
          <><Loader2 className="w-3 h-3 animate-spin" /> Sending</>
        ) : (
          <><Mail className="w-3 h-3" /> Remind</>
        )}
      </button>
      {msg && (
        <span
          className={`text-[9px] font-medium px-1.5 py-0.5 rounded ${
            isError ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"
          }`}
        >
          {msg}
        </span>
      )}
    </div>
  );
}
