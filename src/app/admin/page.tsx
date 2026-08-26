"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import {
  Loader2,
  Download,
  Calendar,
  MapPin,
  Users,
  Plus,
  CheckCircle,
  XCircle,
  Eye,
} from "lucide-react";

interface EventData {
  id: string;
  event_date: string;
  venue_name: string;
  venue_address: string;
  max_participants: number;
  description: string;
  is_active: boolean;
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
  cancellation_reason: string | null;
  created_at: string;
  profiles: { full_name: string; email: string; phone: string; username: string; occupation: string; domicile: string; instagram: string } | null;
}

export default function AdminPage() {
  const [events, setEvents] = useState<EventData[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<string>("");
  const [bookings, setBookings] = useState<BookingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewEvent, setShowNewEvent] = useState(false);
  const [newEvent, setNewEvent] = useState({
    event_date: "",
    venue_name: "",
    venue_address: "",
    max_participants: 40,
    description: "",
  });

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    if (selectedEvent) {
      fetchBookings(selectedEvent);
    }
  }, [selectedEvent]);

  async function fetchEvents() {
    const supabase = createClient();
    const { data } = await supabase
      .from("events")
      .select("*")
      .order("event_date", { ascending: false });

    if (data) {
      // Get booking counts
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

      // Auto-select first active event
      const active = eventsWithCounts.find((e) => e.is_active);
      if (active) setSelectedEvent(active.id);
    }
    setLoading(false);
  }

  async function fetchBookings(eventId: string) {
    const supabase = createClient();
    const { data } = await supabase
      .from("bookings")
      .select("*, profiles(full_name, email, phone, username, occupation, domicile, instagram)")
      .eq("event_id", eventId)
      .order("created_at", { ascending: true });

    if (data) {
      setBookings(data as unknown as BookingData[]);
    }
  }

  async function handleCreateEvent(e: React.FormEvent) {
    e.preventDefault();
    const supabase = createClient();
    const { error } = await supabase.from("events").insert({
      ...newEvent,
      is_active: true,
    });

    if (!error) {
      setShowNewEvent(false);
      setNewEvent({
        event_date: "",
        venue_name: "",
        venue_address: "",
        max_participants: 40,
        description: "",
      });
      fetchEvents();
    }
  }

  async function toggleEventActive(eventId: string, current: boolean) {
    const supabase = createClient();
    await supabase
      .from("events")
      .update({ is_active: !current })
      .eq("id", eventId);
    fetchEvents();
  }

  function exportToCSV() {
    const event = events.find((e) => e.id === selectedEvent);
    if (!event) return;

    const headers = [
      "Name",
      "Email",
      "Phone",
      "Username",
      "Occupation",
      "Domicile",
      "Instagram",
      "Is Member",
      "Status",
      "Booking Date",
    ];

    const rows = bookings.map((b) => {
      const name = b.profiles?.full_name || b.guest_name || "";
      const email = b.profiles?.email || b.guest_email || "";
      const phone = b.profiles?.phone || b.guest_phone || "";
      const username = b.profiles?.username || "";
      const occupation = b.profiles?.occupation || "";
      const domicile = b.profiles?.domicile || "";
      const instagram = b.profiles?.instagram || "";

      return [
        name,
        email,
        phone,
        username,
        occupation,
        domicile,
        instagram,
        b.is_member ? "Yes" : "No",
        b.status,
        new Date(b.created_at).toLocaleDateString(),
      ];
    });

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `english-club-jogja-${event.event_date}-participants.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function exportToGoogleSheets() {
    // Generate Google Sheets compatible TSV
    const event = events.find((e) => e.id === selectedEvent);
    if (!event) return;

    const headers = [
      "Name",
      "Email",
      "Phone",
      "Username",
      "Occupation",
      "Domicile",
      "Instagram",
      "Is Member",
      "Status",
      "Booking Date",
    ];

    const rows = bookings.map((b) => {
      const name = b.profiles?.full_name || b.guest_name || "";
      const email = b.profiles?.email || b.guest_email || "";
      const phone = b.profiles?.phone || b.guest_phone || "";
      const username = b.profiles?.username || "";
      const occupation = b.profiles?.occupation || "";
      const domicile = b.profiles?.domicile || "";
      const instagram = b.profiles?.instagram || "";

      return [
        name,
        email,
        phone,
        username,
        occupation,
        domicile,
        instagram,
        b.is_member ? "Yes" : "No",
        b.status,
        new Date(b.created_at).toLocaleDateString(),
      ].join("\t");
    });

    const tsvContent = [headers.join("\t"), ...rows].join("\n");
    navigator.clipboard.writeText(tsvContent);
    alert(
      "Data copied! Paste it into Google Sheets (Ctrl+V). The data will auto-format into columns."
    );
  }

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

  const currentEvent = events.find((e) => e.id === selectedEvent);

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F0E8]">
      <Navbar />
      <div className="flex-1 px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-[#1A1A1A]">
                Event Dashboard
              </h1>
              <p className="text-[#6B7280] mt-1">
                Manage events and track participants
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowNewEvent(!showNewEvent)}
                className="flex items-center gap-2 px-4 py-2.5 bg-[#3B7DD8] hover:bg-[#2D5FA8] text-white font-medium rounded-xl transition-all text-sm"
              >
                <Plus size={18} />
                New Event
              </button>
              {currentEvent && (
                <>
                  <button
                    onClick={exportToCSV}
                    className="flex items-center gap-2 px-4 py-2.5 bg-[#F47B20] hover:bg-[#D96A15] text-white font-medium rounded-xl transition-all text-sm"
                  >
                    <Download size={18} />
                    Export CSV
                  </button>
                  <button
                    onClick={exportToGoogleSheets}
                    className="flex items-center gap-2 px-4 py-2.5 bg-[#22C55E] hover:bg-[#16A34A] text-white font-medium rounded-xl transition-all text-sm"
                  >
                    <Download size={18} />
                    Copy for Sheets
                  </button>
                </>
              )}
            </div>
          </div>

          {/* New Event Form */}
          {showNewEvent && (
            <div className="bg-white rounded-3xl p-6 shadow-lg border border-[#EDE5D8] mb-8 animate-slideUp">
              <h3 className="text-lg font-bold text-[#1A1A1A] mb-4">
                Create New Event
              </h3>
              <form
                onSubmit={handleCreateEvent}
                className="grid sm:grid-cols-2 gap-4"
              >
                <div>
                  <label className="block text-sm font-medium text-[#374151] mb-1">
                    Event Date
                  </label>
                  <input
                    type="date"
                    value={newEvent.event_date}
                    onChange={(e) =>
                      setNewEvent({ ...newEvent, event_date: e.target.value })
                    }
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
                    value={newEvent.venue_name}
                    onChange={(e) =>
                      setNewEvent({ ...newEvent, venue_name: e.target.value })
                    }
                    required
                    placeholder="e.g., Balans Coffee"
                    className="w-full px-4 py-3 rounded-xl border border-[#E5E7EB] bg-white text-[#1A1A1A] placeholder-[#9CA3AF] focus:border-[#3B7DD8]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#374151] mb-1">
                    Venue Address
                  </label>
                  <input
                    type="text"
                    value={newEvent.venue_address}
                    onChange={(e) =>
                      setNewEvent({
                        ...newEvent,
                        venue_address: e.target.value,
                      })
                    }
                    placeholder="Full address"
                    className="w-full px-4 py-3 rounded-xl border border-[#E5E7EB] bg-white text-[#1A1A1A] placeholder-[#9CA3AF] focus:border-[#3B7DD8]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#374151] mb-1">
                    Max Participants
                  </label>
                  <input
                    type="number"
                    value={newEvent.max_participants}
                    onChange={(e) =>
                      setNewEvent({
                        ...newEvent,
                        max_participants: parseInt(e.target.value),
                      })
                    }
                    required
                    min={1}
                    className="w-full px-4 py-3 rounded-xl border border-[#E5E7EB] bg-white text-[#1A1A1A] focus:border-[#3B7DD8]"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-[#374151] mb-1">
                    Description
                  </label>
                  <textarea
                    value={newEvent.description}
                    onChange={(e) =>
                      setNewEvent({ ...newEvent, description: e.target.value })
                    }
                    rows={2}
                    placeholder="What's this event about?"
                    className="w-full px-4 py-3 rounded-xl border border-[#E5E7EB] bg-white text-[#1A1A1A] placeholder-[#9CA3AF] focus:border-[#3B7DD8] resize-none"
                  />
                </div>
                <div className="sm:col-span-2 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowNewEvent(false)}
                    className="px-6 py-2.5 bg-[#F3F4F6] hover:bg-[#E5E7EB] text-[#374151] font-medium rounded-xl transition-all text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-[#22C55E] hover:bg-[#16A34A] text-white font-medium rounded-xl transition-all text-sm"
                  >
                    Create Event
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Event Selector */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {events.map((event) => (
              <button
                key={event.id}
                onClick={() => setSelectedEvent(event.id)}
                className={`p-5 rounded-2xl border-2 text-left transition-all ${
                  selectedEvent === event.id
                    ? "border-[#F47B20] bg-white shadow-md"
                    : "border-[#EDE5D8] bg-white/50 hover:bg-white hover:shadow-sm"
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <Calendar
                    size={18}
                    className={
                      selectedEvent === event.id
                        ? "text-[#F47B20]"
                        : "text-[#9CA3AF]"
                    }
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleEventActive(event.id, event.is_active);
                    }}
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      event.is_active
                        ? "bg-[#ECFDF5] text-[#059669]"
                        : "bg-[#F3F4F6] text-[#9CA3AF]"
                    }`}
                  >
                    {event.is_active ? "Active" : "Inactive"}
                  </button>
                </div>
                <p className="font-bold text-[#1A1A1A] text-sm">
                  {new Date(event.event_date).toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })}
                </p>
                <p className="text-xs text-[#6B7280] mt-0.5 truncate">
                  {event.venue_name}
                </p>
                <div className="flex items-center gap-1 mt-2 text-xs text-[#374151]">
                  <Users size={14} />
                  <span>
                    {event.booking_count}/{event.max_participants}
                  </span>
                </div>
              </button>
            ))}
          </div>

          {/* Bookings Table */}
          {currentEvent && (
            <div className="bg-white rounded-3xl shadow-lg border border-[#EDE5D8] overflow-hidden">
              <div className="p-6 border-b border-[#EDE5D8]">
                <h3 className="text-lg font-bold text-[#1A1A1A]">
                  Participants — {currentEvent.venue_name}
                </h3>
                <p className="text-sm text-[#6B7280]">
                  {bookings.filter((b) => b.status === "confirmed").length}{" "}
                  confirmed / {bookings.length} total
                </p>
              </div>

              {bookings.length === 0 ? (
                <div className="p-12 text-center">
                  <Users size={48} className="mx-auto mb-4 text-[#D1D5DB]" />
                  <p className="text-[#6B7280]">
                    No bookings yet for this event
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[#EDE5D8] bg-[#F9FAFB]">
                        <th className="text-left px-4 py-3 font-medium text-[#374151]">
                          Name
                        </th>
                        <th className="text-left px-4 py-3 font-medium text-[#374151]">
                          Phone
                        </th>
                        <th className="text-left px-4 py-3 font-medium text-[#374151]">
                          Email
                        </th>
                        <th className="text-left px-4 py-3 font-medium text-[#374151]">
                          Type
                        </th>
                        <th className="text-left px-4 py-3 font-medium text-[#374151]">
                          Status
                        </th>
                        <th className="text-left px-4 py-3 font-medium text-[#374151]">
                          Date
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {bookings.map((b) => (
                        <tr
                          key={b.id}
                          className="border-b border-[#F3F4F6] hover:bg-[#F9FAFB]"
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
                            {new Date(b.created_at).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
