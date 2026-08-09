"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Mail, ArrowLeft, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError("");

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        setSubmitted(true);
      } else {
        const data = (await res.json()) as { message?: string };
        setError(data.message || "Something went wrong. Please try again.");
      }
    } catch {
      setError("Unable to connect. Please check your connection and try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-90px)] items-center justify-center bg-white px-4">
      <div className="w-full max-w-[420px]">
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

        {!submitted ? (
          <>
            {/* Icon */}
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-accent)]/10">
              <Mail className="h-7 w-7 text-[var(--color-accent)]" />
            </div>

            <h1 className="text-3xl font-bold tracking-tight text-[var(--color-ink)]">
              Forgot password?
            </h1>
            <p className="mt-3 text-[15px] leading-relaxed text-[var(--color-muted)]">
              Enter your registered email address below and we&apos;ll send you a link to reset your password.
            </p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <div>
                <label
                  htmlFor="email"
                  className="mb-1.5 block text-[13px] font-semibold text-[var(--color-ink)]"
                >
                  Email address
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-400" />
                  <input
                    id="email"
                    type="email"
                    name="email"
                    placeholder="you@srmist.edu.in"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full rounded-xl border border-gray-200 bg-gray-50/60 py-3 pl-11 pr-4 text-sm text-[var(--color-ink)] placeholder-gray-400 transition-all duration-200 focus:border-[var(--color-accent)] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[var(--color-accent)]/10"
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-[13px] text-red-600">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={pending}
                className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-[var(--color-accent)] px-4 py-3.5 text-sm font-semibold text-white shadow-[0_10px_24px_-8px_rgba(21,81,158,0.6)] transition-all duration-200 hover:shadow-[0_14px_32px_-8px_rgba(21,81,158,0.7)] hover:brightness-110 focus:outline-none focus:ring-4 focus:ring-[var(--color-accent)]/25 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
              >
                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/15 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                <span className="relative z-10 flex items-center gap-2">
                  {pending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Sending…
                    </>
                  ) : (
                    "Send reset link"
                  )}
                </span>
              </button>
            </form>
          </>
        ) : (
          /* Success state */
          <div className="text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-[var(--color-ink)]">
              Check your inbox
            </h1>
            <p className="mt-3 text-[15px] leading-relaxed text-[var(--color-muted)]">
              If <span className="font-semibold text-[var(--color-ink)]">{email}</span> is registered in our system, you&apos;ll receive a password reset link shortly.
            </p>
            <p className="mt-4 text-[13px] text-[var(--color-muted)]">
              Didn&apos;t receive it? Check your spam folder or{" "}
              <button
                onClick={() => { setSubmitted(false); setError(""); }}
                className="font-medium text-[var(--color-accent)] hover:underline"
              >
                try again
              </button>
              .
            </p>
          </div>
        )}

        {/* Back to login */}
        <div className="mt-10">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-[13px] font-medium text-[var(--color-muted)] transition-colors hover:text-[var(--color-ink)]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
