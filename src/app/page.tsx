import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowDown, ArrowUpRight, Plus } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Reveal from "@/components/Reveal";
import PastSaturdays from "@/components/PastSaturdays";
import ThisSaturday from "@/components/home/ThisSaturday";
import { WHATSAPP_GROUP_URL } from "@/lib/constants";
import groupHearts from "@/assets/photos/group-hearts.jpg";
import groupPeace from "@/assets/photos/group-peace.jpg";
import groupRelaxed from "@/assets/photos/group-relaxed.jpg";
import micCircle from "@/assets/photos/mic-circle.jpg";
import rooftopSession from "@/assets/photos/rooftop-session.jpg";

const HEADLINE = ["No", "grades.", "No", "pressure.", "Just", "conversations."];

const STEPS = [
  {
    title: "Show up as you are",
    text: "Grab a seat and say hi. Coming alone is completely fine, and nobody checks your grammar at the door.",
  },
  {
    title: "Break the ice",
    text: "We start with something light, so everyone has spoken at least once before the main topic.",
  },
  {
    title: "Talk in small groups",
    text: "We talk through the week's topic in small groups, so you actually get to speak, not just listen.",
  },
  {
    title: "Share with the room",
    text: "Groups share their best ideas and hot takes with everyone.",
  },
  {
    title: "Stay for the group photo",
    text: "This is the part where strangers start turning into friends.",
  },
];

const FAQ = [
  {
    q: "My English isn't very good. Can I still come?",
    a: "Yes. That's exactly why we exist. There are no grades and no tests, and mistakes are part of the deal.",
  },
  {
    q: "Is it really free?",
    a: "100% free, every week. No tickets, no membership fee. If you want to help keep it running, there's a voluntary QRIS donation, but it's never expected.",
  },
  {
    q: "Do I need to create an account?",
    a: "No. You can book as a guest in under a minute. Members just get one-tap booking next time.",
  },
  {
    q: "I'm coming alone. Is that weird?",
    a: "Not at all. Talking in small groups makes it easy to meet new people, even if you don't know anyone yet.",
  },
  {
    q: "What if I book and can't make it?",
    a: "Please cancel so someone else can take your seat. Seats are limited every week.",
    link: { href: "/cancel", label: "Cancel a booking" },
  },
  {
    q: "Where do I hear about the next topic?",
    a: "The topic and venue are posted here and in our WhatsApp group during the week.",
    link: { href: WHATSAPP_GROUP_URL, label: "Join the WhatsApp group", external: true },
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1">
        {/* ── Hero: the group photo, three takes, like a self-timer burst ── */}
        <section className="relative bg-[#1A1A1A] text-[#F5F0E8] overflow-hidden">
          {/* Headline sits in the ink band; the photo's night sky continues it below. */}
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 pt-10 pb-2 lg:pt-14 lg:-mb-[6vw]">
            <p className="eyebrow text-[#F5F0E8]/70 word-rise">
              <span>English Club Jogja · Every Saturday night · Yogyakarta</span>
            </p>
            <h1 className="word-rise font-display font-extrabold text-[clamp(2.7rem,6.6vw,6.6rem)] leading-[0.9] tracking-[-0.035em] mt-5 max-w-[14ch] lg:max-w-[16ch]">
              {HEADLINE.map((w, i) => (
                <span
                  key={i}
                  className={`${i === 5 ? "text-[#F47B20]" : ""} mr-[0.22em]`}
                  style={{ animationDelay: `${120 + i * 90}ms` }}
                >
                  {w}
                </span>
              ))}
            </h1>
          </div>

          <div className="relative w-full aspect-[3/2] sm:aspect-[16/10] lg:aspect-[16/9]">
            <div className="burst absolute inset-0">
              <Image
                src={groupHearts}
                alt="About forty English Club Jogja members on a rooftop at night, making heart signs with their hands"
                fill
                preload
                placeholder="blur"
                sizes="100vw"
                className="object-cover object-[center_70%]"
              />
              <Image
                src={groupPeace}
                alt=""
                fill
                placeholder="blur"
                sizes="100vw"
                className="object-cover object-[center_70%]"
              />
              <Image
                src={groupRelaxed}
                alt=""
                fill
                placeholder="blur"
                sizes="100vw"
                className="object-cover object-[center_70%]"
              />
            </div>
            <div className="shutter absolute inset-0 bg-white pointer-events-none" aria-hidden="true" />
            {/* melt the photo's sky into the ink band above */}
            <div className="absolute inset-x-0 top-0 h-1/4 bg-gradient-to-b from-[#1A1A1A] to-transparent" aria-hidden="true" />

            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#1A1A1A]/85 to-transparent pt-16">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 pb-5 lg:pb-8 flex flex-wrap items-end justify-between gap-4">
                <div className="hidden sm:flex flex-wrap gap-3">
                  <Link
                    href="/book"
                    className="group inline-flex items-center gap-2 px-6 py-3.5 bg-[#F47B20] hover:bg-[#F5F0E8] text-[#1A1A1A] font-semibold rounded-md text-[17px] transition-colors"
                  >
                    Save a seat for Saturday
                    <ArrowRight size={19} className="transition-transform group-hover:translate-x-1" />
                  </Link>
                  <a
                    href="#how-it-goes"
                    className="inline-flex items-center gap-2 px-5 py-3.5 border-2 border-[#F5F0E8]/70 hover:border-[#F5F0E8] text-[#F5F0E8] font-semibold rounded-md text-[17px]"
                  >
                    What happens on a Saturday <ArrowDown size={18} />
                  </a>
                </div>
                <p className="eyebrow text-[#F5F0E8]/75 text-[11px] sm:text-xs">
                  Three takes, one rooftop · Yogyakarta
                </p>
              </div>
            </div>
          </div>

          {/* Mobile: actions under the photo, thumb-reachable */}
          <div className="sm:hidden px-4 py-5 flex flex-col gap-3">
            <Link
              href="/book"
              className="inline-flex items-center justify-between px-5 py-4 bg-[#F47B20] text-[#1A1A1A] font-semibold rounded-md text-lg"
            >
              Save a seat for Saturday <ArrowRight size={20} />
            </Link>
            <a href="#how-it-goes" className="text-center text-[#F5F0E8]/80 font-medium py-2">
              What happens on a Saturday ↓
            </a>
          </div>
        </section>

        {/* ── Motto ticker ── */}
        <div className="bg-[#F47B20] text-[#1A1A1A] overflow-hidden border-y-2 border-[#1A1A1A]" aria-hidden="true">
          <div className="marquee-track flex w-max whitespace-nowrap py-3">
            {[0, 1].map((k) => (
              <span key={k} className="font-display font-extrabold text-xl sm:text-2xl tracking-tight pr-8">
                {Array.from({ length: 4 }).map((_, i) => (
                  <span key={i}>
                    No grades <span className="text-[#F5F0E8] mx-3">✱</span> No pressure{" "}
                    <span className="text-[#F5F0E8] mx-3">✱</span> Just conversations{" "}
                    <span className="text-[#F5F0E8] mx-3">✱</span> Every Saturday{" "}
                    <span className="text-[#F5F0E8] mx-3">✱</span>{" "}
                  </span>
                ))}
              </span>
            ))}
          </div>
        </div>

        {/* ── This Saturday: the issue cover ── */}
        <section id="this-saturday" className="scroll-mt-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-20 lg:py-28">
            <ThisSaturday />
          </div>
        </section>

        {/* ── How a Saturday goes ── */}
        <section id="how-it-goes" className="scroll-mt-20 bg-white border-y-2 border-[#1A1A1A]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-20 lg:py-28">
            <Reveal className="grid lg:grid-cols-12 gap-6 items-end mb-14">
              <h2 className="lg:col-span-7 font-display font-extrabold text-[clamp(2.4rem,5.4vw,4.6rem)] leading-[0.92] text-[#1A1A1A]">
                What a Saturday night actually looks like.
              </h2>
              <p className="lg:col-span-5 text-lg text-[#374151] leading-relaxed">
                It isn&apos;t a class. There&apos;s no teacher at the front and no worksheet. It&apos;s closer to hanging out with friends who all happen to be speaking English.
              </p>
            </Reveal>

            <div className="grid lg:grid-cols-12 gap-x-10 gap-y-12">
              {/* photo collage */}
              <div className="lg:col-span-7 grid grid-cols-6 gap-3 sm:gap-4 content-start">
                <Reveal className="col-span-6 photo-zoom relative aspect-[16/9] overflow-hidden rounded-sm">
                  <Image
                    src={rooftopSession}
                    alt="Members sitting at small tables on a rooftop café while organisers introduce the evening"
                    fill
                    placeholder="blur"
                    sizes="(min-width: 1024px) 58vw, 100vw"
                    className="object-cover"
                  />
                </Reveal>
                <Reveal delay={100} className="col-span-4 photo-zoom relative aspect-[4/3] overflow-hidden rounded-sm">
                  <Image
                    src={micCircle}
                    alt="A circle of members laughing while one of them holds the microphone"
                    fill
                    placeholder="blur"
                    sizes="(min-width: 1024px) 38vw, 66vw"
                    className="object-cover"
                  />
                </Reveal>
                <Reveal delay={200} className="col-span-2 flex flex-col justify-end">
                  <p className="font-display font-bold text-[clamp(1.1rem,2vw,1.6rem)] leading-tight text-[#2D5FA8] -rotate-2 origin-bottom-left">
                    Sharing ideas with the whole room.
                  </p>
                  <p className="eyebrow text-[#6B7280] mt-3">Real nights, real members</p>
                </Reveal>
              </div>

              {/* the evening, in order */}
              <ol className="lg:col-span-5 flex flex-col">
                {STEPS.map((s, i) => (
                  <Reveal as="li" key={s.title} delay={i * 80} className="grid grid-cols-[3rem_1fr] gap-3 py-5 border-t border-[#1A1A1A]/15 first:border-t-2 first:border-[#1A1A1A]">
                    <span className="font-display font-extrabold text-3xl text-[#F47B20] leading-none">{i + 1}</span>
                    <div>
                      <h3 className="font-display font-bold text-[22px] text-[#1A1A1A] leading-tight">{s.title}</h3>
                      <p className="text-[#374151] mt-1.5 leading-relaxed">{s.text}</p>
                    </div>
                  </Reveal>
                ))}
              </ol>
            </div>
          </div>
        </section>

        {/* ── Back issues ── */}
        <section className="overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-20 lg:py-24">
            <Reveal className="flex flex-wrap items-end justify-between gap-6 mb-10">
              <div>
                <p className="eyebrow text-[#B4570F]">Back issues</p>
                <h2 className="font-display font-extrabold text-[clamp(2.2rem,4.6vw,3.8rem)] leading-[0.95] text-[#1A1A1A] mt-3 max-w-2xl">
                  What we&apos;ve been talking about.
                </h2>
              </div>
              <Link href="/saturdays" className="group inline-flex items-center gap-2 font-semibold text-[#1A1A1A] border-b-2 border-[#F47B20] pb-1">
                All past Saturdays <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
              </Link>
            </Reveal>
            <PastSaturdays variant="strip" limit={10} />
          </div>
        </section>

        {/* ── Come as you are + FAQ ── */}
        <section className="bg-[#1A1A1A] text-[#F5F0E8]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-20 lg:py-28 grid lg:grid-cols-12 gap-x-12 gap-y-12">
            <Reveal className="lg:col-span-5 flex flex-col gap-6">
              <p className="eyebrow text-[#F47B20]">First time?</p>
              <h2 className="font-display font-extrabold text-[clamp(2.4rem,5vw,4.2rem)] leading-[0.92]">
                Come as you are. Leave with new friends.
              </h2>
              <p className="text-lg text-[#F5F0E8]/80 leading-relaxed max-w-md">
                Students, workers, total beginners, near-native speakers. The only thing everyone has in common is wanting to talk.
              </p>
              <div className="relative aspect-[16/10] overflow-hidden rounded-sm mt-2 photo-zoom">
                <Image
                  src={groupPeace}
                  alt="Members posing for a group photo on the rooftop, many making peace signs"
                  fill
                  placeholder="blur"
                  sizes="(min-width: 1024px) 40vw, 100vw"
                  className="object-cover"
                />
              </div>
            </Reveal>

            <div className="lg:col-span-7">
              <ul className="border-t border-[#F5F0E8]/25">
                {FAQ.map((item) => (
                  <li key={item.q} className="border-b border-[#F5F0E8]/25">
                    <details className="faq group">
                      <summary className="flex items-start justify-between gap-6 py-6">
                        <span className="font-display font-bold text-[clamp(1.2rem,2vw,1.55rem)] leading-snug group-open:text-[#F47B20]">
                          {item.q}
                        </span>
                        <Plus size={26} className="faq-icon shrink-0 mt-0.5 text-[#F47B20]" />
                      </summary>
                      <div className="pb-6 -mt-1 pr-10 text-[17px] text-[#F5F0E8]/80 leading-relaxed animate-fadeIn">
                        <p>{item.a}</p>
                        {item.link &&
                          ("external" in item.link ? (
                            <a href={item.link.href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 mt-3 text-[#F47B20] font-semibold underline underline-offset-4">
                              {item.link.label} <ArrowUpRight size={16} />
                            </a>
                          ) : (
                            <Link href={item.link.href} className="inline-block mt-3 text-[#F47B20] font-semibold underline underline-offset-4">
                              {item.link.label}
                            </Link>
                          ))}
                      </div>
                    </details>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* ── Collaborate + support ── */}
        <section>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-20 lg:py-24 grid md:grid-cols-2 gap-6">
            <Reveal className="p-8 lg:p-10 bg-[#EBF3FD] border-2 border-[#1A1A1A] rounded-md flex flex-col gap-4">
              <p className="eyebrow text-[#2D5FA8]">For cafés, campuses & communities</p>
              <h2 className="font-display font-extrabold text-[clamp(1.9rem,3.4vw,2.8rem)] leading-[0.95] text-[#1A1A1A]">
                Host a Saturday with us.
              </h2>
              <p className="text-[#374151] text-lg leading-relaxed">
                We bring a room full of curious, chatty people. You bring the space, a topic, or both.
              </p>
              <Link href="/about#collaborate" className="group mt-auto inline-flex items-center gap-2 font-semibold text-[#1A1A1A] w-fit border-b-2 border-[#2D5FA8] pb-1">
                How collaboration works <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
              </Link>
            </Reveal>
            <Reveal delay={120} className="p-8 lg:p-10 bg-[#FFF3EB] border-2 border-[#1A1A1A] rounded-md flex flex-col gap-4">
              <p className="eyebrow text-[#B4570F]">Free, kept alive by kindness</p>
              <h2 className="font-display font-extrabold text-[clamp(1.9rem,3.4vw,2.8rem)] leading-[0.95] text-[#1A1A1A]">
                Help keep it free.
              </h2>
              <p className="text-[#374151] text-lg leading-relaxed">
                Small voluntary donations cover venues, materials and sound gear, so Saturdays stay free for everyone.
              </p>
              <Link href="/donate" className="group mt-auto inline-flex items-center gap-2 font-semibold text-[#1A1A1A] w-fit border-b-2 border-[#F47B20] pb-1">
                Donate via QRIS <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
              </Link>
            </Reveal>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
