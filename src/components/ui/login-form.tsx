"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Eye, EyeOff, Loader2, Lock, User } from "lucide-react";

/**
 * Glass sign-in card with floating labels, adapted from the "smokey" login
 * reference for English Club Jogja: ECJ orange instead of blue, ECJ fonts, and
 * it sits on a real community photo instead of a WebGL shader. No Google button,
 * since Google sign-in isn't enabled for this project.
 */
export function LoginForm({
  email,
  password,
  onEmail,
  onPassword,
  onSubmit,
  loading,
  error,
}: {
  email: string;
  password: string;
  onEmail: (v: string) => void;
  onPassword: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  loading: boolean;
  error?: string;
}) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="w-full max-w-sm p-8 space-y-7 bg-[#1A1A1A]/45 backdrop-blur-lg rounded-2xl border border-white/20 shadow-2xl dialog-rise">
      <div className="text-center">
        <p className="eyebrow text-[#F47B20]">Members</p>
        <h1 className="mt-2 font-display font-extrabold text-4xl leading-none text-[#F5F0E8]">Welcome back</h1>
        <p className="mt-3 text-sm text-[#F5F0E8]/75">Sign in to save your seat in one tap.</p>
      </div>

      {error && (
        <div role="alert" className="p-3 rounded-lg bg-[#FEF2F2] border border-[#FECACA] text-[#B42318] text-sm">
          {error}
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-8">
        <div className="relative z-0">
          <input
            type="email"
            id="login_email"
            value={email}
            onChange={(e) => onEmail(e.target.value)}
            autoComplete="email"
            className="block py-2.5 px-0 w-full text-[15px] text-white bg-transparent border-0 border-b-2 border-white/50 appearance-none focus:outline-none focus:ring-0 focus:border-[#F47B20] peer line-input"
            style={{ boxShadow: "none" }}
            placeholder=" "
            required
          />
          <label
            htmlFor="login_email"
            className="absolute text-sm text-white/75 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:left-0 peer-focus:text-[#F7A061] peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
          >
            <User className="inline-block mr-2 -mt-1" size={16} />
            Email address
          </label>
        </div>

        <div className="relative z-0">
          <input
            type={showPassword ? "text" : "password"}
            id="login_password"
            value={password}
            onChange={(e) => onPassword(e.target.value)}
            autoComplete="current-password"
            className="block py-2.5 pl-0 pr-9 w-full text-[15px] text-white bg-transparent border-0 border-b-2 border-white/50 appearance-none focus:outline-none focus:ring-0 focus:border-[#F47B20] peer line-input"
            style={{ boxShadow: "none" }}
            placeholder=" "
            required
          />
          <label
            htmlFor="login_password"
            className="absolute text-sm text-white/75 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:left-0 peer-focus:text-[#F7A061] peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
          >
            <Lock className="inline-block mr-2 -mt-1" size={16} />
            Password
          </label>
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute right-0 top-2 p-1 text-white/70 hover:text-white"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        <div className="flex items-center justify-end -mt-3">
          <Link href="/forgot-password" className="text-xs text-white/75 hover:text-white underline-offset-2 hover:underline">
            Forgot password?
          </Link>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="group w-full flex items-center justify-center py-3 px-4 bg-[#F47B20] hover:bg-[#F5F0E8] disabled:opacity-60 rounded-lg text-[#1A1A1A] font-semibold transition-colors"
        >
          {loading ? (
            <Loader2 size={20} className="animate-spin" />
          ) : (
            <>
              Sign in
              <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
            </>
          )}
        </button>

        <div className="relative flex items-center">
          <div className="flex-grow border-t border-white/25" />
          <span className="mx-4 text-white/60 text-[11px] eyebrow">No account?</span>
          <div className="flex-grow border-t border-white/25" />
        </div>

        <div className="grid grid-cols-2 gap-3 -mt-2">
          <Link
            href="/register"
            className="flex items-center justify-center py-2.5 px-3 bg-white/90 hover:bg-white rounded-lg text-[#1A1A1A] text-sm font-semibold text-center"
          >
            Become a member
          </Link>
          <Link
            href="/event"
            className="flex items-center justify-center py-2.5 px-3 border border-white/50 hover:border-white rounded-lg text-white text-sm font-semibold text-center"
          >
            Book as guest
          </Link>
        </div>
      </form>
    </div>
  );
}
