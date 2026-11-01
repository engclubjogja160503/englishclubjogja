"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { type EventData, isUpcoming } from "@/lib/events";

export type MyBooking = {
  /** Still checking. Callers should keep showing the normal "Save a seat" until this is false. */
  loading: boolean;
  /** A signed-in member with a confirmed booking for the next Saturday. */
  booked: boolean;
  event: EventData | null;
};

// One lookup per page load, shared by the navbar, hero and event page.
let pending: Promise<MyBooking> | null = null;

/** Call after booking or cancelling so the next page asks again. */
export function forgetMyBooking() {
  pending = null;
}

async function lookup(): Promise<MyBooking> {
  const supabase = createClient();
  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;
  if (!user) return { loading: false, booked: false, event: null };

  const { data: events } = await supabase
    .from("events")
    .select("*")
    .eq("is_active", true)
    .order("event_date", { ascending: true })
    .limit(10);
  const next = ((events || []) as EventData[]).find((e) => !e.is_archived && isUpcoming(e)) || null;
  if (!next) return { loading: false, booked: false, event: null };

  // Members can always read their own bookings.
  const { data: mine } = await supabase
    .from("bookings")
    .select("id")
    .eq("event_id", next.id)
    .eq("user_id", user.id)
    .eq("status", "confirmed")
    .limit(1)
    .maybeSingle();

  return { loading: false, booked: !!mine, event: next };
}

/**
 * Has the signed-in member already booked the next Saturday?
 * Guests aren't signed in, so for them this is always false.
 */
export function useMyBooking(): MyBooking {
  const [state, setState] = useState<MyBooking>({ loading: true, booked: false, event: null });

  useEffect(() => {
    let alive = true;
    pending ??= lookup().catch(() => ({ loading: false, booked: false, event: null }));
    pending.then((r) => alive && setState(r));

    // Signing in or out changes the answer, so look again.
    const { data: sub } = createClient().auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT") {
        pending = lookup().catch(() => ({ loading: false, booked: false, event: null }));
        pending.then((r) => alive && setState(r));
      }
    });
    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return state;
}
