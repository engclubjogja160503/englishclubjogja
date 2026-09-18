import sharp from "sharp";
import path from "path";

const width = 1200;
const height = 630;

const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#F5F0E8"/>
      <stop offset="100%" style="stop-color:#EDE5D8"/>
    </linearGradient>
    <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#F47B20"/>
      <stop offset="100%" style="stop-color:#3B7DD8"/>
    </linearGradient>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#bg)"/>
  <circle cx="100" cy="100" r="200" fill="#F47B20" opacity="0.05"/>
  <circle cx="${width - 100}" cy="${height - 100}" r="250" fill="#3B7DD8" opacity="0.05"/>
  <circle cx="${width / 2}" cy="${height / 2}" r="300" fill="#F47B20" opacity="0.03"/>
  <pattern id="dots" width="24" height="24" patternUnits="userSpaceOnUse">
    <circle cx="12" cy="12" r="1" fill="#1A1A1A" opacity="0.06"/>
  </pattern>
  <rect width="${width}" height="${height}" fill="url(#dots)"/>
  <rect x="0" y="0" width="${width}" height="6" fill="url(#accent)"/>
  <text x="${width / 2}" y="270" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="72" font-weight="800" fill="#1A1A1A">English Club</text>
  <text x="${width / 2}" y="350" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="72" font-weight="800" fill="#F47B20">Jogja</text>
  <text x="${width / 2}" y="410" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="28" fill="#6B7280">Saturday Night English Practice</text>
  <rect x="${width / 2 - 150}" y="440" width="300" height="40" rx="20" fill="#EBF3FD" stroke="#3B7DD8" stroke-width="1" opacity="0.8"/>
  <text x="${width / 2}" y="466" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="16" font-weight="600" fill="#3B7DD8">100% Free - No tickets needed</text>
  <text x="${width / 2}" y="${height - 60}" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="20" fill="#9CA3AF">english-club-jogja.vercel.app</text>
  <rect x="0" y="${height - 6}" width="${width}" height="6" fill="url(#accent)"/>
</svg>`;

const base = await sharp(Buffer.from(svg)).png().toBuffer();

const logoOverlay = await sharp("public/images/logo.png")
  .resize(160, 160, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .png()
  .toBuffer();

await sharp(base)
  .composite([{
    input: logoOverlay,
    left: Math.floor((width - 160) / 2),
    top: 40,
    blend: "over",
  }])
  .png()
  .toFile("public/images/og-image.png");

console.log("OG image created: public/images/og-image.png");
