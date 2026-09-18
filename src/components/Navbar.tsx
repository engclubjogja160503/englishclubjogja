"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Menu, X, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function Navbar() {
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<{ email: string } | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUser({ email: data.user.email || "" });
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ? { email: session.user.email || "" } : null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    setLoggingOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    setMobileOpen(false);
    setLoggingOut(false);
    router.push("/");
  };

  const navItems = user
    ? [
        { href: "/", label: "Home" },
        { href: "/profile", label: "Profile" },
        { href: "/book", label: "Book Seat" },
        { href: "/cancel", label: "Cancel Booking" },
        { href: "/donate", label: "Donate" },
      ]
    : [
        { href: "/", label: "Home" },
        { href: "/login", label: "Sign In" },
        { href: "/book", label: "Book Seat" },
        { href: "/cancel", label: "Cancel Booking" },
        { href: "/donate", label: "Donate" },
      ];

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
            {navItems.map((item) => (
              <NavLink key={item.href} href={item.href}>
                {item.label}
              </NavLink>
            ))}
            {user && (
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-[#DC2626] hover:bg-[#FEF2F2] transition-colors disabled:opacity-50"
              >
                <LogOut size={16} />
                Logout
              </button>
            )}
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
            {navItems.map((item) => (
              <NavLink
                key={item.href}
                href={item.href}
                mobile
                onClick={() => setMobileOpen(false)}
              >
                {item.label}
              </NavLink>
            ))}
            {user && (
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className="w-full flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-[#DC2626] hover:bg-[#FEF2F2] transition-colors disabled:opacity-50"
              >
                <LogOut size={16} />
                {loggingOut ? "Logging out..." : "Logout"}
              </button>
            )}
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
