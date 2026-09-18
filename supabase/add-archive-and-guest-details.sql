-- ============================================
-- English Club Jogja — Archive + Guest details + Public attendee view
-- Run this ONCE in Supabase SQL Editor (safe to re-run).
-- ============================================

-- 1. Archive flag on events (archived events stay in DB but hide
--    from the homepage & booking page)
alter table events add column if not exists is_archived boolean default false;
create index if not exists idx_events_archived on events(is_archived);

-- 2. Guest demographics on bookings.
--    Guest bookings have no profile row, so age/MBTI/etc. must live
--    on the booking itself for the admin panel to display them.
alter table bookings add column if not exists guest_age_range text;
alter table bookings add column if not exists guest_mbti text;
alter table bookings add column if not exists guest_occupation text;
alter table bookings add column if not exists guest_domicile text;
alter table bookings add column if not exists guest_instagram text;

-- 3. Public attendee view (for the "Going" pill + attendees page).
--    Anyone (incl. logged-out visitors) can read CONFIRMED bookings
--    and basic profile info (name/username/avatar only via anon select).
drop policy if exists "Members can view their own bookings" on bookings;
drop policy if exists "Anyone can view confirmed bookings" on bookings;
create policy "Anyone can view confirmed bookings"
  on bookings for select
  using (status = 'confirmed');

drop policy if exists "Members can view their own profile" on profiles;
drop policy if exists "Anyone can view profiles" on profiles;
create policy "Anyone can view profiles"
  on profiles for select
  using (true);

-- 4. Keep member self-service + admin powers working.
drop policy if exists "Members can update their own bookings" on bookings;
create policy "Members can update their own bookings"
  on bookings for update
  using (
    auth.uid() = user_id
    or user_id is null
    or exists (
      select 1 from profiles
      where id = auth.uid() and is_admin = true
    )
  )
  with check (
    auth.uid() = user_id
    or user_id is null
    or exists (
      select 1 from profiles
      where id = auth.uid() and is_admin = true
    )
  );

drop policy if exists "Admins can delete bookings" on bookings;
create policy "Admins can delete bookings"
  on bookings for delete
  using (
    auth.uid() = user_id
    or user_id is null
    or exists (
      select 1 from profiles
      where id = auth.uid() and is_admin = true
    )
  );

drop policy if exists "Members can update their own profile" on profiles;
create policy "Members can update their own profile"
  on profiles for update
  using (
    auth.uid() = id
    or exists (
      select 1 from profiles
      where id = auth.uid() and is_admin = true
    )
  )
  with check (
    auth.uid() = id
    or exists (
      select 1 from profiles
      where id = auth.uid() and is_admin = true
    )
  );

-- 5. Admins can archive/unarchive events; everyone can read events
--    (the app filters is_active / is_archived client-side).
drop policy if exists "Active events are viewable by everyone" on events;
drop policy if exists "Anyone can view events" on events;
create policy "Anyone can view events"
  on events for select
  using (true);

drop policy if exists "Admins can manage events" on events;
create policy "Admins can manage events"
  on events for all
  using (
    exists (
      select 1 from profiles
      where id = auth.uid() and is_admin = true
    )
  )
  with check (
    exists (
      select 1 from profiles
      where id = auth.uid() and is_admin = true
    )
  );
