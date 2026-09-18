import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Heart, ArrowRight, Sparkles, Coffee, Users } from "lucide-react";
import { WHATSAPP_GROUP_URL } from "@/lib/constants";

export const metadata = {
  title: "Donate — English Club Jogja",
  description:
    "Support English Club Jogja! Your donation keeps our free Saturday night English sessions running.",
};

export default function DonatePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <section className="relative overflow-hidden">
          <div className="absolute top-20 left-10 w-72 h-72 bg-[#F47B20]/5 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-[#3B7DD8]/5 rounded-full blur-3xl" />
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage:
                "radial-gradient(circle, #1A1A1A 1px, transparent 1px)",
              backgroundSize: "24px 24px",
            }}
          />

          <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-16 pb-20">
            <div className="text-center animate-fadeIn">
              <div className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#FCE7F3] border border-[#EC4899]/20 text-[#DB2777] text-sm font-medium mb-8">
                <Heart size={16} className="fill-current" />
                <span>Fuelled by kindness</span>
              </div>

              <h1 className="text-4xl sm:text-5xl font-bold text-[#1A1A1A] leading-tight mb-6">
                Support English Club <span className="text-[#F47B20]">Jogja</span>{" "}
                <span className="inline-block text-3xl sm:text-4xl align-middle">💛</span>
              </h1>

              <p className="text-lg text-[#374151] max-w-xl mx-auto mb-4 leading-relaxed">
                Every Saturday night, we gather to practice English, meet new
                people, and build confidence — <strong>100% free for everyone, always.</strong>
              </p>
              <p className="text-base text-[#6B7280] max-w-xl mx-auto mb-10 leading-relaxed">
                To keep it that way, we rely on small voluntary contributions
                from people like you. Your donation goes directly toward our
                community operational needs: venue arrangements, printed
                materials, sound equipment, and the little things that make
                each meetup warm and welcoming.
              </p>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-lg border border-[#EDE5D8] text-center animate-slideUp">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#ECFDF5] border border-[#A7F3D0] text-[#059669] text-sm font-medium mb-4">
                <Sparkles size={16} />
                <span>Every contribution counts — no amount is too small</span>
              </div>
              <h2 className="text-2xl font-bold text-[#1A1A1A] mb-2">
                Scan to donate via QRIS
              </h2>
              <p className="text-sm text-[#6B7280] mb-6">
                Open your e-wallet or mobile banking app and scan the code below.
              </p>
              <Image
                src="/images/qris.jpeg"
                alt="QRIS English Club Jogja"
                width={260}
                height={260}
                className="mx-auto rounded-2xl border border-[#E5E7EB] shadow-sm"
                priority
              />
              <p className="text-xs text-[#9CA3AF] mt-4">
                QRIS — English Club Jogja
              </p>

              <div className="border-t border-[#EDE5D8] mt-8 pt-8">
                <div className="grid sm:grid-cols-2 gap-4 text-left mb-8">
                  <div className="flex items-start gap-3 p-4 rounded-2xl bg-[#FFF3EB] border border-[#F47B20]/10">
                    <Coffee size={20} className="text-[#F47B20] shrink-0 mt-0.5" />
                    <p className="text-sm text-[#374151]">
                      <strong>Venue & logistics</strong> — keeping our Saturday
                      meetups running smoothly.
                    </p>
                  </div>
                  <div className="flex items-start gap-3 p-4 rounded-2xl bg-[#EBF3FD] border border-[#3B7DD8]/10">
                    <Users size={20} className="text-[#3B7DD8] shrink-0 mt-0.5" />
                    <p className="text-sm text-[#374151]">
                      <strong>Community growth</strong> — materials, games, and
                      activities for everyone.
                    </p>
                  </div>
                </div>

                <p className="text-2xl font-bold text-[#1A1A1A] mb-2">
                  Thank you so much! 🙏
                </p>
                <p className="text-[#6B7280] mb-8">
                  Seriously — your generosity keeps this community alive. Whether
                  you donate or simply show up with good vibes, you&apos;re part
                  of what makes English Club Jogja special.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Link
                    href="/book"
                    className="inline-flex items-center gap-2 px-8 py-4 bg-[#F47B20] hover:bg-[#D96A15] text-white font-semibold rounded-2xl shadow-lg shadow-[#F47B20]/25 hover:shadow-xl transition-all text-lg"
                  >
                    🪑 Book Your Seat
                    <ArrowRight size={20} />
                  </Link>
                  <a
                    href={WHATSAPP_GROUP_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-8 py-4 bg-[#25D366] hover:bg-[#1DA851] text-white font-semibold rounded-2xl shadow-lg shadow-[#25D366]/25 hover:shadow-xl transition-all text-lg"
                  >
                    <span className="text-base">💬</span> Join Our Group
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
