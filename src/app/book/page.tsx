"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { CheckCircle, Loader2, User, ArrowRight } from "lucide-react";
import {
  OCCUPATION_OPTIONS,
  DOMICILE_OPTIONS,
  INTEREST_OPTIONS,
  EXPECTATION_OPTIONS,
} from "@/lib/constants";

interface EventData {
  id: string;
  event_date: string;
  venue_name: string;
  max_participants: number;
}

export default function BookPage() {
  const [step, setStep] = useState<"choose" | "form" | "success">("choose");
  const [isMember, setIsMember] = useState(false);
  const [event, setEvent] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [bookingId, setBookingId] = useState("");

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
          });
        }
      }

      // Fetch active event
      const { data: events } = await supabase
        .from("events")
        .select("*")
        .eq("is_active", true)
        .order("event_date", { ascending: true })
        .limit(1);

      if (events && events.length > 0) {
        setEvent(events[0]);
      }
      setLoading(false);
    }

    init();
  }, []);

  const handleChoice = (member: boolean) => {
    setIsMember(member);
    setStep("form");
  };

  const toggleInterest = (interest: string) => {
    setFormData((prev) => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter((i) => i !== interest)
        : [...prev.interests, interest],
    }));
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
    setSubmitting(true);

    const supabase = createClient();

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
        is_member: true,
      });
    }

    // Create booking
    const bookingData: Record<string, unknown> = {
      event_id: event.id,
      status: "confirmed",
      is_member: isMember,
    };

    if (isMember && user) {
      bookingData.user_id = user.id;
    } else {
      bookingData.guest_name = formData.full_name;
      bookingData.guest_phone = formData.phone;
      bookingData.guest_email = formData.email;
    }

    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .insert(bookingData)
      .select("id")
      .single();

    if (bookingError) {
      console.error("Booking error:", bookingError);
      setSubmitting(false);
      return;
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
        <div className="flex-1 flex items-center justify-center text-center px-4">
          <div>
            <h2 className="text-2xl font-bold text-[#1A1A1A] mb-2">
              No upcoming events
            </h2>
            <p className="text-[#6B7280]">
              Stay tuned for the next Saturday night!
            </p>
          </div>
        </div>
      </div>
    );
  }

  // SUCCESS STATE
  if (step === "success") {
    return (
      <div className="min-h-screen flex flex-col bg-[#F5F0E8]">
        <Navbar />
        <div className="flex-1 flex items-center justify-center px-4 py-12">
          <div className="max-w-md w-full text-center animate-slideUp">
            <div className="bg-white rounded-3xl p-8 shadow-lg border border-[#EDE5D8]">
              <CheckCircle
                size={64}
                className="mx-auto mb-6 text-[#22C55E]"
              />
              <h1 className="text-2xl font-bold text-[#1A1A1A] mb-3">
                You&apos;re in! 🎉
              </h1>
              <p className="text-[#6B7280] mb-6">
                Your seat is booked for{" "}
                <strong className="text-[#1A1A1A]">
                  {formatDate(event.event_date)}
                </strong>{" "}
                at <strong className="text-[#1A1A1A]">{event.venue_name}</strong>
                . See you there!
              </p>

              {bookingId && (
                <div className="bg-[#F3F4F6] rounded-xl p-4 mb-6">
                  <p className="text-xs text-[#9CA3AF] mb-1">
                    Your Booking ID
                  </p>
                  <p className="font-mono font-bold text-[#374151] text-sm break-all">
                    {bookingId}
                  </p>
                </div>
              )}

              <div className="space-y-3">
                <Link
                  href="/"
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[#F47B20] hover:bg-[#D96A15] text-white font-semibold rounded-xl transition-all"
                >
                  Back to Home
                </Link>
                <Link
                  href={`/cancel?id=${bookingId}`}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-white hover:bg-[#F3F4F6] text-[#6B7280] font-medium rounded-xl border border-[#E5E7EB] transition-all"
                >
                  Need to cancel? Click here
                </Link>
              </div>
            </div>
          </div>
        </div>
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

            <div className="space-y-4">
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
                      Log in and confirm — it takes 2 seconds ✨
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
              </p>
            )}
          </div>
        </div>
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
              {/* Full Name */}
              <div>
                <label className="block text-sm font-medium text-[#374151] mb-1.5">
                  Full Name <span className="text-[#EF4444]">*</span>
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
                    Book Your Seat
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
