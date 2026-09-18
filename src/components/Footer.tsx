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
          <p className="text-sm text-[#374151] font-medium text-center">
            No grades, no pressure, just conversation. 🗣️
          </p>

          {/* Social */}
          <div className="flex items-center gap-4">
            <a
              href="https://instagram.com/engclubjogja"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-[#6B7280] hover:text-[#E1306C] transition-colors text-sm"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-4 h-4"
              >
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
              </svg>
              @engclubjogja
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
