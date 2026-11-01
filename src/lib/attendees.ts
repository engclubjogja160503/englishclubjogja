import type { createClient } from "@/lib/supabase/client";
import type { GoingAttendee } from "@/components/GoingPill";

type Supabase = ReturnType<typeof createClient>;

/**
 * Public reads go through the public_bookings / public_profiles views
 * (see supabase/privacy-step-1-add.sql), which expose names and avatars
 * but never emails or phone numbers.
 */

export async function countConfirmed(supabase: Supabase, eventId: string) {
  const { count } = await supabase
    .from("public_bookings")
    .select("id", { count: "exact", head: true })
    .eq("event_id", eventId);
  return count || 0;
}

export async function fetchAttendees(
  supabase: Supabase,
  eventId: string,
  limit?: number
): Promise<GoingAttendee[]> {
  let query = supabase
    .from("public_bookings")
    .select("id, guest_name, user_id")
    .eq("event_id", eventId)
    .order("created_at", { ascending: true });
  if (limit) query = query.limit(limit);

  const { data: bookings } = await query;
  if (!bookings || bookings.length === 0) return [];

  const userIds = [...new Set(bookings.map((b) => b.user_id).filter(Boolean))] as string[];
  const profiles = new Map<string, GoingAttendee["profiles"]>();
  if (userIds.length > 0) {
    const { data } = await supabase
      .from("public_profiles")
      .select("id, full_name, username, avatar_url")
      .in("id", userIds);
    for (const p of data || []) {
      profiles.set(p.id, { full_name: p.full_name, username: p.username, avatar_url: p.avatar_url });
    }
  }

  return bookings.map((b) => ({
    id: b.id,
    guest_name: b.guest_name,
    profiles: b.user_id ? profiles.get(b.user_id) ?? null : null,
  }));
}
