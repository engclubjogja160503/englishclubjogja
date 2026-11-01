"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { type EventData, DEFAULT_TOPIC, formatDate, parseTopic, todayInJogja, venueLine } from "@/lib/events";

type PastEvent = Pick<EventData, "id" | "event_date" | "venue_name" | "venue_address" | "description"> & {
  booked?: number;
};

/** Past Saturdays, newest first. "strip" scrolls sideways on the homepage; "list" is the archive page. */
export default function PastSaturdays({
  variant,
  limit = 24,
}: {
  variant: "strip" | "list";
  limit?: number;
}) {
  const [items, setItems] = useState<PastEvent[] | null>(null);

  useEffect(() => {
    let ignore = false;
    (async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("events")
        .select("id, event_date, venue_name, venue_address, description")
        .lt("event_date", todayInJogja())
        .order("event_date", { ascending: false })
        .limit(limit);
      const past = (data || []) as PastEvent[];

      if (variant === "list") {
        await Promise.all(
          past.map(async (evt) => {
            const { count } = await supabase
              .from("bookings")
              .select("*", { count: "exact", head: true })
              .eq("event_id", evt.id)
              .eq("status", "confirmed");
            evt.booked = count || 0;
          })
        );
      }
      if (!ignore) setItems(past);
    })();
    return () => {
      ignore = true;
    };
  }, [variant, limit]);

  if (items === null) {
    return (
      <div className={variant === "strip" ? "flex gap-5 overflow-hidden" : "flex flex-col gap-4"} aria-busy="true">
        {[0, 1, 2].map((i) => (
          <div key={i} className={`bg-[#EDE5D8] animate-pulse rounded ${variant === "strip" ? "h-56 w-72 shrink-0" : "h-28"}`} />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <p className="text-[#6B7280] text-lg">
        The archive starts after our next Saturday. Check back soon.
      </p>
    );
  }

  if (variant === "strip") {
    // Older sessions often have no topic written down; keep the strip to the ones that do.
    const withTopic = items.filter((evt) => parseTopic(evt.description).title !== DEFAULT_TOPIC);
    const rest = items.length - withTopic.length;
    const oldest = items[items.length - 1];
    return (
      <ul className="snap-strip flex gap-5 overflow-x-auto -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-10 lg:px-10 pb-2">
        {withTopic.map((evt) => {
          const topic = parseTopic(evt.description);
          const i = items.indexOf(evt);
          return (
            <li
              key={evt.id}
              className="shrink-0 w-[78vw] sm:w-80 min-h-60 p-6 flex flex-col gap-4 bg-[#F5F0E8] border-2 border-[#1A1A1A] rounded-md hover:-translate-y-1 hover:rotate-[-0.6deg] transition-transform duration-300"
            >
              <span className="eyebrow text-[#B4570F]">
                {formatDate(evt.event_date, "short")}
                {i === 0 && " · last week"}
              </span>
              <span className="font-display font-extrabold text-[28px] leading-[1] text-[#1A1A1A]">
                {topic.title}
              </span>
              {topic.subtitle && (
                <span className="text-[15px] text-[#374151] leading-snug line-clamp-3">{topic.subtitle}</span>
              )}
            </li>
          );
        })}
        {rest > 0 && (
          <li className="shrink-0 w-[78vw] sm:w-80 min-h-60">
            <Link
              href="/saturdays"
              className="group h-full p-6 flex flex-col justify-between gap-4 bg-[#1A1A1A] text-[#F5F0E8] border-2 border-[#1A1A1A] rounded-md hover:bg-[#F47B20] hover:text-[#1A1A1A] transition-colors"
            >
              <span className="eyebrow opacity-70">Since {formatDate(oldest.event_date, "short")}</span>
              <span className="font-display font-extrabold text-[44px] leading-[0.95]">
                +{rest} more Saturday{rest === 1 ? "" : "s"}
              </span>
              <span className="inline-flex items-center gap-2 font-semibold">
                See the archive <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          </li>
        )}
      </ul>
    );
  }

  return (
    <ol className="border-t-2 border-[#1A1A1A]">
      {items.map((evt) => {
        const topic = parseTopic(evt.description);
        return (
          <li
            key={evt.id}
            className="grid md:grid-cols-12 gap-x-8 gap-y-2 py-8 border-b border-[#1A1A1A]/15"
          >
            <div className="md:col-span-3 flex flex-col gap-1">
              <span className="eyebrow text-[#B4570F]">{formatDate(evt.event_date)}</span>
              <span className="text-sm text-[#6B7280]">{venueLine(evt)}</span>
            </div>
            <div className="md:col-span-7 flex flex-col gap-2 min-w-0">
              <h2 className="font-display font-extrabold text-[clamp(1.8rem,3.6vw,2.8rem)] leading-[1] text-[#1A1A1A]">
                {topic.title}
              </h2>
              {topic.subtitle && <p className="text-lg text-[#2D5FA8] font-medium">{topic.subtitle}</p>}
              {topic.body && <p className="text-[#374151] leading-relaxed max-w-[62ch]">{topic.body}</p>}
            </div>
            <div className="md:col-span-2 md:text-right">
              {typeof evt.booked === "number" && evt.booked > 0 && (
                <span className="eyebrow text-[#1A1A1A]">{evt.booked} booked</span>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
