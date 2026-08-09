"use client";

import { useState, Suspense } from "react";
import Image from "next/image";
import { Lock, Eye, EyeOff, Loader2, CheckCircle2, AlertCircle, ShieldCheck, TriangleAlert } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

function ChangePasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isForced = searchParams.get("forced") === "1";
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pending, setPending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const fieldBase =
    "block w-full rounded-xl border border-gray-200 bg-gray-50/60 py-3 pl-11 pr-11 text-sm text-[var(--color-ink)] placeholder-gray-400 transition-all duration-200 focus:border-[var(--color-accent)] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[var(--color-accent)]/10";

  const passwordStrength = (pwd: string): { label: string; color: string; width: string } => {
    if (pwd.length === 0) return { label: "", color: "", width: "0%" };
    if (pwd.length < 6) return { label: "Too short", color: "bg-red-500", width: "25%" };
    if (pwd.length < 8) return { label: "Weak", color: "bg-orange-400", width: "40%" };
    const hasUpper = /[A-Z]/.test(pwd);
    const hasNum = /[0-9]/.test(pwd);
    const hasSpecial = /[^A-Za-z0-9]/.test(pwd);
    const score = [hasUpper, hasNum, hasSpecial].filter(Boolean).length;
    if (score === 0) return { label: "Fair", color: "bg-yellow-400", width: "55%" };
    if (score === 1) return { label: "Good", color: "bg-blue-400", width: "75%" };
    return { label: "Strong", color: "bg-green-500", width: "100%" };
  };

  const strength = passwordStrength(newPassword);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setPending(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      });
      const data = (await res.json()) as { ok: boolean; message: string };
      if (!res.ok || !data.ok) {
        setError(data.message || "Something went wrong.");
      } else {
        setSuccess(true);
        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
          router.push("/");
        }, 2000);
      }
    } catch {
      setError("Unable to connect. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-90px)] items-center justify-center bg-white px-4">
      <div className="w-full max-w-[440px]">
        {/* Brand lockup */}
        <div className="flex items-center gap-4 mb-10">
          <Image
            src="/SRM_Institute_of_Science_and_Technology_Logo.svg"
            alt="SRM Institute of Science and Technology"
            width={150}
            height={56}
            priority
            className="h-9 w-auto object-contain"
          />
          <div className="h-8 w-px bg-black/10" />
          <div className="leading-tight">
            <p className="text-sm font-bold tracking-tight text-[var(--color-ink)]">CourseFlow</p>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--color-accent)]">
              Academic Portal
            </p>
          </div>
        </div>

        {!success ? (
          <>
            {/* Icon + heading */}
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-accent)]/10">
              <ShieldCheck className="h-7 w-7 text-[var(--color-accent)]" />
            </div>
            <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-700">
              First-time login
            </span>
            <h1 className="text-3xl font-bold tracking-tight text-[var(--color-ink)]">
              Set your password
            </h1>
            {/* Forced redirect warning */}
            {isForced && (
              <div className="mb-5 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] text-amber-800">
                <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                <span>
                  <strong>Access restricted.</strong> You must set a new password before you can access your portal.
                </span>
              </div>
            )}

            <p className="mt-3 text-[15px] leading-relaxed text-[var(--color-muted)]">
              For your security, please change your default password before continuing. Your current password is your registered email address.
            </p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              {/* Current Password */}
              <div>
                <label className="mb-1.5 block text-[13px] font-semibold text-[var(--color-ink)]">
                  Current password
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-400" />
                  <input
                    type={showCurrent ? "text" : "password"}
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Your current password"
                    className={fieldBase}
                  />
                  <button type="button" onClick={() => setShowCurrent(!showCurrent)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-gray-400 hover:text-gray-600">
                    {showCurrent ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label className="mb-1.5 block text-[13px] font-semibold text-[var(--color-ink)]">
                  New password
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-400" />
                  <input
                    type={showNew ? "text" : "password"}
                    required
                    minLength={8}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    className={fieldBase}
                  />
                  <button type="button" onClick={() => setShowNew(!showNew)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-gray-400 hover:text-gray-600">
                    {showNew ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
                  </button>
                </div>
                {/* Strength bar */}
                {newPassword.length > 0 && (
                  <div className="mt-2 space-y-1">
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${strength.color}`}
                        style={{ width: strength.width }}
                      />
                    </div>
                    <p className="text-[11px] text-gray-500">{strength.label}</p>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="mb-1.5 block text-[13px] font-semibold text-[var(--color-ink)]">
                  Confirm new password
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-400" />
                  <input
                    type={showConfirm ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className={fieldBase}
                  />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-gray-400 hover:text-gray-600">
                    {showConfirm ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
                  </button>
                </div>
                {/* Match indicator */}
                {confirmPassword.length > 0 && (
                  <p className={`mt-1.5 text-[11px] ${newPassword === confirmPassword ? "text-green-600" : "text-red-500"}`}>
                    {newPassword === confirmPassword ? "✓ Passwords match" : "✗ Passwords do not match"}
                  </p>
                )}
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-[13px] text-red-600">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={pending}
                className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-[var(--color-accent)] px-4 py-3.5 text-sm font-semibold text-white shadow-[0_10px_24px_-8px_rgba(21,81,158,0.6)] transition-all duration-200 hover:shadow-[0_14px_32px_-8px_rgba(21,81,158,0.7)] hover:brightness-110 focus:outline-none focus:ring-4 focus:ring-[var(--color-accent)]/25 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
              >
                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/15 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                <span className="relative z-10 flex items-center gap-2">
                  {pending ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</>
                  ) : (
                    "Set new password"
                  )}
                </span>
              </button>
            </form>
          </>
        ) : (
          /* Success */
          <div className="text-center py-12">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-[var(--color-ink)]">Password updated!</h1>
            <p className="mt-3 text-[15px] leading-relaxed text-[var(--color-muted)]">
              Your password has been changed successfully. Redirecting you to your dashboard…
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ChangePasswordPage() {
  return (
    <Suspense>
      <ChangePasswordForm />
    </Suspense>
  );
}
