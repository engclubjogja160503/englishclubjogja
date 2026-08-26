-- ============================================
-- English Club Jogja - Database Schema
-- Run this in Supabase SQL Editor
-- ============================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================
-- 1. PROFILES TABLE (user data)
-- ============================================
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  email text unique not null,
  username text unique not null,
  full_name text not null,
  phone text not null,
  occupation text not null check (occupation in ('Worker', 'Student', 'General')),
  domicile text not null,
  instagram text,
  interests text[] default '{}',
  expectations text[] default '{}',
  expectation_other text,
  is_member boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================
-- 2. EVENTS TABLE (Saturday night events)
-- ============================================
create table if not exists events (
  id uuid default uuid_generate_v4() primary key,
  event_date date not null,
  venue_name text not null,
  venue_address text,
  max_participants integer default 40,
  description text,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- ============================================
-- 3. BOOKINGS TABLE (seat reservations)
-- ============================================
create table if not exists bookings (
  id uuid default uuid_generate_v4() primary key,
  event_id uuid references events(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete set null,
  -- Guest booking (non-member)
  guest_name text,
  guest_phone text,
  guest_email text,
  -- Booking status
  status text default 'confirmed' check (status in ('confirmed', 'cancelled')),
  cancellation_reason text,
  -- Member reference
  is_member boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================
-- 4. INDEXES
-- ============================================
create index if not exists idx_bookings_event on bookings(event_id);
create index if not exists idx_bookings_user on bookings(user_id);
create index if not exists idx_bookings_status on bookings(status);
create index if not exists idx_events_date on events(event_date);
create index if not exists idx_events_active on events(is_active);

-- ============================================
-- 5. ROW LEVEL SECURITY (RLS)
-- ============================================
alter table profiles enable row level security;
alter table events enable row level security;
alter table bookings enable row level security;

-- Profiles: users can read all profiles, update only their own
create policy "Public profiles are viewable by everyone"
  on profiles for select
  using (true);

create policy "Users can insert their own profile"
  on profiles for insert
  with check (auth.uid() = id);

create policy "Users can update their own profile"
  on profiles for update
  using (auth.uid() = id);

-- Events: everyone can view active events
create policy "Active events are viewable by everyone"
  on events for select
  using (is_active = true);

-- Bookings: everyone can view confirmed bookings
create policy "Confirmed bookings are viewable by everyone"
  on bookings for select
  using (true);

create policy "Users can create bookings"
  on bookings for insert
  with check (true);

create policy "Users can update their own bookings"
  on bookings for update
  using (auth.uid() = user_id or user_id is null);

create policy "Guests can cancel with booking id"
  on bookings for update
  using (true);

-- ============================================
-- 6. FUNCTIONS
-- ============================================

-- Function to get booking count for an event
create or replace function get_booking_count(p_event_id uuid)
returns integer as $$
  select count(*)::integer
  from bookings
  where event_id = p_event_id
    and status = 'confirmed';
$$ language sql stable;

-- Function to check if event is full
create or replace function is_event_full(p_event_id uuid)
returns boolean as $$
  select get_booking_count(p_event_id) >= (
    select max_participants from events where id = p_event_id
  );
$$ language sql stable;

-- ============================================
-- 7. SEED DATA (First Event)
-- ============================================
insert into events (event_date, venue_name, venue_address, max_participants, description, is_active)
values (
  '2026-08-29',
  'Balans Coffee, Space, and Record',
  'Yogyakarta',
  40,
  'Saturday Night English Practice — come hang, practice English, and meet cool people!',
  true
);
