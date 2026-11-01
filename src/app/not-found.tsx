import Link from "next/link";
import { ArrowRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-10 py-24 flex flex-col gap-6">
        <p className="eyebrow text-[#B4570F]">Error 404</p>
        <h1 className="word-rise font-display font-extrabold text-[clamp(3rem,9vw,8rem)] leading-[0.88] text-[#1A1A1A]">
          <span>Lost</span> <span style={{ animationDelay: "80ms" }}>in</span>{" "}
          <span className="text-[#F47B20]" style={{ animationDelay: "160ms" }}>translation?</span>
        </h1>
        <p className="text-xl text-[#374151] max-w-xl">
          This page doesn&apos;t exist. Happens to the best of us. Let&apos;s get you back to the conversation.
        </p>
        <div className="flex flex-wrap gap-3 mt-2">
          <Link
            href="/"
            className="group inline-flex items-center gap-2 px-6 py-3.5 bg-[#F47B20] hover:bg-[#1A1A1A] hover:text-[#F5F0E8] text-[#1A1A1A] font-semibold rounded-md transition-colors"
          >
            Back to this Saturday <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
          </Link>
          <Link href="/saturdays" className="inline-flex items-center px-6 py-3.5 border-2 border-[#1A1A1A] text-[#1A1A1A] font-semibold rounded-md hover:bg-white">
            Past Saturdays
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
