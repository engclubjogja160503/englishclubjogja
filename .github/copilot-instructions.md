---
description: "English Club Jogja - Project coding standards and conventions. Apply to **/*.ts, **/*.tsx, **/*.css"
applyTo: "**/*.{ts,tsx,css}"
---

# English Club Jogja — Coding Conventions

## Tech Stack
- **Framework**: Next.js 16.3.3 (App Router, `"use client"` pages)
- **UI**: Tailwind CSS v4 + Lucide React icons
- **Auth/DB**: Supabase (browser client via `@lib/supabase/client`, server via `@lib/supabase/server`)
- **Deploy**: Vercel
- **Language**: TypeScript, React 19

## Color Palette
- Orange: `#F47B20` / Dark: `#D96A15` / Light: `#FFF3EB`
- Blue: `#3B7DD8` / Dark: `#2D5FA8` / Light: `#EBF3FD`
- Cream bg: `#F5F0E8`, Cream border: `#EDE5D8`
- Text: `#1A1A1A` (heading), `#374151` (body), `#6B7280` (muted), `#9CA3AF` (placeholder)
- Success: `#22C55E`, Error: `#DC2626`/`#EF4444`

## Design Tokens
- Cards: `rounded-3xl p-6 sm:p-8 shadow-lg border border-[#EDE5D8] bg-white`
- Buttons primary: `bg-[#F47B20] hover:bg-[#D96A15] text-white font-semibold rounded-xl`
- Buttons secondary: `bg-white hover:bg-[#F3F4F6] text-[#374151] border border-[#E5E7EB] rounded-xl`
- Inputs: `px-4 py-3 rounded-xl border border-[#E5E7EB] bg-white text-[#1A1A1A]`
- Error: `p-3 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626]`
- Success: `p-3 rounded-xl bg-[#ECFDF5] text-[#059669]`
- Animations: `animate-fadeIn`, `animate-slideUp`

## File Structure
```
src/
  app/
    page.tsx          # Homepage (event card, attendee bubbles)
    book/page.tsx     # Booking flow (choose → confirm/form → success)
    cancel/page.tsx   # Cancel booking (member self-cancel + guest lookup by email/phone)
    login/page.tsx    # Member login
    register/page.tsx # Member registration (full profile)
    profile/page.tsx  # Member profile edit + avatar crop
    admin/page.tsx    # Admin dashboard
    layout.tsx        # Root layout with Geist fonts
    globals.css       # Tailwind + CSS custom properties
  components/
    Navbar.tsx        # Auth-conditional: Sign In or Profile + Logout
    Footer.tsx        # Simple footer with Instagram link
  lib/
    constants.ts      # Colors, occupation/domicile/interest/expectation options
    supabase/
      client.ts       # Browser client (createBrowserClient)
      server.ts       # Server client (createServerClient with cookies)
  middleware.ts       # Auth check, protects /admin
supabase/
  schema.sql                              # Base schema
  security-and-profile-migration.sql      # RLS, avatar_url, storage, RPC
  fix-rls-guest-and-public-view.sql       # Fix: public read for confirmed bookings + profiles
```

## Database (Supabase)
- **profiles**: id (uuid FK auth.users), email, username, full_name, phone, occupation, domicile, instagram, interests[], expectations[], expectation_other, is_member, avatar_url
- **events**: id, event_date, venue_name, venue_address, max_participants, description, is_active
- **bookings**: id, event_id, user_id (nullable for guests), guest_name, guest_phone, guest_email, status, cancellation_reason, is_member
- **RLS policies**: profiles read by owner only, bookings read by owner only, events active only
- **RPC**: `cancel_guest_booking(booking_id, verification, reason)` — security definer
- **Storage**: `avatars` bucket, public, folder per user ID

## Booking Flow
1. Choose: Member vs Guest
2. Member → login popup → confirm (one click)
3. Guest → fill form → submit
4. Both → sync to Google Sheets webhook

## Admin Flow
- `/admin` page, protected by middleware
- Manages events, views bookings
- Add/edit/delete events (is_active toggle)

## Critical Rules
- **NEVER use PowerShell `Set-Content` with here-strings for code files** — destroys `${}` template literals
- Always use file editing tools (replace_string_in_file, create_file) for code changes
- Guest bookings use `user_id: null` with `guest_name/guest_phone/guest_email`
- Member bookings use `user_id` set to auth.uid()
- Profile auto-created via upsert before booking if missing
