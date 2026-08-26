import Image from "next/image";

export default function Footer() {
  return (
    <footer className="bg-white border-t border-[#EDE5D8] mt-auto">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <Image
              src="/images/logo.png"
              alt="English Club Jogja"
              width={120}
              height={35}
              className="h-8 w-auto"
            />
          </div>

          {/* Tagline */}
          <p className="text-sm text-[#6B7280] text-center">
            Every Saturday Night, 7 PM — Practice English, make friends, have a
            blast.
          </p>

          {/* Social */}
          <div className="flex items-center gap-4">
            <a
              href="https://instagram.com/englishclubjogja"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#6B7280] hover:text-[#F47B20] text-sm"
            >
              @englishclubjogja
            </a>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-[#EDE5D8] text-center">
          <p className="text-xs text-[#9CA3AF]">
            &copy; {new Date().getFullYear()} English Club Jogja. Made with
            &hearts; in Yogyakarta.
          </p>
        </div>
      </div>
    </footer>
  );
}
