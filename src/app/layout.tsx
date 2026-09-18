import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "English Club Jogja — Saturday Night English Practice",
  description:
    "Join English Club Jogja every Saturday night! Practice English, meet new people, and have fun. Free events across Yogyakarta.",
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
    description: "Saturday Night English Practice — Free & Fun!",
    images: [
      {
        url: "/images/og-image.png",
        width: 1200,
        height: 630,
        alt: "English Club Jogja",
      },
    ],
    type: "website",
    siteName: "English Club Jogja",
  },
  twitter: {
    card: "summary_large_image",
    title: "English Club Jogja",
    description: "Saturday Night English Practice — Free & Fun!",
    images: ["/images/og-image.png"],
  },
  metadataBase: new URL("https://english-club-jogja-psi.vercel.app"),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#F5F0E8]">{children}</body>
    </html>
  );
}
