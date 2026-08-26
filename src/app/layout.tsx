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
  openGraph: {
    title: "English Club Jogja",
    description: "Saturday Night English Practice — Free & Fun!",
    images: ["/images/logo.png"],
  },
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
