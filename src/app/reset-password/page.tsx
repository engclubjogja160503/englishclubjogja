"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Loader2, CheckCircle, Eye, EyeOff } from "lucide-react";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [valid, setValid] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    const query = new URLSearchParams(window.location.search);
    const hash = new URLSearchParams(window.location.hash.slice(1));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setValid(true);
    });

    (async () => {
      // Supabase says the link was already used or has expired.
      if (query.get("error_code") || hash.get("error_code")) {
        setChecking(false);
        return;
      }
      // Email template link (?token_hash=…&type=recovery): verified here, so it
      // works in any browser or device, not only the one that asked for it.
      const tokenHash = query.get("token_hash");
      if (tokenHash) {
        const { error: verifyError } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: "recovery" });
        window.history.replaceState(null, "", "/reset-password");
        setValid(!verifyError);
        setChecking(false);
        return;
      }
      // Default Supabase link (?code=…): the client exchanges it on load.
      const { data } = await supabase.auth.getSession();
      setValid(!!data.session);
      setChecking(false);
    })();

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      setError("Passwords don't match!");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    setError("");
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }
    setDone(true);
    setLoading(false);
    setTimeout(() => router.push("/profile"), 2500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-[#F5F0E8]">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-10 w-72 h-72 bg-[#3B7DD8]/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-[#F47B20]/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative animate-fadeIn">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-[#6B7280] hover:text-[#F47B20] mb-8 transition-colors"
        >
          &larr; Back to home
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

          {checking ? (
            <div className="flex justify-center py-8">
              <Loader2 size={32} className="animate-spin text-[#F47B20]" />
            </div>
          ) : done ? (
            <div className="text-center">
              <CheckCircle size={48} className="mx-auto mb-4 text-[#22C55E]" />
              <h1 className="text-2xl font-bold text-[#1A1A1A] mb-2">
                Password updated! 🎉
              </h1>
              <p className="text-[#6B7280]">
                You&apos;re signed in. Taking you to your profile...
              </p>
            </div>
          ) : !valid ? (
            <div className="text-center">
              <h1 className="text-2xl font-bold text-[#1A1A1A] mb-2">
                Link expired or invalid 😢
              </h1>
              <p className="text-[#6B7280] mb-3">
                Reset links only work once and expire after a while. Please
                request a new one.
              </p>
              <p className="text-sm text-[#9CA3AF] mb-6">
                Tip: open the new link in the same browser you request it from.
              </p>
              <Link
                href="/forgot-password"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#F47B20] hover:bg-[#D96A15] text-white font-semibold rounded-xl transition-all"
              >
                Request a new link
              </Link>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-center text-[#1A1A1A] mb-2">
                Set a new password 🔐
              </h1>
              <p className="text-center text-[#6B7280] mb-8">
                Choose something memorable this time!
              </p>

              {error && (
                <div className="mb-6 p-4 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626] text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-[#374151] mb-1.5">
                    New password
                  </label>
                  <div className="relative">
                    <input
                      type={show ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min. 6 characters"
                      required
                      className="w-full px-4 py-3 pr-12 rounded-xl border border-[#E5E7EB] bg-white text-[#1A1A1A] placeholder-[#9CA3AF] focus:border-[#3B7DD8]"
                    />
                    <button
                      type="button"
                      onClick={() => setShow(!show)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#6B7280]"
                    >
                      {show ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#374151] mb-1.5">
                    Confirm new password
                  </label>
                  <input
                    type="password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Type it again"
                    required
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
                    "Update Password"
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
