"use client";

import { useState } from "react";
import { Loader2, Mail, Lock, Eye, EyeOff, AlertCircle, UserCheck } from "lucide-react";

export default function FacultyLoginForm() {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
          role: formData.get("role"),
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

  const fieldClass =
    "block w-full rounded-xl border border-gray-200 bg-gray-50/60 py-3 pl-11 pr-4 text-sm text-[var(--color-ink)] placeholder-gray-400 transition-colors focus:border-[var(--color-accent)] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[var(--color-accent)]/10";

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      {/* Role Selection */}
      <div>
        <label className="mb-1.5 block text-[13px] font-semibold text-[var(--color-ink)]">
          Select Role
        </label>
        <div className="relative">
          <UserCheck className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-400" />
          <select
            name="role"
            className={fieldClass}
            required
            defaultValue="faculty"
          >
            <option value="faculty">Faculty</option>
            <option value="course_coordinator">Course Coordinator</option>
            <option value="secondary_coordinator">Secondary Coordinator</option>
            <option value="hod">Head of Department (HOD)</option>
            <option value="audit">IQAC Audit</option>
            <option value="admin">System Admin</option>
          </select>
        </div>
      </div>

      {/* Email */}
      <div>
        <label className="mb-1.5 block text-[13px] font-semibold text-[var(--color-ink)]">
          Email address
        </label>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-400" />
          <input
            type="email"
            name="email"
            placeholder="you@srmist.edu.in"
            autoComplete="email"
            className={fieldClass}
            required
          />
        </div>
      </div>

      {/* Password */}
      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <label className="block text-[13px] font-semibold text-[var(--color-ink)]">
            Password
          </label>
          <a
            href="#"
            className="text-[13px] font-medium text-[var(--color-accent)] hover:underline"
          >
            Forgot password?
          </a>
        </div>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-400" />
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            placeholder="Enter your password"
            autoComplete="current-password"
            className={`${fieldClass} pr-11`}
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-gray-400 transition-colors hover:text-[var(--color-ink)]"
          >
            {showPassword ? (
              <EyeOff className="h-[18px] w-[18px]" />
            ) : (
              <Eye className="h-[18px] w-[18px]" />
            )}
          </button>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`flex items-start gap-2 rounded-xl border px-3.5 py-2.5 text-[13px] ${
            error
              ? "border-red-200 bg-red-50 text-red-600"
              : "border-green-200 bg-green-50 text-green-700"
          }`}
        >
          {error && <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />}
          <span>{message}</span>
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={pending}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-accent)] px-4 py-3 text-sm font-semibold text-white shadow-[0_10px_24px_-8px_rgba(21,81,158,0.6)] transition-all hover:brightness-110 focus:outline-none focus:ring-4 focus:ring-[var(--color-accent)]/25 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {pending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Signing in…
          </>
        ) : (
          "Sign in"
        )}
      </button>
    </form>
  );
}
