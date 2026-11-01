"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import GoingPill, { type GoingAttendee } from "@/components/GoingPill";
import { WHATSAPP_GROUP_URL } from "@/lib/constants";
import { countConfirmed, fetchAttendees } from "@/lib/attendees";
import {
  type EventData,
  formatDate,
  formatTime,
  isUpcoming,
  parseTopic,
  venueLine,
} from "@/lib/events";

async function loadCounts(supabase: ReturnType<typeof createClient>, ids: string[]) {
  const counts: Record<string, number> = {};
  const attendees: Record<string, GoingAttendee[]> = {};
  await Promise.all(
    ids.map(async (id) => {
      counts[id] = await countConfirmed(supabase, id);
      attendees[id] = await fetchAttendees(supabase, id, 6);
    })
  );
  return { counts, attendees };
}

export default function ThisSaturday() {
  const [events, setEvents] = useState<EventData[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [attendeesMap, setAttendeesMap] = useState<Record<string, GoingAttendee[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    let ids: string[] = [];

    async function fetchEvents() {
      const { data: evts } = await supabase
        .from("events")
        .select("*")
        .eq("is_active", true)
        .order("event_date", { ascending: true });

      // Past events stay "active" until an admin archives them, so filter by date here.
      const visible = ((evts || []) as EventData[]).filter(
        (e) => !e.is_archived && isUpcoming(e)
      );
      setEvents(visible);
      ids = visible.map((e) => e.id);
      if (ids.length > 0) {
        const res = await loadCounts(supabase, ids);
        setCounts(res.counts);
        setAttendeesMap(res.attendees);
      }
      setLoading(false);
    }

    fetchEvents();

    // Realtime: refresh seat counts and faces whenever a booking changes.
    const channel = supabase
      .channel("bookings-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "bookings" }, async () => {
        if (ids.length === 0) return;
        const res = await loadCounts(supabase, ids);
        setCounts(res.counts);
        setAttendeesMap(res.attendees);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (loading) {
    return (
      <div className="grid lg:grid-cols-12 gap-10 animate-pulse" aria-busy="true" aria-label="Loading this Saturday">
        <div className="lg:col-span-7 space-y-5">
          <div className="h-4 w-48 bg-[#EDE5D8] rounded" />
          <div className="h-20 w-full bg-[#EDE5D8] rounded" />
          <div className="h-5 w-3/4 bg-[#EDE5D8] rounded" />
        </div>
        <div className="lg:col-span-5 h-64 bg-[#EDE5D8] rounded" />
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="grid lg:grid-cols-12 gap-10 items-end">
        <div className="lg:col-span-8">
          <p className="eyebrow text-[#B4570F]">Next Saturday</p>
          <h2 className="font-display font-extrabold text-[clamp(2.4rem,6vw,4.8rem)] leading-[0.95] text-[#1A1A1A] mt-4">
            The next topic is being cooked up.
          </h2>
          <p className="mt-5 text-lg text-[#374151] max-w-xl">
            Each week&apos;s topic and venue are announced in our WhatsApp group first. Join it and you&apos;ll hear about Saturday before anyone else.
          </p>
        </div>
        <div className="lg:col-span-4 flex flex-col gap-3">
          <a
            href={WHATSAPP_GROUP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-between gap-2 px-6 py-4 bg-[#F47B20] hover:bg-[#1A1A1A] hover:text-[#F5F0E8] text-[#1A1A1A] font-semibold rounded-md text-lg transition-colors"
          >
            Join the WhatsApp group <ArrowUpRight size={20} />
          </a>
          <Link href="/saturdays" className="text-[#2D5FA8] font-medium underline underline-offset-4">
            See what we talked about before
          </Link>
        </div>
      </div>
    );
  }

  const [cover, ...later] = events;

  return (
    <div className="flex flex-col gap-16">
      <IssueCover
        evt={cover}
        count={counts[cover.id] || 0}
        attendees={attendeesMap[cover.id] || []}
      />
      {later.length > 0 && (
        <div className="border-t-2 border-[#1A1A1A] pt-6">
          <p className="eyebrow text-[#6B7280] mb-4">Also coming up</p>
          <ul className="grid sm:grid-cols-2 gap-6">
            {later.map((evt) => {
              const topic = parseTopic(evt.description);
              return (
                <li key={evt.id} className="flex flex-col gap-1">
                  <span className="eyebrow text-[#B4570F]">
                    {formatDate(evt.event_date, "short")} · {formatTime(evt.event_time)}
                  </span>
                  <span className="font-display font-bold text-2xl text-[#1A1A1A]">{topic.title}</span>
                  <span className="text-sm text-[#6B7280]">
                    {counts[evt.id] || 0} of {evt.max_participants} seats taken
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

function IssueCover({
  evt,
  count,
  attendees,
}: {
  evt: EventData;
  count: number;
  attendees: GoingAttendee[];
}) {
  const topic = parseTopic(evt.description);
  const spotsLeft = Math.max(evt.max_participants - count, 0);
  const isFull = spotsLeft <= 0;

  return (
    <div className="grid lg:grid-cols-12 gap-x-12 gap-y-10">
      <div className="lg:col-span-7 flex flex-col gap-6">
        <p className="eyebrow text-[#B4570F]">
          This Saturday&apos;s topic · {formatDate(evt.event_date)}
        </p>
        <h2 className="font-display font-extrabold text-[clamp(2.8rem,7.4vw,6.4rem)] leading-[0.9] text-[#1A1A1A]">
          {topic.title}
        </h2>
        {topic.subtitle && (
          <p className="font-display font-medium text-[clamp(1.25rem,2.2vw,1.75rem)] leading-snug text-[#2D5FA8] max-w-2xl">
            {topic.subtitle}
          </p>
        )}
        {topic.body && (
          <p className="text-[17px] leading-relaxed text-[#374151] max-w-[60ch]">{topic.body}</p>
        )}
      </div>

      <aside className="lg:col-span-5 lg:pl-10 lg:border-l-2 lg:border-[#1A1A1A] flex flex-col gap-7">
        <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 text-[16px]">
          <dt className="eyebrow text-[#6B7280] pt-0.5">When</dt>
          <dd className="text-[#1A1A1A] font-medium">
            {formatDate(evt.event_date, "short")}, {formatTime(evt.event_time)}
          </dd>
          <dt className="eyebrow text-[#6B7280] pt-0.5">Where</dt>
          <dd className="text-[#1A1A1A] font-medium">{venueLine(evt)}</dd>
          <dt className="eyebrow text-[#6B7280] pt-0.5">Cost</dt>
          <dd className="text-[#1A1A1A] font-medium">Free. No tickets.</dd>
        </dl>

        <SeatMap total={evt.max_participants} taken={count} />

        {count > 0 && (
          <div>
            <GoingPill attendees={attendees} eventId={evt.id} totalCount={count} />
          </div>
        )}

        {isFull ? (
          <div className="px-6 py-4 bg-[#EDE5D8] text-[#374151] font-semibold rounded-md text-center">
            Fully booked. See you next Saturday!
          </div>
        ) : (
          <Link
            href="/event"
            className="group inline-flex items-center justify-between gap-2 px-6 py-4 bg-[#F47B20] hover:bg-[#1A1A1A] hover:text-[#F5F0E8] text-[#1A1A1A] font-semibold rounded-md text-lg transition-colors"
          >
            Save your seat
            <ArrowRight size={20} className="transition-transform group-hover:translate-x-1" />
          </Link>
        )}
        <p className="text-sm text-[#6B7280] -mt-3">
          Booked but can&apos;t make it?{" "}
          <Link href="/cancel" className="text-[#2D5FA8] underline underline-offset-2">
            Free up your seat
          </Link>{" "}
          for someone else.
        </p>
      </aside>
    </div>
  );
}

/** One square per chair. Taken seats fill in one by one. */
function SeatMap({ total, taken }: { total: number; taken: number }) {
  const left = Math.max(total - taken, 0);
  const seats = Array.from({ length: total });
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-3">
        <span className="eyebrow text-[#1A1A1A]">
          {Math.min(taken, total)} / {total} seats taken
        </span>
        <span className={`eyebrow ${left <= 5 ? "text-[#DC2626]" : "text-[#B4570F]"}`}>
          {left === 0 ? "Full" : `${left} left`}
        </span>
      </div>
      <div
        className="grid gap-[5px]"
        style={{ gridTemplateColumns: `repeat(${Math.min(total, 10)}, minmax(0, 1fr))` }}
        role="img"
        aria-label={`${taken} of ${total} seats taken`}
      >
        {seats.map((_, i) => (
          <span
            key={i}
            className={`aspect-square rounded-[3px] ${
              i < taken ? "bg-[#F47B20] seat-taken" : "border-[1.5px] border-[#1A1A1A]/25"
            }`}
            style={i < taken ? { animationDelay: `${i * 28}ms` } : undefined}
          />
        ))}
      </div>
    </div>
  );
}
