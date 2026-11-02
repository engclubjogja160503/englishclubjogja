"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowUpRight, Home, LogIn } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { WHATSAPP_GROUP_URL } from "@/lib/constants";
import { ComingSoonArt } from "@/components/event/TicketMoments";

/** Shown when there is no upcoming Saturday to book or cancel. Never a dead end. */
export default function NoUpcomingEvent({
  title = "The next event is coming soon!",
  text = "The next event will show up here as soon as possible. In the meantime, please wait for the info in our WhatsApp group.",
}: {
  title?: string;
  text?: string;
}) {
  const [signedIn, setSignedIn] = useState<boolean | null>(null);

  useEffect(() => {
    createClient()
      .auth.getUser()
      .then(({ data }) => setSignedIn(!!data.user));
  }, []);

  return (
    <div className="max-w-xl w-full flex flex-col items-center text-center gap-5 animate-fadeIn">
      <p className="eyebrow text-[#B4570F]">Next Saturday</p>
      <h1 className="font-display font-extrabold text-[clamp(2.2rem,8vw,3.6rem)] leading-[0.95] text-[#1A1A1A]">
        {title}
      </h1>
      <p className="text-lg text-[#374151] leading-relaxed">{text}</p>
      <ComingSoonArt />

      <div className="w-full flex flex-col gap-3 mt-3">
        <a
          href={WHATSAPP_GROUP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 px-6 py-4 bg-[#F47B20] hover:bg-[#1A1A1A] hover:text-[#F5F0E8] text-[#1A1A1A] font-semibold rounded-md text-lg transition-colors"
        >
          Join the WhatsApp group <ArrowUpRight size={20} />
        </a>
        <div className="grid sm:grid-cols-2 gap-3">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 border-2 border-[#1A1A1A] text-[#1A1A1A] font-semibold rounded-md hover:bg-white"
          >
            <Home size={18} /> Back to home
          </Link>
          {signedIn ? (
            <Link
              href="/profile"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 border-2 border-[#1A1A1A] text-[#1A1A1A] font-semibold rounded-md hover:bg-white"
            >
              Go to my profile
            </Link>
          ) : (
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 border-2 border-[#1A1A1A] text-[#1A1A1A] font-semibold rounded-md hover:bg-white"
            >
              <LogIn size={18} /> Sign in as a member
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
