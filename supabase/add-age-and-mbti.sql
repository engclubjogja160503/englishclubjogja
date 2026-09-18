-- Run this once in Supabase SQL Editor.
-- Allows admins to update any profile and adds age/mbti columns.

-- Add new columns
alter table profiles add column if not exists age_range text;
alter table profiles add column if not exists mbti text;

-- Allow admins to update any profile
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

-- Allow admins to delete bookings
drop policy if exists "Members can update their own bookings" on bookings;
create policy "Members can update their own bookings"
  on bookings for update
  using (
    auth.uid() = user_id
    or exists (
      select 1 from profiles
      where id = auth.uid() and is_admin = true
    )
  )
  with check (
    auth.uid() = user_id
    or exists (
      select 1 from profiles
      where id = auth.uid() and is_admin = true
    )
  );

-- Allow admins to delete bookings
drop policy if exists "Admins can delete bookings" on bookings;
create policy "Admins can delete bookings"
  on bookings for delete
  using (
    exists (
      select 1 from profiles
      where id = auth.uid() and is_admin = true
    )
  );
