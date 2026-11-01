"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { LoginForm } from "@/components/ui/login-form";
import groupRelaxed from "@/assets/photos/group-relaxed.jpg";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
    <main className="relative min-h-screen w-full overflow-hidden bg-[#1A1A1A]">
      {/* The community, not a stock texture: the rooftop group photo. */}
      <Image
        src={groupRelaxed}
        alt=""
        fill
        preload
        placeholder="blur"
        sizes="100vw"
        className="object-cover object-[center_65%] scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#1A1A1A]/80 via-[#1A1A1A]/45 to-[#1A1A1A]/85" aria-hidden="true" />

      <div className="relative z-10 flex min-h-screen flex-col px-4 py-6">
        <div className="flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-white/80 hover:text-white">
            <ArrowLeft size={16} /> Back to home
          </Link>
          <Link href="/" aria-label="English Club Jogja, home">
            <Image src="/images/logo-wordmark.png" alt="English Club Jogja" width={648} height={438} className="h-10 w-auto rounded-sm" />
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center py-10">
          <LoginForm
            email={email}
            password={password}
            onEmail={setEmail}
            onPassword={setPassword}
            onSubmit={handleLogin}
            loading={loading}
            error={error}
          />
        </div>

        <p className="eyebrow text-center text-[11px] text-white/60">
          Real members, real Saturdays · No grades. No pressure. Just conversations.
        </p>
      </div>
    </main>
  );
}
