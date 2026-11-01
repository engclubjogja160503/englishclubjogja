import type { Metadata } from "next";
import { Bricolage_Grotesque, Instrument_Sans, DM_Mono } from "next/font/google";
import "./globals.css";

// Display: chunky grotesque that echoes the logo's stacked "ENGLISH club".
const display = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  weight: ["500", "700", "800"],
});

const sans = Instrument_Sans({
  variable: "--font-body",
  subsets: ["latin"],
});

// Mono for dates, times, seat counts — the "issue masthead" voice.
const mono = DM_Mono({
  variable: "--font-code",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: {
    default: "English Club Jogja — No grades. No pressure. Just conversations.",
    template: "%s · English Club Jogja",
  },
  description:
    "A free English conversation community in Yogyakarta. Every Saturday night we pick a topic, sit in small groups, and talk. Come as you are.",
  keywords: [
    "English Club",
    "Jogja",
    "Yogyakarta",
    "English Practice",
    "Saturday Night",
    "Community",
    "Free Event",
  ],
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon-32x32.png",
    apple: "/apple-touch-icon.png",
    other: [
      { rel: "icon", type: "image/png", sizes: "16x16", url: "/favicon-16x16.png" },
      { rel: "icon", type: "image/png", sizes: "32x32", url: "/favicon-32x32.png" },
      { rel: "icon", type: "image/png", sizes: "48x48", url: "/favicon-48x48.png" },
      { rel: "icon", type: "image/png", sizes: "192x192", url: "/android-chrome-192x192.png" },
      { rel: "icon", type: "image/png", sizes: "512x512", url: "/android-chrome-512x512.png" },
    ],
  },
  openGraph: {
    title: "English Club Jogja",
    description: "No grades. No pressure. Just conversations. Every Saturday night in Yogyakarta, free.",
    images: [
      {
        url: "/images/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "English Club Jogja members on a rooftop in Yogyakarta at night",
      },
    ],
    type: "website",
    siteName: "English Club Jogja",
  },
  twitter: {
    card: "summary_large_image",
    title: "English Club Jogja",
    description: "No grades. No pressure. Just conversations.",
    images: ["/images/og-image.jpg"],
  },
  metadataBase: new URL("https://www.engclubjogja.online"),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${sans.variable} ${mono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#F5F0E8]">{children}</body>
    </html>
  );
}
