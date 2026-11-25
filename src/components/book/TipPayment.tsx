"use client";

import Image from "next/image";
import { useEffect, useRef, type Dispatch, type SetStateAction } from "react";
import { Check, Download, ImageUp, Loader2, ScanLine } from "lucide-react";
import { MIN_TIP, RECOMMENDED_TIP, detectTipAmount, formatRupiah, prepareProof, warmUpOcr } from "@/lib/tip-proof";

export interface TipState {
  image: Blob | null;
  preview: string;
  /** what the person confirms, as typed (digits only) */
  amount: string;
  /** what the site read off the screenshot */
  detected: number | null;
  reading: boolean;
}

export const emptyTip: TipState = { image: null, preview: "", amount: "", detected: null, reading: false };

export const tipAmountOf = (tip: TipState) => parseInt(tip.amount || "0", 10) || 0;

/** Why the booking can't go through yet, or "" when the tip is complete. */
export function tipProblem(tip: TipState): string {
  if (!tip.image) return "Please upload your payment screenshot first.";
  if (tip.reading) return "Still reading your screenshot, one second…";
  if (tipAmountOf(tip) < MIN_TIP) return "Please fill in your tip amount.";
  return "";
}

/**
 * The tip step of a booking: QRIS to scan, a required payment screenshot,
 * and the amount, read off the screenshot automatically and editable.
 * The explanation of the tip is in English and Bahasa Indonesia; the rest is English.
 */
export default function TipPayment({
  tip,
  setTip,
  id = "tip",
}: {
  tip: TipState;
  setTip: Dispatch<SetStateAction<TipState>>;
  id?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  // the latest screenshot wins if someone picks a second one before the first is read
  const runRef = useRef(0);

  // get the reader ready while they fill in the form or scan the QRIS
  useEffect(() => {
    const t = setTimeout(() => warmUpOcr().catch(() => {}), 1200);
    return () => clearTimeout(t);
  }, []);

  const onPick = async (file: File | undefined) => {
    if (!file) return;
    const run = ++runRef.current;
    if (tip.preview) URL.revokeObjectURL(tip.preview);
    setTip({ image: null, preview: URL.createObjectURL(file), amount: "", detected: null, reading: true });
    try {
      const image = await prepareProof(file);
      if (run !== runRef.current) return;
      setTip((t) => ({ ...t, image }));
      const detected = await Promise.race([
        detectTipAmount(image),
        new Promise<null>((r) => setTimeout(() => r(null), 25000)),
      ]).catch(() => null);
      if (run !== runRef.current) return;
      setTip((t) => ({ ...t, detected, amount: detected ? String(detected) : t.amount, reading: false }));
    } catch {
      if (run !== runRef.current) return;
      setTip((t) => ({ ...t, image: null, reading: false }));
      alert("That file couldn't be opened as an image. Please choose a screenshot (JPG or PNG).");
    }
  };

  const amount = tipAmountOf(tip);
  const edited = tip.detected != null && amount > 0 && amount !== tip.detected;

  return (
    <section id={id} className="bg-[#FFF3EB] rounded-xl p-6 sm:p-8 border-2 border-[#1A1A1A] scroll-mt-24">
      <div className="text-center">
        <p className="font-mono text-[12px] uppercase tracking-[0.1em] text-[#B4570F]">One last thing</p>
        <h3 className="font-display text-2xl font-extrabold text-[#1A1A1A] mt-1">Tip to save your seat</h3>
      </div>

      <div className="mt-4 grid sm:grid-cols-2 gap-3 text-sm leading-relaxed">
        <p className="bg-white rounded-lg border-2 border-[#1A1A1A]/15 p-3 text-[#374151]">
          <span className="font-mono text-[11px] tracking-[0.1em] text-[#9CA3AF] block mb-1">EN</span>
          Every seat comes with a tip via QRIS. Any amount works, <strong className="text-[#1A1A1A]">from Rp1 up to whatever feels right</strong> for you.
          Not sure how much? We recommend <strong className="text-[#1A1A1A]">{formatRupiah(RECOMMENDED_TIP)}</strong>.
          It helps cover the venue and everything that makes Saturday happen.
        </p>
        <p className="bg-white rounded-lg border-2 border-[#1A1A1A]/15 p-3 text-[#374151]">
          <span className="font-mono text-[11px] tracking-[0.1em] text-[#9CA3AF] block mb-1">ID</span>
          Setiap kursi disertai tip lewat QRIS. Nominalnya bebas, <strong className="text-[#1A1A1A]">mulai dari Rp1, seikhlasnya</strong>.
          Bingung mau kasih berapa? Rekomendasi kami <strong className="text-[#1A1A1A]">{formatRupiah(RECOMMENDED_TIP)}</strong>.
          Tip ini bantu biaya tempat dan semua yang bikin Sabtu malam jalan.
        </p>
      </div>

      <div className="mt-5 flex flex-col items-center">
        <p className="mb-3 inline-flex items-center gap-2 rounded-full border-2 border-[#1A1A1A] bg-[#F47B20] px-4 py-1.5 text-sm font-semibold text-[#1A1A1A] shadow-[2px_2px_0_#1A1A1A]">
          Recommended tip <span className="font-display text-base font-extrabold">{formatRupiah(RECOMMENDED_TIP)}</span>
        </p>
        <Image
          src="/images/qris.jpeg"
          alt="QRIS English Club Jogja"
          width={220}
          height={220}
          className="rounded-lg border-2 border-[#1A1A1A] bg-white"
        />
        <a
          href="/images/qris.jpeg"
          download="QRIS-English-Club-Jogja.jpeg"
          className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-[#2D5FA8] underline underline-offset-4"
        >
          <Download size={15} /> Save QRIS
        </a>
        <p className="mt-1 text-xs text-[#6B7280] text-center max-w-xs">
          On your phone? Save it, then use &ldquo;scan from gallery&rdquo; in your e-wallet.
        </p>
      </div>

      <div className="mt-6">
        <label htmlFor={`${id}-file`} className="block font-mono text-[12px] uppercase tracking-[0.08em] text-[#374151] mb-1.5">
          Payment screenshot <span className="text-[#EF4444]">*</span>
        </label>
        <input
          ref={inputRef}
          id={`${id}-file`}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(e) => {
            onPick(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
        {tip.preview ? (
          <div className="flex items-center gap-4 bg-white rounded-lg border-2 border-[#1A1A1A] p-3">
            {/* eslint-disable-next-line @next/next/no-img-element -- local blob preview */}
            <img src={tip.preview} alt="Your payment screenshot" className="h-24 w-16 object-cover rounded border border-[#1A1A1A]/20" />
            <div className="flex-1 min-w-0 text-sm">
              {tip.reading ? (
                <p className="flex items-center gap-2 text-[#374151]">
                  <Loader2 size={16} className="animate-spin text-[#F47B20]" /> Reading the amount…
                </p>
              ) : tip.detected ? (
                <p className="flex items-start gap-2 text-[#047857]">
                  <ScanLine size={16} className="mt-0.5 shrink-0" />
                  <span>
                    We read <strong>{formatRupiah(tip.detected)}</strong> from your screenshot.
                  </span>
                </p>
              ) : (
                <p className="text-[#92400E]">
                  We couldn&apos;t read the amount, please type it below.
                </p>
              )}
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="mt-2 text-sm font-semibold text-[#2D5FA8] underline underline-offset-4"
              >
                Change screenshot
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="w-full flex flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-[#1A1A1A]/40 bg-white px-4 py-7 text-[#374151] hover:border-[#F47B20] hover:bg-[#FFFDF8] transition-colors"
          >
            <ImageUp size={28} className="text-[#F47B20]" />
            <span className="font-semibold">Upload your payment screenshot</span>
            <span className="text-sm text-[#6B7280]">JPG or PNG</span>
          </button>
        )}
      </div>

      <div className="mt-5">
        <label htmlFor={`${id}-amount`} className="block font-mono text-[12px] uppercase tracking-[0.08em] text-[#374151] mb-1.5">
          Tip amount <span className="text-[#EF4444]">*</span>
        </label>
        <div className="flex items-center rounded-lg border-2 border-[#1A1A1A]/20 bg-white focus-within:border-[#3B7DD8]">
          <span className="pl-4 pr-1 font-semibold text-[#374151]">Rp</span>
          <input
            id={`${id}-amount`}
            type="text"
            inputMode="numeric"
            value={tip.amount ? Number(tip.amount).toLocaleString("id-ID") : ""}
            onChange={(e) => setTip((t) => ({ ...t, amount: e.target.value.replace(/\D/g, "").slice(0, 9) }))}
            placeholder={tip.reading ? "…" : `e.g. ${RECOMMENDED_TIP.toLocaleString("id-ID")}`}
            className="w-full px-2 py-3 bg-transparent text-[#1A1A1A] placeholder-[#9CA3AF] outline-none"
          />
          {amount >= MIN_TIP && !tip.reading && <Check size={18} className="mr-3 text-[#059669]" />}
        </div>
        {edited && (
          <p className="mt-1.5 text-xs text-[#92400E]">
            Make sure this matches your screenshot.
          </p>
        )}
      </div>
    </section>
  );
}
