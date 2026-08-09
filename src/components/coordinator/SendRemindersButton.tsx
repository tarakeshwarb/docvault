"use client";

import { useState } from "react";
import { Loader2, Bell } from "lucide-react";
import { sendRemindersToAllPending } from "@/app/course-coordinator/actions";

export function SendRemindersButton({ offering_id }: { offering_id: string }) {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function handleSend() {
    setLoading(true);
    setMsg(null);
    try {
      const res = await sendRemindersToAllPending(offering_id);
      setMsg(res.message);
      setTimeout(() => setMsg(null), 5000);
    } catch (err) {
      setMsg("Failed to send reminders.");
      setTimeout(() => setMsg(null), 5000);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      {msg && <span className="text-xs font-semibold text-orange-200">{msg}</span>}
      <button
        onClick={handleSend}
        disabled={loading}
        className="inline-flex items-center gap-1.5 rounded-full border border-orange-300/30 bg-orange-500/20 px-3 py-1.5 text-xs font-semibold text-orange-200 ring-1 ring-inset ring-orange-500/25 hover:bg-orange-500/30 transition-colors disabled:opacity-60"
      >
        {loading ? (
          <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Sending...</>
        ) : (
          <><Bell className="w-3.5 h-3.5" /> Send Reminders</>
        )}
      </button>
    </div>
  );
}
