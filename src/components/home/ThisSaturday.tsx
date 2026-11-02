"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { type GoingAttendee } from "@/components/GoingPill";
import IssueCover from "@/components/home/IssueCover";
import { ComingSoonArt } from "@/components/event/TicketMoments";
import { WHATSAPP_GROUP_URL } from "@/lib/constants";
import { countConfirmed, fetchAttendees } from "@/lib/attendees";
import {
  type EventData,
  formatDate,
  formatTime,
  isUpcoming,
  parseTopic,
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
      <div className="grid lg:grid-cols-12 gap-10 items-center">
        <div className="lg:col-span-6">
          <p className="eyebrow text-[#B4570F]">Next Saturday</p>
          <h2 className="font-display font-extrabold text-[clamp(2.4rem,6vw,4.8rem)] leading-[0.95] text-[#1A1A1A] mt-4">
            The next event is coming soon!
          </h2>
          <p className="mt-5 text-lg text-[#374151] max-w-xl">
            The next event will show up here as soon as possible. In the meantime, please wait for the info in our WhatsApp group.
          </p>
        </div>
        <div className="lg:col-span-6 flex justify-center">
          <ComingSoonArt compact />
        </div>
        <div className="lg:col-span-12 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
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
