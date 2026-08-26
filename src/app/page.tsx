"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  Calendar,
  MapPin,
  Users,
  Clock,
  ArrowRight,
  Sparkles,
  Heart,
  Coffee,
} from "lucide-react";

interface EventData {
  id: string;
  event_date: string;
  venue_name: string;
  venue_address: string;
  max_participants: number;
  description: string;
}

interface BookingCount {
  count: number;
}

export default function HomePage() {
  const [event, setEvent] = useState<EventData | null>(null);
  const [bookingCount, setBookingCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    async function fetchEvent() {
      const { data: events } = await supabase
        .from("events")
        .select("*")
        .eq("is_active", true)
        .order("event_date", { ascending: true })
        .limit(1);

      if (events && events.length > 0) {
        setEvent(events[0]);

        const { count } = await supabase
          .from("bookings")
          .select("*", { count: "exact", head: true })
          .eq("event_id", events[0].id)
          .eq("status", "confirmed");

        setBookingCount(count || 0);
      }
      setLoading(false);
    }

    fetchEvent();

    // Realtime subscription
    const channel = supabase
      .channel("bookings-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bookings" },
        async () => {
          if (event) {
            const { count } = await supabase
              .from("bookings")
              .select("*", { count: "exact", head: true })
              .eq("event_id", event.id)
              .eq("status", "confirmed");
            setBookingCount(count || 0);
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

  const spotsLeft = event ? event.max_participants - bookingCount : 0;
  const isFull = spotsLeft <= 0;
  const percentage = event
    ? Math.min((bookingCount / event.max_participants) * 100, 100)
    : 0;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* Hero Section */}
      <main className="flex-1">
        <section className="relative overflow-hidden">
          {/* Background decorations */}
          <div className="absolute top-20 left-10 w-72 h-72 bg-[#F47B20]/5 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-[#3B7DD8]/5 rounded-full blur-3xl" />

          <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-16 pb-20">
            <div className="text-center animate-fadeIn">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#FFF3EB] border border-[#F47B20]/20 text-[#F47B20] text-sm font-medium mb-8">
                <Sparkles size={16} />
                <span>100% Free — No tickets needed</span>
              </div>

              {/* Title */}
              <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold text-[#1A1A1A] leading-tight mb-6">
                English Club{" "}
                <span className="text-[#F47B20]">Jogja</span>
              </h1>

              <p className="text-lg sm:text-xl text-[#6B7280] max-w-2xl mx-auto mb-10 leading-relaxed">
                Practice English every Saturday night. Meet cool people. Have an
                absolute blast. No pressure, just vibes.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
                <Link
                  href="/book"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-[#F47B20] hover:bg-[#D96A15] text-white font-semibold rounded-2xl shadow-lg shadow-[#F47B20]/25 hover:shadow-xl hover:shadow-[#F47B20]/30 transform hover:-translate-y-0.5 transition-all text-lg"
                >
                  Book Your Seat
                  <ArrowRight size={20} />
                </Link>
                <Link
                  href="/cancel"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-white hover:bg-[#F3F4F6] text-[#374151] font-semibold rounded-2xl border border-[#E5E7EB] transition-all text-lg"
                >
                  Cancel Booking
                </Link>
              </div>
            </div>

            {/* Event Card */}
            {loading ? (
              <div className="max-w-2xl mx-auto">
                <div className="bg-white rounded-3xl p-8 shadow-lg border border-[#EDE5D8] animate-pulse">
                  <div className="h-6 bg-gray-200 rounded w-1/3 mb-4" />
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
                  <div className="h-4 bg-gray-200 rounded w-2/3" />
                </div>
              </div>
            ) : event ? (
              <div className="max-w-2xl mx-auto animate-slideUp">
                <div className="bg-white rounded-3xl p-8 shadow-lg border border-[#EDE5D8] hover:shadow-xl transition-shadow">
                  {/* Event Header */}
                  <div className="flex items-center gap-2 text-[#F47B20] text-sm font-semibold mb-4">
                    <Coffee size={18} />
                    <span>NEXT MEETUP</span>
                  </div>

                  <h2 className="text-2xl sm:text-3xl font-bold text-[#1A1A1A] mb-2">
                    Saturday Night English Practice
                  </h2>

                  <p className="text-[#6B7280] mb-6">{event.description}</p>

                  {/* Event Details */}
                  <div className="space-y-3 mb-8">
                    <div className="flex items-center gap-3 text-[#374151]">
                      <Calendar
                        size={20}
                        className="text-[#F47B20] shrink-0"
                      />
                      <span className="font-medium">
                        {formatDate(event.event_date)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-[#374151]">
                      <Clock
                        size={20}
                        className="text-[#F47B20] shrink-0"
                      />
                      <span className="font-medium">7:00 PM WIB</span>
                    </div>
                    <div className="flex items-center gap-3 text-[#374151]">
                      <MapPin
                        size={20}
                        className="text-[#F47B20] shrink-0"
                      />
                      <span className="font-medium">
                        {event.venue_name}
                        {event.venue_address &&
                          ` — ${event.venue_address}`}
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <div className="flex items-center gap-2 text-[#374151]">
                        <Users size={16} className="text-[#3B7DD8]" />
                        <span className="font-semibold">
                          {bookingCount} / {event.max_participants} seats
                          booked
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

                  {/* Full CTA */}
                  {!isFull && (
                    <Link
                      href="/book"
                      className="mt-6 w-full flex items-center justify-center gap-2 px-6 py-4 bg-[#F47B20] hover:bg-[#D96A15] text-white font-semibold rounded-2xl shadow-lg shadow-[#F47B20]/25 hover:shadow-xl transition-all text-lg"
                    >
                      <Heart size={20} />
                      Claim Your Spot Now
                    </Link>
                  )}

                  {isFull && (
                    <div className="mt-6 w-full flex items-center justify-center gap-2 px-6 py-4 bg-[#F3F4F6] text-[#6B7280] font-semibold rounded-2xl text-lg">
                      <span>Sold out — See you next week!</span>
                    </div>
                  )}
                </div>
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
              <h2 className="text-2xl sm:text-3xl font-bold text-center text-[#1A1A1A] mb-12">
                How it works
              </h2>
              <div className="grid sm:grid-cols-3 gap-8">
                <StepCard
                  number="01"
                  title="Sign up or book as guest"
                  desc="Create an account for faster booking next time, or just fill in your details real quick."
                />
                <StepCard
                  number="02"
                  title="Show up & have fun"
                  desc="Come to the venue on Saturday at 7 PM. Bring your good vibes and ready to speak English!"
                />
                <StepCard
                  number="03"
                  title="Meet your new crew"
                  desc="Network, make friends, practice English, maybe find your future partner? Who knows!"
                />
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
  title,
  desc,
}: {
  number: string;
  title: string;
  desc: string;
}) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#EDE5D8] hover:shadow-md transition-shadow">
      <div className="text-4xl font-bold text-[#F47B20]/20 mb-3">{number}</div>
      <h3 className="text-lg font-bold text-[#1A1A1A] mb-2">{title}</h3>
      <p className="text-[#6B7280] text-sm leading-relaxed">{desc}</p>
    </div>
  );
}
