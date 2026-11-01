import Image from "next/image";
import DoodleCrewFooter, { type CrewMember, type FooterColumn } from "@/components/ui/doodle-crew-footer";
import { WHATSAPP_GROUP_URL } from "@/lib/constants";

const INSTAGRAM_URL = "https://instagram.com/engclubjogja";

const COLUMNS: FooterColumn[] = [
  {
    title: "The club",
    links: [
      { label: "Home", href: "/" },
      { label: "About us", href: "/about" },
      { label: "Collaborate", href: "/about#collaborate" },
      { label: "Past Saturdays", href: "/saturdays" },
    ],
  },
  {
    title: "Your seat",
    links: [
      { label: "Save a seat", href: "/event" },
      { label: "Cancel a booking", href: "/cancel" },
      { label: "Member sign in", href: "/login" },
      { label: "Become a member", href: "/register" },
    ],
  },
  {
    title: "Keep in touch",
    links: [
      { label: "WhatsApp group", href: WHATSAPP_GROUP_URL },
      { label: "Instagram", href: INSTAGRAM_URL },
      { label: "Donate (QRIS)", href: "/donate" },
    ],
  },
];

// Character indices count across "ENGLISH CLUB" (0–11, space at 7) then "JOGJA" (12–16).
const CREW: CrewMember[] = [
  { kind: "yeti", letter: 12, seat: "front", offset: -0.6, name: "Bima", says: "First time here? Same! Let's talk." },
  { kind: "bird", letter: 3, seat: "top", name: "Wren", says: "Small talk, big talk, all talk!" },
  { kind: "ghost", letter: 5, seat: "behind", name: "Boo", says: "Boo! …sorry, I'm shy. Hi!" },
  { kind: "kid", letter: 10, seat: "top", name: "Sekar", says: "Best seat in the house. And it's free!" },
  { kind: "mushroom", letter: 16, seat: "front", offset: 1.1, scale: 0.95, name: "Jamur", says: "I'm a fun guy. Fluent-ish, too." },
  { kind: "cat", letter: 16, seat: "front", offset: 2.2, flip: true, name: "Kopi", says: "Mistakes? We collect them here." },
];

export default function Footer() {
  return (
    <DoodleCrewFooter
      wordmark={"ENGLISH CLUB\nJOGJA"}
      lineColors={["#F47B20", "#3B7DD8"]}
      brand="English Club Jogja"
      logo={
        <Image
          src="/images/logo-wordmark.png"
          alt=""
          width={648}
          height={438}
          className="h-11 w-auto rounded-sm"
        />
      }
      blurb="A free English conversation community in Yogyakarta. Every Saturday night we pick a topic, sit in small groups, and talk."
      tagline="No grades. No pressure. Just conversations."
      columns={COLUMNS}
      actions={[
        { label: "Join the WhatsApp group", href: WHATSAPP_GROUP_URL, icon: "speech", variant: "outline" },
        { label: "Save a seat", href: "/event", icon: "star", variant: "solid" },
      ]}
      copyright={`© ${new Date().getFullYear()} English Club Jogja. Made in Yogyakarta, by the people who show up.`}
      socials={[
        { label: "Instagram", href: INSTAGRAM_URL },
        { label: "WhatsApp", href: WHATSAPP_GROUP_URL },
      ]}
      crew={CREW}
      fontFamily="var(--font-bricolage), 'Arial Black', sans-serif"
      fontWeight={800}
      bodyFamily="var(--font-body), system-ui, sans-serif"
      height="auto"
    />
  );
}
