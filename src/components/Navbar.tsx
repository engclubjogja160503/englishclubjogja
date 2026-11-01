"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X, LogOut, ArrowUpRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { WHATSAPP_GROUP_URL } from "@/lib/constants";

const MAIN_LINKS = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/about#collaborate", label: "Collaborate" },
  { href: "/donate", label: "Donate" },
];

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
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

  // Lock page scroll while the full-screen mobile menu is open.
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const handleLogout = async () => {
    setLoggingOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    setMobileOpen(false);
    setLoggingOut(false);
    router.push("/");
  };

  const isActive = (href: string) =>
    !href.includes("#") &&
    (pathname === href || (href !== "/" && pathname.startsWith(href + "/")));

  return (
    // No backdrop-filter here: it would become the containing block for the fixed mobile menu.
    <nav className="sticky top-0 z-50 bg-[#F5F0E8] border-b-2 border-[#1A1A1A]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
        <div className="flex items-center justify-between h-16 lg:h-[72px] gap-6">
          <Link href="/" className="flex items-center shrink-0" aria-label="English Club Jogja, home">
            <Image
              src="/images/logo-wordmark.png"
              alt="English Club Jogja"
              width={648}
              height={438}
              className="h-11 lg:h-12 w-auto"
              preload
            />
          </Link>

          {/* Desktop nav */}
          <div className="hidden lg:flex items-center gap-7">
            {MAIN_LINKS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`text-[15px] font-medium hover:text-[#D96A15] underline-offset-[6px] decoration-2 ${
                  isActive(item.href) ? "text-[#1A1A1A] underline decoration-[#F47B20]" : "text-[#374151]"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>

          <div className="hidden lg:flex items-center gap-4">
            {user ? (
              <>
                <Link href="/profile" className="text-sm font-medium text-[#374151] hover:text-[#D96A15]">
                  Profile
                </Link>
                <button
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="flex items-center gap-1.5 text-sm font-medium text-[#6B7280] hover:text-[#DC2626] disabled:opacity-50"
                >
                  <LogOut size={15} />
                  {loggingOut ? "Logging out…" : "Logout"}
                </button>
              </>
            ) : (
              <Link href="/login" className="text-sm font-medium text-[#374151] hover:text-[#D96A15]">
                Sign in
              </Link>
            )}
            <Link
              href="/book"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#F47B20] hover:bg-[#1A1A1A] hover:text-[#F5F0E8] text-[#1A1A1A] font-semibold text-[15px] rounded-md transition-colors"
            >
              Save a seat
            </Link>
          </div>

          {/* Mobile toggle */}
          <div className="flex lg:hidden items-center gap-2">
            <Link
              href="/book"
              className="px-3.5 py-2 bg-[#F47B20] text-[#1A1A1A] font-semibold text-sm rounded-md"
            >
              Save a seat
            </Link>
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="p-2 -mr-2 text-[#1A1A1A]"
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X size={26} /> : <Menu size={26} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu: full screen, big type */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-x-0 top-16 bottom-0 bg-[#1A1A1A] text-[#F5F0E8] overflow-y-auto animate-fadeIn">
          <div className="px-6 pt-8 pb-12 flex flex-col gap-10 min-h-full">
            <ul className="flex flex-col gap-1">
              {MAIN_LINKS.map((item, i) => (
                <li key={item.href} className="word-rise">
                  <Link
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    style={{ animationDelay: `${i * 50}ms` }}
                    className="font-display font-bold text-[40px] leading-[1.15] tracking-tight hover:text-[#F47B20]"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>

            <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-[15px] border-t border-white/15 pt-6">
              <Link href="/book" onClick={() => setMobileOpen(false)} className="text-[#F47B20] font-semibold">Save a seat</Link>
              <Link href="/cancel" onClick={() => setMobileOpen(false)} className="text-[#F5F0E8]/80">Cancel a booking</Link>
              <a href={WHATSAPP_GROUP_URL} target="_blank" rel="noopener noreferrer" className="text-[#F5F0E8]/80 inline-flex items-center gap-1">
                WhatsApp group <ArrowUpRight size={14} />
              </a>
              {user ? (
                <>
                  <Link href="/profile" onClick={() => setMobileOpen(false)} className="text-[#F5F0E8]/80">Profile</Link>
                  <button
                    onClick={handleLogout}
                    disabled={loggingOut}
                    className="text-left text-[#F5F0E8]/80 inline-flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <LogOut size={15} />
                    {loggingOut ? "Logging out…" : "Logout"}
                  </button>
                </>
              ) : (
                <Link href="/login" onClick={() => setMobileOpen(false)} className="text-[#F5F0E8]/80">Sign in</Link>
              )}
            </div>

            <p className="eyebrow text-[#F5F0E8]/50 mt-auto">No grades · No pressure · Just conversations</p>
          </div>
        </div>
      )}
    </nav>
  );
}
