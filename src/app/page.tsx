"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import GoingPill, { type GoingAttendee } from "@/components/GoingPill";
import { WHATSAPP_GROUP_URL } from "@/lib/constants";
import {
  Calendar,
  MapPin,
  Users,
  Clock,
  ArrowRight,
  Coffee,
  ClipboardEdit,
  PartyPopper,
  Handshake,
} from "lucide-react";

interface EventData {
  id: string;
  event_date: string;
  event_time: string | null;
  venue_name: string;
  venue_address: string;
  max_participants: number;
  description: string;
  is_archived?: boolean | null;
}

function formatTime(timeStr: string | null) {
  if (!timeStr) return "7:00 PM WIB";
  const [h, m] = timeStr.split(":");
  const hour = parseInt(h, 10);
  if (Number.isNaN(hour)) return timeStr;
  const ampm = hour >= 12 ? "PM" : "AM";
  const h12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${h12}:${m ?? "00"} ${ampm} WIB`;
}

export default function HomePage() {
  const [events, setEvents] = useState<EventData[]>([]);
  const [bookingCounts, setBookingCounts] = useState<Record<string, number>>({});
  const [attendeesMap, setAttendeesMap] = useState<Record<string, GoingAttendee[]>>({});
  const [loading, setLoading] = useState(true);

  const anySpotAvailable = events.some((evt) => {
    const count = bookingCounts[evt.id] || 0;
    return count < evt.max_participants;
  });

  useEffect(() => {
    const supabase = createClient();

    async function fetchEvents() {
      const { data: evts } = await supabase
        .from("events")
        .select("*")
        .eq("is_active", true)
        .order("event_date", { ascending: true });

      // Client-side archive filter (works even before the
      // is_archived column migration is applied in Supabase).
      const visible = (evts || []).filter((e) => !e.is_archived);

      if (visible.length > 0) {
        setEvents(visible);

        const counts: Record<string, number> = {};
        const attendees: Record<string, GoingAttendee[]> = {};
        await Promise.all(
          visible.map(async (evt) => {
            const { count } = await supabase
              .from("bookings")
              .select("*", { count: "exact", head: true })
              .eq("event_id", evt.id)
              .eq("status", "confirmed");
            counts[evt.id] = count || 0;

            const { data: sample } = await supabase
              .from("bookings")
              .select("id, guest_name, profiles(full_name, username, avatar_url)")
              .eq("event_id", evt.id)
              .eq("status", "confirmed")
              .order("created_at", { ascending: true })
              .limit(6);
            if (sample) {
              attendees[evt.id] = sample as unknown as GoingAttendee[];
            }
          })
        );
        setBookingCounts(counts);
        setAttendeesMap(attendees);
      }
      setLoading(false);
    }

    fetchEvents();

    // Realtime subscription — refetch counts + attendee preview on any booking change
    const channel = supabase
      .channel("bookings-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bookings" },
        async () => {
          const { data: evts } = await supabase
            .from("events")
            .select("id")
            .eq("is_active", true);
          if (evts) {
            const counts: Record<string, number> = {};
            const attendees: Record<string, GoingAttendee[]> = {};
            await Promise.all(
              evts.map(async (evt) => {
                const { count } = await supabase
                  .from("bookings")
                  .select("*", { count: "exact", head: true })
                  .eq("event_id", evt.id)
                  .eq("status", "confirmed");
                counts[evt.id] = count || 0;

                const { data: sample } = await supabase
                  .from("bookings")
                  .select("id, guest_name, profiles(full_name, username, avatar_url)")
                  .eq("event_id", evt.id)
                  .eq("status", "confirmed")
                  .order("created_at", { ascending: true })
                  .limit(6);
                if (sample) {
                  attendees[evt.id] = sample as unknown as GoingAttendee[];
                }
              })
            );
            setBookingCounts(counts);
            setAttendeesMap(attendees);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + "T19:00:00");
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* Hero Section */}
      <main className="flex-1">
        <section className="relative overflow-hidden">
          {/* Background decorations */}
          <div className="absolute top-20 left-10 w-72 h-72 bg-[#F47B20]/5 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-[#3B7DD8]/5 rounded-full blur-3xl" />
          {/* Subtle dot pattern texture */}
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(circle, #1A1A1A 1px, transparent 1px)", backgroundSize: "24px 24px" }} />

          <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-16 pb-20">
            <div className="text-center animate-fadeIn">
              {/* Badge */}
              <div className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#EBF3FD] border border-[#3B7DD8]/20 text-[#3B7DD8] text-sm font-medium mb-8">
                <span className="animate-bounce inline-block text-base">👋</span>
                <span>100% Free — No tickets needed</span>
              </div>

              {/* Title */}
              <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold text-[#1A1A1A] leading-tight mb-6">
                English Club{" "}
                <span className="text-[#F47B20]">Jogja</span>{" "}
                <span className="inline-block animate-bounce text-3xl sm:text-4xl md:text-5xl align-middle" style={{ animationDelay: "0.2s" }}>🗣️</span>
              </h1>

              <p className="text-lg sm:text-xl text-[#374151] max-w-2xl mx-auto mb-3 leading-relaxed">
                A place to practice English, meet new people, and build your confidence without pressure.
              </p>
              <p className="text-base sm:text-lg text-[#3B7DD8] font-semibold mb-10">
                🗓️ We Meet Every Weekend
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-4 mb-16">
                {!loading && !anySpotAvailable ? (
                  <div className="inline-flex items-center gap-2 px-8 py-4 bg-[#F3F4F6] text-[#6B7280] font-semibold rounded-2xl text-lg cursor-not-allowed">
                    <span className="text-base">🪑</span> Fully Booked — See you next week!
                  </div>
                ) : (
                  <Link
                    href="/book"
                    className="inline-flex items-center gap-2 px-8 py-4 bg-[#F47B20] hover:bg-[#D96A15] text-white font-semibold rounded-2xl shadow-lg shadow-[#F47B20]/25 hover:shadow-xl hover:shadow-[#F47B20]/30 transform hover:-translate-y-0.5 transition-all text-lg animate-pulse-glow"
                  >
                    <span className="text-base">🪑</span> Book Your Seat
                    <ArrowRight size={20} />
                  </Link>
                )}
                <Link
                  href="/cancel"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-white hover:bg-[#F3F4F6] text-[#374151] font-semibold rounded-2xl border border-[#E5E7EB] transition-all text-lg"
                >
                  Cancel Booking
                </Link>
                <a
                  href={WHATSAPP_GROUP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-[#25D366] hover:bg-[#1DA851] text-white font-semibold rounded-2xl shadow-lg shadow-[#25D366]/25 hover:shadow-xl transform hover:-translate-y-0.5 transition-all text-lg"
                >
                  <span className="text-base">💬</span> Join Our Group
                </a>
              </div>
            </div>

            {/* Event Cards */}
            {loading ? (
              <div className="max-w-2xl mx-auto">
                <div className="bg-white rounded-3xl p-8 shadow-lg border border-[#EDE5D8] animate-pulse">
                  <div className="h-6 bg-gray-200 rounded w-1/3 mb-4" />
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
                  <div className="h-4 bg-gray-200 rounded w-2/3" />
                </div>
              </div>
            ) : events.length > 0 ? (
              <div className="max-w-2xl mx-auto space-y-6">
                {events.map((evt, i) => {
                  const count = bookingCounts[evt.id] || 0;
                  const spotsLeft = evt.max_participants - count;
                  const isFull = spotsLeft <= 0;
                  const percentage = Math.min(
                    (count / evt.max_participants) * 100,
                    100
                  );

                  return (
                    <div
                      key={evt.id}
                      className="animate-slideUp"
                      style={{ animationDelay: `${i * 0.1}s` }}
                    >
                      <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-lg border border-[#EDE5D8] hover:shadow-xl transition-shadow">
                        {/* Event Header */}
                        <div className="flex items-center gap-2 text-[#3B7DD8] text-sm font-semibold mb-4">
                          <Coffee size={18} />
                          <span>
                            {i === 0 ? "NEXT MEETUP" : "UPCOMING EVENT"}
                          </span>
                          <span className="animate-pulse text-sm">✨</span>
                        </div>

                        <h2 className="text-2xl sm:text-3xl font-bold text-[#1A1A1A] mb-2">
                          Saturday Night English Practice
                        </h2>

                        <p className="text-[#6B7280] mb-6">
                          {evt.description}
                        </p>

                        {/* Event Details */}
                        <div className="space-y-3 mb-8">
                          <div className="flex items-center gap-3 text-[#374151]">
                            <Calendar
                              size={20}
                              className="text-[#3B7DD8] shrink-0"
                            />
                            <span className="font-medium">
                              {formatDate(evt.event_date)}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-[#374151]">
                            <Clock
                              size={20}
                              className="text-[#F47B20] shrink-0"
                            />
                            <span className="font-medium">
                              {formatTime(evt.event_time)}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-[#374151]">
                            <MapPin
                              size={20}
                              className="text-[#EF4444] shrink-0"
                            />
                            <span className="font-medium">
                              {evt.venue_name}
                              {evt.venue_address &&
                                ` — ${evt.venue_address}`}
                            </span>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="mb-4">
                          <div className="flex items-center justify-between text-sm mb-2">
                            <div className="flex items-center gap-2 text-[#374151]">
                              <Users
                                size={16}
                                className="text-[#3B7DD8]"
                              />
                              <span className="font-semibold">
                                {count} of {evt.max_participants} seats have
                                been booked
                              </span>
                            </div>
                            <span
                              className={`font-bold ${
                                isFull
                                  ? "text-[#EF4444]"
                                  : spotsLeft <= 5
                                  ? "text-[#F59E0B]"
                                  : "text-[#22C55E]"
                              }`}
                            >
                              {isFull
                                ? "FULLY BOOKED"
                                : `${spotsLeft} spots left`}
                            </span>
                          </div>
                          <div className="w-full h-3 bg-[#F3F4F6] rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-1000 ease-out"
                              style={{
                                width: `${percentage}%`,
                                backgroundColor: isFull
                                  ? "#EF4444"
                                  : spotsLeft <= 5
                                  ? "#F59E0B"
                                  : "#22C55E",
                              }}
                            />
                          </div>
                        </div>

                        {/* Going pill — who's confirmed, links to full list */}
                        {(bookingCounts[evt.id] || 0) > 0 && (
                          <div className="mb-4 flex justify-start">
                            <GoingPill
                              attendees={attendeesMap[evt.id] || []}
                              eventId={evt.id}
                              totalCount={count}
                            />
                          </div>
                        )}

                        {/* CTA */}
                        {!isFull ? (
                          <Link
                            href="/book"
                            className="mt-6 w-full flex items-center justify-center gap-2 px-6 py-4 bg-[#F47B20] hover:bg-[#D96A15] text-white font-semibold rounded-2xl shadow-lg shadow-[#F47B20]/25 hover:shadow-xl transition-all text-lg"
                          >
                            <span className="text-base">💺</span> Claim
                            Your Spot Now
                            <ArrowRight size={20} />
                          </Link>
                        ) : (
                          <div className="mt-6 w-full flex items-center justify-center gap-2 px-6 py-4 bg-[#F3F4F6] text-[#6B7280] font-semibold rounded-2xl text-lg">
                            <span>
                              😅 Fully Booked — See you next week!
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="max-w-2xl mx-auto text-center py-12">
                <p className="text-[#6B7280] text-lg">
                  No upcoming events yet. Stay tuned!
                </p>
              </div>
            )}

            {/* How It Works */}
            <div className="mt-20 max-w-4xl mx-auto">
              <h2 className="text-2xl sm:text-3xl font-bold text-center text-[#1A1A1A] mb-4">
                How it works <span className="text-xl">✨</span>
              </h2>
              <p className="text-center text-[#6B7280] mb-12 text-sm">
                No grades, no pressure, just conversation.
              </p>
              <div className="grid sm:grid-cols-3 gap-6">
                <div className="animate-slideUp" style={{ animationDelay: "0.1s" }}>
                  <StepCard
                    number="01"
                    icon={<ClipboardEdit size={20} />}
                    title="Sign up or book as guest"
                    desc="Create an account for faster booking next time, or just fill in your details real quick."
                    color="orange"
                  />
                </div>
                <div className="animate-slideUp" style={{ animationDelay: "0.2s" }}>
                  <StepCard
                    number="02"
                    icon={<PartyPopper size={20} />}
                    title="Show up & have fun"
                    desc="Come to the venue on Saturday at 7 PM. Bring your good vibes and ready to speak English!"
                    color="blue"
                  />
                </div>
                <div className="animate-slideUp" style={{ animationDelay: "0.3s" }}>
                  <StepCard
                    number="03"
                    icon={<Handshake size={20} />}
                    title="Meet fellow English learners"
                    desc="Network, make friends, practice English, maybe find your future partner? Who knows!"
                    color="green"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

function StepCard({
  number,
  icon,
  title,
  desc,
  color,
}: {
  number: string;
  icon: React.ReactNode;
  title: string;
  desc: string;
  color: "orange" | "blue" | "green";
}) {
  const colorMap = {
    orange: {
      bg: "bg-[#FFF3EB]",
      number: "text-[#F47B20]/20",
      iconBg: "bg-[#F47B20]/10",
      iconColor: "text-[#F47B20]",
      border: "border-[#F47B20]/10",
      hover: "hover:border-[#F47B20]/30",
    },
    blue: {
      bg: "bg-[#EBF3FD]",
      number: "text-[#3B7DD8]/20",
      iconBg: "bg-[#3B7DD8]/10",
      iconColor: "text-[#3B7DD8]",
      border: "border-[#3B7DD8]/10",
      hover: "hover:border-[#3B7DD8]/30",
    },
    green: {
      bg: "bg-[#ECFDF5]",
      number: "text-[#22C55E]/20",
      iconBg: "bg-[#22C55E]/10",
      iconColor: "text-[#22C55E]",
      border: "border-[#22C55E]/10",
      hover: "hover:border-[#22C55E]/30",
    },
  };
  const c = colorMap[color];

  return (
    <div className={`bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-sm border ${c.border} ${c.hover} hover:shadow-md transition-all`}>
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 rounded-xl ${c.iconBg} flex items-center justify-center ${c.iconColor}`}>
          {icon}
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-3xl font-bold ${c.number}`}>{number}</span>
        </div>
      </div>
      <h3 className="text-lg font-bold text-[#1A1A1A] mb-2">{title}</h3>
      <p className="text-[#6B7280] text-sm leading-relaxed">{desc}</p>
    </div>
  );
}
