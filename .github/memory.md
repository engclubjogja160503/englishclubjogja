# English Club Jogja — Project Memory

## Deployment
- Vercel project: `english-club-jogja` under `engclubjogja-1888` account
- URL: `english-club-jogja-psi.vercel.app`
- Env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_GOOGLE_SHEETS_WEBHOOK_URL`

## Supabase
- Project: `hsajzodlipnkunotndlq`
- Google Apps Script: `https://script.google.com/macros/s/AKfycbyQdG3_CoIVLId0tc1UE0oWioZp3oxhHLzIFWwUidOh1zJwv5-kaDUidFBd5HqxUCCO/exec`
- Spreadsheet: `https://docs.google.com/spreadsheets/d/1gn8ZimoFYaeqEy9nYrdImEuI5hFJopL_Cl0WdblDqns/edit`

## Migrations (All Complete ✅)
1. ✅ `fix-rls-guest-and-public-view.sql` — Run 2026-08-28, public read for confirmed bookings + profiles
2. ✅ Email confirmation — Already OFF (no action needed)

## Current TODO
- Admin CRUD for events (currently just dashboard view, no add/edit/delete)
- Admin can set new active event for next Saturday

## Lessons Learned
- **NEVER** use PowerShell here-strings (`@"..."@`) for code files — destroys `${}` template literals
- Use `replace_string_in_file` or `create_file` for all code edits
- Guest bookings must have `user_id: null` — RLS allows insert when `user_id IS NULL`
- Profile upsert with `id: user.id` creates profile if missing (needed for member bookings)
- Supabase SQL Editor requires GitHub login — user must log in first before agent can run SQL
