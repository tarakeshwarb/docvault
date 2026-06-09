"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

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
    <form className="space-y-4" onSubmit={handleSubmit}>
      
      {/* Email Input */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">
          Email <span className="text-red-500">*</span>
        </label>
        <input
          type="email"
          name="email"
          placeholder="Enter your mail address"
          className="block w-full rounded-md border border-gray-300 px-4 py-2 text-sm placeholder-gray-400 focus:border-[#0c4da2] focus:outline-none focus:ring-1 focus:ring-[#0c4da2]"
          required
        />
      </div>

      {/* Password Input */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">
          Password <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            placeholder="Enter password"
            className="block w-full rounded-md border border-gray-300 px-4 py-2 pr-10 text-sm placeholder-gray-400 focus:border-[#0c4da2] focus:outline-none focus:ring-1 focus:ring-[#0c4da2]"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
          >
            {showPassword ? (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Forgot Password */}
      <div className="flex items-center justify-end">
        <div className="text-sm">
          <a href="#" className="font-medium text-[#0c4da2] hover:text-[#093980]">
            Forgot your password ?
          </a>
        </div>
      </div>

      {/* Error Message Display */}
      {message && (
        <div className={`text-sm ${error ? 'text-red-500' : 'text-green-500'}`}>
          {message}
        </div>
      )}

      {/* Login Button */}
      <div>
        <button
          type="submit"
          disabled={pending}
          className="flex w-full justify-center items-center gap-2 rounded-lg bg-[#0c4da2] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#093980] focus:outline-none focus:ring-2 focus:ring-[#0c4da2] focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {pending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Logging In...
              </>
          ) : (
            "Log In"
          )}
        </button>
      </div>
    </form>
  );
}
