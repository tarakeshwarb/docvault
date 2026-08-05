"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Loader2,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  GraduationCap,
  LayoutGrid,
  Users,
  ShieldCheck,
  ClipboardList,
  Settings,
  type LucideIcon,
} from "lucide-react";

const ROLES: { value: string; label: string; icon: LucideIcon }[] = [
  { value: "faculty", label: "Faculty", icon: GraduationCap },
  { value: "course_coordinator", label: "Coordinator", icon: LayoutGrid },
  { value: "secondary_coordinator", label: "Sec. Coord.", icon: Users },
  { value: "hod", label: "HOD", icon: ShieldCheck },
  { value: "audit", label: "Audit", icon: ClipboardList },
  { value: "admin", label: "Admin", icon: Settings },
];

export default function FacultyLoginForm() {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  // Refs for measuring segment positions
  const segmentRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const [sliderStyle, setSliderStyle] = useState<React.CSSProperties>({});

  const updateSlider = useCallback(() => {
    const btn = segmentRefs.current[activeIndex];
    const container = containerRef.current;
    if (btn && container) {
      const containerRect = container.getBoundingClientRect();
      const btnRect = btn.getBoundingClientRect();
      setSliderStyle({
        width: btnRect.width,
        transform: `translateX(${btnRect.left - containerRect.left}px)`,
      });
    }
  }, [activeIndex]);

  useEffect(() => {
    updateSlider();
    window.addEventListener("resize", updateSlider);
    return () => window.removeEventListener("resize", updateSlider);
  }, [updateSlider]);

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
          role: ROLES[activeIndex].value,
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

  const fieldBase =
    "block w-full rounded-xl border border-gray-200 bg-gray-50/60 py-3 pl-11 pr-4 text-sm text-[var(--color-ink)] placeholder-gray-400 transition-all duration-200 focus:border-[var(--color-accent)] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[var(--color-accent)]/10";

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <input type="hidden" name="role" value={ROLES[activeIndex].value} />

      {/* Segmented Control */}
      <div>
        <label className="mb-2.5 block text-[13px] font-semibold text-[var(--color-ink)]">
          I am signing in as
        </label>
        <div
          ref={containerRef}
          className="relative flex rounded-xl bg-gray-100/80 p-1 ring-1 ring-black/[0.04]"
        >
          {/* Sliding highlight */}
          <div
            className="absolute top-1 bottom-1 left-0 rounded-[10px] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.08),0_2px_8px_rgba(0,0,0,0.04)] ring-1 ring-black/[0.04] transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
            style={sliderStyle}
          />

          {ROLES.map((role, i) => {
            const Icon = role.icon;
            const isActive = i === activeIndex;
            return (
              <button
                key={role.value}
                type="button"
                ref={(el) => { segmentRefs.current[i] = el; }}
                onClick={() => setActiveIndex(i)}
                className={`relative z-10 flex flex-1 flex-col items-center gap-1 rounded-[10px] py-2.5 px-1 transition-colors duration-200 ${
                  isActive ? "text-[var(--color-accent)]" : "text-gray-400 hover:text-gray-600"
                }`}
              >
                <Icon className="h-4 w-4" strokeWidth={isActive ? 2.5 : 2} />
                <span
                  className={`text-[10px] leading-none font-semibold tracking-wide ${
                    isActive ? "text-[var(--color-accent)]" : ""
                  }`}
                >
                  {role.label}
                </span>
              </button>
            );
          })}
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
            className={fieldBase}
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
            className={`${fieldBase} pr-11`}
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
        className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-[var(--color-accent)] px-4 py-3.5 text-sm font-semibold text-white shadow-[0_10px_24px_-8px_rgba(21,81,158,0.6)] transition-all duration-200 hover:shadow-[0_14px_32px_-8px_rgba(21,81,158,0.7)] hover:brightness-110 focus:outline-none focus:ring-4 focus:ring-[var(--color-accent)]/25 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
      >
        <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/15 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
        <span className="relative z-10 flex items-center gap-2">
          {pending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Signing in…
            </>
          ) : (
            "Sign in"
          )}
        </span>
      </button>
    </form>
  );
}
