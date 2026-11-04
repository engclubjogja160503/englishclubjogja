export interface EventData {
  id: string;
  event_date: string;
  event_time: string | null;
  venue_name: string;
  venue_address: string | null;
  max_participants: number;
  description: string | null;
  theme?: string | null;
  is_active?: boolean | null;
  is_archived?: boolean | null;
}

const EMOJI = /[\p{Extended_Pictographic}\p{Regional_Indicator}\u{FE0F}\u{200D}]/gu;

export function stripEmoji(text: string) {
  return text.replace(EMOJI, "").replace(/\s{2,}/g, " ").trim();
}

const SMALL_WORDS = new Set(["a", "an", "and", "as", "at", "but", "by", "for", "in", "of", "on", "or", "the", "to", "vs", "with"]);

function titleCase(text: string) {
  return text
    .toLowerCase()
    .split(" ")
    .map((w, i) =>
      i > 0 && SMALL_WORDS.has(w) ? w : w.charAt(0).toUpperCase() + w.slice(1)
    )
    .join(" ");
}

/**
 * Event descriptions are written like
 * "💖 LOVE, LIES & BUTTERFLIES: The Messy, Magical... 💖 Ever felt that mix…"
 * Split that into a cover title, an optional subtitle, and the body text.
 */
export const DEFAULT_TOPIC = "Saturday Night English Practice";

export function parseTopic(description: string | null) {
  const fallback = DEFAULT_TOPIC;
  const raw = (description || "").trim();
  const clean = stripEmoji(raw);
  if (!clean) return { title: fallback, subtitle: "", body: "" };

  const colon = clean.indexOf(":");
  if (colon <= 0 || colon > 80) {
    const lead = leadingTitle(clean);
    if (!lead) return { title: fallback, subtitle: "", body: clean };
    const t = lead.title;
    return {
      title: t === t.toUpperCase() ? titleCase(t) : t,
      subtitle: "",
      body: lead.body.charAt(0).toUpperCase() + lead.body.slice(1),
    };
  }

  const rawTitle = clean.slice(0, colon).trim();
  const title = rawTitle === rawTitle.toUpperCase() ? titleCase(rawTitle) : rawTitle;

  // The subtitle runs up to the next emoji (organisers use them as separators),
  // or else up to the first full stop.
  const afterColon = raw.slice(raw.indexOf(":") + 1);
  const emojiAt = afterColon.search(/\p{Extended_Pictographic}/u);
  if (emojiAt > 0) {
    return {
      title,
      subtitle: stripEmoji(afterColon.slice(0, emojiAt)),
      body: stripEmoji(afterColon.slice(emojiAt)),
    };
  }
  const rest = stripEmoji(afterColon);
  const m = rest.match(/^(.{8,160}?[.!?])\s+([\s\S]*)$/);
  return { title, subtitle: m ? m[1] : rest, body: m ? m[2] : "" };
}

/**
 * The headline of an event. The admin's Theme wins when it is filled in;
 * otherwise the title is read out of the description as before.
 */
export function eventTopic(evt: Pick<EventData, "description" | "theme">) {
  const parsed = parseTopic(evt.description);
  const theme = stripEmoji(evt.theme || "");
  if (!theme) return parsed;
  // The description may open with that same title; then keep its subtitle and body.
  if (parsed.title !== DEFAULT_TOPIC && parsed.title.toLowerCase() === theme.toLowerCase()) {
    return { ...parsed, title: theme };
  }
  return { title: theme, subtitle: "", body: stripEmoji(evt.description || "") };
}

const CONNECTORS = new Set([...SMALL_WORDS, "&", "were", "was", "is", "are", "if", "be"]);

/**
 * Titles without a colon: "Turn The Volume Up! Bring your playlist…",
 * "How To Be A Human (No User Manual) if life had…", "If Movie were Real Ever wondered…".
 * Take the leading run of capitalised words (plus small connectors). It ends at
 * "!", "?", ")" or, if a lowercase word interrupts, one word earlier, since that
 * capitalised word starts the next sentence.
 */
function leadingTitle(text: string) {
  const words = text.split(/\s+/);
  let end = 0;
  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    const bare = w.replace(/^[("'“]+/, "");
    const capital = /^[\p{Lu}\d]/u.test(bare);
    if (!capital && !CONNECTORS.has(bare.toLowerCase())) {
      end = /[!?)]$/.test(words[i - 1] || "") ? i : i - 1;
      break;
    }
    if (/[!?)]$/.test(w)) {
      end = i + 1;
      break;
    }
    if (/[.:]$/.test(w) || i === words.length - 1) return null;
  }
  // Need at least two words that aren't just a greeting.
  if (end < 2) return null;
  const title = words.slice(0, end).join(" ").replace(/[,;]$/, "");
  if (/^(hey|hi|hello|halo)\b/i.test(title)) return null;
  return { title, body: words.slice(end).join(" ") };
}

export function formatTime(timeStr: string | null) {
  if (!timeStr) return "19.00 WIB";
  const [h, m] = timeStr.split(":");
  const hour = parseInt(h, 10);
  if (Number.isNaN(hour)) return timeStr;
  return `${String(hour).padStart(2, "0")}.${m ?? "00"} WIB`;
}

export function formatDate(dateStr: string, style: "long" | "short" = "long") {
  const date = new Date(dateStr + "T19:00:00");
  return date.toLocaleDateString("en-GB", {
    weekday: style === "long" ? "long" : "short",
    day: "numeric",
    month: style === "long" ? "long" : "short",
    ...(style === "long" ? { year: "numeric" } : {}),
  });
}

/** Today's date in Yogyakarta (WIB, UTC+7) as YYYY-MM-DD. */
export function todayInJogja() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(new Date());
}

export function isUpcoming(evt: Pick<EventData, "event_date">) {
  return evt.event_date >= todayInJogja();
}

export function venueLine(evt: Pick<EventData, "venue_name" | "venue_address">) {
  const name = stripEmoji(evt.venue_name || "");
  if (!name || /to be announced/i.test(name)) return "Venue announced in the WhatsApp group";
  return evt.venue_address ? `${name}, ${evt.venue_address}` : name;
}
