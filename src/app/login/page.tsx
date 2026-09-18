"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import Image from "next/image";
import { Eye, EyeOff, LogIn, Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    router.push("/book");
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-[#F5F0E8]">
      {/* Background decorations */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-[#F47B20]/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#3B7DD8]/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative animate-fadeIn">
        {/* Back to home */}
        <Link
          href="/"
          className="inline-flex items-center text-sm text-[#6B7280] hover:text-[#F47B20] mb-8 transition-colors"
        >
          &larr; Back to home
        </Link>

        <div className="bg-white rounded-3xl p-8 shadow-lg border border-[#EDE5D8]">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <Image
              src="/images/logo.png"
              alt="English Club Jogja"
              width={160}
              height={50}
              className="h-12 w-auto"
            />
          </div>

          <h1 className="text-2xl font-bold text-center text-[#1A1A1A] mb-2">
            Welcome back! 👋
          </h1>
          <p className="text-center text-[#6B7280] mb-8">
            Log in to quickly book your seat
          </p>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626] text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-[#374151] mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full px-4 py-3 rounded-xl border border-[#E5E7EB] bg-white text-[#1A1A1A] placeholder-[#9CA3AF] focus:border-[#3B7DD8]"
              />
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-[#374151]">
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-sm font-semibold text-[#3B7DD8] hover:text-[#2D5FA8]"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="w-full px-4 py-3 pr-12 rounded-xl border border-[#E5E7EB] bg-white text-[#1A1A1A] placeholder-[#9CA3AF] focus:border-[#3B7DD8]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#6B7280]"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-[#F47B20] hover:bg-[#D96A15] disabled:bg-[#F47B20]/50 text-white font-semibold rounded-xl shadow-lg shadow-[#F47B20]/25 transition-all"
            >
              {loading ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <>
                  <LogIn size={20} />
                  Log In
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-[#6B7280]">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="font-semibold text-[#F47B20] hover:text-[#D96A15]"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
