"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  Loader2,
  Download,
  Calendar,
  Users,
  Plus,
  CheckCircle,
  XCircle,
  Clock,
  Pencil,
  Trash2,
  Shield,
  LogIn,
  UserPlus,
  UserMinus,
  Crown,
  Grid3X3,
  Tag,
  Archive,
  ArchiveRestore,
} from "lucide-react";
import { AGE_RANGES, MBTI_OPTIONS } from "@/lib/constants";

interface EventData {
  id: string;
  event_date: string;
  event_time: string | null;
  venue_name: string;
  venue_address: string;
  max_participants: number;
  description: string;
  is_active: boolean;
  is_archived?: boolean | null;
  booking_count?: number;
}

interface BookingData {
  id: string;
  event_id: string;
  status: string;
  is_member: boolean;
  guest_name: string | null;
  guest_phone: string | null;
  guest_email: string | null;
  guest_age_range?: string | null;
  guest_mbti?: string | null;
  guest_occupation?: string | null;
  guest_domicile?: string | null;
  guest_instagram?: string | null;
  cancellation_reason: string | null;
  created_at: string;
  user_id?: string;
  profiles: {
    full_name: string;
    email: string;
    phone: string;
    username: string;
    occupation: string;
    domicile: string;
    instagram: string;
    age_range: string | null;
    mbti: string | null;
    interests: string[] | null;
  } | null;
}

interface ProfileData {
  id: string;
  email: string;
  full_name: string;
  username: string;
  is_admin: boolean;
  is_member: boolean;
  age_range: string | null;
  mbti: string | null;
}

const emptyEvent = {
  event_date: "",
  event_time: "19:00",
  venue_name: "",
  venue_address: "",
  max_participants: 40,
  description: "",
};

export default function AdminPage() {
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [events, setEvents] = useState<EventData[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<string>("");
  const [bookings, setBookings] = useState<BookingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEventForm, setShowEventForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<string | null>(null);
  const [eventForm, setEventForm] = useState(emptyEvent);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | "confirmed" | "cancelled">("all");
  const [archiveFilter, setArchiveFilter] = useState<"active" | "archived" | "all">("active");
  const [archiveConfirm, setArchiveConfirm] = useState<string | null>(null);
  const [archivingPast, setArchivingPast] = useState(false);

  // Admin management state
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [allProfiles, setAllProfiles] = useState<ProfileData[]>([]);
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminSearch, setAdminSearch] = useState("");

  // Grouping state
  const [groupBy, setGroupBy] = useState<"none" | "mbti" | "interest" | "occupation">("none");

  // Booking edit state
  const [editingBooking, setEditingBooking] = useState<string | null>(null);
  const [editBookingForm, setEditBookingForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    occupation: "General",
    domicile: "Kota Yogyakarta",
    instagram: "",
    age_range: "",
    mbti: "",
  });
  const [savingBooking, setSavingBooking] = useState(false);
  const [deleteBookingConfirm, setDeleteBookingConfirm] = useState<string | null>(null);

  // ── Auth check (database-based) ──
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data }) => {
      const u = data.user;
      setUser(u ? { id: u.id, email: u.email || "" } : null);

      if (u) {
        // Check is_admin from profiles table
        const { data: profile } = await supabase
          .from("profiles")
          .select("is_admin")
          .eq("id", u.id)
          .single();

        setIsAdmin(profile?.is_admin === true);
      } else {
        setIsAdmin(false);
      }
      setAuthLoading(false);
    });
  }, []);

  // ── Fetch events ──
  useEffect(() => {
    if (isAdmin) {
      fetchEvents();
      fetchAllProfiles();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  useEffect(() => {
    if (selectedEvent) fetchBookings(selectedEvent);
  }, [selectedEvent]);

  async function fetchEvents() {
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("events")
      .select("*")
      .order("event_date", { ascending: false });

    if (data) {
      const eventsWithCounts = await Promise.all(
        data.map(async (event) => {
          const { count } = await supabase
            .from("bookings")
            .select("*", { count: "exact", head: true })
            .eq("event_id", event.id)
            .eq("status", "confirmed");
          return { ...event, booking_count: count || 0 };
        })
      );
      setEvents(eventsWithCounts);
      const active =
        eventsWithCounts.find((e) => e.is_active && !e.is_archived) ||
        eventsWithCounts.find((e) => !e.is_archived);
      if (active && !selectedEvent) setSelectedEvent(active.id);
    }
    setLoading(false);
  }

  async function fetchBookings(eventId: string) {
    const supabase = createClient();
    const { data } = await supabase
      .from("bookings")
      .select(
        "*, profiles(full_name, email, phone, username, occupation, domicile, instagram, age_range, mbti, interests)"
      )
      .eq("event_id", eventId)
      .order("status", { ascending: true })
      .order("created_at", { ascending: true });

    if (data) setBookings(data as unknown as BookingData[]);
  }

  // ── Create / Update event ──
  async function handleSaveEvent(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const supabase = createClient();

    const eventData = {
      event_date: eventForm.event_date,
      event_time: eventForm.event_time + ":00",
      venue_name: eventForm.venue_name,
      venue_address: eventForm.venue_address,
      max_participants: eventForm.max_participants,
      description: eventForm.description,
    };

    if (editingEvent) {
      await supabase.from("events").update(eventData).eq("id", editingEvent);
    } else {
      await supabase.from("events").insert({ ...eventData, is_active: true });
    }

    setSaving(false);
    setShowEventForm(false);
    setEditingEvent(null);
    setEventForm(emptyEvent);
    fetchEvents();
  }

  function openEditEvent(event: EventData) {
    setEditingEvent(event.id);
    setEventForm({
      event_date: event.event_date,
      event_time: event.event_time ? event.event_time.slice(0, 5) : "19:00",
      venue_name: event.venue_name,
      venue_address: event.venue_address,
      max_participants: event.max_participants,
      description: event.description || "",
    });
    setShowEventForm(true);
  }

  function openNewEvent() {
    setEditingEvent(null);
    setEventForm(emptyEvent);
    setShowEventForm(true);
  }

  async function deleteEvent(eventId: string) {
    const supabase = createClient();
    await supabase.from("events").delete().eq("id", eventId);
    setDeleteConfirm(null);
    if (selectedEvent === eventId) setSelectedEvent("");
    fetchEvents();
  }

  async function toggleEventActive(eventId: string, current: boolean) {
    const supabase = createClient();
    await supabase.from("events").update({ is_active: !current }).eq("id", eventId);
    fetchEvents();
  }

  function isEventArchived(event: EventData) {
    return event.is_archived === true;
  }

  function isEventPast(event: EventData) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(event.event_date + "T00:00:00") < today;
  }

  /** Archive = hidden from the homepage & booking page. Falls back to
   *  is_active=false when the is_archived column migration hasn't run yet. */
  async function archiveEvent(eventId: string) {
    const supabase = createClient();
    const { error } = await supabase
      .from("events")
      .update({ is_archived: true, is_active: false })
      .eq("id", eventId);
    if (error) {
      await supabase
        .from("events")
        .update({ is_active: false })
        .eq("id", eventId);
    }
    setArchiveConfirm(null);
    fetchEvents();
  }

  async function unarchiveEvent(eventId: string) {
    const supabase = createClient();
    const { error } = await supabase
      .from("events")
      .update({ is_archived: false, is_active: true })
      .eq("id", eventId);
    if (error) {
      await supabase
        .from("events")
        .update({ is_active: true })
        .eq("id", eventId);
    }
    fetchEvents();
  }

  /** One-click: archive every past event that is still visible. */
  async function archivePastEvents() {
    setArchivingPast(true);
    const supabase = createClient();
    const past = events.filter((e) => isEventPast(e) && !isEventArchived(e));
    for (const e of past) {
      const { error } = await supabase
        .from("events")
        .update({ is_archived: true, is_active: false })
        .eq("id", e.id);
      if (error) {
        await supabase
          .from("events")
          .update({ is_active: false })
          .eq("id", e.id);
      }
    }
    setArchivingPast(false);
    fetchEvents();
  }

  // ── Admin management ──
  async function fetchAllProfiles() {
    setAdminLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("profiles")
      .select("id, email, full_name, username, is_admin, is_member, age_range, mbti")
      .order("full_name", { ascending: true });

    if (data) setAllProfiles(data as ProfileData[]);
    setAdminLoading(false);
  }

  async function toggleAdmin(profileId: string, currentlyAdmin: boolean) {
    const supabase = createClient();
    await supabase
      .from("profiles")
      .update({ is_admin: !currentlyAdmin })
      .eq("id", profileId);
    fetchAllProfiles();
  }

  // ── Booking edit/save/delete ──
  function openEditBooking(booking: BookingData) {
    setEditingBooking(booking.id);
    setEditBookingForm({
      full_name: booking.profiles?.full_name || booking.guest_name || "",
      email: booking.profiles?.email || booking.guest_email || "",
      phone: booking.profiles?.phone || booking.guest_phone || "",
      occupation: booking.profiles?.occupation || booking.guest_occupation || "General",
      domicile: booking.profiles?.domicile || booking.guest_domicile || "Kota Yogyakarta",
      instagram: booking.profiles?.instagram || booking.guest_instagram || "",
      age_range: booking.profiles?.age_range || booking.guest_age_range || "",
      mbti: booking.profiles?.mbti || booking.guest_mbti || "",
    });
  }

  async function saveBookingEdit(booking: BookingData) {
    setSavingBooking(true);
    const supabase = createClient();

    // Update profile if this is a member booking
    if (booking.user_id) {
      await supabase
        .from("profiles")
        .update({
          full_name: editBookingForm.full_name,
          email: editBookingForm.email,
          phone: editBookingForm.phone,
          occupation: editBookingForm.occupation,
          domicile: editBookingForm.domicile,
          instagram: editBookingForm.instagram,
          age_range: editBookingForm.age_range,
          mbti: editBookingForm.mbti,
        })
        .eq("id", booking.user_id);
    }

    // Update guest fields on the booking itself (incl. demographics,
    // so Age/MBTI are visible for guests too)
    if (!booking.is_member) {
      await supabase
        .from("bookings")
        .update({
          guest_name: editBookingForm.full_name,
          guest_email: editBookingForm.email,
          guest_phone: editBookingForm.phone,
          guest_age_range: editBookingForm.age_range || null,
          guest_mbti: editBookingForm.mbti || null,
          guest_occupation: editBookingForm.occupation || null,
          guest_domicile: editBookingForm.domicile || null,
          guest_instagram: editBookingForm.instagram || null,
        })
        .eq("id", booking.id);
    }

    setEditingBooking(null);
    setSavingBooking(false);
    if (selectedEvent) fetchBookings(selectedEvent);
  }

  async function deleteBooking(bookingId: string) {
    const supabase = createClient();
    await supabase.from("bookings").delete().eq("id", bookingId);
    setDeleteBookingConfirm(null);
    if (selectedEvent) fetchBookings(selectedEvent);
  }

  // ── Export ──
  function exportToCSV() {
    const event = events.find((e) => e.id === selectedEvent);
    if (!event) return;
    const headers = ["Name", "Email", "Phone", "Username", "Occupation", "Domicile", "Instagram", "Age", "MBTI", "Interests", "Type", "Status", "Reason", "Date"];
    const rows = bookings.map((b) => [
      b.profiles?.full_name || b.guest_name || "",
      b.profiles?.email || b.guest_email || "",
      b.profiles?.phone || b.guest_phone || "",
      b.profiles?.username || "",
      b.profiles?.occupation || b.guest_occupation || "",
      b.profiles?.domicile || b.guest_domicile || "",
      b.profiles?.instagram || b.guest_instagram || "",
      b.profiles?.age_range || b.guest_age_range || "",
      b.profiles?.mbti || b.guest_mbti || "",
      (b.profiles?.interests || []).join("; "),
      b.is_member ? "Member" : "Guest",
      b.status,
      b.cancellation_reason || "",
      new Date(b.created_at).toLocaleDateString(),
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ecj-${event.event_date}-participants.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ── Format helpers ──
  function formatTime(timeStr: string | null) {
    if (!timeStr) return "7:00 PM";
    const [h, m] = timeStr.split(":");
    const hour = parseInt(h);
    const ampm = hour >= 12 ? "PM" : "AM";
    const h12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${h12}:${m} ${ampm}`;
  }

  // ── Auth gate ──
  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-[#F5F0E8]">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 size={32} className="animate-spin text-[#F47B20]" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col bg-[#F5F0E8]">
        <Navbar />
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="max-w-md w-full text-center">
            <div className="bg-white rounded-3xl p-8 shadow-lg border border-[#EDE5D8]">
              <LogIn size={48} className="mx-auto mb-4 text-[#F47B20]" />
              <h2 className="text-xl font-bold text-[#1A1A1A] mb-2">Login Required</h2>
              <p className="text-[#6B7280] mb-6">You need to be logged in to access the admin dashboard.</p>
              <Link href="/login" className="inline-flex items-center gap-2 px-6 py-3 bg-[#F47B20] hover:bg-[#D96A15] text-white font-semibold rounded-xl transition-all">
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col bg-[#F5F0E8]">
        <Navbar />
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="max-w-md w-full text-center">
            <div className="bg-white rounded-3xl p-8 shadow-lg border border-[#EDE5D8]">
              <Shield size={48} className="mx-auto mb-4 text-[#EF4444]" />
              <h2 className="text-xl font-bold text-[#1A1A1A] mb-2">Access Denied</h2>
              <p className="text-[#6B7280] mb-2">You don&apos;t have admin permissions.</p>
              <p className="text-sm text-[#9CA3AF] mb-6">Signed in as {user.email}</p>
              <Link href="/" className="inline-flex items-center gap-2 px-6 py-3 bg-[#F47B20] hover:bg-[#D96A15] text-white font-semibold rounded-xl transition-all">
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Main dashboard ──
  const currentEvent = events.find((e) => e.id === selectedEvent);
  const filteredBookings = bookings.filter((b) => statusFilter === "all" || b.status === statusFilter);
  const confirmedCount = bookings.filter((b) => b.status === "confirmed").length;
  const cancelledCount = bookings.filter((b) => b.status === "cancelled").length;

  // Grouping logic
  const groupedBookings: Record<string, BookingData[]> = {};
  if (groupBy !== "none") {
    filteredBookings.forEach((b) => {
      let key = "Unknown";
      if (groupBy === "mbti") {
        key = b.profiles?.mbti || b.guest_mbti || "Not specified";
      } else if (groupBy === "interest") {
        const interests = b.profiles?.interests || [];
        if (interests.length === 0) {
          key = "No interests specified";
        } else {
          interests.forEach((interest) => {
            if (!groupedBookings[interest]) groupedBookings[interest] = [];
            groupedBookings[interest].push(b);
          });
          return;
        }
      } else if (groupBy === "occupation") {
        key = b.profiles?.occupation || b.guest_occupation || "Not specified";
      }
      if (!groupedBookings[key]) groupedBookings[key] = [];
      groupedBookings[key].push(b);
    });
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F0E8]">
      <Navbar />
      <div className="flex-1 px-4 py-8">
        <div className="max-w-6xl mx-auto">

          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-[#1A1A1A]">
                Admin Dashboard
              </h1>
              <p className="text-[#6B7280] mt-1">
                Manage events and track participants
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowAdminPanel(!showAdminPanel)}
                className={`flex items-center gap-2 px-4 py-2.5 font-medium rounded-xl transition-all text-sm ${
                  showAdminPanel
                    ? "bg-[#8B5CF6] hover:bg-[#7C3AED] text-white"
                    : "bg-white hover:bg-[#F3F4F6] text-[#374151] border border-[#E5E7EB]"
                }`}
              >
                <Crown size={18} />
                Manage Admins
              </button>
              <button
                onClick={openNewEvent}
                className="flex items-center gap-2 px-4 py-2.5 bg-[#3B7DD8] hover:bg-[#2D5FA8] text-white font-medium rounded-xl transition-all text-sm"
              >
                <Plus size={18} />
                New Event
              </button>
              {currentEvent && (
                <button
                  onClick={exportToCSV}
                  className="flex items-center gap-2 px-4 py-2.5 bg-[#F47B20] hover:bg-[#D96A15] text-white font-medium rounded-xl transition-all text-sm"
                >
                  <Download size={18} />
                  Export CSV
                </button>
              )}
            </div>
          </div>

          {/* ── Manage Admins Panel ── */}
          {showAdminPanel && (
            <div className="bg-white rounded-3xl p-6 shadow-lg border border-[#EDE5D8] mb-8 animate-slideUp">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-[#1A1A1A]">Manage Admins</h3>
                  <p className="text-sm text-[#6B7280]">Promote or demote members to admin role</p>
                </div>
                <button
                  onClick={() => setShowAdminPanel(false)}
                  className="text-[#6B7280] hover:text-[#374151]"
                >
                  ✕
                </button>
              </div>

              {/* Search */}
              <div className="mb-4">
                <input
                  type="text"
                  value={adminSearch}
                  onChange={(e) => setAdminSearch(e.target.value)}
                  placeholder="Search by name or email..."
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E5E7EB] bg-white text-[#1A1A1A] placeholder-[#9CA3AF] focus:border-[#8B5CF6] text-sm"
                />
              </div>

              {adminLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 size={24} className="animate-spin text-[#8B5CF6]" />
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {allProfiles
                    .filter(
                      (p) =>
                        p.full_name.toLowerCase().includes(adminSearch.toLowerCase()) ||
                        p.email.toLowerCase().includes(adminSearch.toLowerCase()) ||
                        p.username.toLowerCase().includes(adminSearch.toLowerCase())
                    )
                    .map((profile) => (
                      <div
                        key={profile.id}
                        className="flex items-center justify-between p-3 rounded-xl hover:bg-[#F9FAFB] transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                              profile.is_admin
                                ? "bg-[#8B5CF6]/10 text-[#8B5CF6]"
                                : "bg-[#F3F4F6] text-[#6B7280]"
                            }`}
                          >
                            {profile.full_name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-[#1A1A1A] text-sm">
                              {profile.full_name}
                              {profile.id === user?.id && (
                                <span className="ml-2 text-xs text-[#9CA3AF]">(you)</span>
                              )}
                            </p>
                            <p className="text-xs text-[#6B7280]">{profile.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {profile.is_admin ? (
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-[#8B5CF6]/10 text-[#8B5CF6] flex items-center gap-1">
                              <Crown size={12} />
                              Admin
                            </span>
                          ) : (
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-[#F3F4F6] text-[#6B7280]">
                              Member
                            </span>
                          )}
                          {profile.id !== user?.id && (
                            <button
                              onClick={() => toggleAdmin(profile.id, profile.is_admin)}
                              className={`p-1.5 rounded-lg transition-all ${
                                profile.is_admin
                                  ? "text-[#EF4444] hover:bg-[#FEF2F2]"
                                  : "text-[#22C55E] hover:bg-[#ECFDF5]"
                              }`}
                              title={profile.is_admin ? "Remove admin" : "Make admin"}
                            >
                              {profile.is_admin ? <UserMinus size={16} /> : <UserPlus size={16} />}
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  {allProfiles.filter(
                    (p) =>
                      p.full_name.toLowerCase().includes(adminSearch.toLowerCase()) ||
                      p.email.toLowerCase().includes(adminSearch.toLowerCase())
                  ).length === 0 && (
                    <p className="text-center text-[#6B7280] py-4">No members found</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── Event Form (Create / Edit) ── */}
          {showEventForm && (
            <div className="bg-white rounded-3xl p-6 shadow-lg border border-[#EDE5D8] mb-8 animate-slideUp">
              <h3 className="text-lg font-bold text-[#1A1A1A] mb-4">
                {editingEvent ? "Edit Event" : "Create New Event"}
              </h3>
              <form onSubmit={handleSaveEvent} className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#374151] mb-1">
                    Event Date
                  </label>
                  <input
                    type="date"
                    value={eventForm.event_date}
                    onChange={(e) => setEventForm({ ...eventForm, event_date: e.target.value })}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-[#E5E7EB] bg-white text-[#1A1A1A] focus:border-[#3B7DD8]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#374151] mb-1">
                    Event Time
                  </label>
                  <input
                    type="time"
                    value={eventForm.event_time}
                    onChange={(e) => setEventForm({ ...eventForm, event_time: e.target.value })}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-[#E5E7EB] bg-white text-[#1A1A1A] focus:border-[#3B7DD8]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#374151] mb-1">
                    Venue Name
                  </label>
                  <input
                    type="text"
                    value={eventForm.venue_name}
                    onChange={(e) => setEventForm({ ...eventForm, venue_name: e.target.value })}
                    required
                    placeholder="e.g., Balans Coffee"
                    className="w-full px-4 py-3 rounded-xl border border-[#E5E7EB] bg-white text-[#1A1A1A] placeholder-[#9CA3AF] focus:border-[#3B7DD8]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#374151] mb-1">
                    Max Participants
                  </label>
                  <input
                    type="number"
                    value={eventForm.max_participants}
                    onChange={(e) => setEventForm({ ...eventForm, max_participants: parseInt(e.target.value) })}
                    required
                    min={1}
                    className="w-full px-4 py-3 rounded-xl border border-[#E5E7EB] bg-white text-[#1A1A1A] focus:border-[#3B7DD8]"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-[#374151] mb-1">
                    Venue Address
                  </label>
                  <input
                    type="text"
                    value={eventForm.venue_address}
                    onChange={(e) => setEventForm({ ...eventForm, venue_address: e.target.value })}
                    placeholder="Full address"
                    className="w-full px-4 py-3 rounded-xl border border-[#E5E7EB] bg-white text-[#1A1A1A] placeholder-[#9CA3AF] focus:border-[#3B7DD8]"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-[#374151] mb-1">
                    Description
                  </label>
                  <textarea
                    value={eventForm.description}
                    onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                    rows={2}
                    placeholder="What's this event about?"
                    className="w-full px-4 py-3 rounded-xl border border-[#E5E7EB] bg-white text-[#1A1A1A] placeholder-[#9CA3AF] focus:border-[#3B7DD8] resize-none"
                  />
                </div>
                <div className="sm:col-span-2 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => { setShowEventForm(false); setEditingEvent(null); }}
                    className="px-6 py-2.5 bg-[#F3F4F6] hover:bg-[#E5E7EB] text-[#374151] font-medium rounded-xl transition-all text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-2.5 bg-[#22C55E] hover:bg-[#16A34A] disabled:bg-[#22C55E]/50 text-white font-medium rounded-xl transition-all text-sm"
                  >
                    {saving && <Loader2 size={16} className="animate-spin" />}
                    {editingEvent ? "Save Changes" : "Create Event"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ── Delete Confirmation Modal ── */}
          {deleteConfirm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
              <div className="bg-white rounded-2xl p-6 shadow-xl max-w-sm w-full animate-slideUp">
                <div className="text-center">
                  <Trash2 size={40} className="mx-auto mb-3 text-[#EF4444]" />
                  <h3 className="text-lg font-bold text-[#1A1A1A] mb-2">Delete Event?</h3>
                  <p className="text-sm text-[#6B7280] mb-6">
                    This will permanently remove the event and all its bookings. This cannot be undone.
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setDeleteConfirm(null)}
                      className="flex-1 px-4 py-2.5 bg-[#F3F4F6] hover:bg-[#E5E7EB] text-[#374151] font-medium rounded-xl transition-all text-sm"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => deleteEvent(deleteConfirm)}
                      className="flex-1 px-4 py-2.5 bg-[#EF4444] hover:bg-[#DC2626] text-white font-medium rounded-xl transition-all text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Archive Confirmation Modal ── */}
          {archiveConfirm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
              <div className="bg-white rounded-2xl p-6 shadow-xl max-w-sm w-full animate-slideUp">
                <div className="text-center">
                  <Archive size={40} className="mx-auto mb-3 text-[#F47B20]" />
                  <h3 className="text-lg font-bold text-[#1A1A1A] mb-2">Archive Event?</h3>
                  <p className="text-sm text-[#6B7280] mb-6">
                    This event will be hidden from the homepage and booking page. Bookings are kept — you can unarchive anytime.
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setArchiveConfirm(null)}
                      className="flex-1 px-4 py-2.5 bg-[#F3F4F6] hover:bg-[#E5E7EB] text-[#374151] font-medium rounded-xl transition-all text-sm"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => archiveEvent(archiveConfirm)}
                      className="flex-1 px-4 py-2.5 bg-[#F47B20] hover:bg-[#D96A15] text-white font-medium rounded-xl transition-all text-sm"
                    >
                      Archive
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Event Cards ── */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div className="flex gap-1 bg-white rounded-lg p-1 border border-[#EDE5D8] w-fit">
              {(["active", "archived", "all"] as const).map((f) => {
                const count =
                  f === "all"
                    ? events.length
                    : events.filter((e) =>
                        f === "archived" ? isEventArchived(e) : !isEventArchived(e)
                      ).length;
                return (
                  <button
                    key={f}
                    onClick={() => setArchiveFilter(f)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all capitalize ${
                      archiveFilter === f
                        ? "bg-[#1A1A1A] text-white shadow-sm"
                        : "text-[#6B7280] hover:text-[#374151]"
                    }`}
                  >
                    {f} ({count})
                  </button>
                );
              })}
            </div>
            {events.some((e) => isEventPast(e) && !isEventArchived(e)) && (
              <button
                onClick={archivePastEvents}
                disabled={archivingPast}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-[#FFF3EB] text-[#F47B20] font-medium rounded-xl border border-[#F47B20]/30 transition-all text-sm disabled:opacity-50"
              >
                {archivingPast ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Archive size={16} />
                )}
                Archive all past events
              </button>
            )}
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="p-5 rounded-2xl border-2 border-[#EDE5D8] bg-white/50 animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-1/3 mb-3" />
                  <div className="h-3 bg-gray-200 rounded w-1/2 mb-2" />
                  <div className="h-3 bg-gray-200 rounded w-2/3" />
                </div>
              ))
            ) : events.length === 0 ? (
              <div className="sm:col-span-2 lg:col-span-3 text-center py-12">
                <Calendar size={48} className="mx-auto mb-4 text-[#D1D5DB]" />
                <p className="text-[#6B7280] mb-4">No events yet. Create your first one!</p>
                <button
                  onClick={openNewEvent}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[#3B7DD8] hover:bg-[#2D5FA8] text-white font-medium rounded-xl transition-all"
                >
                  <Plus size={18} />
                  New Event
                </button>
              </div>
            ) : (
              events
                .filter((event) =>
                  archiveFilter === "all"
                    ? true
                    : archiveFilter === "archived"
                    ? isEventArchived(event)
                    : !isEventArchived(event)
                )
                .map((event) => (
                <div
                  key={event.id}
                  onClick={() => setSelectedEvent(event.id)}
                  className={`p-5 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                    selectedEvent === event.id
                      ? "border-[#F47B20] bg-white shadow-md"
                      : "border-[#EDE5D8] bg-white/50 hover:bg-white hover:shadow-sm"
                  } ${isEventArchived(event) ? "opacity-70" : ""}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <Calendar
                      size={18}
                      className={selectedEvent === event.id ? "text-[#F47B20]" : "text-[#9CA3AF]"}
                    />
                    <div className="flex items-center gap-1.5">
                      {isEventPast(event) && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-[#F3F4F6] text-[#6B7280]">
                          Past
                        </span>
                      )}
                      {isEventArchived(event) ? (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-[#1A1A1A] text-white">
                          Archived
                        </span>
                      ) : (
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleEventActive(event.id, event.is_active); }}
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            event.is_active
                              ? "bg-[#ECFDF5] text-[#059669]"
                              : "bg-[#F3F4F6] text-[#9CA3AF]"
                          }`}
                        >
                          {event.is_active ? "Active" : "Inactive"}
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="font-bold text-[#1A1A1A] text-sm">
                    {new Date(event.event_date + "T00:00:00").toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1 text-xs text-[#6B7280]">
                    <Clock size={12} />
                    <span>{formatTime(event.event_time)}</span>
                  </div>
                  <p className="text-xs text-[#6B7280] mt-1 truncate">{event.venue_name}</p>
                  <div className="flex items-center gap-1 mt-2 text-xs text-[#374151]">
                    <Users size={14} />
                    <span>{event.booking_count}/{event.max_participants}</span>
                  </div>
                  {/* Edit / Archive / Delete */}
                  <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-[#F3F4F6]">
                    <button
                      onClick={(e) => { e.stopPropagation(); openEditEvent(event); }}
                      className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-[#3B7DD8] hover:bg-[#EBF3FD] rounded-lg transition-all"
                    >
                      <Pencil size={12} /> Edit
                    </button>
                    {isEventArchived(event) ? (
                      <button
                        onClick={(e) => { e.stopPropagation(); unarchiveEvent(event.id); }}
                        className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-[#059669] hover:bg-[#ECFDF5] rounded-lg transition-all"
                      >
                        <ArchiveRestore size={12} /> Unarchive
                      </button>
                    ) : (
                      <button
                        onClick={(e) => { e.stopPropagation(); setArchiveConfirm(event.id); }}
                        className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-[#F47B20] hover:bg-[#FFF3EB] rounded-lg transition-all"
                      >
                        <Archive size={12} /> Archive
                      </button>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); setDeleteConfirm(event.id); }}
                      className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-[#EF4444] hover:bg-[#FEF2F2] rounded-lg transition-all"
                    >
                      <Trash2 size={12} /> Delete
                    </button>
                  </div>
                </div>
              ))
            )}
            {!loading &&
              events.filter((event) =>
                archiveFilter === "all"
                  ? true
                  : archiveFilter === "archived"
                  ? isEventArchived(event)
                  : !isEventArchived(event)
              ).length === 0 &&
              events.length > 0 && (
                <div className="sm:col-span-2 lg:col-span-3 text-center py-12">
                  <Archive size={48} className="mx-auto mb-4 text-[#D1D5DB]" />
                  <p className="text-[#6B7280]">
                    {archiveFilter === "archived"
                      ? "No archived events. Past events you archive will appear here."
                      : "No active events in this view."}
                  </p>
                </div>
              )}
          </div>

          {/* ── Bookings Table ── */}
          {currentEvent && (
            <div className="bg-white rounded-3xl shadow-lg border border-[#EDE5D8] overflow-hidden">
              <div className="p-6 border-b border-[#EDE5D8]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-bold text-[#1A1A1A]">
                      Participants — {currentEvent.venue_name}
                    </h3>
                    <p className="text-sm text-[#6B7280]">
                      {confirmedCount} confirmed / {cancelledCount} cancelled / {bookings.length} total
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {/* Status filter */}
                    <div className="flex gap-1 bg-[#F3F4F6] rounded-lg p-1">
                      {(["all", "confirmed", "cancelled"] as const).map((s) => (
                        <button
                          key={s}
                          onClick={() => setStatusFilter(s)}
                          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all capitalize ${
                            statusFilter === s
                              ? "bg-white text-[#1A1A1A] shadow-sm"
                              : "text-[#6B7280] hover:text-[#374151]"
                          }`}
                        >
                          {s} {s === "confirmed" ? `(${confirmedCount})` : s === "cancelled" ? `(${cancelledCount})` : `(${bookings.length})`}
                        </button>
                      ))}
                    </div>
                    {/* Group by */}
                    <div className="flex items-center gap-2">
                      <Grid3X3 size={14} className="text-[#6B7280]" />
                      <select
                        value={groupBy}
                        onChange={(e) => setGroupBy(e.target.value as typeof groupBy)}
                        className="px-3 py-1.5 rounded-lg border border-[#E5E7EB] bg-white text-xs font-medium text-[#374151] focus:border-[#3B7DD8]"
                      >
                        <option value="none">No grouping</option>
                        <option value="mbti">Group by MBTI</option>
                        <option value="interest">Group by Interest</option>
                        <option value="occupation">Group by Occupation</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {filteredBookings.length === 0 ? (
                <div className="p-12 text-center">
                  <Users size={48} className="mx-auto mb-4 text-[#D1D5DB]" />
                  <p className="text-[#6B7280]">
                    {bookings.length === 0
                      ? "No bookings yet for this event"
                      : "No bookings match this filter"}
                  </p>
                </div>
              ) : groupBy === "none" ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[#EDE5D8] bg-[#F9FAFB]">
                        <th className="text-left px-4 py-3 font-medium text-[#374151]">Name</th>
                        <th className="text-left px-4 py-3 font-medium text-[#374151]">Phone</th>
                        <th className="text-left px-4 py-3 font-medium text-[#374151]">Email</th>
                        <th className="text-left px-4 py-3 font-medium text-[#374151]">Age</th>
                        <th className="text-left px-4 py-3 font-medium text-[#374151]">MBTI</th>
                        <th className="text-left px-4 py-3 font-medium text-[#374151]">Type</th>
                        <th className="text-left px-4 py-3 font-medium text-[#374151]">Status</th>
                        <th className="text-left px-4 py-3 font-medium text-[#374151]">Booked At</th>
                        <th className="text-left px-4 py-3 font-medium text-[#374151]">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredBookings.map((b) => (
                        <tr
                          key={b.id}
                          className={`border-b border-[#F3F4F6] hover:bg-[#F9FAFB] ${
                            b.status === "cancelled" ? "opacity-60" : ""
                          }`}
                        >
                          <td className="px-4 py-3 font-medium text-[#1A1A1A]">
                            {b.profiles?.full_name || b.guest_name || "—"}
                          </td>
                          <td className="px-4 py-3 text-[#6B7280]">
                            {b.profiles?.phone || b.guest_phone || "—"}
                          </td>
                          <td className="px-4 py-3 text-[#6B7280]">
                            {b.profiles?.email || b.guest_email || "—"}
                          </td>
                          <td className="px-4 py-3 text-[#6B7280] text-xs">
                            {b.profiles?.age_range || b.guest_age_range || "—"}
                          </td>
                          <td className="px-4 py-3 text-[#6B7280] text-xs">
                            {b.profiles?.mbti || b.guest_mbti || "—"}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                b.is_member
                                  ? "bg-[#EBF3FD] text-[#3B7DD8]"
                                  : "bg-[#F3F4F6] text-[#6B7280]"
                              }`}
                            >
                              {b.is_member ? "Member" : "Guest"}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {b.status === "confirmed" ? (
                              <span className="inline-flex items-center gap-1 text-[#22C55E] text-xs font-medium">
                                <CheckCircle size={14} />
                                Confirmed
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[#EF4444] text-xs font-medium">
                                <XCircle size={14} />
                                Cancelled
                                {b.cancellation_reason && (
                                  <span className="text-[#9CA3AF] ml-1">
                                    ({b.cancellation_reason})
                                  </span>
                                )}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-[#6B7280] text-xs">
                            <div>{new Date(b.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "Asia/Jakarta" })}</div>
                            <div className="text-[#9CA3AF]">{new Date(b.created_at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Jakarta" })} WIB</div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => openEditBooking(b)}
                                className="p-1.5 text-[#3B7DD8] hover:bg-[#EBF3FD] rounded-lg transition-all"
                                title="Edit booking"
                              >
                                <Pencil size={14} />
                              </button>
                              <button
                                onClick={() => setDeleteBookingConfirm(b.id)}
                                className="p-1.5 text-[#EF4444] hover:bg-[#FEF2F2] rounded-lg transition-all"
                                title="Delete booking"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-6 space-y-6">
                  {Object.entries(groupedBookings)
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([groupKey, groupBookings]) => (
                      <div key={groupKey}>
                        <div className="flex items-center gap-2 mb-3">
                          <Tag size={16} className="text-[#F47B20]" />
                          <h4 className="font-bold text-[#1A1A1A]">{groupKey}</h4>
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-[#F3F4F6] text-[#6B7280]">
                            {groupBookings.length}
                          </span>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b border-[#EDE5D8] bg-[#F9FAFB]">
                                <th className="text-left px-4 py-3 font-medium text-[#374151]">Name</th>
                                <th className="text-left px-4 py-3 font-medium text-[#374151]">Phone</th>
                                <th className="text-left px-4 py-3 font-medium text-[#374151]">Email</th>
                                <th className="text-left px-4 py-3 font-medium text-[#374151]">Age</th>
                                <th className="text-left px-4 py-3 font-medium text-[#374151]">MBTI</th>
                                <th className="text-left px-4 py-3 font-medium text-[#374151]">Type</th>
                                <th className="text-left px-4 py-3 font-medium text-[#374151]">Status</th>
                                <th className="text-left px-4 py-3 font-medium text-[#374151]">Booked At</th>
                                <th className="text-left px-4 py-3 font-medium text-[#374151]">Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {groupBookings.map((b) => (
                                <tr
                                  key={b.id}
                                  className={`border-b border-[#F3F4F6] hover:bg-[#F9FAFB] ${
                                    b.status === "cancelled" ? "opacity-60" : ""
                                  }`}
                                >
                                  <td className="px-4 py-3 font-medium text-[#1A1A1A]">
                                    {b.profiles?.full_name || b.guest_name || "—"}
                                  </td>
                                  <td className="px-4 py-3 text-[#6B7280]">
                                    {b.profiles?.phone || b.guest_phone || "—"}
                                  </td>
                                  <td className="px-4 py-3 text-[#6B7280]">
                                    {b.profiles?.email || b.guest_email || "—"}
                                  </td>
                                  <td className="px-4 py-3 text-[#6B7280] text-xs">
                                    {b.profiles?.age_range || b.guest_age_range || "—"}
                                  </td>
                                  <td className="px-4 py-3 text-[#6B7280] text-xs">
                                    {b.profiles?.mbti || b.guest_mbti || "—"}
                                  </td>
                                  <td className="px-4 py-3">
                                    <span
                                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                                        b.is_member
                                          ? "bg-[#EBF3FD] text-[#3B7DD8]"
                                          : "bg-[#F3F4F6] text-[#6B7280]"
                                      }`}
                                    >
                                      {b.is_member ? "Member" : "Guest"}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3">
                                    {b.status === "confirmed" ? (
                                      <span className="inline-flex items-center gap-1 text-[#22C55E] text-xs font-medium">
                                        <CheckCircle size={14} />
                                        Confirmed
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 text-[#EF4444] text-xs font-medium">
                                        <XCircle size={14} />
                                        Cancelled
                                        {b.cancellation_reason && (
                                          <span className="text-[#9CA3AF] ml-1">
                                            ({b.cancellation_reason})
                                          </span>
                                        )}
                                      </span>
                                    )}
                                  </td>
                                  <td className="px-4 py-3 text-[#6B7280] text-xs">
                                    <div>{new Date(b.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "Asia/Jakarta" })}</div>
                                    <div className="text-[#9CA3AF]">{new Date(b.created_at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Jakarta" })} WIB</div>
                                  </td>
                                  <td className="px-4 py-3">
                                    <div className="flex items-center gap-1">
                                      <button
                                        onClick={() => openEditBooking(b)}
                                        className="p-1.5 text-[#3B7DD8] hover:bg-[#EBF3FD] rounded-lg transition-all"
                                        title="Edit booking"
                                      >
                                        <Pencil size={14} />
                                      </button>
                                      <button
                                        onClick={() => setDeleteBookingConfirm(b.id)}
                                        className="p-1.5 text-[#EF4444] hover:bg-[#FEF2F2] rounded-lg transition-all"
                                        title="Delete booking"
                                      >
                                        <Trash2 size={14} />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <Footer />

      {/* ── Booking Edit Modal ── */}
      {editingBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl p-6 shadow-xl max-w-lg w-full animate-slideUp max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-[#1A1A1A] mb-4">Edit Booking</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#374151] mb-1">Full Name</label>
                <input
                  type="text"
                  value={editBookingForm.full_name}
                  onChange={(e) => setEditBookingForm({ ...editBookingForm, full_name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E5E7EB] text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#374151] mb-1">Email</label>
                  <input
                    type="email"
                    value={editBookingForm.email}
                    onChange={(e) => setEditBookingForm({ ...editBookingForm, email: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#E5E7EB] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#374151] mb-1">Phone</label>
                  <input
                    type="tel"
                    value={editBookingForm.phone}
                    onChange={(e) => setEditBookingForm({ ...editBookingForm, phone: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#E5E7EB] text-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#374151] mb-1">Occupation</label>
                  <select
                    value={editBookingForm.occupation}
                    onChange={(e) => setEditBookingForm({ ...editBookingForm, occupation: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#E5E7EB] text-sm bg-white"
                  >
                    <option value="Worker">Worker</option>
                    <option value="Student">Student</option>
                    <option value="General">General</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#374151] mb-1">Domicile</label>
                  <select
                    value={editBookingForm.domicile}
                    onChange={(e) => setEditBookingForm({ ...editBookingForm, domicile: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#E5E7EB] text-sm bg-white"
                  >
                    {["Kota Yogyakarta","Bantul","Sleman","Gunung Kidul","Kulon Progo","Other"].map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#374151] mb-1">Instagram</label>
                <input
                  type="text"
                  value={editBookingForm.instagram}
                  onChange={(e) => setEditBookingForm({ ...editBookingForm, instagram: e.target.value })}
                  placeholder="@username"
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E5E7EB] text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#374151] mb-1">Age Range</label>
                  <select
                    value={editBookingForm.age_range}
                    onChange={(e) => setEditBookingForm({ ...editBookingForm, age_range: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#E5E7EB] text-sm bg-white"
                  >
                    <option value="">Select age range</option>
                    {AGE_RANGES.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#374151] mb-1">MBTI</label>
                  <select
                    value={editBookingForm.mbti}
                    onChange={(e) => setEditBookingForm({ ...editBookingForm, mbti: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#E5E7EB] text-sm bg-white"
                  >
                    <option value="">Not sure about my MBTI</option>
                    {MBTI_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setEditingBooking(null)}
                className="px-5 py-2.5 bg-[#F3F4F6] hover:bg-[#E5E7EB] text-[#374151] font-medium rounded-xl transition-all text-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const booking = bookings.find((b) => b.id === editingBooking);
                  if (booking) saveBookingEdit(booking);
                }}
                disabled={savingBooking}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#22C55E] hover:bg-[#16A34A] disabled:bg-[#22C55E]/50 text-white font-medium rounded-xl transition-all text-sm"
              >
                {savingBooking && <Loader2 size={16} className="animate-spin" />}
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Booking Delete Confirmation Modal ── */}
      {deleteBookingConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl p-6 shadow-xl max-w-sm w-full animate-slideUp">
            <div className="text-center">
              <Trash2 size={40} className="mx-auto mb-3 text-[#EF4444]" />
              <h3 className="text-lg font-bold text-[#1A1A1A] mb-2">Delete Booking?</h3>
              <p className="text-sm text-[#6B7280] mb-6">
                This will permanently remove this booking. This cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteBookingConfirm(null)}
                  className="flex-1 px-4 py-2.5 bg-[#F3F4F6] hover:bg-[#E5E7EB] text-[#374151] font-medium rounded-xl transition-all text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={() => deleteBooking(deleteBookingConfirm)}
                  className="flex-1 px-4 py-2.5 bg-[#EF4444] hover:bg-[#DC2626] text-white font-medium rounded-xl transition-all text-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
