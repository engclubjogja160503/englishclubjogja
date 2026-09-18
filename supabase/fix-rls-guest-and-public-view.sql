-- Fix RLS: Allow public view of confirmed bookings and profiles
-- for attendee bubbles on homepage and booking page.
-- Run this in Supabase SQL Editor.

-- Allow everyone to see confirmed bookings (for attendee list)
-- Drop the restrictive "Members can view their own bookings" first
drop policy if exists "Members can view their own bookings" on bookings;

create policy "Anyone can view confirmed bookings"
  on bookings for select
  using (status = 'confirmed');

-- Allow everyone to view basic profile info (for attendee name display)
-- Drop the restrictive "Members can view their own profile" first
drop policy if exists "Members can view their own profile" on profiles;

create policy "Anyone can view profiles"
  on profiles for select
  using (true);

-- Fix UPDATE policy: allow members to cancel their own bookings
-- Drop existing update policies first
drop policy if exists "Users can update their own bookings" on bookings;
drop policy if exists "Guests can cancel with booking id" on bookings;

-- Unified policy: member owns the booking OR booking has no user_id (guest)
create policy "Users can update their own bookings"
  on bookings for update
  using (
    auth.uid() = user_id
    or user_id is null
  );
