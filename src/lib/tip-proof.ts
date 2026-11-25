import type { Worker } from "tesseract.js";
import type { createClient } from "@/lib/supabase/client";

type Supabase = ReturnType<typeof createClient>;

/** Bookings come with a QRIS tip; this is the smallest amount we accept. */
export const MIN_TIP = 1;

export const formatRupiah = (n: number) => "Rp" + Math.round(n).toLocaleString("id-ID");

/**
 * Shrinks a payment screenshot to at most 2000 px on its long side as a JPEG,
 * so uploads stay small on mobile data while the amount is still readable.
 */
export async function prepareProof(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 2000 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Could not read the image"))), "image/jpeg", 0.85)
  );
}

// Lines that name the paid amount, and lines that carry other money we must ignore.
const AMOUNT_HINT = /total|jumlah|nominal|amount|bayar|pembayaran|payment|transfer|dibayar|paid|tagihan/i;
const NOT_THE_TIP = /saldo|balance|biaya|fee|admin|cashback|koin|coin|poin|point|limit|diskon|discount|promo/i;

/** Turns "10.000", "10.000,00", "10,000.00" or "10 000" into 10000. */
function toRupiah(raw: string): number | null {
  let s = raw.replace(/\s+/g, "");
  // drop a cents tail: ",00" or ".00"
  s = s.replace(/[.,]\d{2}$/, "");
  s = s.replace(/[.,]/g, "");
  if (!/^\d+$/.test(s)) return null;
  const n = parseInt(s, 10);
  return n >= MIN_TIP && n <= 10_000_000 ? n : null;
}

/**
 * Reads the paid amount out of an e-wallet / m-banking receipt's text.
 * Prefers amounts on lines like "Total" or "Jumlah", skips balances and fees,
 * and otherwise takes the amount that appears most often (receipts repeat it).
 */
export function parseTipAmount(text: string): number | null {
  const hinted: number[] = [];
  const all: number[] = [];
  const lines = text.split(/\r?\n/);
  lines.forEach((line, i) => {
    if (NOT_THE_TIP.test(line)) return;
    // OCR often reads "Rp" as "Ro", "RP" or "R p"
    for (const m of line.matchAll(/(?:(?<![a-z])r\s?[po](?![a-z])\.?|(?<![a-z])idr(?![a-z]))\s*:?\s*([0-9][0-9.,\s]{0,14}[0-9]|[0-9])/gi)) {
      const n = toRupiah(m[1]);
      if (n == null) continue;
      all.push(n);
      // the label is often on the line just above the amount
      if (AMOUNT_HINT.test(line) || AMOUNT_HINT.test(lines[i - 1] || "")) hinted.push(n);
    }
  });
  const pick = (list: number[]) => {
    if (!list.length) return null;
    const counts = new Map<number, number>();
    for (const n of list) counts.set(n, (counts.get(n) || 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1] || b[0] - a[0])[0][0];
  };
  return pick(hinted) ?? pick(all);
}

let ocr: Promise<Worker> | null = null;

/**
 * Starts the in-browser OCR engine (a few MB, downloaded once) so it is ready
 * by the time someone uploads their screenshot. Safe to call many times.
 */
export function warmUpOcr(): Promise<Worker> {
  if (!ocr) {
    ocr = import("tesseract.js").then(({ createWorker }) => createWorker("eng"));
    ocr.catch(() => (ocr = null));
  }
  return ocr;
}

/** Runs OCR in the browser (nothing leaves the device) and returns the amount it found, if any. */
export async function detectTipAmount(image: Blob): Promise<number | null> {
  const worker = await warmUpOcr();
  const { data } = await worker.recognize(image);
  return parseTipAmount(data.text);
}

/** Uploads the screenshot into the private payment-proofs bucket and returns its path. */
export async function uploadProof(supabase: Supabase, eventId: string, image: Blob): Promise<string> {
  const path = `${eventId}/${crypto.randomUUID()}.jpg`;
  const { error } = await supabase.storage
    .from("payment-proofs")
    .upload(path, image, { contentType: "image/jpeg", upsert: false });
  if (error) throw error;
  return path;
}
