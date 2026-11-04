"use client";

import { CrewFigure, DoodleShape, type CrewKind, type DoodleKind } from "@/components/ui/doodle-crew-footer";
import { type EventData, formatTime, eventTopic, venueLine } from "@/lib/events";

/**
 * A hand-drawn admission ticket, generated from the event the admin filled in.
 * Nothing is uploaded: topic, date, time, venue and seats come from the event
 * row, and the character, colour and barcode are picked from the event date,
 * so every Saturday gets its own ticket automatically.
 * Same sketchbook language as the footer: ink outlines, hatching, doodles.
 * All motion is transform-only, so the ticket is readable even with animations off.
 */

// Characters that stand on the ticket's top edge (the kid's dangling legs would cover the text).
const CREW: CrewKind[] = ["cat", "bird", "yeti", "ghost", "mushroom"];
const THEMES = [
  { accent: "#F47B20", soft: "#FFF3EB" },
  { accent: "#3B7DD8", soft: "#EBF3FD" },
];
const DOODLES: DoodleKind[] = ["speech", "coffee", "star", "sparkle", "heart"];

function seedOf(text: string) {
  let h = 0;
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) >>> 0;
  return h;
}

function rand(seed: number, n: number) {
  const s = Math.sin(seed * 0.0001 + n * 127.1) * 43758.5453;
  return s - Math.floor(s);
}

export default function EventTicket({
  event,
  taken,
  compact = false,
}: {
  event: EventData;
  taken: number;
  compact?: boolean;
}) {
  const topic = eventTopic(event);
  const seed = seedOf(event.event_date + event.id);
  const theme = THEMES[seed % THEMES.length];
  const crew = CREW[seed % CREW.length];
  const date = new Date(event.event_date + "T19:00:00");
  const day = date.toLocaleDateString("en-GB", { day: "2-digit" });
  const month = date.toLocaleDateString("en-GB", { month: "short" }).toUpperCase();
  const weekday = date.toLocaleDateString("en-GB", { weekday: "short" }).toUpperCase();
  const left = Math.max(event.max_participants - taken, 0);
  const widths = Array.from({ length: 26 }, (_, i) => 1 + Math.round(rand(seed, i) * 3));
  const bars = widths.map((w, i) => ({ w, x: widths.slice(0, i).reduce((sum, v) => sum + v + 1.6, 0) }));
  const barsWidth = bars[bars.length - 1].x + bars[bars.length - 1].w;
  const doodles = DOODLES.map((kind, i) => ({ kind, i }))
    .sort((a, b) => rand(seed, a.i + 50) - rand(seed, b.i + 50))
    .slice(0, 3);

  return (
    <div
      className={`tk-wrap${compact ? " is-compact" : ""}`}
      style={{ "--tk-accent": theme.accent, "--tk-soft": theme.soft } as React.CSSProperties}
    >
      <style>{CSS}</style>

      <div className="tk-crew" aria-hidden="true">
        <CrewFigure kind={crew} className="tk-crew-svg" />
      </div>

      {doodles.map((d, k) => (
        <svg key={d.kind} className={`tk-doodle tk-doodle-${k}`} viewBox="-16 -16 32 32" aria-hidden="true">
          <DoodleShape kind={d.kind} />
        </svg>
      ))}

      <article className="tk" aria-label={`Ticket: ${topic.title}, ${weekday} ${day} ${month}`}>
        <div className="tk-main">
          <div className="tk-top">
            <span>Admit one</span>
            <span>English Club Jogja</span>
          </div>

          <p className="tk-kicker">This Saturday&apos;s topic</p>
          <h3 className="tk-title">{topic.title}</h3>
          <svg className="tk-underline" viewBox="0 0 200 10" preserveAspectRatio="none" aria-hidden="true">
            <path d="M2 6 C30 2 50 9 80 5 S140 2 198 6" />
          </svg>
          {topic.subtitle && !compact && <p className="tk-sub">{topic.subtitle}</p>}

          <dl className="tk-facts">
            <div>
              <dt>Date</dt>
              <dd>
                {weekday} {day} {month}
              </dd>
            </div>
            <div>
              <dt>Time</dt>
              <dd>{formatTime(event.event_time)}</dd>
            </div>
            <div className="tk-venue">
              <dt>Venue</dt>
              <dd>{venueLine(event)}</dd>
            </div>
          </dl>
        </div>

        <div className="tk-perf" aria-hidden="true" />

        <div className="tk-stub">
          <span className="tk-stub-dow">{weekday}</span>
          <span className="tk-stub-day">{day}</span>
          <span className="tk-stub-mon">{month}</span>
          <span className="tk-stub-seats">{left === 0 ? "Fully booked" : `${left} seat${left === 1 ? "" : "s"} left`}</span>
          <svg className="tk-barcode" viewBox={`0 0 ${barsWidth.toFixed(1)} 26`} preserveAspectRatio="none" aria-hidden="true">
            {bars.map((b, i) => (
              <rect key={i} x={b.x} y={rand(seed, i + 9) * 2} width={b.w} height={24 - rand(seed, i + 19) * 3} rx="0.4" />
            ))}
          </svg>
          <span className="tk-stub-no">No. {String(seed % 100000).padStart(5, "0")}</span>
        </div>
      </article>
    </div>
  );
}

const CSS = `
.tk-wrap{--tk-ink:#1A1A1A;--tk-paper:#FFFDF8;--tk-cut:#F5F0E8;--tk-pt:96px;--tk-crew-h:102px;position:relative;padding:var(--tk-pt) 14px 18px;max-width:760px;margin:0 auto}
.tk-wrap.is-compact{--tk-pt:80px;--tk-crew-h:86px;max-width:640px}
.tk{position:relative;display:grid;grid-template-columns:minmax(0,1fr) auto minmax(150px,190px);background:var(--tk-paper);border:2.5px solid var(--tk-ink);border-radius:18px;box-shadow:6px 6px 0 var(--tk-ink);transform:rotate(-1.2deg);animation:tk-stamp .7s cubic-bezier(.2,.8,.25,1.15) backwards;transition:transform .35s cubic-bezier(.3,1.4,.5,1)}
.tk-wrap:hover .tk{transform:rotate(0deg) translateY(-3px)}
.tk-main{padding:22px 24px 22px 26px;min-width:0;display:flex;flex-direction:column;gap:8px}
.tk-top{display:flex;justify-content:space-between;gap:12px;font-family:var(--font-code),ui-monospace,monospace;font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#6B7280;border-bottom:1.5px dashed rgba(26,26,26,.25);padding-bottom:8px}
.tk-kicker{margin-top:6px;font-family:var(--font-code),ui-monospace,monospace;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:var(--tk-accent)}
.tk-title{font-family:var(--font-bricolage),'Arial Black',sans-serif;font-weight:800;font-size:clamp(28px,4.6vw,46px);line-height:.95;letter-spacing:-.03em;color:var(--tk-accent);text-shadow:2px 2px 0 var(--tk-ink);text-wrap:balance;margin:0}
.is-compact .tk-title{font-size:clamp(26px,4vw,38px)}
.tk-underline{width:min(70%,260px);height:10px;margin-top:-2px}
.tk-underline path{fill:none;stroke:var(--tk-ink);stroke-width:2.4;stroke-linecap:round}
.tk-sub{font-size:16px;line-height:1.4;color:#374151;max-width:46ch;margin:0}
.tk-facts{display:grid;grid-template-columns:auto auto minmax(0,1fr);gap:6px 22px;margin:8px 0 0}
.tk-facts div{min-width:0}
.tk-facts dt{font-family:var(--font-code),ui-monospace,monospace;font-size:10.5px;letter-spacing:.1em;text-transform:uppercase;color:#6B7280}
.tk-facts dd{margin:2px 0 0;font-weight:600;font-size:15px;color:var(--tk-ink)}
.tk-perf{position:relative;width:0;border-left:2.5px dashed var(--tk-ink);margin:18px 0}
.tk-perf::before,.tk-perf::after{content:"";position:absolute;left:50%;width:30px;height:30px;border-radius:50%;background:var(--tk-cut);border:2.5px solid var(--tk-ink);transform:translateX(-50%)}
.tk-perf::before{top:-37px;clip-path:inset(50% -4px -4px -4px)}
.tk-perf::after{bottom:-37px;clip-path:inset(-4px -4px 50% -4px)}
.tk-stub{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;padding:18px 14px;border-radius:0 15px 15px 0;background:repeating-linear-gradient(-38deg,var(--tk-soft) 0 7px,var(--tk-paper) 7px 9px)}
.tk-stub-dow,.tk-stub-mon{font-family:var(--font-code),ui-monospace,monospace;font-size:13px;letter-spacing:.14em;color:var(--tk-ink)}
.tk-stub-day{font-family:var(--font-bricolage),'Arial Black',sans-serif;font-weight:800;font-size:64px;line-height:.9;color:var(--tk-accent);text-shadow:2px 2px 0 var(--tk-ink)}
.tk-stub-seats{margin-top:8px;padding:3px 10px;border:2px solid var(--tk-ink);border-radius:999px;background:#fff;font-size:12.5px;font-weight:700;color:var(--tk-ink);white-space:nowrap;transform:rotate(-3deg)}
.tk-barcode{width:88%;height:30px;margin-top:10px}
.tk-barcode rect{fill:var(--tk-ink)}
.tk-stub-no{font-family:var(--font-code),ui-monospace,monospace;font-size:10px;letter-spacing:.2em;color:#6B7280}
/* Stands on the ticket's top edge, above the stub, so it never covers the text. */
.tk-crew{position:absolute;bottom:calc(100% - var(--tk-pt) - 4px);right:48px;height:var(--tk-crew-h);z-index:2;transform-origin:50% 100%;animation:tk-peek .9s cubic-bezier(.3,1.4,.5,1) .35s backwards}
.tk-crew-svg{display:block;height:100%;width:auto;overflow:visible}
.tk-doodle{position:absolute;width:30px;height:30px;stroke:#1A1A1A;stroke-width:1.9;stroke-linejoin:round;stroke-linecap:round;z-index:3;animation:tk-float 5s ease-in-out infinite}
.tk-doodle-0{top:26px;left:4px}
.tk-doodle-1{bottom:0;left:38%;animation-delay:-1.6s}
.tk-doodle-2{top:18px;right:6px;animation-delay:-3.2s}
@keyframes tk-stamp{0%{transform:translateY(-14px) rotate(-5deg) scale(1.05)}60%{transform:translateY(2px) rotate(-.6deg) scale(.99)}100%{transform:rotate(-1.2deg)}}
@keyframes tk-peek{0%{transform:translateY(40%) scale(.8)}100%{transform:none}}
@keyframes tk-float{0%,100%{transform:translateY(0) rotate(-8deg)}50%{transform:translateY(-8px) rotate(8deg)}}
@media (max-width:640px){
  .tk{grid-template-columns:1fr;grid-template-rows:auto auto auto}
  .tk-main{padding:18px 18px 14px}
  .tk-perf{width:auto;height:0;border-left:0;border-top:2.5px dashed var(--tk-ink);margin:0 16px}
  .tk-perf::before,.tk-perf::after{top:50%;left:auto;transform:translateY(-50%)}
  .tk-perf::before{left:-35px;clip-path:inset(-4px -4px -4px 50%)}
  .tk-perf::after{right:-35px;bottom:auto;clip-path:inset(-4px 50% -4px -4px)}
  .tk-stub{flex-direction:row;flex-wrap:wrap;justify-content:center;gap:4px 10px;border-radius:0 0 15px 15px;padding:14px}
  .tk-stub-day{font-size:44px}
  .tk-stub-seats{margin-top:0}
  .tk-barcode{width:60%;margin-top:4px}
  .tk-facts{grid-template-columns:auto auto}
  .tk-venue{grid-column:1/-1}
  .tk-wrap,.tk-wrap.is-compact{--tk-pt:74px;--tk-crew-h:80px}
  .tk-crew{right:30px}
}
@media (prefers-reduced-motion:reduce){.tk,.tk-crew,.tk-doodle{animation:none!important}.tk-wrap:hover .tk{transform:rotate(-1.2deg)}}
`;
