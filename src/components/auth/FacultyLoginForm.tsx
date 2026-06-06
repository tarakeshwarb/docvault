"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Lock, AlertCircle, CheckCircle, Loader2, Eye, EyeOff } from "lucide-react";

export default function FacultyLoginForm() {
  const router = useRouter();
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
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-[0.18em] text-[#1c2d45]">
          Faculty Email
        </label>
        <div className="relative group">
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-[#2b4f8c] transition-colors pointer-events-none" />
          <input
            type="email"
            name="email"
            autoComplete="username"
            placeholder="faculty@srmist.edu.in"
            className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50 pl-12 pr-4 text-sm text-[#1c2d45] outline-none transition-all placeholder:text-gray-400 hover:border-[#2b4f8c]/50 focus:border-[#2b4f8c] focus:bg-white focus:ring-2 focus:ring-[#2b4f8c]/20"
          />
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-[0.18em] text-[#1c2d45]">
          Password
        </label>
        <div className="relative group">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-[#2b4f8c] transition-colors pointer-events-none" />
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            autoComplete="current-password"
            placeholder="Enter your password"
            className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50 pl-12 pr-14 text-sm text-[#1c2d45] outline-none transition-all placeholder:text-gray-400 hover:border-[#2b4f8c]/50 focus:border-[#2b4f8c] focus:bg-white focus:ring-2 focus:ring-[#2b4f8c]/20"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#2b4f8c] transition-colors p-1"
          >
            {showPassword ? (
              <EyeOff className="h-5 w-5" />
            ) : (
              <Eye className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>
      <button
        type="submit"
        disabled={pending}
        className="mt-2 h-12 w-full rounded-xl bg-gradient-to-r from-[#2b4f8c] to-[#24407a] text-sm font-bold text-white shadow-lg shadow-[#2b4f8c]/30 transition-all hover:shadow-xl hover:shadow-[#2b4f8c]/40 hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100 flex items-center justify-center gap-2"
      >
        {pending ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Signing in…
          </>
        ) : (
          "Sign In"
        )}
      </button>
      {message && (
        <div 
          className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm ${
            error 
              ? "bg-red-50 text-red-700 border border-red-200" 
              : "bg-green-50 text-green-700 border border-green-200"
          }`}
          style={{ animation: "fade-up 0.3s ease-out" }}
        >
          {error ? (
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
          ) : (
            <CheckCircle className="h-5 w-5 flex-shrink-0" />
          )}
          {message}
        </div>
      )}
    </form>
  );
}
