"use client";

import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { useMyBooking } from "@/lib/use-my-booking";

/** The hero's main button: "Save a seat", or "You're going" once a signed-in member has booked. */
export default function HeroSeatButton({ className, wide = false }: { className: string; wide?: boolean }) {
  const { booked } = useMyBooking();
  return (
    <Link href="/event" className={className}>
      {booked ? (
        <>
          <span className="inline-flex items-center gap-2">
            <Check size={19} strokeWidth={3} /> You&apos;re going this Saturday
          </span>
          <ArrowRight size={wide ? 20 : 19} className="transition-transform group-hover:translate-x-1" />
        </>
      ) : (
        <>
          Save a seat for Saturday
          <ArrowRight size={wide ? 20 : 19} className="transition-transform group-hover:translate-x-1" />
        </>
      )}
    </Link>
  );
}
