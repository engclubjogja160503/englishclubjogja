# English Club Jogja — Agent Instructions

> This file tells the AI agent everything it needs to know about this project.
> Keep it updated whenever the architecture or conventions change.

## Identity

- **Project**: English Club Jogja — a free weekly English practice community in Yogyakarta
- **Users**: Members (registered) and Guests (walk-in)
- **Purpose**: Event booking, member management, admin dashboard

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16.3.3 (App Router, `"use client"` pages) |
| Language | TypeScript, React 19 |
| Styling | Tailwind CSS v4 + Lucide React icons |
| Auth/DB | Supabase (browser: `@lib/supabase/client`, server: `@lib/supabase/server`) |
| Deploy | Vercel (`english-club-jogja-psi.vercel.app`) |
| Sheets | Google Apps Script webhook → Google Spreadsheet |

## File Structure

```
src/
  app/
    page.tsx              # Homepage — event card, booking count, attendee bubbles
    book/page.tsx         # Booking flow — choose → login/confirm/form → success
    cancel/page.tsx       # Cancel — member self-cancel (dropdown), guest lookup by email/phone
    login/page.tsx        # Member login
    register/page.tsx     # Member registration (full profile form)
    profile/page.tsx      # Profile edit + circular avatar crop + upload
    admin/page.tsx        # Admin dashboard (event management, booking list)
    layout.tsx            # Root layout (Geist fonts)
    globals.css           # Tailwind + CSS custom properties
  components/
    Navbar.tsx            # Auth-conditional: Sign In/Profile + Logout
    Footer.tsx            # Simple footer with Instagram link
  lib/
    constants.ts          # Colors, occupation/domicile/interest/expectation options
    supabase/
      client.ts           # Browser client (createBrowserClient)
      server.ts           # Server client (createServerClient with cookies)
  middleware.ts           # Auth check, protects /admin
supabase/
  schema.sql                              # Base schema
  security-and-profile-migration.sql      # RLS, avatar_url, storage, RPC
  fix-rls-guest-and-public-view.sql       # Public read for confirmed bookings + profiles
```

## Color Palette

| Token | Hex | Usage |
|-------|-----|-------|
| Orange | `#F47B20` | Primary CTAs, active states |
| Orange Dark | `#D96A15` | Hover states |
| Orange Light | `#FFF3EB` | Backgrounds, badges |
| Blue | `#3B7DD8` | Guest/secondary actions |
| Cream | `#F5F0E8` | Page background |
| Cream Border | `#EDE5D8` | Card borders |
| Text | `#1A1A1A` | Headings |
| Body | `#374151` | Body text |
| Muted | `#6B7280` | Secondary text |
| Placeholder | `#9CA3AF` | Input placeholders |
| Success | `#22C55E` | Success messages |
| Error | `#DC2626` / `#EF4444` | Error messages |

## Design Tokens (Copy-Paste Ready)

```
Cards:              rounded-3xl p-6 sm:p-8 shadow-lg border border-[#EDE5D8] bg-white
Button primary:     bg-[#F47B20] hover:bg-[#D96A15] text-white font-semibold rounded-xl
Button secondary:   bg-white hover:bg-[#F3F4F6] text-[#374151] border border-[#E5E7EB] rounded-xl
Input:              px-4 py-3 rounded-xl border border-[#E5E7EB] bg-white text-[#1A1A1A]
Error banner:       p-3 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626]
Success banner:     p-3 rounded-xl bg-[#ECFDF5] text-[#059669]
Animations:         animate-fadeIn, animate-slideUp
```

## Database Schema

### profiles
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | FK → auth.users, primary key |
| email | text | unique |
| username | text | unique |
| full_name | text | |
| phone | text | |
| occupation | text | 'Worker' / 'Student' / 'General' |
| domicile | text | From DOMICILE_OPTIONS |
| instagram | text | nullable |
| interests | text[] | Array of INTEREST_OPTIONS |
| expectations | text[] | Array of EXPECTATION_OPTIONS |
| expectation_other | text | Free text |
| is_member | boolean | default true |
| avatar_url | text | Storage path or signed URL |

### events
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key |
| event_date | date | |
| venue_name | text | |
| venue_address | text | nullable |
| max_participants | integer | default 40 |
| description | text | |
| is_active | boolean | Only one active at a time |

### bookings
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key |
| event_id | uuid | FK → events |
| user_id | uuid | FK → profiles, nullable (null = guest) |
| guest_name | text | For guest bookings |
| guest_phone | text | For guest bookings |
| guest_email | text | For guest bookings |
| status | text | 'confirmed' / 'cancelled' |
| cancellation_reason | text | |
| is_member | boolean | |

## RLS Policies

- **profiles**: Public read (anyone can view), insert/update by owner only
- **bookings**: Public read (anyone can view confirmed), insert when `user_id IS NULL` or `auth.uid() = user_id`, update by owner
- **events**: Read when `is_active = true`
- **Storage avatars**: Folder per user ID, public bucket

## Booking Flow

```
1. User visits /book
2. Choose: Member → login popup → one-click confirm
           Guest → fill form → submit
3. Booking created with status "confirmed"
4. Synced to Google Sheets via webhook
5. Profile auto-upserted (upsert on profiles table with user.id)
```

## Cancel Flow

```
Member: Logged in → dropdown shows their bookings → select → cancel
Guest:  Enter email/phone → system looks up booking → select → cancel
        (No booking ID needed anymore!)
```

## Key Business Rules

1. **Guest bookings**: `user_id: null`, guest info in `guest_name/guest_phone/guest_email`
2. **Member bookings**: `user_id` set to `auth.uid()`
3. **One booking per member per event**: Check for existing/cancelled booking before insert
4. **Cancelled booking restore**: If member had a cancelled booking, update status back to "confirmed"
5. **Profile auto-create**: Upsert profile before booking if missing
6. **Admin protection**: `/admin` route protected by middleware (requires auth)

## RPC Functions

- `cancel_guest_booking(booking_id, verification, reason)` — Security definer function for guest self-cancel. Verification = email or phone.

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=https://hsajzodlipnkunotndlq.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_GOOGLE_SHEETS_WEBHOOK_URL=https://script.google.com/macros/s/.../exec
```

## Deployment

- **Platform**: Vercel
- **Project**: `english-club-jogja`
- **Account**: `engclubjogja-1888`
- **URL**: `english-club-jogja-psi.vercel.app`

## Critical Warnings

- **NEVER** use PowerShell `Set-Content` with here-strings (`@"..."@`) for code files — it destroys `${}` template literals. Always use file editing tools (`replace_string_in_file`, `create_file`).
- When editing existing files, always read the current content first — the file may have been changed by formatter or user.
- Prefer `replace_string_in_file` over `insert_edit_into_file` for edits — it's faster and more precise.
