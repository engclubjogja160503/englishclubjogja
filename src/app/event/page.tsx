"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, MapPin, X } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import GoingPill, { type GoingAttendee } from "@/components/GoingPill";
import NoUpcomingEvent from "@/components/NoUpcomingEvent";
import EventTicket from "@/components/event/EventTicket";
import { createClient } from "@/lib/supabase/client";
import { countConfirmed, fetchAttendees } from "@/lib/attendees";
import { WHATSAPP_GROUP_URL } from "@/lib/constants";
import { type EventData, formatDate, formatTime, isUpcoming, parseTopic, venueLine } from "@/lib/events";

export default function EventPage() {
  const [event, setEvent] = useState<EventData | null>(null);
  const [taken, setTaken] = useState(0);
  const [attendees, setAttendees] = useState<GoingAttendee[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let ignore = false;
    (async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("events")
        .select("*")
        .eq("is_active", true)
        .order("event_date", { ascending: true })
        .limit(10);
      const next = ((data || []) as EventData[]).find((e) => !e.is_archived && isUpcoming(e)) || null;
      if (next) {
        const [count, list] = await Promise.all([
          countConfirmed(supabase, next.id),
          fetchAttendees(supabase, next.id, 6),
        ]);
        if (ignore) return;
        setTaken(count);
        setAttendees(list);
        setEvent(next);
        // Arriving here opens the event card straight away.
        setOpen(true);
      }
      if (!ignore) setLoading(false);
    })();
    return () => {
      ignore = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center px-4 py-24" aria-busy="true">
          <div className="w-full max-w-2xl h-64 rounded-2xl bg-[#EDE5D8] animate-pulse" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center px-4 py-16">
          <NoUpcomingEvent />
        </main>
        <Footer />
      </div>
    );
  }

  const isFull = taken >= event.max_participants;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1">
        <section className="max-w-5xl mx-auto w-full px-4 sm:px-6 pt-12 lg:pt-16 pb-20 flex flex-col items-center text-center gap-4">
          <p className="eyebrow text-[#B4570F]">This week&apos;s event</p>
          <h1 className="word-rise font-display font-extrabold text-[clamp(2.4rem,6.4vw,4.6rem)] leading-[0.92] text-[#1A1A1A]">
            <span>See</span> <span style={{ animationDelay: "80ms" }}>you</span>{" "}
            <span style={{ animationDelay: "160ms" }}>on</span>{" "}
            <span className="text-[#F47B20]" style={{ animationDelay: "240ms" }}>Saturday.</span>
          </h1>
          <p className="text-lg text-[#374151] max-w-xl">
            Here&apos;s your ticket for this week. Check the details, then claim your spot.
          </p>

          <div className="w-full mt-2">
            <EventTicket event={event} taken={taken} />
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 mt-2">
            <ClaimButton isFull={isFull} />
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="inline-flex items-center gap-2 px-6 py-4 border-2 border-[#1A1A1A] text-[#1A1A1A] font-semibold rounded-md hover:bg-white text-lg"
            >
              See event details
            </button>
          </div>

          {taken > 0 && (
            <div className="mt-2">
              <GoingPill attendees={attendees} eventId={event.id} totalCount={taken} />
            </div>
          )}
        </section>
      </main>

      <Footer />

      {open && <EventDialog event={event} taken={taken} attendees={attendees} onClose={() => setOpen(false)} />}
    </div>
  );
}

function ClaimButton({ isFull, wide = false }: { isFull: boolean; wide?: boolean }) {
  if (isFull) {
    return (
      <span className={`inline-flex items-center justify-center px-6 py-4 bg-[#EDE5D8] text-[#374151] font-semibold rounded-md text-lg ${wide ? "w-full" : ""}`}>
        Fully booked. See you next Saturday!
      </span>
    );
  }
  return (
    <Link
      href="/book"
      className={`group inline-flex items-center justify-center gap-2 px-7 py-4 bg-[#F47B20] hover:bg-[#1A1A1A] hover:text-[#F5F0E8] text-[#1A1A1A] font-semibold rounded-md text-lg border-2 border-[#1A1A1A] shadow-[0_3px_0_#1A1A1A] transition-colors ${wide ? "w-full" : ""}`}
    >
      Claim your spot
      <ArrowRight size={20} className="transition-transform group-hover:translate-x-1" />
    </Link>
  );
}

function EventDialog({
  event,
  taken,
  attendees,
  onClose,
}: {
  event: EventData;
  taken: number;
  attendees: GoingAttendee[];
  onClose: () => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const topic = parseTopic(event.description);
  const venue = venueLine(event);
  const hasVenue = !/announced in the WhatsApp group/.test(venue);
  const left = Math.max(event.max_participants - taken, 0);
  const isFull = left === 0;

  const onKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    closeRef.current?.focus();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onKey]);

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-6" role="presentation">
      <div className="absolute inset-0 bg-[#1A1A1A]/60 animate-fadeIn" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="event-dialog-title"
        className="relative w-full sm:max-w-2xl max-h-[92svh] overflow-y-auto bg-[#F5F0E8] border-2 border-[#1A1A1A] rounded-t-2xl sm:rounded-2xl shadow-[6px_6px_0_#1A1A1A] dialog-rise"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between gap-4 px-5 sm:px-7 py-4 bg-[#F5F0E8] border-b-2 border-[#1A1A1A]">
          <p className="eyebrow text-[#B4570F]">This week&apos;s event</p>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close event details"
            className="p-1.5 -mr-1.5 rounded-md text-[#1A1A1A] hover:bg-white"
          >
            <X size={22} />
          </button>
        </div>

        <div className="px-3 sm:px-5">
          <EventTicket event={event} taken={taken} compact />
        </div>

        <div className="px-5 sm:px-7 pb-7 flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <h2 id="event-dialog-title" className="font-display font-extrabold text-3xl leading-tight text-[#1A1A1A]">
              {topic.title}
            </h2>
            {topic.subtitle && <p className="text-lg font-medium text-[#2D5FA8]">{topic.subtitle}</p>}
            {topic.body && <p className="text-[16px] leading-relaxed text-[#374151]">{topic.body}</p>}
          </div>

          <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 border-t-2 border-[#1A1A1A] pt-5 text-[16px]">
            <dt className="eyebrow text-[#6B7280] pt-0.5">When</dt>
            <dd className="text-[#1A1A1A] font-medium">
              {formatDate(event.event_date)}, {formatTime(event.event_time)}
            </dd>
            <dt className="eyebrow text-[#6B7280] pt-0.5">Where</dt>
            <dd className="text-[#1A1A1A] font-medium">
              {venue}
              {hasVenue && (
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(venue)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 flex items-center gap-1 text-sm text-[#2D5FA8] underline underline-offset-2"
                >
                  <MapPin size={14} /> Open in Google Maps
                </a>
              )}
            </dd>
            <dt className="eyebrow text-[#6B7280] pt-0.5">Cost</dt>
            <dd className="text-[#1A1A1A] font-medium">Free. No tickets needed.</dd>
            <dt className="eyebrow text-[#6B7280] pt-0.5">Seats</dt>
            <dd className="text-[#1A1A1A] font-medium">
              {isFull ? "Fully booked" : `${left} of ${event.max_participants} left`}
            </dd>
          </dl>

          {taken > 0 && (
            <div>
              <GoingPill attendees={attendees} eventId={event.id} totalCount={taken} />
            </div>
          )}

          <div className="flex flex-col gap-3">
            <ClaimButton isFull={isFull} wide />
            {isFull ? (
              <a
                href={WHATSAPP_GROUP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 border-2 border-[#1A1A1A] text-[#1A1A1A] font-semibold rounded-md hover:bg-white"
              >
                Join the WhatsApp group <ArrowUpRight size={18} />
              </a>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center justify-center px-6 py-3.5 text-[#374151] font-semibold rounded-md hover:bg-white"
              >
                Maybe later
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
