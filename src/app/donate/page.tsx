import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { WHATSAPP_GROUP_URL } from "@/lib/constants";

export const metadata = {
  title: "Donate",
  description:
    "Support English Club Jogja! Your donation keeps our free Saturday night English sessions running.",
};

const USES = [
  { title: "Venue & logistics", text: "Keeping our Saturday meetups running smoothly." },
  { title: "Materials & games", text: "Printed prompts, games and activities for every table." },
  { title: "Sound equipment", text: "So everyone can hear the person holding the mic." },
];

export default function DonatePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-10 pt-14 lg:pt-20 pb-20 grid lg:grid-cols-12 gap-x-14 gap-y-12">
          <div className="lg:col-span-7 flex flex-col gap-6">
            <p className="eyebrow text-[#B4570F]">Fuelled by kindness</p>
            <h1 className="word-rise font-display font-extrabold text-[clamp(2.8rem,7vw,6rem)] leading-[0.9] text-[#1A1A1A]">
              <span>Help</span> <span style={{ animationDelay: "80ms" }}>keep</span>{" "}
              <span style={{ animationDelay: "160ms" }}>Saturdays</span>{" "}
              <span className="text-[#F47B20]" style={{ animationDelay: "240ms" }}>free.</span>
            </h1>
            <p className="text-xl text-[#374151] leading-relaxed max-w-2xl">
              Every Saturday night, we gather to practise English, meet new people, and build confidence. It&apos;s <strong className="text-[#1A1A1A]">100% free for everyone, always.</strong>
            </p>
            <p className="text-lg text-[#6B7280] leading-relaxed max-w-2xl">
              To keep it that way, we rely on small voluntary contributions from people like you. Your donation goes directly toward the community&apos;s running costs and the little things that make each meetup warm and welcoming.
            </p>

            <ul className="mt-4 border-t-2 border-[#1A1A1A]">
              {USES.map((u) => (
                <li key={u.title} className="grid sm:grid-cols-[14rem_1fr] gap-1 sm:gap-6 py-4 border-b border-[#1A1A1A]/15">
                  <span className="font-display font-bold text-xl text-[#1A1A1A]">{u.title}</span>
                  <span className="text-[#374151]">{u.text}</span>
                </li>
              ))}
            </ul>

            <p className="text-[#374151] mt-2">
              Whether you donate or simply show up with good vibes, you&apos;re part of what makes English Club Jogja special. Thank you.
            </p>
          </div>

          <aside className="lg:col-span-5">
            <div className="lg:sticky lg:top-28 bg-white border-2 border-[#1A1A1A] rounded-md p-6 sm:p-8 flex flex-col items-center text-center gap-4">
              <p className="eyebrow text-[#1A1A1A]">Scan to donate via QRIS</p>
              <Image
                src="/images/qris.jpeg"
                alt="QRIS code for donating to English Club Jogja"
                width={300}
                height={423}
                className="w-full max-w-[300px] h-auto rounded-sm"
                preload
              />
              <p className="text-sm text-[#6B7280]">
                Open your e-wallet or mobile banking app and scan the code. No amount is too small.
              </p>
            </div>
          </aside>
        </section>

        <section className="bg-[#1A1A1A] text-[#F5F0E8]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-14 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <p className="font-display font-extrabold text-[clamp(1.8rem,3.6vw,3rem)] leading-[0.95] max-w-xl">
              The best way to support us? <span className="text-[#F47B20]">Show up.</span>
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/book"
                className="group inline-flex items-center gap-2 px-6 py-3.5 bg-[#F47B20] hover:bg-[#F5F0E8] text-[#1A1A1A] font-semibold rounded-md transition-colors"
              >
                Save a seat <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
              </Link>
              <a
                href={WHATSAPP_GROUP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3.5 border-2 border-[#F5F0E8]/70 hover:border-[#F5F0E8] text-[#F5F0E8] font-semibold rounded-md"
              >
                Join the WhatsApp group <ArrowUpRight size={18} />
              </a>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
