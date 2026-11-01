"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { createClient } from "@/lib/supabase/client";
import { fetchAttendees } from "@/lib/attendees";
import { attendeeName, type GoingAttendee } from "@/components/GoingPill";
import { Loader2, Users, ArrowLeft, Calendar, MapPin } from "lucide-react";

interface EventInfo {
  id: string;
  event_date: string;
  event_time: string | null;
  venue_name: string;
  venue_address: string;
}

const AVATAR_BG = [
  "bg-[#F47B20]",
  "bg-[#3B7DD8]",
  "bg-[#1A1A1A]",
  "bg-[#D96A15]",
  "bg-[#2D5FA8]",
  "bg-[#6B7280]",
];

function initialsOf(name: string) {
  return name
    .split(" ")
    .map((p) => p.charAt(0))
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function AttendeesContent() {
  const searchParams = useSearchParams();
  const eventId = searchParams.get("event") || "";
  const [event, setEvent] = useState<EventInfo | null>(null);
  const [attendees, setAttendees] = useState<GoingAttendee[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    (async () => {
      if (!eventId) {
        if (!ignore) setLoading(false);
        return;
      }
      const supabase = createClient();
      const { data: evt } = await supabase
        .from("events")
        .select("id, event_date, event_time, venue_name, venue_address")
        .eq("id", eventId)
        .maybeSingle();
      if (!ignore && evt) setEvent(evt as EventInfo);

      const list = await fetchAttendees(supabase, eventId);
      if (!ignore) {
        setAttendees(list);
        setLoading(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, [eventId]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + "T19:00:00");
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F0E8]">
      <Navbar />
      <div className="flex-1 px-4 py-12">
        <div className="max-w-2xl mx-auto animate-fadeIn">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-[#6B7280] hover:text-[#F47B20] mb-6"
          >
            <ArrowLeft size={16} /> Back to home
          </Link>

          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 size={32} className="animate-spin text-[#F47B20]" />
            </div>
          ) : !eventId || !event ? (
            <div className="bg-white rounded-3xl p-8 shadow-lg border border-[#EDE5D8] text-center">
              <Users size={48} className="mx-auto mb-4 text-[#D1D5DB]" />
              <h1 className="text-2xl font-bold text-[#1A1A1A] mb-2">
                Event not found
              </h1>
              <p className="text-[#6B7280] mb-6">
                We couldn&apos;t find that event. It may have been archived.
              </p>
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#F47B20] hover:bg-[#D96A15] text-white font-semibold rounded-xl transition-all"
              >
                Back to Home
              </Link>
            </div>
          ) : (
            <>
              <div className="text-center mb-8">
                <div className="eyebrow inline-flex items-center gap-2 text-[#B4570F] mb-4">
                  <span className="w-2 h-2 rounded-full bg-[#F47B20] animate-pulse" />
                  {attendees.length} confirmed going
                </div>
                <h1 className="font-display font-extrabold text-5xl leading-none text-[#1A1A1A] mb-4">
                  Who&apos;s going
                </h1>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-2 text-[#6B7280]">
                  <span className="inline-flex items-center gap-1.5 text-sm">
                    <Calendar size={16} className="text-[#3B7DD8]" />
                    {formatDate(event.event_date)}
                  </span>
                  <span className="hidden sm:inline text-[#D1D5DB]">•</span>
                  <span className="inline-flex items-center gap-1.5 text-sm">
                    <MapPin size={16} className="text-[#F47B20]" />
                    {event.venue_name}
                  </span>
                </div>
              </div>

              {attendees.length === 0 ? (
                <div className="bg-white rounded-3xl p-8 shadow-lg border border-[#EDE5D8] text-center">
                  <p className="text-[#6B7280]">
                    No confirmed attendees yet. Be the first!
                  </p>
                  <Link
                    href="/book"
                    className="mt-4 inline-flex items-center gap-2 px-6 py-3 bg-[#F47B20] hover:bg-[#1A1A1A] hover:text-[#F5F0E8] text-[#1A1A1A] font-semibold rounded-md transition-colors"
                  >
                    Save your seat
                  </Link>
                </div>
              ) : (
                <div className="bg-white rounded-md p-4 sm:p-6 border-2 border-[#1A1A1A]">
                  <div className="divide-y divide-[#F3F4F6]">
                    {attendees.map((a, i) => {
                      const name = attendeeName(a, i);
                      const isMember = !!a.profiles;
                      return (
                        <div
                          key={a.id}
                          className="flex items-center gap-3 py-3 px-2"
                        >
                          <span
                            className={`w-10 h-10 rounded-full overflow-hidden flex items-center justify-center text-xs font-bold text-white shrink-0 ${AVATAR_BG[i % AVATAR_BG.length]}`}
                          >
                            {a.profiles?.avatar_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={a.profiles.avatar_url}
                                alt={name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              initialsOf(name)
                            )}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-[#1A1A1A] truncate">
                              {name}
                            </p>
                          </div>
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-medium shrink-0 ${
                              isMember
                                ? "bg-[#EBF3FD] text-[#2D5FA8]"
                                : "bg-[#FFF3EB] text-[#B4570F]"
                            }`}
                          >
                            {isMember ? "Member" : "Guest"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="mt-6 text-center">
                <Link
                  href="/book"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-[#F47B20] hover:bg-[#1A1A1A] hover:text-[#F5F0E8] text-[#1A1A1A] font-semibold rounded-md transition-colors text-lg"
                >
                  Join them. Save your seat
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default function AttendeesPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex flex-col bg-[#F5F0E8]">
          <Navbar />
          <div className="flex-1 flex items-center justify-center">
            <Loader2 size={32} className="animate-spin text-[#F47B20]" />
          </div>
        </div>
      }
    >
      <AttendeesContent />
    </Suspense>
  );
}
