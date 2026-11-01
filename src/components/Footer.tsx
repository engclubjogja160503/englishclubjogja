import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { WHATSAPP_GROUP_URL } from "@/lib/constants";

const COLUMNS = [
  {
    heading: "The club",
    links: [
      { href: "/#this-saturday", label: "This Saturday" },
      { href: "/saturdays", label: "Past Saturdays" },
      { href: "/about", label: "About us" },
      { href: "/about#collaborate", label: "Collaborate" },
    ],
  },
  {
    heading: "Your seat",
    links: [
      { href: "/book", label: "Save a seat" },
      { href: "/cancel", label: "Cancel a booking" },
      { href: "/login", label: "Member sign in" },
      { href: "/register", label: "Become a member" },
    ],
  },
  {
    heading: "Keep in touch",
    links: [
      { href: WHATSAPP_GROUP_URL, label: "WhatsApp group", external: true },
      { href: "https://instagram.com/engclubjogja", label: "Instagram @engclubjogja", external: true },
      { href: "/donate", label: "Support us (QRIS)" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="mt-auto bg-[#1A1A1A] text-[#F5F0E8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 pt-16 pb-10">
        <p className="font-display font-extrabold text-[clamp(2.4rem,7vw,5.5rem)] leading-[0.95] tracking-tight max-w-4xl">
          No grades. No pressure.{" "}
          <span className="text-[#F47B20]">Just conversations.</span>
        </p>

        <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-10 border-t border-white/15 pt-10">
          {COLUMNS.map((col) => (
            <div key={col.heading} className="flex flex-col gap-3">
              <p className="eyebrow text-[#F5F0E8]/50">{col.heading}</p>
              <ul className="flex flex-col gap-2.5">
                {col.links.map((l) => (
                  <li key={l.label}>
                    {"external" in l && l.external ? (
                      <a
                        href={l.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[15px] text-[#F5F0E8]/85 hover:text-[#F47B20]"
                      >
                        {l.label} <ArrowUpRight size={14} />
                      </a>
                    ) : (
                      <Link href={l.href} className="text-[15px] text-[#F5F0E8]/85 hover:text-[#F47B20]">
                        {l.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div className="col-span-2 md:col-span-1 flex flex-col gap-3">
            <p className="eyebrow text-[#F5F0E8]/50">When</p>
            <p className="text-[15px] text-[#F5F0E8]/85 leading-relaxed">
              Every Saturday night in Yogyakarta. Free, always. The topic and venue drop in the WhatsApp group during the week.
            </p>
          </div>
        </div>

        <div className="mt-14 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#F5F0E8]/45 eyebrow">
          <span>© {new Date().getFullYear()} English Club Jogja</span>
          <span>Made in Yogyakarta, by the people who show up</span>
        </div>
      </div>
    </footer>
  );
}
