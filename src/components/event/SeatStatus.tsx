"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { ArrowUpRight, Check, Info, X } from "lucide-react";
import { WHATSAPP_GROUP_URL } from "@/lib/constants";
import { type EventData, formatDate, formatTime } from "@/lib/events";

/** Replaces "Save your seat" once a signed-in member has booked. */
export function SavedSeat({ event, wide = true }: { event?: EventData | null; wide?: boolean }) {
  return (
    <div
      className={`flex flex-col gap-2 px-5 py-4 bg-white border-2 border-[#1A1A1A] rounded-lg shadow-[0_4px_0_#1A1A1A] text-left ${wide ? "w-full" : ""}`}
    >
      <p className="flex items-center gap-2.5 font-display font-bold text-xl text-[#1A1A1A]">
        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-[#F47B20] border-2 border-[#1A1A1A] shrink-0">
          <Check size={16} strokeWidth={3} />
        </span>
        Your seat has been saved.
      </p>
      {event && (
        <p className="text-sm text-[#374151] pl-[38px]">
          See you {formatDate(event.event_date, "short")}, {formatTime(event.event_time)}.
        </p>
      )}
      <p className="text-sm text-[#6B7280] pl-[38px]">
        Plans changed?{" "}
        <Link href="/cancel" className="font-semibold text-[#2D5FA8] underline underline-offset-2">
          Cancel your booking
        </Link>{" "}
        so someone else can come.
      </p>
    </div>
  );
}

/** The ⓘ next to "Going": how to check your booking went through. */
export function GoingInfo() {
  const [open, setOpen] = useState(false);
  const id = useId();
  const box = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <span ref={box} className="relative inline-flex">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={id}
        aria-label="How to check your booking"
        className="inline-flex items-center justify-center w-9 h-9 rounded-full border-2 border-[#1A1A1A] bg-white text-[#1A1A1A] hover:bg-[#FFF3EB] shadow-[0_2px_0_#1A1A1A]"
      >
        <Info size={18} />
      </button>
      {open && (
        <span
          id={id}
          role="dialog"
          aria-label="How to check your booking"
          className="dialog-rise absolute z-30 bottom-[calc(100%+10px)] right-0 sm:right-auto sm:left-1/2 sm:-translate-x-1/2 w-[min(300px,80vw)] p-4 bg-white border-2 border-[#1A1A1A] rounded-lg shadow-[3px_3px_0_#F47B20] text-left text-sm leading-relaxed text-[#374151]"
        >
          <span className="flex items-start justify-between gap-3">
            <strong className="font-display text-base text-[#1A1A1A]">Booked already?</strong>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close" className="-mt-1 -mr-1 p-1 text-[#6B7280] hover:text-[#1A1A1A]">
              <X size={16} />
            </button>
          </span>
          <span className="block mt-1.5">
            Whether you booked as a member or as a guest, make sure your name is on the list of who&apos;s going.
          </span>
          <span className="block mt-2">
            Not there? Try booking again, or message the admins in our WhatsApp group.
          </span>
          <a
            href={WHATSAPP_GROUP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-1 font-semibold text-[#2D5FA8] underline underline-offset-2"
          >
            Open the WhatsApp group <ArrowUpRight size={14} />
          </a>
        </span>
      )}
    </span>
  );
}
