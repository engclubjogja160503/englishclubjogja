"use client";

import { Suspense, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  XCircle,
  Loader2,
  CheckCircle,
  AlertTriangle,
  LogIn,
  Search,
} from "lucide-react";
import { isUpcoming } from "@/lib/events";
import NoUpcomingEvent from "@/components/NoUpcomingEvent";
import { CancelledMoment } from "@/components/event/TicketMoments";
import { forgetMyBooking } from "@/lib/use-my-booking";

interface Booking {
  id: string;
  guest_name: string | null;
  guest_email: string | null;
  guest_phone: string | null;
  profiles: { full_name: string } | null;
}



function CancelPageContent() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState("");
  const [reason, setReason] = useState("");
  const [verification, setVerification] = useState("");
  const [isMember, setIsMember] = useState(false);
  const [mode, setMode] = useState<"member" | "guest">("member");
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState("");
  const [eventId, setEventId] = useState("");
  const [noEvent, setNoEvent] = useState(false);

  // Guest lookup state
  const [lookupValue, setLookupValue] = useState("");
  const [lookupType, setLookupType] = useState<"email" | "phone">("email");
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState("");
  const [lookupDone, setLookupDone] = useState(false);

  // Confirmation modal
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Persisted cancellation banner
  const [showCancelledBanner, setShowCancelledBanner] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Detect cancellation banner from URL param or sessionStorage
  useEffect(() => {
    const cancelledParam = searchParams.get("cancelled");
    const wasCancelled = sessionStorage.getItem("bookingCancelled");
    if (!cancelledParam && !wasCancelled) return;

    sessionStorage.removeItem("bookingCancelled");
    // Clean the URL so refreshing doesn't re-show
    if (cancelledParam === "true") {
      window.history.replaceState({}, "", "/cancel");
    }

    // Defer the state update so the effect body stays synchronous pure.
    const id = setTimeout(() => setShowCancelledBanner(true), 0);
    return () => clearTimeout(id);
  }, [searchParams]);

  useEffect(() => {
    const supabase = createClient();

    async function fetchBookings() {
      // Get active event (skip archived ones)
      const { data: events } = await supabase
        .from("events")
        .select("id, event_date, venue_name, is_archived")
        .eq("is_active", true)
        .order("event_date", { ascending: true })
        .limit(5);

      const visible = (events || []).filter((e) => !e.is_archived && isUpcoming(e));
      if (visible.length === 0) {
        setNoEvent(true);
        setLoading(false);
        return;
      }

      setEventId(visible[0].id);

      const { data: authData } = await supabase.auth.getUser();
      const authUser = authData.user;
      setIsMember(!!authUser);

      const { data } = authUser
        ? await supabase
            .from("bookings")
            .select("id, guest_name, guest_email, guest_phone, profiles(full_name)")
            .eq("event_id", visible[0].id)
            .eq("user_id", authUser.id)
            .eq("status", "confirmed")
        : { data: [] };

      if (data) {
        setBookings(data as unknown as Booking[]);
      }
      setLoading(false);
    }

    fetchBookings();
  }, []);

  // Guest: lookup booking by email or phone
  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lookupValue.trim() || !eventId) return;

    setLookupLoading(true);
    setLookupError("");
    setBookings([]);

    const supabase = createClient();
    const value = lookupValue.trim();

    // Matches the email (case-insensitive) or phone exactly, the same way
    // cancel_guest_booking verifies it, and returns only booking id + name.
    const { data, error: queryError } = await supabase.rpc("find_guest_bookings", {
      p_event_id: eventId,
      p_verification: value,
    });

    if (queryError) {
      setLookupError("Something went wrong. Please try again.");
      setLookupLoading(false);
      return;
    }

    if (!data || data.length === 0) {
      setLookupError(
        `No active guest booking found with this ${lookupType}. Make sure you typed it correctly.`
      );
      setLookupLoading(false);
      return;
    }

    setBookings(
      (data as { id: string; guest_name: string | null }[]).map((b) => ({
        id: b.id,
        guest_name: b.guest_name,
        guest_email: null,
        guest_phone: null,
        profiles: null,
      }))
    );
    setVerification(value);
    setLookupDone(true);
    setLookupLoading(false);
  };

  const handleCancel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "member" && !selectedBooking) return;
    if (mode === "guest" && (!selectedBooking || !verification)) return;
    setCancelling(true);
    setError("");

    const supabase = createClient();

    let updateError: Error | null = null;
    if (mode === "guest") {
      const result = await supabase.rpc("cancel_guest_booking", {
        p_booking_id: selectedBooking,
        p_verification: verification,
        p_reason: reason,
      });
      updateError = result.error;
      if (!updateError && result.data !== true) {
        updateError = new Error("Booking verification failed");
      }
    } else {
      // Member: verify auth
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setError("You must be logged in to cancel a booking.");
        setCancelling(false);
        return;
      }
      // Use RPC to cancel — security definer bypasses RLS issues
      const { data, error } = await supabase.rpc("cancel_member_booking", {
        p_booking_id: selectedBooking,
        p_reason: reason || null,
      });
      updateError = error;
      if (!updateError && data !== true) {
        updateError = new Error("Booking not found or already cancelled");
      }
    }

    if (updateError) {
      console.error("Cancel error:", updateError);
      setError("We could not verify that booking. Check your details and try again.");
      setCancelling(false);
      return;
    }

    // The page stays mounted after router.push, so clear the cancelled booking from state.
    setBookings((prev) => prev.filter((b) => b.id !== selectedBooking));
    setSelectedBooking("");
    setReason("");
    setVerification("");
    setLookupValue("");
    setLookupDone(false);
    setShowConfirmModal(false);
    setCancelling(false);
    forgetMyBooking();
    sessionStorage.setItem("bookingCancelled", "true");
    router.push("/cancel?cancelled=true");
  };

  const getBookingName = (booking: Booking, index?: number) => {
    if (booking.guest_name) return booking.guest_name;
    if (booking.profiles?.full_name) return booking.profiles.full_name;
    return `Participant #${(index ?? 0) + 1}`;
  };

  if (showCancelledBanner) {
    return (
      <div className="min-h-screen flex flex-col bg-[#F5F0E8]">
        <Navbar />
        <main className="flex-1">
          <CancelledMoment onAnother={noEvent ? undefined : () => setShowCancelledBanner(false)} />
        </main>
        <Footer />
      </div>
    );
  }

  if (!loading && noEvent) {
    return (
      <div className="min-h-screen flex flex-col bg-[#F5F0E8]">
        <Navbar />
        <div className="flex-1 flex items-center justify-center px-4 py-16">
          <NoUpcomingEvent
            title="No upcoming Saturday to cancel"
            text="There's no session open right now, so there's nothing to cancel. The next topic is announced in our WhatsApp group first."
          />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F0E8]">
      <Navbar />
      <div className="flex-1 px-4 py-12">
        <div className="max-w-2xl mx-auto animate-fadeIn">
          <div className="text-center mb-8">
            <h1 className="font-display font-extrabold text-5xl leading-none text-[#1A1A1A] mb-4">
              Cancel a booking
            </h1>
            <p className="text-[#6B7280]">
              We&apos;ll miss you! Cancelling frees your seat for someone else.
            </p>
          </div>

          {/* Cancellation success banner (persists after navigation) */}
          {showCancelledBanner && (
            <div className="mb-6 p-6 rounded-2xl bg-[#ECFDF5] border-2 border-[#22C55E]/30 animate-slideUp">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-[#22C55E]/10 flex items-center justify-center shrink-0">
                  <CheckCircle size={28} className="text-[#22C55E]" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-[#065F46] mb-1">
                    Booking Successfully Cancelled
                  </h3>
                  <p className="text-sm text-[#047857] mb-3">
                    Your seat has been removed from the event. We&apos;ll miss you — see you at the next one!
                  </p>
                  <div className="flex gap-2">
                    <Link
                      href="/"
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#22C55E] hover:bg-[#16A34A] text-white text-sm font-semibold rounded-lg transition-all"
                    >
                      Back to Home
                    </Link>
                    <button
                      type="button"
                      onClick={() => setShowCancelledBanner(false)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-[#F3F4F6] text-[#374151] text-sm font-medium rounded-lg border border-[#D1D5DB] transition-all"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-3xl p-8 shadow-lg border border-[#EDE5D8]">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 size={32} className="animate-spin text-[#F47B20]" />
              </div>
            ) : mode === "member" && !isMember ? (
              <div className="text-center py-8">
                <LogIn size={48} className="mx-auto mb-4 text-[#F47B20]" />
                <h3 className="text-lg font-bold text-[#1A1A1A] mb-2">
                  Log in to cancel a member booking
                </h3>
                <div className="flex flex-col items-center gap-3 mt-4">
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-[#F47B20] hover:bg-[#D96A15] text-white font-semibold rounded-xl transition-all"
                  >
                    <LogIn size={18} />
                    Sign In
                  </Link>
                  <button
                    type="button"
                    onClick={() => setMode("guest")}
                    className="text-sm font-semibold text-[#F47B20] hover:text-[#D96A15]"
                  >
                    Cancel as a guest instead
                  </button>
                </div>
              </div>
            ) : mode === "member" && bookings.length === 0 ? (
              <div className="text-center py-8">
                <AlertTriangle
                  size={48}
                  className="mx-auto mb-4 text-[#F59E0B]"
                />
                <h3 className="text-lg font-bold text-[#1A1A1A] mb-2">
                  No member booking found
                </h3>
                <p className="text-[#6B7280] mb-1">
                  We couldn&apos;t find any booking under your account.
                </p>
                <p className="text-[#6B7280] text-sm mb-6">
                  Maybe you booked as a guest? Try looking up with your email or phone.
                </p>
                <div className="flex flex-col items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setMode("guest")}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-[#3B7DD8] hover:bg-[#2D5FA8] text-white font-semibold rounded-xl transition-all"
                  >
                    <Search size={18} />
                    Cancel as a Guest
                  </button>
                  <Link
                    href="/event"
                    className="text-sm font-semibold text-[#F47B20] hover:text-[#D96A15]"
                  >
                    Or book a new seat
                  </Link>
                </div>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  // Enter in the guest lookup field should search, not open the cancel dialog.
                  if (mode === "guest" && !lookupDone) {
                    handleLookup(e);
                    return;
                  }
                  if (!selectedBooking) return;
                  setShowConfirmModal(true);
                }}
                className="space-y-6"
              >
                {error && (
                  <div className="p-4 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626] text-sm">
                    {error}
                  </div>
                )}

                {mode === "member" ? (
                  /* ── Member: pick from dropdown ── */
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-[#374151] mb-1.5">
                        Your booking
                      </label>
                      <select
                        value={selectedBooking}
                        onChange={(e) => setSelectedBooking(e.target.value)}
                        required
                        className="w-full px-4 py-3 rounded-xl border border-[#E5E7EB] bg-white text-[#1A1A1A]"
                      >
                        <option value="">Choose your booking...</option>
                        {bookings.map((booking) => (
                          <option key={booking.id} value={booking.id}>
                            {getBookingName(booking)}
                          </option>
                        ))}
                      </select>
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
                  </div>
                ) : !lookupDone ? (
                  /* ── Guest Step 1: Find my booking ── */
                  <div className="space-y-4">
                    <div className="text-center pb-2">
                      <Search
                        size={40}
                        className="mx-auto mb-3 text-[#3B7DD8]"
                      />
                      <h3 className="text-lg font-bold text-[#1A1A1A]">
                        Find my booking
                      </h3>
                      <p className="text-sm text-[#6B7280]">
                        Enter the email or phone number you used when booking.
                      </p>
                    </div>

                    {lookupError && (
                      <div className="p-4 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626] text-sm text-center">
                        {lookupError}
                      </div>
                    )}

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setLookupType("email");
                          setLookupValue("");
                          setLookupError("");
                        }}
                        className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                          lookupType === "email"
                            ? "bg-[#3B7DD8] text-white"
                            : "bg-[#F3F4F6] text-[#374151] hover:bg-[#E5E7EB]"
                        }`}
                      >
                        Email
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setLookupType("phone");
                          setLookupValue("");
                          setLookupError("");
                        }}
                        className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                          lookupType === "phone"
                            ? "bg-[#3B7DD8] text-white"
                            : "bg-[#F3F4F6] text-[#374151] hover:bg-[#E5E7EB]"
                        }`}
                      >
                        Phone
                      </button>
                    </div>

                    <div className="space-y-4">
                      <input
                        type={lookupType === "email" ? "email" : "tel"}
                        value={lookupValue}
                        onChange={(e) => {
                          setLookupValue(e.target.value);
                          setLookupError("");
                        }}
                        placeholder={
                          lookupType === "email"
                            ? "you@example.com"
                            : "08xxxxxxxxxx"
                        }
                        required
                        className="w-full px-4 py-3 rounded-xl border border-[#E5E7EB] bg-white text-[#1A1A1A] placeholder-[#9CA3AF] focus:border-[#3B7DD8]"
                      />
                      <button
                        type="button"
                        disabled={!lookupValue.trim() || lookupLoading}
                        onClick={handleLookup}
                        className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-[#3B7DD8] hover:bg-[#2D5FA8] disabled:bg-[#3B7DD8]/50 text-white font-semibold rounded-xl transition-all"
                      >
                        {lookupLoading ? (
                          <Loader2 size={20} className="animate-spin" />
                        ) : (
                          <>
                            <Search size={18} />
                            Find Booking
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  /* ── Guest Step 2: Select booking & cancel ── */
                  <div className="space-y-4">
                    <div className="p-3 rounded-xl bg-[#EBF3FD] border border-[#BFDBFE] text-sm text-[#1E40AF] text-center">
                      Found {bookings.length} booking
                      {bookings.length > 1 ? "s" : ""} for{" "}
                      <strong>{lookupValue}</strong>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#374151] mb-1.5">
                        Which booking do you want to cancel?
                      </label>
                      <select
                        value={selectedBooking}
                        onChange={(e) => setSelectedBooking(e.target.value)}
                        required
                        className="w-full px-4 py-3 rounded-xl border border-[#E5E7EB] bg-white text-[#1A1A1A]"
                      >
                        <option value="">Choose a booking...</option>
                        {bookings.map((booking, index) => (
                          <option key={booking.id} value={booking.id}>
                            {getBookingName(booking, index)}
                          </option>
                        ))}
                      </select>
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

                    <button
                      type="button"
                      onClick={() => {
                        setLookupDone(false);
                        setLookupValue("");
                        setSelectedBooking("");
                        setLookupError("");
                      }}
                      className="w-full text-sm text-[#6B7280] hover:text-[#F47B20]"
                    >
                      ← Search with a different email/phone
                    </button>
                  </div>
                )}

                {/* Switch mode button (only for logged-in members) */}
                {isMember && (
                  <button
                    type="button"
                    onClick={() =>
                      setMode(mode === "member" ? "guest" : "member")
                    }
                    className="w-full text-sm text-[#6B7280] hover:text-[#F47B20]"
                  >
                    {mode === "member"
                      ? "Cancel a guest booking"
                      : "Cancel a member booking"}
                  </button>
                )}
              </form>
            )}
          </div>

          {/* Info card for guests on member mode */}
          {!isMember && mode === "member" && (
            <div className="mt-6 bg-[#EBF3FD] rounded-2xl p-6 border border-[#BFDBFE]">
              <h3 className="font-bold text-[#1E40AF] mb-2">
                Guest? No problem!
              </h3>
              <p className="text-sm text-[#374151]">
                Click &quot;Cancel as a guest instead&quot; above. Enter the
                email or phone you used when booking, and we&apos;ll find your
                reservation — no booking ID needed!
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Confirmation Modal ── */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowConfirmModal(false)}
          />
          {/* Modal */}
          <div className="relative bg-white rounded-3xl p-8 shadow-2xl max-w-md w-full animate-slideUp">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-[#FEF2F2] flex items-center justify-center mx-auto mb-4">
                <AlertTriangle size={32} className="text-[#EF4444]" />
              </div>
              <h3 className="text-xl font-bold text-[#1A1A1A] mb-2">
                Cancel this booking?
              </h3>
              <p className="text-[#6B7280] mb-1">
                Are you sure you want to cancel your booking?
              </p>
              {selectedBooking && (
                <p className="text-sm text-[#374151] font-medium mt-2">
                  {getBookingName(
                    bookings.find((b) => b.id === selectedBooking)!,
                    bookings.findIndex((b) => b.id === selectedBooking)
                  )}
                </p>
              )}
              {reason && (
                <p className="text-sm text-[#9CA3AF] mt-1">
                  Reason: {reason}
                </p>
              )}
              <p className="text-xs text-[#9CA3AF] mt-3">
                This action cannot be undone.
              </p>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 px-4 py-3 bg-white hover:bg-[#F3F4F6] text-[#374151] font-semibold rounded-xl border border-[#E5E7EB] transition-all"
              >
                Go Back
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowConfirmModal(false);
                  handleCancel({ preventDefault: () => {} } as React.FormEvent);
                }}
                disabled={cancelling}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[#EF4444] hover:bg-[#DC2626] disabled:bg-[#EF4444]/50 text-white font-semibold rounded-xl transition-all"
              >
                {cancelling ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : (
                  <>
                    <XCircle size={18} />
                    Yes, Cancel
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}

export default function CancelPage() {
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
      <CancelPageContent />
    </Suspense>
  );
}
