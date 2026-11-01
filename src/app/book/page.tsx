"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import GoingPill from "@/components/GoingPill";
import NoUpcomingEvent from "@/components/NoUpcomingEvent";
import { Loader2, User, ArrowRight, LogIn } from "lucide-react";
import {
  OCCUPATION_OPTIONS,
  DOMICILE_OPTIONS,
  INTEREST_OPTIONS,
  EXPECTATION_OPTIONS,
  AGE_RANGES,
  MBTI_OPTIONS,
} from "@/lib/constants";
import { isUpcoming, type EventData as FullEvent } from "@/lib/events";
import { BookedMoment } from "@/components/event/TicketMoments";
import { countConfirmed, fetchAttendees } from "@/lib/attendees";

const GOOGLE_SHEETS_WEBHOOK_URL = process.env.NEXT_PUBLIC_GOOGLE_SHEETS_WEBHOOK_URL;

/** Fire-and-forget sync so a slow Apps Script never holds up the success screen. */
function syncToSheets(payload: Record<string, unknown>) {
  if (!GOOGLE_SHEETS_WEBHOOK_URL) return;
  fetch(GOOGLE_SHEETS_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(payload),
    keepalive: true,
  }).catch((sheetsError) => {
    console.error("Google Sheets sync error:", sheetsError);
  });
}

interface EventData {
  id: string;
  event_date: string;
  venue_name: string;
  max_participants: number;
}

interface AttendeeData {
  id: string;
  guest_name: string | null;
  profiles: { full_name: string; username: string; avatar_url?: string | null } | null;
}

export default function BookPage() {
  const [step, setStep] = useState<"choose" | "confirm" | "declined" | "form" | "success">("choose");
  const [isMember, setIsMember] = useState(false);
  const [event, setEvent] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [bookingId, setBookingId] = useState("");
  const [showMemberLogin, setShowMemberLogin] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);
  const [attendees, setAttendees] = useState<AttendeeData[]>([]);
  const [bookingError, setBookingError] = useState("");
  const [bookingCount, setBookingCount] = useState(0);

  // Form state
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    occupation: "Student",
    domicile: "Kota Yogyakarta",
    instagram: "",
    interests: [] as string[],
    expectations: [] as string[],
    expectation_other: "",
    age_range: "",
    mbti: "",
  });

  // Logged in user
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);

  useEffect(() => {
    const supabase = createClient();

    async function init() {
      // Check auth
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (authUser) {
        setUser({ id: authUser.id, email: authUser.email || "" });

        // Fetch profile
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", authUser.id)
          .single();

        if (profile) {
          setFormData({
            full_name: profile.full_name || "",
            email: profile.email || authUser.email || "",
            phone: profile.phone || "",
            occupation: profile.occupation || "Student",
            domicile: profile.domicile || "Kota Yogyakarta",
            instagram: profile.instagram || "",
            interests: profile.interests || [],
            expectations: profile.expectations || [],
            expectation_other: profile.expectation_other || "",
            age_range: profile.age_range || "",
            mbti: profile.mbti || "",
          });
        }
      }

      // Fetch the next active event (skip archived ones and dates that have passed)
      const { data: events } = await supabase
        .from("events")
        .select("*")
        .eq("is_active", true)
        .order("event_date", { ascending: true })
        .limit(10);

      const visible = (events || []).filter((e) => !e.is_archived && isUpcoming(e));
      if (visible.length > 0) {
        const activeEvent = visible[0];
        setEvent(activeEvent);

        const confirmedBookings = await fetchAttendees(supabase, activeEvent.id);
        setAttendees(confirmedBookings);
        setBookingCount(confirmedBookings.length);
      }
      setLoading(false);
    }

    init();
  }, []);

  const handleChoice = (member: boolean) => {
    if (member && !user) {
      setShowMemberLogin(true);
      return;
    }

    setIsMember(member);
  setStep(member ? "confirm" : "form");
  };

  const handleMemberLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoggingIn(true);
    setLoginError("");

    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password: loginPassword,
    });

    if (error || !data.user) {
      setLoginError(error?.message || "Unable to log in. Please try again.");
      setLoggingIn(false);
      return;
    }

    setUser({ id: data.user.id, email: data.user.email || loginEmail });
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", data.user.id)
      .single();

    if (profile) {
      setFormData({
        full_name: profile.full_name || "",
        email: profile.email || data.user.email || loginEmail,
        phone: profile.phone || "",
        occupation: profile.occupation || "Student",
        domicile: profile.domicile || "Kota Yogyakarta",
        instagram: profile.instagram || "",
        interests: profile.interests || [],
        expectations: profile.expectations || [],
        expectation_other: profile.expectation_other || "",
        age_range: profile.age_range || "",
        mbti: profile.mbti || "",
      });
    }

    setIsMember(true);
    setStep("confirm");
    setLoggingIn(false);
  };

  const confirmMemberBooking = async () => {
    if (!event) return;
    setSubmitting(true);
    setBookingError("");

    const supabase = createClient();

    // Re-check capacity before booking
    const currentCount = await countConfirmed(supabase, event.id);
    if (currentCount >= event.max_participants) {
      setBookingError("Sorry, this event is now fully booked.");
      setSubmitting(false);
      return;
    }
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();
    const member = currentUser || user;

    if (!member) {
      setBookingError("Your login session has expired. Please log in again.");
      setSubmitting(false);
      return;
    }

    const memberEmail = member.email || loginEmail;
    const memberUsername =
      currentUser?.user_metadata?.username ||
      `${memberEmail.split("@")[0]}-${member.id.slice(0, 6)}`;

    const { error: profileError } = await supabase.from("profiles").upsert({
      id: member.id,
      email: memberEmail,
      username: memberUsername,
      full_name: formData.full_name || memberEmail.split("@")[0],
      phone: formData.phone || "Not provided",
      occupation: formData.occupation || "General",
      domicile: formData.domicile || "Other",
      instagram: formData.instagram,
      interests: formData.interests,
      expectations: formData.expectations,
      expectation_other: formData.expectation_other,
      age_range: formData.age_range,
      mbti: formData.mbti,
      is_member: true,
    });

    if (profileError) {
      console.error("Profile recovery error:", profileError);
      setBookingError(profileError.message);
      setSubmitting(false);
      return;
    }

    // One seat per member: if they already have one, just show it again.
    const { data: existingBooking } = await supabase
      .from("bookings")
      .select("id")
      .eq("event_id", event.id)
      .eq("user_id", member.id)
      .eq("status", "confirmed")
      .limit(1)
      .maybeSingle();

    if (existingBooking) {
      setBookingId(existingBooking.id);
      setStep("success");
      setSubmitting(false);
      return;
    }

    const { data: cancelledBooking } = await supabase
      .from("bookings")
      .select("id")
      .eq("event_id", event.id)
      .eq("user_id", member.id)
      .eq("status", "cancelled")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const bookingQuery = cancelledBooking
      ? supabase
          .from("bookings")
          .update({ status: "confirmed", cancellation_reason: null })
          .eq("id", cancelledBooking.id)
      : supabase.from("bookings").insert({
          event_id: event.id,
          user_id: member.id,
          status: "confirmed",
          is_member: true,
        });

    const { data: booking, error: bookingError } = await bookingQuery
      .select("id")
      .single();

    if (bookingError) {
      console.error("Booking error:", bookingError);
      setBookingError(bookingError.message);
      setSubmitting(false);
      return;
    }

    if (booking?.id) {
      syncToSheets({
        bookingId: booking.id,
        eventDate: event.event_date,
        name: formData.full_name,
        email: formData.email,
        phone: formData.phone,
        username: "",
        occupation: formData.occupation,
        domicile: formData.domicile,
        instagram: formData.instagram,
        isMember: true,
        status: "confirmed",
        bookingDate: new Date().toISOString(),
        age: formData.age_range,
        mbti: formData.mbti,
      });
    }

    setBookingId(booking?.id || "");
    setStep("success");
    setSubmitting(false);
  };

  const toggleInterest = (interest: string) => {
    setFormData((prev) => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter((i) => i !== interest)
        : [...prev.interests, interest],
    }));
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    setIsMember(false);
    setFormData({
      full_name: "",
      email: "",
      phone: "",
      occupation: "Student",
      domicile: "Kota Yogyakarta",
      instagram: "",
      interests: [],
      expectations: [],
      expectation_other: "",
      age_range: "",
      mbti: "",
    });
    setStep("choose");
  };

  const toggleExpectation = (exp: string) => {
    setFormData((prev) => ({
      ...prev,
      expectations: prev.expectations.includes(exp)
        ? prev.expectations.filter((e) => e !== exp)
        : [...prev.expectations, exp],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!event) return;

    setBookingError("");
    if (!isMember || !user) {
      if (!formData.age_range) {
        setBookingError("Please select your age range.");
        return;
      }
      if (!formData.mbti) {
        setBookingError("Please select your MBTI type.");
        return;
      }
    }

    setSubmitting(true);

    const supabase = createClient();

    // Re-check capacity before booking
    const currentCount = await countConfirmed(supabase, event.id);
    if (currentCount >= event.max_participants) {
      setBookingError("Sorry, this event is now fully booked.");
      setSubmitting(false);
      return;
    }

    // If member, update profile
    if (isMember && user) {
      await supabase.from("profiles").upsert({
        id: user.id,
        email: formData.email,
        full_name: formData.full_name,
        phone: formData.phone,
        occupation: formData.occupation,
        domicile: formData.domicile,
        instagram: formData.instagram,
        interests: formData.interests,
        expectations: formData.expectations,
        expectation_other: formData.expectation_other,
        age_range: formData.age_range,
        mbti: formData.mbti,
        is_member: true,
      });
    }

    let booking: { id: string } | null = null;
    let bookingError: { message: string } | null = null;

    if (isMember && user) {
      const res = await supabase
        .from("bookings")
        .insert({ event_id: event.id, user_id: user.id, status: "confirmed", is_member: true })
        .select("id")
        .single();
      booking = res.data;
      bookingError = res.error;
    } else {
      // Guests book through a database function, so the bookings table
      // (with everyone's emails and phone numbers) never has to be public.
      const res = await supabase.rpc("create_guest_booking", {
        p_event_id: event.id,
        p_name: formData.full_name,
        p_phone: formData.phone,
        p_email: formData.email,
        p_age_range: formData.age_range,
        p_mbti: formData.mbti,
        p_occupation: formData.occupation,
        p_domicile: formData.domicile,
        p_instagram: formData.instagram,
      });
      if (res.error) {
        const code = res.error.message;
        bookingError = {
          message: code.includes("ALREADY_BOOKED")
            ? "This email already has a seat for this Saturday. See you there! If you need to cancel, use the Cancel a booking page."
            : code.includes("EVENT_FULL")
            ? "Sorry, this event is now fully booked."
            : code.includes("EVENT_UNAVAILABLE")
            ? "This event is no longer open for booking."
            : code.includes("MISSING_DETAILS")
            ? "Please fill in your name and email."
            : code,
        };
      } else {
        booking = { id: res.data as string };
      }
    }

    if (bookingError) {
      console.error("Booking error:", bookingError);
      setBookingError(bookingError.message || "Failed to create booking. Please try again.");
      setSubmitting(false);
      return;
    }

    if (booking?.id) {
      syncToSheets({
        bookingId: booking.id,
        eventDate: event.event_date,
        name: formData.full_name,
        email: formData.email,
        phone: formData.phone,
        username: "",
        occupation: formData.occupation,
        domicile: formData.domicile,
        instagram: formData.instagram,
        isMember,
        status: "confirmed",
        bookingDate: new Date().toISOString(),
        age: formData.age_range,
        mbti: formData.mbti,
      });
    }

    setBookingId(booking?.id || "");
    setStep("success");
    setSubmitting(false);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + "T19:00:00");
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-[#F5F0E8]">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 size={32} className="animate-spin text-[#F47B20]" />
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex flex-col bg-[#F5F0E8]">
        <Navbar />
        <div className="flex-1 flex items-center justify-center px-4 py-16">
          <NoUpcomingEvent />
        </div>
        <Footer />
      </div>
    );
  }

  const isFull = bookingCount >= event.max_participants;

  if (isFull) {
    return (
      <div className="min-h-screen flex flex-col bg-[#F5F0E8]">
        <Navbar />
        <div className="flex-1 flex items-center justify-center px-4 py-12">
          <div className="max-w-md w-full text-center animate-slideUp">
            <div className="bg-white rounded-3xl p-8 shadow-lg border border-[#EDE5D8]">
              <div className="text-6xl mb-6">😅</div>
              <h1 className="text-2xl font-bold text-[#1A1A1A] mb-3">
                Fully Booked!
              </h1>
              <p className="text-[#6B7280] mb-2">
                All {event.max_participants} seats for{" "}
                <strong className="text-[#1A1A1A]">
                  {formatDate(event.event_date)}
                </strong>{" "}
                are taken.
              </p>
              <p className="text-[#6B7280] mb-8">
                See you next week! 🙌
              </p>
              <div className="space-y-3">
                <Link
                  href="/"
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[#F47B20] hover:bg-[#D96A15] text-white font-semibold rounded-xl transition-all"
                >
                  Back to Home
                </Link>
                <Link
                  href="/cancel"
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-white hover:bg-[#F3F4F6] text-[#6B7280] font-medium rounded-xl border border-[#E5E7EB] transition-all"
                >
                  Cancel a Booking
                </Link>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // SUCCESS STATE
  if (step === "success") {
    return (
      <div className="min-h-screen flex flex-col bg-[#F5F0E8]">
        <Navbar />
        <main className="flex-1">
          <BookedMoment
            event={event as unknown as FullEvent}
            taken={Math.min(bookingCount + 1, event.max_participants)}
            bookingId={bookingId}
          />
        </main>
        <Footer />
      </div>
    );
  }

  if (step === "confirm") {
    return (
      <div className="min-h-screen flex flex-col bg-[#F5F0E8]">
        <Navbar />
        <div className="flex-1 flex items-center justify-center px-4 py-12">
          <div className="max-w-lg w-full animate-fadeIn">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-[#1A1A1A] mb-3">
                Are you coming? 🙌
              </h1>
              <p className="text-[#6B7280]">
                Confirm your attendance for {formatDate(event.event_date)} at {event.venue_name}.
              </p>
            </div>

            <div className="bg-white rounded-3xl p-8 shadow-lg border border-[#EDE5D8]">
              {bookingError && (
                <div className="mb-5 p-3 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626] text-sm text-center">
                  {bookingError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={confirmMemberBooking}
                  disabled={submitting}
                  className="px-5 py-4 bg-[#F47B20] hover:bg-[#D96A15] disabled:bg-[#F47B20]/50 text-white font-bold rounded-2xl transition-all"
                >
                  {submitting ? "Confirming..." : "Yes, I'm in!"}
                </button>
                <button
                  type="button"
                  onClick={() => setStep("declined")}
                  disabled={submitting}
                  className="px-5 py-4 bg-white hover:bg-[#F3F4F6] text-[#374151] font-bold rounded-2xl border border-[#E5E7EB] transition-all"
                >
                  No, see you next time
                </button>
              </div>

              <div className="border-t border-[#EDE5D8] mt-8 pt-8 text-center">
                <h3 className="text-lg font-bold text-[#1A1A1A] mb-1">
                  Want to support us?
                </h3>
                <p className="text-sm text-[#6B7280] mb-5">
                  This event is free. Contributions are optional.
                </p>
                <Image
                  src="/images/qris.jpeg"
                  alt="QRIS English Club Jogja"
                  width={220}
                  height={220}
                  className="mx-auto rounded-2xl border border-[#E5E7EB]"
                />
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (step === "declined") {
    return (
      <div className="min-h-screen flex flex-col bg-[#F5F0E8]">
        <Navbar />
        <div className="flex-1 flex items-center justify-center px-4 py-12">
          <div className="max-w-md w-full text-center animate-fadeIn">
            <div className="bg-white rounded-3xl p-8 shadow-lg border border-[#EDE5D8]">
              <h1 className="text-3xl font-bold text-[#1A1A1A] mb-3">
                See you next time! 👋
              </h1>
              <p className="text-[#6B7280] mb-6">
                No worries. We hope to see you at a future English Club Jogja session.
              </p>
              <button
                type="button"
                onClick={() => setStep("confirm")}
                className="w-full px-6 py-3 bg-[#F47B20] hover:bg-[#D96A15] text-white font-semibold rounded-xl transition-all"
              >
                I changed my mind
              </button>
              <Link
                href="/"
                className="mt-3 w-full inline-flex items-center justify-center px-6 py-3 bg-white hover:bg-[#F3F4F6] text-[#374151] font-semibold rounded-xl border border-[#E5E7EB] transition-all"
              >
                Back to Home
              </Link>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // CHOOSE STEP
  if (step === "choose") {
    return (
      <div className="min-h-screen flex flex-col bg-[#F5F0E8]">
        <Navbar />
        <div className="flex-1 flex items-center justify-center px-4 py-12">
          <div className="max-w-lg w-full animate-fadeIn">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-[#1A1A1A] mb-3">
                Book Your Seat 🪑
              </h1>
              <p className="text-[#6B7280]">
                {formatDate(event.event_date)} @ {event.venue_name}
              </p>
            </div>

            {showMemberLogin && (
              <form
                onSubmit={handleMemberLogin}
                className="bg-white rounded-2xl p-6 shadow-sm border-2 border-[#F47B20] space-y-5"
              >
                <div>
                  <h3 className="font-bold text-[#1A1A1A] text-lg">Member Login</h3>
                  <p className="text-sm text-[#6B7280] mt-1">
                    Log in to use your saved profile.
                  </p>
                </div>

                {loginError && (
                  <div className="p-3 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626] text-sm">
                    {loginError}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-[#374151] mb-1.5">
                    Email
                  </label>
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                    autoComplete="email"
                    placeholder="you@example.com"
                    className="w-full px-4 py-3 rounded-xl border border-[#E5E7EB] bg-white text-[#1A1A1A] placeholder-[#9CA3AF] focus:border-[#F47B20]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#374151] mb-1.5">
                    Password
                  </label>
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    className="w-full px-4 py-3 rounded-xl border border-[#E5E7EB] bg-white text-[#1A1A1A] placeholder-[#9CA3AF] focus:border-[#F47B20]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loggingIn}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-[#F47B20] hover:bg-[#D96A15] disabled:bg-[#F47B20]/50 text-white font-semibold rounded-xl transition-all"
                >
                  {loggingIn ? <Loader2 size={20} className="animate-spin" /> : <LogIn size={20} />}
                  Log In
                </button>

                <button
                  type="button"
                  onClick={() => setShowMemberLogin(false)}
                  className="w-full text-sm text-[#6B7280] hover:text-[#F47B20]"
                >
                  Back to booking options
                </button>

                <div className="flex items-center justify-between text-sm">
                  <p className="text-[#6B7280]">
                    Don&apos;t have an account?{" "}
                    <Link
                      href="/register"
                      className="font-semibold text-[#F47B20] hover:text-[#D96A15]"
                    >
                      Sign up here
                    </Link>
                  </p>
                  <Link
                    href="/forgot-password"
                    className="font-semibold text-[#3B7DD8] hover:text-[#2D5FA8]"
                  >
                    Forgot password?
                  </Link>
                </div>
              </form>
            )}

            <div className={`space-y-4 ${showMemberLogin ? "hidden" : ""}`}>
              {/* Member option */}
              <button
                onClick={() => handleChoice(true)}
                className="w-full bg-white rounded-2xl p-6 shadow-sm border-2 border-[#EDE5D8] hover:border-[#F47B20] hover:shadow-md transition-all text-left group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#FFF3EB] flex items-center justify-center text-[#F47B20] group-hover:bg-[#F47B20] group-hover:text-white transition-colors">
                    <User size={24} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-[#1A1A1A] text-lg">
                      I&apos;m a Member
                    </h3>
                    <p className="text-sm text-[#6B7280]">
                      Log in to use your saved profile and confirm ✨
                    </p>
                  </div>
                  <ArrowRight
                    size={20}
                    className="text-[#9CA3AF] group-hover:text-[#F47B20] transition-colors"
                  />
                </div>
              </button>

              {/* Guest option */}
              <button
                onClick={() => handleChoice(false)}
                className="w-full bg-white rounded-2xl p-6 shadow-sm border-2 border-[#EDE5D8] hover:border-[#3B7DD8] hover:shadow-md transition-all text-left group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#EBF3FD] flex items-center justify-center text-[#3B7DD8] group-hover:bg-[#3B7DD8] group-hover:text-white transition-colors">
                    <svg
                      width="24"
                      height="24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <line x1="19" y1="8" x2="19" y2="14" />
                      <line x1="22" y1="11" x2="16" y2="11" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-[#1A1A1A] text-lg">
                      Book as Guest
                    </h3>
                    <p className="text-sm text-[#6B7280]">
                      No account needed — just fill in your details real quick
                    </p>
                  </div>
                  <ArrowRight
                    size={20}
                    className="text-[#9CA3AF] group-hover:text-[#3B7DD8] transition-colors"
                  />
                </div>
              </button>
            </div>

            {user && (
              <p className="mt-4 text-center text-sm text-[#6B7280]">
                Logged in as{" "}
                <span className="font-medium text-[#374151]">
                  {user.email}
                </span>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="ml-2 text-[#F47B20] font-semibold hover:text-[#D96A15] underline"
                >
                  (Log out)
                </button>
              </p>
            )}

            {attendees.length > 0 && event && (
              <div className="mt-6 flex justify-center">
                <GoingPill
                  attendees={attendees}
                  eventId={event.id}
                  totalCount={bookingCount}
                />
              </div>
            )}

            <div className="mt-8 text-center">
              <Link href="/" className="text-sm font-medium text-[#6B7280] hover:text-[#D96A15]">
                &larr; Back to home
              </Link>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // FORM STEP
  return (
    <div className="min-h-screen flex flex-col bg-[#F5F0E8]">
      <Navbar />
      <div className="flex-1 px-4 py-12">
        <div className="max-w-2xl mx-auto animate-fadeIn">
          {/* Header */}
          <div className="text-center mb-8">
            <button
              onClick={() => setStep("choose")}
              className="inline-flex items-center text-sm text-[#6B7280] hover:text-[#F47B20] mb-4"
            >
              &larr; Go back
            </button>
            <h1 className="text-3xl font-bold text-[#1A1A1A] mb-2">
              {isMember ? "Quick Confirm ⚡" : "Fill Your Details 📝"}
            </h1>
            <p className="text-[#6B7280]">
              {formatDate(event.event_date)} @ {event.venue_name}
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="bg-white rounded-3xl p-8 shadow-lg border border-[#EDE5D8] space-y-6">
              {/* Error display for guest booking */}
              {bookingError && (
                <div className="p-3 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626] text-sm text-center">
                  {bookingError}
                </div>
              )}

              {/* Logout hint for logged-in users booking as guest */}
              {user && !isMember && (
                <div className="flex items-center justify-between p-3 rounded-xl bg-[#FFF3EB] border border-[#FDE68A] text-sm">
                  <span className="text-[#92400E]">
                    Logged in as <strong>{user.email}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="text-[#F47B20] font-semibold hover:text-[#D96A15] underline"
                  >
                    Log out
                  </button>
                </div>
              )}

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-[#374151] mb-1.5">
                  Name <span className="text-[#EF4444]">*</span>
                </label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) =>
                    setFormData({ ...formData, full_name: e.target.value })
                  }
                  placeholder="Your full name"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-[#E5E7EB] bg-white text-[#1A1A1A] placeholder-[#9CA3AF] focus:border-[#3B7DD8]"
                />
              </div>

              {/* Email (always show for guest, show for member if no user) */}
              {(!isMember || !user) && (
                <div>
                  <label className="block text-sm font-medium text-[#374151] mb-1.5">
                    Email <span className="text-[#EF4444]">*</span>
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    placeholder="you@example.com"
                    required
                    disabled={isMember && !!user}
                    className="w-full px-4 py-3 rounded-xl border border-[#E5E7EB] bg-white text-[#1A1A1A] placeholder-[#9CA3AF] focus:border-[#3B7DD8] disabled:bg-[#F3F4F6] disabled:text-[#9CA3AF]"
                  />
                </div>
              )}

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-[#374151] mb-1.5">
                  Phone Number <span className="text-[#EF4444]">*</span>
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  placeholder="08xxxxxxxxxx"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-[#E5E7EB] bg-white text-[#1A1A1A] placeholder-[#9CA3AF] focus:border-[#3B7DD8]"
                />
              </div>

              {/* Age Range */}
              <div>
                <label className="block text-sm font-medium text-[#374151] mb-1.5">
                  Age Range <span className="text-[#EF4444]">*</span>
                </label>
                <select
                  value={formData.age_range}
                  onChange={(e) =>
                    setFormData({ ...formData, age_range: e.target.value })
                  }
                  required
                  className="w-full px-4 py-3 rounded-xl border border-[#E5E7EB] bg-white text-[#1A1A1A] focus:border-[#3B7DD8]"
                >
                  <option value="">Select your age range</option>
                  {AGE_RANGES.map((range) => (
                    <option key={range} value={range}>{range}</option>
                  ))}
                </select>
              </div>

              {/* MBTI */}
              <div>
                <label className="block text-sm font-medium text-[#374151] mb-1.5">
                  MBTI Personality Type <span className="text-[#EF4444]">*</span>
                </label>
                <select
                  value={formData.mbti}
                  onChange={(e) =>
                    setFormData({ ...formData, mbti: e.target.value })
                  }
                  required
                  className="w-full px-4 py-3 rounded-xl border border-[#E5E7EB] bg-white text-[#1A1A1A] focus:border-[#3B7DD8]"
                >
                  <option value="">Select your MBTI</option>
                  {MBTI_OPTIONS.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              {/* Occupation */}
              <div>
                <label className="block text-sm font-medium text-[#374151] mb-1.5">
                  What do you do? <span className="text-[#EF4444]">*</span>
                </label>
                <select
                  value={formData.occupation}
                  onChange={(e) =>
                    setFormData({ ...formData, occupation: e.target.value })
                  }
                  required
                  className="w-full px-4 py-3 rounded-xl border border-[#E5E7EB] bg-white text-[#1A1A1A] focus:border-[#3B7DD8]"
                >
                  {OCCUPATION_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Domicile */}
              <div>
                <label className="block text-sm font-medium text-[#374151] mb-1.5">
                  Where are you based? <span className="text-[#EF4444]">*</span>
                </label>
                <select
                  value={formData.domicile}
                  onChange={(e) =>
                    setFormData({ ...formData, domicile: e.target.value })
                  }
                  required
                  className="w-full px-4 py-3 rounded-xl border border-[#E5E7EB] bg-white text-[#1A1A1A] focus:border-[#3B7DD8]"
                >
                  {DOMICILE_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              {/* Instagram */}
              <div>
                <label className="block text-sm font-medium text-[#374151] mb-1.5">
                  Instagram <span className="text-[#9CA3AF]">(optional)</span>
                </label>
                <input
                  type="text"
                  value={formData.instagram}
                  onChange={(e) =>
                    setFormData({ ...formData, instagram: e.target.value })
                  }
                  placeholder="@yourusername"
                  className="w-full px-4 py-3 rounded-xl border border-[#E5E7EB] bg-white text-[#1A1A1A] placeholder-[#9CA3AF] focus:border-[#3B7DD8]"
                />
              </div>

              {/* Interests */}
              <div>
                <label className="block text-sm font-medium text-[#374151] mb-3">
                  Your Interests{" "}
                  <span className="text-[#9CA3AF]">
                    (optional, pick as many as you want)
                  </span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {INTEREST_OPTIONS.map((interest) => (
                    <button
                      key={interest}
                      type="button"
                      onClick={() => toggleInterest(interest)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                        formData.interests.includes(interest)
                          ? "bg-[#F47B20] text-white shadow-sm"
                          : "bg-[#F3F4F6] text-[#374151] hover:bg-[#E5E7EB]"
                      }`}
                    >
                      {interest}
                    </button>
                  ))}
                </div>
              </div>

              {/* Expectations */}
              <div>
                <label className="block text-sm font-medium text-[#374151] mb-3">
                  What are you looking for?{" "}
                  <span className="text-[#9CA3AF]">(optional)</span>
                </label>
                <div className="space-y-2">
                  {EXPECTATION_OPTIONS.map((exp) => (
                    <label
                      key={exp}
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#F3F4F6] cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={formData.expectations.includes(exp)}
                        onChange={() => toggleExpectation(exp)}
                        className="w-4 h-4 rounded border-[#D1D5DB] text-[#F47B20] focus:ring-[#F47B20]"
                      />
                      <span className="text-sm text-[#374151]">{exp}</span>
                    </label>
                  ))}
                </div>

                {/* Other expectation */}
                <div className="mt-3">
                  <input
                    type="text"
                    value={formData.expectation_other}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        expectation_other: e.target.value,
                      })
                    }
                    placeholder="Anything else? Type it here..."
                    className="w-full px-4 py-3 rounded-xl border border-[#E5E7EB] bg-white text-[#1A1A1A] placeholder-[#9CA3AF] focus:border-[#3B7DD8]"
                  />
                </div>
              </div>
            </div>

            {/* QRIS Section */}
            <div className="mt-8 bg-white rounded-3xl p-8 shadow-lg border border-[#EDE5D8]">
              <div className="text-center mb-6">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#ECFDF5] border border-[#A7F3D0] text-[#059669] text-sm font-medium mb-4">
                  <span>This event is 100% FREE</span>
                </div>
                <h3 className="text-lg font-bold text-[#1A1A1A] mb-1">
                  Want to support us?
                </h3>
                <p className="text-sm text-[#6B7280]">
                  Scan the QRIS below if you&apos;d like to chip in for
                  community operations. Totally optional!
                </p>
              </div>

              <div className="flex justify-center">
                <Image
                  src="/images/qris.jpeg"
                  alt="QRIS English Club Jogja"
                  width={220}
                  height={220}
                  className="rounded-2xl border border-[#E5E7EB]"
                />
              </div>

              <p className="text-center text-xs text-[#9CA3AF] mt-4">
                Every contribution helps us keep this community alive and running
                ✨
              </p>
            </div>

            {/* Submit Button */}
            <div className="mt-8">
              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-[#F47B20] hover:bg-[#D96A15] disabled:bg-[#F47B20]/50 text-white font-bold rounded-2xl shadow-lg shadow-[#F47B20]/25 hover:shadow-xl transition-all text-lg"
              >
                {submitting ? (
                  <Loader2 size={24} className="animate-spin" />
                ) : (
                  <>
                    {isMember ? "Confirm Booking" : "Book Your Seat"}
                    <ArrowRight size={22} />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
      <Footer />
    </div>
  );
}
