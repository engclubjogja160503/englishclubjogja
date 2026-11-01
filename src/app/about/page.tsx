import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Reveal from "@/components/Reveal";
import { WHATSAPP_GROUP_URL } from "@/lib/constants";
import groupRelaxed from "@/assets/photos/group-relaxed.jpg";
import rooftopSession from "@/assets/photos/rooftop-session.jpg";

export const metadata = {
  title: "About",
  description:
    "English Club Jogja is a free, community-run English conversation club in Yogyakarta. No grades, no pressure, just conversations.",
};

const PRINCIPLES = [
  {
    title: "No grades",
    text: "Nobody is tested, scored or ranked. You're here to talk, not to pass anything.",
  },
  {
    title: "No pressure",
    text: "Speak a lot or listen first. Make mistakes out loud. Everyone started somewhere.",
  },
  {
    title: "Just conversations",
    text: "Real topics people care about, from relationships to careers to whatever is trending this week.",
  },
];

const HOUSE_RULES = [
  "Be kind. Laugh with people, never at them.",
  "Let everyone have a turn. Small groups only work when the quiet ones get space too.",
  "Respect people's boundaries, online and off. Ask before you post someone's photo.",
  "Keep it friendly. ECJ is a community, not a dating app or a sales pitch.",
];

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        {/* Intro */}
        <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-10 pt-14 lg:pt-20 pb-16">
          <p className="eyebrow text-[#B4570F]">About English Club Jogja</p>
          <h1 className="word-rise font-display font-extrabold text-[clamp(2.8rem,7.6vw,6.6rem)] leading-[0.9] text-[#1A1A1A] mt-5 max-w-5xl">
            {["Not", "a", "course.", "A", "Saturday", "night", "habit."].map((w, i) => (
              <span key={i} className={`mr-[0.22em] ${i >= 3 ? "text-[#F47B20]" : ""}`} style={{ animationDelay: `${i * 80}ms` }}>
                {w}
              </span>
            ))}
          </h1>
          <div className="mt-10 grid lg:grid-cols-12 gap-10">
            <p className="lg:col-span-6 text-xl text-[#374151] leading-relaxed">
              English Club Jogja is a free, community-run club in Yogyakarta. Every Saturday night we pick a topic, sit in small groups, and talk about it in English. That&apos;s it. No teacher at the front, no fee, no certificate at the end.
            </p>
            <p className="lg:col-span-5 lg:col-start-8 text-lg text-[#374151] leading-relaxed">
              People come to practise, to get over the fear of speaking, to meet people outside their campus or office, or just to fill a Saturday with something better than scrolling.
            </p>
          </div>
        </section>

        <section className="relative">
          <div className="relative w-full aspect-[16/9] lg:aspect-[21/9] overflow-hidden">
            <Image
              src={rooftopSession}
              alt="A Saturday session on a rooftop café, members seated at small tables under string lights"
              fill
              placeholder="blur"
              sizes="100vw"
              className="object-cover"
            />
          </div>
        </section>

        {/* Principles */}
        <section className="bg-[#1A1A1A] text-[#F5F0E8]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-20 grid md:grid-cols-3 gap-10">
            {PRINCIPLES.map((p, i) => (
              <Reveal key={p.title} delay={i * 100} className="flex flex-col gap-3 border-t-2 border-[#F47B20] pt-5">
                <h2 className="font-display font-extrabold text-4xl">{p.title}.</h2>
                <p className="text-[#F5F0E8]/80 text-lg leading-relaxed">{p.text}</p>
              </Reveal>
            ))}
          </div>
        </section>

        {/* House rules */}
        <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-10 py-20 lg:py-24 grid lg:grid-cols-12 gap-10">
          <Reveal className="lg:col-span-5">
            <p className="eyebrow text-[#B4570F]">House rules</p>
            <h2 className="font-display font-extrabold text-[clamp(2.2rem,4.4vw,3.6rem)] leading-[0.95] text-[#1A1A1A] mt-3">
              How we keep it a good room to be in.
            </h2>
          </Reveal>
          <ol className="lg:col-span-7 flex flex-col">
            {HOUSE_RULES.map((rule, i) => (
              <Reveal as="li" key={rule} delay={i * 80} className="grid grid-cols-[2.5rem_1fr] gap-3 py-5 border-t border-[#1A1A1A]/15 first:border-t-2 first:border-[#1A1A1A]">
                <span className="font-display font-extrabold text-2xl text-[#F47B20]">{i + 1}</span>
                <p className="text-lg text-[#1A1A1A] leading-relaxed">{rule}</p>
              </Reveal>
            ))}
          </ol>
        </section>

        {/* Collaborate */}
        <section id="collaborate" className="scroll-mt-20 bg-[#EBF3FD] border-y-2 border-[#1A1A1A]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-20 lg:py-24 grid lg:grid-cols-12 gap-x-12 gap-y-10">
            <Reveal className="lg:col-span-6 flex flex-col gap-5">
              <p className="eyebrow text-[#2D5FA8]">Collaborate</p>
              <h2 className="font-display font-extrabold text-[clamp(2.4rem,5vw,4.2rem)] leading-[0.92] text-[#1A1A1A]">
                Let&apos;s make a Saturday together.
              </h2>
              <p className="text-lg text-[#374151] leading-relaxed">
                Every week we bring a room full of young people from around Jogja who want to talk. We&apos;re always open to working with others who share that spirit.
              </p>
              <ul className="flex flex-col gap-3 text-[17px] text-[#1A1A1A]">
                <li className="flex gap-3"><span className="text-[#2D5FA8] font-bold">→</span><span><strong>Cafés & venues:</strong> host a session and fill your space on a Saturday night.</span></li>
                <li className="flex gap-3"><span className="text-[#2D5FA8] font-bold">→</span><span><strong>Campus organisations:</strong> co-host a themed session with your members.</span></li>
                <li className="flex gap-3"><span className="text-[#2D5FA8] font-bold">→</span><span><strong>Communities & speakers:</strong> bring a topic you know well and lead a conversation.</span></li>
              </ul>
              <div className="flex flex-wrap gap-3 mt-3">
                <a
                  href="https://instagram.com/engclubjogja"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3.5 bg-[#1A1A1A] hover:bg-[#2D5FA8] text-[#F5F0E8] font-semibold rounded-md transition-colors"
                >
                  Message us on Instagram <ArrowUpRight size={18} />
                </a>
                <a
                  href={WHATSAPP_GROUP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3.5 border-2 border-[#1A1A1A] text-[#1A1A1A] font-semibold rounded-md hover:bg-white"
                >
                  WhatsApp group <ArrowUpRight size={18} />
                </a>
              </div>
            </Reveal>
            <Reveal delay={120} className="lg:col-span-6 relative aspect-[4/3] lg:aspect-auto lg:min-h-[420px] overflow-hidden rounded-sm border-2 border-[#1A1A1A] -rotate-1">
              <Image
                src={groupRelaxed}
                alt="English Club Jogja members gathered for a group photo on a rooftop at night"
                fill
                placeholder="blur"
                sizes="(min-width: 1024px) 45vw, 100vw"
                className="object-cover"
              />
            </Reveal>
          </div>
        </section>

        <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-10 py-20 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <h2 className="font-display font-extrabold text-[clamp(2rem,4vw,3.2rem)] leading-[0.95] text-[#1A1A1A] max-w-2xl">
            The easiest way to understand ECJ is to come once.
          </h2>
          <Link
            href="/event"
            className="group inline-flex items-center gap-2 px-6 py-4 bg-[#F47B20] hover:bg-[#1A1A1A] hover:text-[#F5F0E8] text-[#1A1A1A] font-semibold rounded-md text-lg shrink-0 transition-colors"
          >
            Save a seat <ArrowRight size={20} className="transition-transform group-hover:translate-x-1" />
          </Link>
        </section>
      </main>
      <Footer />
    </div>
  );
}
