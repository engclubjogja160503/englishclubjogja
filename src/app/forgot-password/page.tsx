"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { Loader2, MailCheck, ArrowLeft } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email.trim(),
      { redirectTo: `${window.location.origin}/reset-password` }
    );

    if (resetError) {
      setError(resetError.message);
      setLoading(false);
      return;
    }

    setSent(true);
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-[#F5F0E8]">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-[#F47B20]/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#3B7DD8]/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative animate-fadeIn">
        <Link
          href="/login"
          className="inline-flex items-center gap-1 text-sm text-[#6B7280] hover:text-[#F47B20] mb-8 transition-colors"
        >
          <ArrowLeft size={16} /> Back to login
        </Link>
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-[#6B7280] hover:text-[#F47B20] mb-8 ml-5 transition-colors"
        >
          Home
        </Link>

        <div className="bg-white rounded-3xl p-8 shadow-lg border border-[#EDE5D8]">
          <div className="flex justify-center mb-6">
            <Image
              src="/images/logo.png"
              alt="English Club Jogja"
              width={160}
              height={50}
              className="h-12 w-auto"
            />
          </div>

          {sent ? (
            <div className="text-center">
              <MailCheck size={48} className="mx-auto mb-4 text-[#22C55E]" />
              <h1 className="text-2xl font-bold text-[#1A1A1A] mb-2">
                Check your inbox 📬
              </h1>
              <p className="text-[#6B7280] mb-2">
                If an account exists for <strong>{email}</strong>, we&apos;ve
                sent you a password reset link.
              </p>
              <p className="text-sm text-[#9CA3AF] mb-6">
                Didn&apos;t get it? Check your spam folder, then try again in a
                minute.
              </p>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#F47B20] hover:bg-[#D96A15] text-white font-semibold rounded-xl transition-all"
              >
                Back to Login
              </Link>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-center text-[#1A1A1A] mb-2">
                Forgot your password? 🔑
              </h1>
              <p className="text-center text-[#6B7280] mb-8">
                No worries — enter your email and we&apos;ll send you a reset link.
              </p>

              {error && (
                <div className="mb-6 p-4 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626] text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
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
                    autoComplete="email"
                    className="w-full px-4 py-3 rounded-xl border border-[#E5E7EB] bg-white text-[#1A1A1A] placeholder-[#9CA3AF] focus:border-[#3B7DD8]"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-[#F47B20] hover:bg-[#D96A15] disabled:bg-[#F47B20]/50 text-white font-semibold rounded-xl shadow-lg shadow-[#F47B20]/25 transition-all"
                >
                  {loading ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    "Send Reset Link"
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
