"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Menu, X } from "lucide-react";

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-[#EDE5D8]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/images/logo.png"
              alt="English Club Jogja"
              width={140}
              height={40}
              className="h-10 w-auto"
              priority
            />
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            <NavLink href="/">Home</NavLink>
            <NavLink href="/book">Book a Seat</NavLink>
            <NavLink href="/cancel">Cancel Booking</NavLink>
          </div>

          {/* Mobile toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-[#FFF3EB] text-[#1A1A1A]"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden pb-4 animate-fadeIn">
            <NavLink href="/" mobile onClick={() => setMobileOpen(false)}>
              Home
            </NavLink>
            <NavLink href="/book" mobile onClick={() => setMobileOpen(false)}>
              Book a Seat
            </NavLink>
            <NavLink
              href="/cancel"
              mobile
              onClick={() => setMobileOpen(false)}
            >
              Cancel Booking
            </NavLink>
          </div>
        )}
      </div>
    </nav>
  );
}

function NavLink({
  href,
  children,
  mobile,
  onClick,
}: {
  href: string;
  children: React.ReactNode;
  mobile?: boolean;
  onClick?: () => void;
}) {
  if (mobile) {
    return (
      <Link
        href={href}
        onClick={onClick}
        className="block px-4 py-2 rounded-lg text-sm font-medium text-[#374151] hover:bg-[#FFF3EB] hover:text-[#F47B20]"
      >
        {children}
      </Link>
    );
  }
  return (
    <Link
      href={href}
      className="px-4 py-2 rounded-lg text-sm font-medium text-[#374151] hover:bg-[#FFF3EB] hover:text-[#F47B20]"
    >
      {children}
    </Link>
  );
}
