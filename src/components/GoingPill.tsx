"use client";

import Link from "next/link";

export interface GoingAttendee {
  id: string;
  guest_name: string | null;
  profiles: {
    full_name: string;
    username: string;
    avatar_url?: string | null;
  } | null;
}

const AVATAR_BG = [
  "bg-[#F47B20]",
  "bg-[#3B7DD8]",
  "bg-[#1A1A1A]",
  "bg-[#D96A15]",
  "bg-[#2D5FA8]",
  "bg-[#6B7280]",
];

function initialsOf(name: string) {
  return name
    .split(" ")
    .map((p) => p.charAt(0))
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function attendeeName(a: GoingAttendee, index: number) {
  if (a.profiles?.username) return a.profiles.username;
  if (a.profiles?.full_name) return a.profiles.full_name;
  if (a.guest_name) return a.guest_name;
  return `Participant #${index + 1}`;
}

/** "Going + avatar stack + count" pill in ECJ palette. Links to attendees page. */
export default function GoingPill({
  attendees,
  eventId,
  totalCount,
  dark = false,
}: {
  attendees: GoingAttendee[];
  eventId: string;
  /** Full confirmed total (attendees may be just a preview sample). */
  totalCount?: number;
  dark?: boolean;
}) {
  const total = totalCount ?? attendees.length;
  if (total === 0) return null;

  const shown = attendees.slice(0, 5);
  const extra = Math.max(total - shown.length, 0);

  return (
    <Link
      href={`/attendees?event=${eventId}`}
      className={`inline-flex items-center gap-2.5 rounded-md pl-1.5 pr-3 py-1.5 border transition-colors group w-fit max-w-full ${
        dark
          ? "bg-[#262626] border-[#404040] hover:border-[#F47B20]/50"
          : "bg-white border-[#1A1A1A]/15 hover:border-[#1A1A1A]"
      }`}
      title="See who's going"
    >
      <span className="inline-flex items-center px-3 py-1.5 rounded bg-[#1A1A1A] text-[#F5F0E8] text-xs font-semibold uppercase tracking-wider group-hover:bg-[#F47B20] group-hover:text-[#1A1A1A] transition-colors shrink-0">
        Going
      </span>
      <span className="flex items-center shrink-0">
        {shown.map((a, i) => {
          const name = attendeeName(a, i);
          const avatar = a.profiles?.avatar_url;
          return (
            <span
              key={a.id}
              title={name}
              className={`w-8 h-8 rounded-full border-2 ${
                dark ? "border-[#262626]" : "border-white"
              } overflow-hidden flex items-center justify-center text-[10px] font-bold text-white shrink-0 ${
                AVATAR_BG[i % AVATAR_BG.length]
              }`}
              style={{ marginLeft: i === 0 ? 0 : -10, zIndex: shown.length - i }}
            >
              {avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatar} alt={name} className="w-full h-full object-cover" />
              ) : (
                initialsOf(name)
              )}
            </span>
          );
        })}
        {extra > 0 && (
          <span
            className={`h-8 px-2 rounded-full text-xs font-bold flex items-center justify-center border-2 shrink-0 ${
              dark
                ? "bg-[#404040] text-[#E5E7EB] border-[#262626]"
                : "bg-[#1A1A1A] text-white border-white"
            }`}
            style={{ marginLeft: -10, zIndex: 0 }}
          >
            +{extra}
          </span>
        )}
      </span>
      <span
        className={`text-xs font-medium hidden sm:inline group-hover:underline underline-offset-2 ${
          dark ? "text-[#A3A3A3]" : "text-[#2D5FA8]"
        }`}
      >
        {total} confirmed &rarr;
      </span>
    </Link>
  );
}
