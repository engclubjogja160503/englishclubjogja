"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, ArrowUpRight, CalendarPlus, Check, Copy, Home } from "lucide-react";
import EventTicket from "@/components/event/EventTicket";
import { CrewFigure, DoodleShape, type CrewKind, type DoodleKind } from "@/components/ui/doodle-crew-footer";
import { WHATSAPP_GROUP_URL } from "@/lib/constants";
import { type EventData, formatDate, formatTime, eventTopic, venueLine } from "@/lib/events";

/**
 * The two "after" screens of booking (confirmed and cancelled), plus the
 * "coming soon" art for when nothing is scheduled. Same sketchbook
 * language as the footer and the event ticket. All motion is transform-only,
 * so everything stays readable if a browser skips animations.
 */

/** A crew member with a speech bubble. Tap it to hear the next line. */
function TalkingCrew({ kind, lines }: { kind: CrewKind; lines: string[] }) {
  const [i, setI] = useState(0);
  const [hops, setHops] = useState(0);
  return (
    <button
      type="button"
      className="mo-talker"
      onClick={() => {
        setI((v) => (v + 1) % lines.length);
        setHops((v) => v + 1);
      }}
      aria-label={`Say something else. Currently saying: ${lines[i]}`}
    >
      <span key={"b" + i} className="mo-bubble" aria-live="polite">
        {lines[i]}
      </span>
      <span key={"c" + hops} className="mo-crew">
        <CrewFigure kind={kind} className="mo-crew-svg" />
      </span>
      <span className="mo-tap">tap me</span>
    </button>
  );
}

const BURST: { kind: DoodleKind; dx: number; dy: number; r: number }[] = [
  { kind: "star", dx: -300, dy: -150, r: -40 },
  { kind: "heart", dx: -340, dy: 20, r: 30 },
  { kind: "speech", dx: -260, dy: 170, r: -15 },
  { kind: "sparkle", dx: 300, dy: -160, r: 60 },
  { kind: "coffee", dx: 340, dy: 10, r: -20 },
  { kind: "star", dx: 270, dy: 170, r: 45 },
  { kind: "heart", dx: -60, dy: -200, r: 20 },
  { kind: "speech", dx: 90, dy: 210, r: -30 },
];

function calendarUrl(event: EventData) {
  const topic = eventTopic(event).title;
  const [h, m] = (event.event_time || "19:00").split(":").map((v) => parseInt(v, 10));
  // WIB is UTC+7. Sessions are listed with a start time only, so block out two hours.
  const start = new Date(`${event.event_date}T00:00:00Z`);
  start.setUTCHours((Number.isNaN(h) ? 19 : h) - 7, Number.isNaN(m) ? 0 : m);
  const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `English Club Jogja: ${topic}`,
    dates: `${fmt(start)}/${fmt(end)}`,
    details: "Saturday night English conversation. No grades, no pressure, just conversations.\nhttps://www.engclubjogja.online/event",
    location: venueLine(event),
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function BookedMoment({
  event,
  taken,
  bookingId,
}: {
  event: EventData;
  taken: number;
  bookingId: string;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(bookingId);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard can be blocked; the ID is still selectable on screen.
    }
  };

  return (
    <section className="mo">
      <style>{CSS}</style>
      <p className="eyebrow text-[#B4570F]">Booking confirmed</p>
      <h1 className="mo-title word-rise">
        <span>You&apos;re</span> <span className="text-[#F47B20]" style={{ animationDelay: "90ms" }}>in!</span>
      </h1>
      <p className="mo-lede">
        See you on <strong>{formatDate(event.event_date)}</strong>, {formatTime(event.event_time)}, at{" "}
        <strong>{venueLine(event)}</strong>.
      </p>

      <div className="mo-ticket">
        <div className="mo-burst" aria-hidden="true">
          {BURST.map((b, k) => (
            <svg
              key={k}
              viewBox="-16 -16 32 32"
              className="mo-burst-doodle"
              style={{ "--dx": b.dx + "px", "--dy": b.dy + "px", "--r": b.r + "deg", animationDelay: 250 + k * 40 + "ms" } as React.CSSProperties}
            >
              <DoodleShape kind={b.kind} />
            </svg>
          ))}
        </div>
        <EventTicket event={event} taken={taken} />
        <span className="mo-stamp" aria-hidden="true">Confirmed</span>
      </div>

      <TalkingCrew
        kind="cat"
        lines={[
          "Yay! Your seat is saved.",
          "Bring your best small talk.",
          "Mistakes welcome. Seriously.",
          "Coming alone? You won't be for long.",
        ]}
      />

      {bookingId && (
        <div className="mo-id">
          <span className="eyebrow text-[#6B7280]">Booking ID</span>
          <code>{bookingId}</code>
          <button type="button" onClick={copy} className="mo-copy" aria-label="Copy booking ID">
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      )}

      <div className="mo-actions">
        <a href={calendarUrl(event)} target="_blank" rel="noopener noreferrer" className="mo-btn is-solid">
          <CalendarPlus size={18} /> Add to Google Calendar
        </a>
        <Link href="/" className="mo-btn is-outline">
          <Home size={18} /> Back to home
        </Link>
      </div>
      <Link href="/cancel" className="mo-small">
        Plans changed? Free up your seat
      </Link>
    </section>
  );
}

export function CancelledMoment({ onAnother }: { onAnother?: () => void }) {
  // The tear line, zig-zagging down the middle of the ticket.
  const tear = Array.from({ length: 17 }, (_, k) => `${k % 2 ? 338 : 322} ${k * 14}`).join(" L ");
  const shape = "M18 0 L582 0 Q600 0 600 18 L600 202 Q600 220 582 220 L18 220 Q0 220 0 202 L0 18 Q0 0 18 0 Z";

  const face = (
    <>
      <path d={shape} className="mo-torn-paper" />
      <path d="M440 6 L440 214" className="mo-torn-perf" />
      <rect x="446" y="6" width="148" height="208" rx="12" className="mo-torn-stub" />
      <text x="32" y="44" className="mo-torn-mono">ADMIT ONE · ENGLISH CLUB JOGJA</text>
      <text x="32" y="112" className="mo-torn-big">SEE YOU</text>
      <text x="32" y="176" className="mo-torn-big is-blue">NEXT TIME</text>
      <text x="519" y="96" className="mo-torn-day" textAnchor="middle">SAT</text>
      <text x="519" y="150" className="mo-torn-mono" textAnchor="middle">EVERY WEEK</text>
    </>
  );

  return (
    <section className="mo">
      <style>{CSS}</style>
      <p className="eyebrow text-[#B4570F]">Seat released</p>
      <h1 className="mo-title word-rise">
        <span>Booking</span> <span className="text-[#3B7DD8]" style={{ animationDelay: "90ms" }}>cancelled.</span>
      </h1>
      <p className="mo-lede">Thanks for letting us know. Your seat is free for someone else now.</p>

      <div className="mo-torn" aria-hidden="true">
        <svg viewBox="-40 -20 680 270" className="mo-torn-svg">
          <defs>
            <clipPath id="mo-left">
              <path d={`M-10 -10 L330 -10 L ${tear} L330 230 L-10 230 Z`} />
            </clipPath>
            <clipPath id="mo-right">
              <path d={`M610 -10 L330 -10 L ${tear} L330 230 L610 230 Z`} />
            </clipPath>
          </defs>
          <g className="mo-half is-left">
            <g clipPath="url(#mo-left)">{face}</g>
            <path d={`M ${tear}`} className="mo-torn-edge" />
          </g>
          <g className="mo-half is-right">
            <g clipPath="url(#mo-right)">{face}</g>
            <path d={`M ${tear}`} className="mo-torn-edge" />
            <g className="mo-torn-stamp" transform="translate(500 205) rotate(-14)">
              <rect x="-74" y="-22" width="148" height="44" rx="6" />
              <text x="0" y="8" textAnchor="middle">RELEASED</text>
            </g>
          </g>
        </svg>
      </div>

      <TalkingCrew
        kind="ghost"
        lines={["Aww, we'll miss you!", "There's a new topic every Saturday.", "Come back anytime. No pressure!"]}
      />

      <div className="mo-actions">
        <Link href="/event" className="mo-btn is-solid">
          See this week&apos;s event <ArrowRight size={18} />
        </Link>
        <Link href="/" className="mo-btn is-outline">
          <Home size={18} /> Back to home
        </Link>
      </div>
      <div className="mo-links">
        <a href={WHATSAPP_GROUP_URL} target="_blank" rel="noopener noreferrer" className="mo-small">
          Join the WhatsApp group <ArrowUpRight size={14} className="inline -mt-0.5" />
        </a>
        {onAnother && (
          <button type="button" onClick={onAnother} className="mo-small">
            Cancel another booking
          </button>
        )}
      </div>
    </section>
  );
}

/**
 * The "nothing scheduled yet" art: a blank ticket that floats in, gets a
 * COMING SOON stamp, doodles drifting around it, and the bird with a reminder.
 */
export function ComingSoonArt({ compact = false }: { compact?: boolean }) {
  return (
    <div className={"mo mo-soon" + (compact ? " is-compact" : "")}>
      <style>{CSS}</style>
      <div className="mo-soon-ticket" aria-hidden="true">
        <div className="mo-burst">
          {BURST.slice(0, compact ? 5 : 8).map((d, k) => (
            <svg
              key={k}
              viewBox="-16 -16 32 32"
              className="mo-burst-doodle mo-soon-float"
              style={{ "--dx": d.dx * 0.8 + "px", "--dy": d.dy * 0.6 + "px", "--r": d.r + "deg", animationDelay: `${0.2 + k * 0.06}s, ${1.2 + k * 0.3}s` } as React.CSSProperties}
            >
              <DoodleShape kind={d.kind} />
            </svg>
          ))}
        </div>
        <svg viewBox="-20 -20 640 270" className="mo-soon-svg">
          <path d="M18 0 L582 0 Q600 0 600 18 L600 202 Q600 220 582 220 L18 220 Q0 220 0 202 L0 18 Q0 0 18 0 Z" className="mo-torn-paper" />
          <path d="M440 6 L440 214" className="mo-torn-perf" />
          <rect x="446" y="6" width="148" height="208" rx="12" className="mo-torn-stub" />
          <text x="32" y="44" className="mo-torn-mono">ADMIT ONE · ENGLISH CLUB JOGJA</text>
          <text x="32" y="112" className="mo-torn-big">NEXT EVENT</text>
          <text x="32" y="176" className="mo-torn-big is-blue mo-soon-dots">
            LOADING<tspan className="d1">.</tspan><tspan className="d2">.</tspan><tspan className="d3">.</tspan>
          </text>
          <text x="519" y="96" className="mo-torn-day" textAnchor="middle">SAT</text>
          <text x="519" y="150" className="mo-torn-mono" textAnchor="middle">?? / ??</text>
          <g className="mo-soon-stamp" transform="translate(482 204) rotate(-12)">
            <rect x="-110" y="-24" width="220" height="48" rx="6" />
            <text x="0" y="9" textAnchor="middle">COMING SOON</text>
          </g>
        </svg>
      </div>
      <TalkingCrew
        kind="bird"
        lines={[
          "The next event is on its way!",
          "We'll post it here as soon as we can.",
          "Keep an eye on our WhatsApp group!",
        ]}
      />
    </div>
  );
}

const CSS = `
.mo.mo-soon{padding:8px 0 0;gap:6px;max-width:640px;width:100%}
.mo-soon-ticket{position:relative;width:100%;animation:mo-soon-in .8s cubic-bezier(.3,1.4,.5,1) backwards}
.mo-soon-svg{position:relative;z-index:1;width:100%;height:auto;overflow:visible;animation:mo-soon-bob 4s ease-in-out 1s infinite}
.mo-soon .mo-burst{top:50%}
.mo-soon-float{animation:mo-burst .9s cubic-bezier(.2,.9,.3,1.2) backwards,mo-soon-drift 3.4s ease-in-out infinite}
.mo-soon-dots tspan{animation:mo-soon-dot 1.4s ease-in-out infinite}
.mo-soon-dots .d2{animation-delay:.2s}.mo-soon-dots .d3{animation-delay:.4s}
.mo-soon-stamp{transform-box:fill-box;transform-origin:center;animation:mo-soon-stamp .55s cubic-bezier(.3,1.5,.5,1) .7s backwards}
.mo-soon-stamp rect{fill:rgba(255,253,248,.8);stroke:#D96A15;stroke-width:4}
.mo-soon-stamp text{font-family:var(--font-bricolage),'Arial Black',sans-serif;font-weight:800;font-size:28px;letter-spacing:2px;fill:#D96A15}
.mo-soon.is-compact .mo-talker{margin-top:-4px}
@keyframes mo-soon-in{0%{transform:translateY(40px) rotate(-4deg) scale(.9)}100%{transform:none}}
@keyframes mo-soon-bob{0%,100%{transform:translateY(0) rotate(0)}50%{transform:translateY(-8px) rotate(-1deg)}}
@keyframes mo-soon-drift{0%,100%{translate:0 0}50%{translate:0 -10px}}
@keyframes mo-soon-dot{0%,100%{opacity:.25}50%{opacity:1}}
@keyframes mo-soon-stamp{0%{transform:scale(2.2)}100%{transform:scale(1)}}
.mo{max-width:820px;margin:0 auto;padding:48px 16px 72px;overflow-x:clip;display:flex;flex-direction:column;align-items:center;text-align:center;gap:14px}
.mo-title{font-family:var(--font-bricolage),'Arial Black',sans-serif;font-weight:800;font-size:clamp(48px,9vw,88px);line-height:.9;letter-spacing:-.035em;color:#1A1A1A;margin:0}
.mo-lede{font-size:18px;line-height:1.5;color:#374151;max-width:52ch}
.mo-lede strong{color:#1A1A1A}
.mo-ticket{position:relative;width:100%;margin-top:4px}
.mo-burst{position:absolute;left:50%;top:55%;width:0;height:0;z-index:0}
.mo-burst-doodle{position:absolute;width:34px;height:34px;margin:-17px 0 0 -17px;stroke:#1A1A1A;stroke-width:1.9;stroke-linejoin:round;stroke-linecap:round;transform:translate(var(--dx),var(--dy)) rotate(var(--r));animation:mo-burst .9s cubic-bezier(.2,.9,.3,1.2) backwards}
.mo-ticket .tk-wrap{position:relative;z-index:1}
.mo-stamp{position:absolute;z-index:3;left:64%;top:76%;padding:3px 14px;border:3.5px solid #D96A15;border-radius:8px;color:#D96A15;font-family:var(--font-bricolage),'Arial Black',sans-serif;font-weight:800;font-size:clamp(20px,2.8vw,28px);letter-spacing:.04em;text-transform:uppercase;background:rgba(255,253,248,.55);transform:translate(-50%,-50%) rotate(-12deg);mix-blend-mode:multiply;animation:mo-stamp .55s cubic-bezier(.3,1.5,.5,1) .7s backwards;pointer-events:none}
.mo-talker{position:relative;display:flex;flex-direction:column;align-items:center;gap:4px;background:none;border:0;padding:6px 10px;cursor:pointer;font:inherit}
.mo-bubble{position:relative;max-width:300px;padding:9px 16px;background:#fff;border:2px solid #1A1A1A;border-radius:14px;box-shadow:3px 3px 0 #F47B20;font-weight:600;font-size:15px;color:#1A1A1A;animation:mo-pop .35s cubic-bezier(.3,1.6,.5,1) backwards}
.mo-bubble::after{content:"";position:absolute;left:50%;bottom:-9px;width:14px;height:14px;background:#fff;border-right:2px solid #1A1A1A;border-bottom:2px solid #1A1A1A;transform:translateX(-50%) rotate(45deg)}
.mo-crew{display:block;height:96px;transform-origin:50% 100%;animation:mo-hop .6s cubic-bezier(.3,.7,.4,1)}
.mo-crew-svg{height:100%;width:auto;display:block;overflow:visible}
.mo-tap{font-family:var(--font-code),ui-monospace,monospace;font-size:10.5px;letter-spacing:.14em;text-transform:uppercase;color:#6B7280}
.mo-talker:hover .mo-crew{animation:mo-wiggle .5s ease-in-out}
.mo-id{display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:8px 12px;padding:10px 14px;border:2px dashed rgba(26,26,26,.3);border-radius:10px;background:#FFFDF8;max-width:100%}
.mo-id code{font-family:var(--font-code),ui-monospace,monospace;font-size:13px;color:#1A1A1A;word-break:break-all;user-select:all}
.mo-copy{display:inline-flex;align-items:center;gap:5px;padding:4px 10px;border:1.5px solid #1A1A1A;border-radius:6px;background:#fff;font-size:13px;font-weight:600;cursor:pointer}
.mo-actions{display:flex;flex-wrap:wrap;justify-content:center;gap:12px;margin-top:8px}
.mo-btn{display:inline-flex;align-items:center;gap:8px;height:50px;padding:0 22px;border:2px solid #1A1A1A;border-radius:8px;font-weight:600;font-size:16px;box-shadow:0 3px 0 #1A1A1A;transition:transform .18s cubic-bezier(.3,1.4,.5,1),box-shadow .18s}
.mo-btn.is-solid{background:#F47B20;color:#1A1A1A}
.mo-btn.is-outline{background:#fff;color:#1A1A1A}
.mo-btn:hover{transform:translateY(-2px) rotate(-1deg);box-shadow:0 5px 0 #1A1A1A}
.mo-links{display:flex;flex-wrap:wrap;justify-content:center;gap:6px 22px}
.mo-small{font-size:14px;color:#2D5FA8;text-decoration:underline;text-underline-offset:3px;background:none;border:0;cursor:pointer;font-family:inherit}
.mo-torn{width:100%;max-width:640px;margin-top:8px}
.mo-torn-svg{width:100%;height:auto;overflow:visible}
.mo-torn-paper{fill:#FFFDF8;stroke:#1A1A1A;stroke-width:3}
.mo-torn-perf{stroke:#1A1A1A;stroke-width:2.5;stroke-dasharray:7 6}
.mo-torn-stub{fill:#EBF3FD}
.mo-torn-mono{font-family:var(--font-code),ui-monospace,monospace;font-size:15px;letter-spacing:2px;fill:#6B7280}
.mo-torn-big{font-family:var(--font-bricolage),'Arial Black',sans-serif;font-weight:800;font-size:64px;letter-spacing:-2px;fill:#F47B20;stroke:#1A1A1A;stroke-width:1.5;paint-order:stroke}
.mo-torn-big.is-blue{fill:#3B7DD8}
.mo-torn-day{font-family:var(--font-bricolage),'Arial Black',sans-serif;font-weight:800;font-size:46px;fill:#3B7DD8}
.mo-torn-edge{fill:none;stroke:#1A1A1A;stroke-width:3;stroke-linejoin:round}
.mo-half{transform-box:view-box;transform-origin:330px 220px}
.mo-half.is-left{transform:translate(-26px,8px) rotate(-6deg);animation:mo-tear-l .9s cubic-bezier(.3,1.3,.5,1) .5s backwards}
.mo-half.is-right{transform:translate(26px,14px) rotate(7deg);animation:mo-tear-r .9s cubic-bezier(.3,1.3,.5,1) .5s backwards}
.mo-torn-stamp rect{fill:rgba(255,253,248,.7);stroke:#3B7DD8;stroke-width:4}
.mo-torn-stamp text{font-family:var(--font-bricolage),'Arial Black',sans-serif;font-weight:800;font-size:28px;letter-spacing:2px;fill:#3B7DD8}
@keyframes mo-burst{0%{transform:translate(0,0) scale(.2) rotate(0deg)}100%{transform:translate(var(--dx),var(--dy)) rotate(var(--r))}}
@keyframes mo-stamp{0%{transform:translate(-50%,-50%) rotate(-12deg) scale(2.2)}100%{transform:translate(-50%,-50%) rotate(-12deg) scale(1)}}
@keyframes mo-pop{0%{transform:translateY(8px) scale(.85)}100%{transform:none}}
@keyframes mo-hop{0%{transform:none}25%{transform:scale(1.1,.85)}50%{transform:translateY(-22%) scale(.95,1.08)}75%{transform:scale(1.06,.94)}100%{transform:none}}
@keyframes mo-wiggle{0%,100%{transform:none}30%{transform:rotate(-6deg)}60%{transform:rotate(5deg)}}
@keyframes mo-tear-l{0%{transform:none}100%{transform:translate(-26px,8px) rotate(-6deg)}}
@keyframes mo-tear-r{0%{transform:none}100%{transform:translate(26px,14px) rotate(7deg)}}
@media (max-width:640px){
  .mo-burst-doodle{width:26px;height:26px;margin:-13px 0 0 -13px;transform:translate(calc(var(--dx) * .5),calc(var(--dy) * .7)) rotate(var(--r));animation-name:mo-burst-sm}
  @keyframes mo-burst-sm{0%{transform:translate(0,0) scale(.2)}100%{transform:translate(calc(var(--dx) * .5),calc(var(--dy) * .7)) rotate(var(--r))}}
  .mo-stamp{left:50%;top:58%;font-size:22px}
  .mo-btn{width:100%;justify-content:center}
  .mo-actions{width:100%}
}
@media (prefers-reduced-motion:reduce){.mo *{animation:none!important}}
`;
