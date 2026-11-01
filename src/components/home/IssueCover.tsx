"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import GoingPill, { type GoingAttendee } from "@/components/GoingPill";
import { CrewFigure, DoodleShape, type DoodleKind } from "@/components/ui/doodle-crew-footer";
import { type EventData, formatDate, formatTime, parseTopic, venueLine } from "@/lib/events";
import { useMyBooking } from "@/lib/use-my-booking";
import { GoingInfo, SavedSeat } from "@/components/event/SeatStatus";

/**
 * This Saturday's "issue cover" on the homepage. Same sketchbook motion as the
 * footer and the ticket: floating doodles, a squiggle that draws under the
 * topic, seats that stamp in, and a bird guarding the next free seat.
 * Motion is transform-only, so nothing is hidden if a browser skips it.
 */

/** True once the element has scrolled into view (stays true). */
function useInView<T extends Element>() {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      const id = window.setTimeout(() => setInView(true), 0);
      return () => window.clearTimeout(id);
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { threshold: 0.25 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return { ref, inView };
}

/** Counts up to `to` once `run` turns true. Starts on the final number, so it's right without animation. */
function CountUp({ to, run }: { to: number; run: boolean }) {
  const [n, setN] = useState(to);
  useEffect(() => {
    if (!run || to <= 0) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const k = Math.min(1, (now - t0) / 900);
      setN(Math.round(to * (1 - Math.pow(1 - k, 3))));
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [run, to]);
  return <>{n}</>;
}

const TOPIC_DOODLES: { kind: DoodleKind; cls: string }[] = [
  { kind: "speech", cls: "ts-doodle-a" },
  { kind: "coffee", cls: "ts-doodle-b" },
  { kind: "star", cls: "ts-doodle-c" },
];

export default function IssueCover({
  evt,
  count,
  attendees,
}: {
  evt: EventData;
  count: number;
  attendees: GoingAttendee[];
}) {
  const topic = parseTopic(evt.description);
  const spotsLeft = Math.max(evt.max_participants - count, 0);
  const isFull = spotsLeft <= 0;
  const { ref, inView } = useInView<HTMLDivElement>();
  const mine = useMyBooking();

  return (
    <div ref={ref} data-inview={inView ? "1" : "0"} className="ts grid lg:grid-cols-12 gap-x-12 gap-y-10">
      <style>{TS_CSS}</style>
      <div className="lg:col-span-7 flex flex-col gap-6 relative">
        {TOPIC_DOODLES.map((d) => (
          <svg key={d.cls} viewBox="-16 -16 32 32" className={`ts-doodle ${d.cls}`} aria-hidden="true">
            <DoodleShape kind={d.kind} />
          </svg>
        ))}
        <p className="eyebrow text-[#B4570F]">
          This Saturday&apos;s topic · {formatDate(evt.event_date)}
        </p>
        <div>
          <h2 className="font-display font-extrabold text-[clamp(2.8rem,7.4vw,6.4rem)] leading-[0.9] text-[#1A1A1A] word-rise">
            {topic.title.split(" ").map((w, i) => (
              <span key={i} className="mr-[0.2em]" style={{ animationDelay: `${i * 70}ms` }}>
                {w}
              </span>
            ))}
          </h2>
          <svg className="ts-squiggle" viewBox="0 0 300 16" preserveAspectRatio="none" aria-hidden="true">
            <path pathLength={1} d="M3 10 C40 3 70 14 110 8 S180 2 220 9 S270 13 297 6" />
          </svg>
        </div>
        {topic.subtitle && (
          <p className="font-display font-medium text-[clamp(1.25rem,2.2vw,1.75rem)] leading-snug text-[#2D5FA8] max-w-2xl">
            {topic.subtitle}
          </p>
        )}
        {topic.body && <p className="text-[17px] leading-relaxed text-[#374151] max-w-[60ch]">{topic.body}</p>}
      </div>

      <aside className="lg:col-span-5 lg:pl-10 lg:border-l-2 lg:border-[#1A1A1A] flex flex-col gap-7">
        <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 text-[16px]">
          <dt className="eyebrow text-[#6B7280] pt-0.5">When</dt>
          <dd className="text-[#1A1A1A] font-medium">
            {formatDate(evt.event_date, "short")}, {formatTime(evt.event_time)}
          </dd>
          <dt className="eyebrow text-[#6B7280] pt-0.5">Where</dt>
          <dd className="text-[#1A1A1A] font-medium">{venueLine(evt)}</dd>
          <dt className="eyebrow text-[#6B7280] pt-0.5">Cost</dt>
          <dd className="text-[#1A1A1A] font-medium">Free. No tickets.</dd>
        </dl>

        <SeatMap total={evt.max_participants} taken={count} play={inView} />

        {count > 0 && (
          <div className="flex items-center gap-2.5">
            <GoingPill attendees={attendees} eventId={evt.id} totalCount={count} />
            <GoingInfo />
          </div>
        )}

        {mine.booked ? (
          <SavedSeat event={evt} />
        ) : isFull ? (
          <div className="px-6 py-4 bg-[#EDE5D8] text-[#374151] font-semibold rounded-md text-center">
            Fully booked. See you next Saturday!
          </div>
        ) : (
          <Link href="/event" className="ts-cta group">
            Save your seat
            <ArrowRight size={20} className="transition-transform group-hover:translate-x-1" />
          </Link>
        )}
        {!mine.booked && (
          <p className="text-sm text-[#6B7280] -mt-3">
            Booked but can&apos;t make it?{" "}
            <Link href="/cancel" className="text-[#2D5FA8] underline underline-offset-2">
              Free up your seat
            </Link>{" "}
            for someone else.
          </p>
        )}
      </aside>
    </div>
  );
}

const BIRD_LINES = ["This seat's free!", "Sit with us?", "Free. Like, actually free.", "I saved it for you."];
const FULL_LINES = ["Full house tonight!", "See you next Saturday?"];

/** One square per chair. Taken seats stamp in when the map scrolls into view; a bird guards the next free one. */
function SeatMap({ total, taken, play }: { total: number; taken: number; play: boolean }) {
  const left = Math.max(total - taken, 0);
  const seats = Array.from({ length: total });
  const cols = Math.min(total, 10);
  const perch = left > 0 ? Math.min(taken, total - 1) : total - 1;
  const lines = left > 0 ? BIRD_LINES : FULL_LINES;
  const [line, setLine] = useState(0);
  const [hops, setHops] = useState(0);
  const bubbleLeft = perch % cols >= cols - 3;
  const bubbleRight = perch % cols <= 1;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-3">
        <span className="eyebrow text-[#1A1A1A] tabular-nums">
          <CountUp to={Math.min(taken, total)} run={play} /> / {total} seats taken
        </span>
        <span className={`eyebrow ${left <= 5 ? "text-[#DC2626]" : "text-[#B4570F]"}`}>
          {left === 0 ? "Full" : `${left} left`}
        </span>
      </div>
      <div
        className="ts-seats grid gap-[5px] pt-12"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
        role="img"
        aria-label={`${taken} of ${total} seats taken`}
      >
        {seats.map((_, i) => (
          <span key={i} className="relative">
            <span
              className={`ts-seat ${i < taken ? "is-taken" : "is-free"}`}
              style={{ "--i": i, "--tilt": `${((i * 37) % 7) - 3}deg` } as React.CSSProperties}
            />
            {i === perch && (
              <button
                type="button"
                className="ts-bird"
                onClick={() => {
                  setLine((v) => (v + 1) % lines.length);
                  setHops((v) => v + 1);
                }}
                aria-label={`Bird says: ${lines[line]}. Tap for another line.`}
              >
                <span
                  key={"l" + line}
                  className={`ts-bubble${bubbleLeft ? " is-left" : bubbleRight ? " is-right" : ""}`}
                >
                  {lines[line]}
                </span>
                <span key={"h" + hops} className="ts-bird-body">
                  <CrewFigure kind="bird" className="ts-bird-svg" pad={4} />
                </span>
              </button>
            )}
          </span>
        ))}
      </div>
    </div>
  );
}

const TS_CSS = `
.ts-doodle{position:absolute;width:30px;height:30px;stroke:#1A1A1A;stroke-width:1.9;stroke-linejoin:round;stroke-linecap:round;pointer-events:none;animation:ts-float 5.5s ease-in-out infinite}
.ts-doodle-a{top:-8px;right:6%}
.ts-doodle-b{top:40%;right:-1%;animation-delay:-1.8s}
.ts-doodle-c{bottom:2%;right:14%;animation-delay:-3.4s;width:24px;height:24px}
.ts-squiggle{display:block;width:min(62%,420px);height:16px;margin-top:8px}
.ts-squiggle path{fill:none;stroke:#F47B20;stroke-width:4;stroke-linecap:round;stroke-dasharray:1;stroke-dashoffset:0}
.ts[data-inview="1"] .ts-squiggle path{animation:ts-draw 1.1s cubic-bezier(.6,0,.3,1) .3s backwards}
.ts-seat{display:block;aspect-ratio:1;border-radius:4px;transition:transform .25s cubic-bezier(.3,1.5,.5,1)}
.ts-seat.is-taken{background:#F47B20;border:1.5px solid #1A1A1A;box-shadow:1.5px 1.5px 0 #1A1A1A;transform:rotate(var(--tilt))}
.ts-seat.is-free{border:1.5px dashed rgba(26,26,26,.35)}
.ts-seat:hover{transform:rotate(calc(var(--tilt) * -2)) scale(1.12)}
.ts[data-inview="1"] .ts-seat.is-taken{animation:ts-stamp .45s cubic-bezier(.3,1.6,.5,1) backwards;animation-delay:calc(var(--i) * 30ms)}
.ts-bird{position:absolute;left:50%;bottom:62%;transform:translateX(-50%);z-index:2;background:none;border:0;padding:0;cursor:pointer;display:flex;flex-direction:column;align-items:center}
.ts-bird-body{display:block;height:46px;transform-origin:50% 100%;animation:ts-hop .6s cubic-bezier(.3,.7,.4,1)}
.ts-bird-svg{height:100%;width:auto;display:block;overflow:visible;animation:ts-bob 2.6s ease-in-out infinite}
.ts-bubble{position:absolute;bottom:calc(100% + 6px);left:50%;transform:translateX(-50%);white-space:nowrap;padding:5px 10px;background:#fff;border:2px solid #1A1A1A;border-radius:10px;box-shadow:2px 2px 0 #F47B20;font-size:12.5px;font-weight:700;color:#1A1A1A;animation:ts-pop .35s cubic-bezier(.3,1.6,.5,1) backwards}
.ts-bubble::after{content:"";position:absolute;left:50%;bottom:-7px;width:10px;height:10px;background:#fff;border-right:2px solid #1A1A1A;border-bottom:2px solid #1A1A1A;transform:translateX(-50%) rotate(45deg)}
.ts-bubble.is-left{left:auto;right:-6px;transform:none;animation-name:ts-pop-side}
.ts-bubble.is-left::after{left:auto;right:12px;transform:rotate(45deg)}
.ts-bubble.is-right{left:-6px;transform:none;animation-name:ts-pop-side}
.ts-bubble.is-right::after{left:12px;transform:rotate(45deg)}
.ts-cta{display:inline-flex;align-items:center;justify-content:space-between;gap:8px;padding:16px 24px;background:#F47B20;color:#1A1A1A;font-weight:600;font-size:18px;border:2px solid #1A1A1A;border-radius:8px;box-shadow:0 4px 0 #1A1A1A;transition:transform .18s cubic-bezier(.3,1.4,.5,1),box-shadow .18s}
.ts-cta:hover{transform:translateY(-2px) rotate(-.6deg);box-shadow:0 6px 0 #1A1A1A}
.ts-cta:active{transform:translateY(3px);box-shadow:0 1px 0 #1A1A1A}
@keyframes ts-float{0%,100%{transform:translateY(0) rotate(-8deg)}50%{transform:translateY(-10px) rotate(8deg)}}
@keyframes ts-draw{from{stroke-dashoffset:1}to{stroke-dashoffset:0}}
@keyframes ts-stamp{0%{transform:translateY(-40%) scale(1.5) rotate(0deg)}100%{transform:rotate(var(--tilt))}}
@keyframes ts-hop{0%{transform:none}25%{transform:scale(1.15,.8)}50%{transform:translateY(-35%) scale(.95,1.1)}75%{transform:scale(1.06,.94)}100%{transform:none}}
@keyframes ts-bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}
@keyframes ts-pop{0%{transform:translateX(-50%) scale(.6)}100%{transform:translateX(-50%) scale(1)}}
@keyframes ts-pop-side{0%{transform:scale(.6)}100%{transform:none}}
@media (max-width:640px){.ts-doodle-b{display:none}.ts-bubble{font-size:11.5px}}
@media (prefers-reduced-motion:reduce){.ts *{animation:none!important}}
`;
