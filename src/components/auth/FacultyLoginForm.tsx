"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function FacultyLoginForm() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage("");
    setError(false);

    try {
      const formData = new FormData(event.currentTarget);
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.get("email"),
          password: formData.get("password"),
        }),
      });

      const data = (await response.json()) as {
        ok: boolean;
        message: string;
        redirectTo?: string;
      };

      if (!response.ok || !data.ok || !data.redirectTo) {
        setMessage(data.message || "Login failed.");
        setError(true);
        return;
      }

      setMessage(data.message || "Login successful.");
      window.location.href = data.redirectTo;
    } catch {
      setMessage("Login failed. Please try again.");
      setError(true);
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="mt-6 space-y-5 max-w-sm" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
          Faculty email
        </label>
        <input
          type="email"
          name="email"
          autoComplete="username"
          placeholder="faculty@srmist.edu.in"
          className="h-12 w-full rounded-full border border-white/20 bg-white/10 px-5 text-sm text-white shadow-inner outline-none backdrop-blur-md transition-all hover:bg-white/15 focus:border-white/50 focus:bg-white/20 focus:ring-2 focus:ring-white/20 placeholder:text-white/40"
        />
      </div>
      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-[0.2em] text-white/80">
          Password
        </label>
        <input
          type="password"
          name="password"
          autoComplete="current-password"
          placeholder="Enter your password"
          className="h-12 w-full rounded-full border border-white/20 bg-white/10 px-5 text-sm text-white shadow-inner outline-none backdrop-blur-md transition-all hover:bg-white/15 focus:border-white/50 focus:bg-white/20 focus:ring-2 focus:ring-white/20 placeholder:text-white/40"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="mt-2 flex h-12 w-full items-center justify-center rounded-full bg-white text-sm font-bold text-[#2b4f8c] shadow-[0_8px_20px_rgba(255,255,255,0.2)] transition-all hover:scale-[1.02] hover:shadow-[0_12px_25px_rgba(255,255,255,0.3)] disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:scale-100"
      >
        {pending ? "Signing in..." : "Sign in"}
      </button>
      <p className="text-xs text-white/50 text-center mt-6">
        Sign in with your faculty credentials. The portal will route you to the right dashboard after sign in.
      </p>
      {message ? (
        <p className={`text-sm ${error ? "text-[var(--color-accent)]" : "text-green-600"}`}>
          {message}
        </p>
      ) : null}
    </form>
  );
}