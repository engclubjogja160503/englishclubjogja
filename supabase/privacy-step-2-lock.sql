-- ============================================================
-- Privacy fix, STEP 2 of 2 — locks the tables down.
-- Run ONLY AFTER privacy-step-1-add.sql has been run AND the matching
-- code (public_profiles / public_bookings / RPCs) is live on the site.
-- Running it earlier breaks guest booking, cancel lookup and the
-- "Going" faces on the old code.
-- Safe to re-run.
-- ============================================================

-- PROFILES: you see your own row; admins see everyone.
-- Everyone else reads names/avatars through public_profiles.
drop policy if exists "Anyone can view profiles" on profiles;
drop policy if exists "Public profiles are viewable by everyone" on profiles;
drop policy if exists "Members can view their own profile" on profiles;
create policy "Members can view their own profile"
  on profiles for select
  using (auth.uid() = id or public.is_admin());

drop policy if exists "Members can update their own profile" on profiles;
drop policy if exists "Users can update their own profile" on profiles;
create policy "Members can update their own profile"
  on profiles for update
  using (auth.uid() = id or public.is_admin())
  with check (auth.uid() = id or public.is_admin());

-- BOOKINGS: you see your own member bookings; admins see everything.
-- Public counts and attendee names come from public_bookings.
drop policy if exists "Anyone can view confirmed bookings" on bookings;
drop policy if exists "Confirmed bookings are viewable by everyone" on bookings;
drop policy if exists "Members can view their own bookings" on bookings;
create policy "Members can view their own bookings"
  on bookings for select
  using (auth.uid() = user_id or public.is_admin());

-- Guests book through create_guest_booking(); direct inserts are members only.
drop policy if exists "Users can create bookings" on bookings;
drop policy if exists "Anyone can create guest bookings" on bookings;
create policy "Members can create their own bookings"
  on bookings for insert
  with check (auth.uid() = user_id or public.is_admin());

-- Guests cancel through cancel_guest_booking(); nobody can edit guest rows directly.
drop policy if exists "Users can update their own bookings" on bookings;
drop policy if exists "Guests can cancel with booking id" on bookings;
drop policy if exists "Members can update their own bookings" on bookings;
create policy "Members can update their own bookings"
  on bookings for update
  using (auth.uid() = user_id or public.is_admin())
  with check (auth.uid() = user_id or public.is_admin());

drop policy if exists "Admins can delete bookings" on bookings;
create policy "Admins can delete bookings"
  on bookings for delete
  using (public.is_admin());
