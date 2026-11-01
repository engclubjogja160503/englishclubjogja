import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PastSaturdays from "@/components/PastSaturdays";
import micCircle from "@/assets/photos/mic-circle.jpg";

export const metadata = {
  title: "Past Saturdays",
  description:
    "Every topic English Club Jogja has talked about, one Saturday at a time.",
};

export default function SaturdaysPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-10 pt-14 lg:pt-20 pb-10 grid lg:grid-cols-12 gap-10 items-end">
          <div className="lg:col-span-7 flex flex-col gap-5">
            <p className="eyebrow text-[#B4570F]">The archive</p>
            <h1 className="word-rise font-display font-extrabold text-[clamp(3rem,8vw,7rem)] leading-[0.88] text-[#1A1A1A]">
              <span>Past</span> <span style={{ animationDelay: "90ms" }}>Saturdays.</span>
            </h1>
            <p className="text-lg text-[#374151] max-w-xl leading-relaxed">
              Every week has its own topic. Here&apos;s what we&apos;ve talked about so far, newest first.
            </p>
            <Link
              href="/book"
              className="group mt-2 inline-flex items-center gap-2 px-6 py-3.5 bg-[#F47B20] hover:bg-[#1A1A1A] hover:text-[#F5F0E8] text-[#1A1A1A] font-semibold rounded-md w-fit transition-colors"
            >
              Join the next one <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
          <div className="lg:col-span-5 relative aspect-[4/3] overflow-hidden rounded-sm rotate-1 border-2 border-[#1A1A1A]">
            <Image
              src={micCircle}
              alt="Members gathered in a circle, laughing, one holding a microphone"
              fill
              preload
              placeholder="blur"
              sizes="(min-width: 1024px) 40vw, 100vw"
              className="object-cover"
            />
          </div>
        </section>

        <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-10 pb-24">
          <PastSaturdays variant="list" limit={40} />
        </section>
      </main>
      <Footer />
    </div>
  );
}
