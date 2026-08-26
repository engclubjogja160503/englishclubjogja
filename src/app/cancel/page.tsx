"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { XCircle, Loader2, CheckCircle, AlertTriangle } from "lucide-react";

interface Booking {
  id: string;
  guest_name: string | null;
  guest_phone: string | null;
  is_member: boolean;
  profiles: { full_name: string; email: string } | null;
}

export default function CancelPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState("");
  const [reason, setReason] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [cancelled, setCancelled] = useState(false);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [eventId, setEventId] = useState("");

  useEffect(() => {
    const supabase = createClient();

    async function fetchBookings() {
      // Get active event
      const { data: events } = await supabase
        .from("events")
        .select("id")
        .eq("is_active", true)
        .order("event_date", { ascending: true })
        .limit(1);

      if (!events || events.length === 0) {
        setLoading(false);
        return;
      }

      setEventId(events[0].id);

      // Get confirmed bookings
      const { data } = await supabase
        .from("bookings")
        .select("id, guest_name, guest_phone, is_member, user_id, profiles(full_name, email)")
        .eq("event_id", events[0].id)
        .eq("status", "confirmed");

      if (data) {
        setBookings(data as unknown as Booking[]);
      }
      setLoading(false);
    }

    fetchBookings();
  }, []);

  const handleCancel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBooking) return;
    setCancelling(true);
    setError("");

    const supabase = createClient();

    const { error: updateError } = await supabase
      .from("bookings")
      .update({
        status: "cancelled",
        cancellation_reason: reason,
      })
      .eq("id", selectedBooking);

    if (updateError) {
      setError("Failed to cancel. Please try again.");
      setCancelling(false);
      return;
    }

    setCancelled(true);
    setCancelling(false);
  };

  const getBookingName = (booking: Booking) => {
    if (booking.profiles?.full_name) return booking.profiles.full_name;
    if (booking.guest_name) return booking.guest_name;
    return "Unknown";
  };

  const filteredBookings = bookings.filter((b) => {
    const name = getBookingName(b).toLowerCase();
    return name.includes(searchQuery.toLowerCase());
  });

  // SUCCESS STATE
  if (cancelled) {
    return (
      <div className="min-h-screen flex flex-col bg-[#F5F0E8]">
        <Navbar />
        <div className="flex-1 flex items-center justify-center px-4 py-12">
          <div className="max-w-md w-full text-center animate-slideUp">
            <div className="bg-white rounded-3xl p-8 shadow-lg border border-[#EDE5D8]">
              <CheckCircle size={64} className="mx-auto mb-6 text-[#22C55E]" />
              <h1 className="text-2xl font-bold text-[#1A1A1A] mb-3">
                Booking Cancelled
              </h1>
              <p className="text-[#6B7280] mb-6">
                Your seat has been successfully cancelled. No worries though
                — we&apos;ll see you at the next one! 🫶
              </p>
              <Link
                href="/"
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[#F47B20] hover:bg-[#D96A15] text-white font-semibold rounded-xl transition-all"
              >
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F0E8]">
      <Navbar />
      <div className="flex-1 px-4 py-12">
        <div className="max-w-2xl mx-auto animate-fadeIn">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-[#1A1A1A] mb-3">
              Cancel Booking 😢
            </h1>
            <p className="text-[#6B7280]">
              We&apos;ll miss you! Pick your name below to cancel your booking.
            </p>
          </div>

          <div className="bg-white rounded-3xl p-8 shadow-lg border border-[#EDE5D8]">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 size={32} className="animate-spin text-[#F47B20]" />
              </div>
            ) : bookings.length === 0 ? (
              <div className="text-center py-8">
                <AlertTriangle
                  size={48}
                  className="mx-auto mb-4 text-[#F59E0B]"
                />
                <h3 className="text-lg font-bold text-[#1A1A1A] mb-2">
                  No bookings found
                </h3>
                <p className="text-[#6B7280]">
                  Looks like nobody&apos;s booked yet. Wanna be the first?
                </p>
                <Link
                  href="/book"
                  className="inline-flex items-center gap-2 mt-4 px-6 py-3 bg-[#F47B20] hover:bg-[#D96A15] text-white font-semibold rounded-xl transition-all"
                >
                  Book a Seat
                </Link>
              </div>
            ) : (
              <form onSubmit={handleCancel} className="space-y-6">
                {error && (
                  <div className="p-4 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626] text-sm">
                    {error}
                  </div>
                )}

                {/* Search */}
                <div>
                  <label className="block text-sm font-medium text-[#374151] mb-1.5">
                    Search your name
                  </label>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Type your name to search..."
                    className="w-full px-4 py-3 rounded-xl border border-[#E5E7EB] bg-white text-[#1A1A1A] placeholder-[#9CA3AF] focus:border-[#3B7DD8]"
                  />
                </div>

                {/* Name dropdown */}
                <div>
                  <label className="block text-sm font-medium text-[#374151] mb-1.5">
                    Select your booking <span className="text-[#EF4444]">*</span>
                  </label>
                  <select
                    value={selectedBooking}
                    onChange={(e) => setSelectedBooking(e.target.value)}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-[#E5E7EB] bg-white text-[#1A1A1A] focus:border-[#3B7DD8]"
                  >
                    <option value="">Choose a name...</option>
                    {filteredBookings.map((b) => (
                      <option key={b.id} value={b.id}>
                        {getBookingName(b)}
                        {b.is_member ? " (Member)" : " (Guest)"}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-[#9CA3AF]">
                    {filteredBookings.length} booking(s) found
                  </p>
                </div>

                {/* Reason */}
                <div>
                  <label className="block text-sm font-medium text-[#374151] mb-1.5">
                    Reason for cancellation{" "}
                    <span className="text-[#9CA3AF]">(optional)</span>
                  </label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Let us know why you're cancelling..."
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border border-[#E5E7EB] bg-white text-[#1A1A1A] placeholder-[#9CA3AF] focus:border-[#3B7DD8] resize-none"
                  />
                </div>

                {/* Confirm button */}
                <button
                  type="submit"
                  disabled={!selectedBooking || cancelling}
                  className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-[#EF4444] hover:bg-[#DC2626] disabled:bg-[#EF4444]/50 text-white font-bold rounded-2xl shadow-lg transition-all text-lg"
                >
                  {cancelling ? (
                    <Loader2 size={24} className="animate-spin" />
                  ) : (
                    <>
                      <XCircle size={22} />
                      Confirm Cancellation
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
