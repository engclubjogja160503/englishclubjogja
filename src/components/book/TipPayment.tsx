"use client";

import Image from "next/image";
import { useEffect, useRef, type Dispatch, type SetStateAction } from "react";
import { Check, Download, ImageUp, Loader2, ScanLine } from "lucide-react";
import { MIN_TIP, detectTipAmount, formatRupiah, prepareProof, warmUpOcr } from "@/lib/tip-proof";

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

/** Why the booking can't go through yet, in both languages, or "" when the tip is complete. */
export function tipProblem(tip: TipState): string {
  if (!tip.image) return "Please upload your payment screenshot first. · Upload dulu screenshot bukti bayarnya ya.";
  if (tip.reading) return "Still reading your screenshot, one second… · Sebentar, screenshot-nya lagi dibaca…";
  if (tipAmountOf(tip) < MIN_TIP) return "Please fill in your tip amount. · Isi nominal tipnya dulu ya.";
  return "";
}

/**
 * The tip step of a booking: QRIS to scan, a required payment screenshot,
 * and the amount, read off the screenshot automatically and editable.
 * Copy is in English and Bahasa Indonesia.
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
      alert("That file couldn't be opened as an image. Please choose a screenshot (JPG or PNG). · File-nya tidak bisa dibuka, pilih screenshot JPG atau PNG ya.");
    }
  };

  const amount = tipAmountOf(tip);
  const edited = tip.detected != null && amount > 0 && amount !== tip.detected;

  return (
    <section id={id} className="bg-[#FFF3EB] rounded-xl p-6 sm:p-8 border-2 border-[#1A1A1A] scroll-mt-24">
      <div className="text-center">
        <p className="font-mono text-[12px] uppercase tracking-[0.1em] text-[#B4570F]">One last thing · Satu langkah lagi</p>
        <h3 className="font-display text-2xl font-extrabold text-[#1A1A1A] mt-1">Tip to save your seat</h3>
        <p className="font-display text-lg font-bold text-[#D96A15] -mt-0.5">Tip untuk amankan kursimu</p>
      </div>

      <div className="mt-4 grid sm:grid-cols-2 gap-3 text-sm leading-relaxed">
        <p className="bg-white rounded-lg border-2 border-[#1A1A1A]/15 p-3 text-[#374151]">
          <span className="font-mono text-[11px] tracking-[0.1em] text-[#9CA3AF] block mb-1">EN</span>
          Every seat comes with a tip via QRIS. Any amount works, <strong className="text-[#1A1A1A]">from Rp1 up to whatever feels right</strong> for you.
          It helps cover the venue and everything that makes Saturday happen.
        </p>
        <p className="bg-white rounded-lg border-2 border-[#1A1A1A]/15 p-3 text-[#374151]">
          <span className="font-mono text-[11px] tracking-[0.1em] text-[#9CA3AF] block mb-1">ID</span>
          Setiap kursi disertai tip lewat QRIS. Nominalnya bebas, <strong className="text-[#1A1A1A]">mulai dari Rp1, seikhlasnya</strong>.
          Tip ini bantu biaya tempat dan semua yang bikin Sabtu malam jalan.
        </p>
      </div>

      <div className="mt-5 flex flex-col items-center">
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
          <Download size={15} /> Save QRIS · Simpan QRIS
        </a>
        <p className="mt-1 text-xs text-[#6B7280] text-center max-w-xs">
          On your phone? Save it, then use &ldquo;scan from gallery&rdquo; in your e-wallet. · Pakai HP? Simpan, lalu scan dari galeri di e-wallet kamu.
        </p>
      </div>

      <div className="mt-6">
        <label htmlFor={`${id}-file`} className="block font-mono text-[12px] uppercase tracking-[0.08em] text-[#374151] mb-1.5">
          Payment screenshot · Bukti bayar <span className="text-[#EF4444]">*</span>
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
                  <Loader2 size={16} className="animate-spin text-[#F47B20]" /> Reading the amount… · Membaca nominal…
                </p>
              ) : tip.detected ? (
                <p className="flex items-start gap-2 text-[#047857]">
                  <ScanLine size={16} className="mt-0.5 shrink-0" />
                  <span>
                    We read <strong>{formatRupiah(tip.detected)}</strong> from your screenshot. · Terbaca{" "}
                    <strong>{formatRupiah(tip.detected)}</strong>.
                  </span>
                </p>
              ) : (
                <p className="text-[#92400E]">
                  We couldn&apos;t read the amount, please type it below. · Nominal tidak terbaca, ketik manual di bawah ya.
                </p>
              )}
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="mt-2 text-sm font-semibold text-[#2D5FA8] underline underline-offset-4"
              >
                Change screenshot · Ganti
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
            <span className="text-sm text-[#6B7280]">Upload screenshot bukti bayar (JPG / PNG)</span>
          </button>
        )}
      </div>

      <div className="mt-5">
        <label htmlFor={`${id}-amount`} className="block font-mono text-[12px] uppercase tracking-[0.08em] text-[#374151] mb-1.5">
          Tip amount · Nominal tip <span className="text-[#EF4444]">*</span>
        </label>
        <div className="flex items-center rounded-lg border-2 border-[#1A1A1A]/20 bg-white focus-within:border-[#3B7DD8]">
          <span className="pl-4 pr-1 font-semibold text-[#374151]">Rp</span>
          <input
            id={`${id}-amount`}
            type="text"
            inputMode="numeric"
            value={tip.amount ? Number(tip.amount).toLocaleString("id-ID") : ""}
            onChange={(e) => setTip((t) => ({ ...t, amount: e.target.value.replace(/\D/g, "").slice(0, 9) }))}
            placeholder={tip.reading ? "…" : "e.g. 10.000"}
            className="w-full px-2 py-3 bg-transparent text-[#1A1A1A] placeholder-[#9CA3AF] outline-none"
          />
          {amount >= MIN_TIP && !tip.reading && <Check size={18} className="mr-3 text-[#059669]" />}
        </div>
        {edited && (
          <p className="mt-1.5 text-xs text-[#92400E]">
            Make sure this matches your screenshot. · Pastikan sama dengan screenshot ya.
          </p>
        )}
      </div>
    </section>
  );
}
