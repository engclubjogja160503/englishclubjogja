-- ============================================================
-- Privacy fix, STEP 1 of 2 — additive only, safe to run any time.
-- Run in Supabase SQL Editor BEFORE deploying the matching code.
-- Nothing here removes access, so the current live site keeps working.
-- Safe to re-run.
-- ============================================================

-- 1. Helper: is the current user an admin?
--    SECURITY DEFINER so policies can call it without recursing into
--    the profiles policies themselves.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select is_admin from profiles where id = auth.uid()),
    false
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- 2. Public, read-only views with only the columns the site shows.
--    Views run with the owner's rights, so they keep working after
--    step 2 locks the underlying tables down.
create or replace view public.public_profiles as
  select id, username, full_name, avatar_url
  from profiles;

create or replace view public.public_bookings as
  select id, event_id, user_id, guest_name, status, is_member, created_at
  from bookings
  where status = 'confirmed';

grant select on public.public_profiles to anon, authenticated;
grant select on public.public_bookings to anon, authenticated;

-- 3. Guest booking without exposing the bookings table.
--    Checks the event, capacity and duplicate email in one transaction.
create or replace function public.create_guest_booking(
  p_event_id uuid,
  p_name text,
  p_phone text,
  p_email text,
  p_age_range text default null,
  p_mbti text default null,
  p_occupation text default null,
  p_domicile text default null,
  p_instagram text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_max integer;
  v_taken integer;
  v_id uuid;
begin
  if coalesce(trim(p_name), '') = '' or coalesce(trim(p_email), '') = '' then
    raise exception 'MISSING_DETAILS';
  end if;

  -- Lock the event row so two last-seat bookings can't both succeed.
  select max_participants into v_max
  from events
  where id = p_event_id
    and is_active = true
    and coalesce(is_archived, false) = false
    and event_date >= (now() at time zone 'Asia/Jakarta')::date
  for update;

  if not found then
    raise exception 'EVENT_UNAVAILABLE';
  end if;

  if exists (
    select 1 from bookings
    where event_id = p_event_id
      and status = 'confirmed'
      and user_id is null
      and lower(guest_email) = lower(trim(p_email))
  ) then
    raise exception 'ALREADY_BOOKED';
  end if;

  select count(*) into v_taken
  from bookings
  where event_id = p_event_id and status = 'confirmed';

  if v_taken >= v_max then
    raise exception 'EVENT_FULL';
  end if;

  insert into bookings (
    event_id, user_id, status, is_member,
    guest_name, guest_phone, guest_email,
    guest_age_range, guest_mbti, guest_occupation, guest_domicile, guest_instagram
  ) values (
    p_event_id, null, 'confirmed', false,
    trim(p_name), trim(p_phone), trim(p_email),
    p_age_range, p_mbti, p_occupation, p_domicile, nullif(trim(p_instagram), '')
  )
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.create_guest_booking(uuid, text, text, text, text, text, text, text, text) from public;
grant execute on function public.create_guest_booking(uuid, text, text, text, text, text, text, text, text) to anon, authenticated;

-- 4. Guest "find my booking" for the cancel page.
--    Returns only id + name, and only for an exact email/phone match.
create or replace function public.find_guest_bookings(
  p_event_id uuid,
  p_verification text
)
returns table (id uuid, guest_name text)
language sql
stable
security definer
set search_path = public
as $$
  select b.id, b.guest_name
  from bookings b
  where b.event_id = p_event_id
    and b.status = 'confirmed'
    and b.user_id is null
    and coalesce(trim(p_verification), '') <> ''
    and (
      lower(b.guest_email) = lower(trim(p_verification))
      or b.guest_phone = trim(p_verification)
    );
$$;

revoke all on function public.find_guest_bookings(uuid, text) from public;
grant execute on function public.find_guest_bookings(uuid, text) to anon, authenticated;

-- 5. Only admins can grant or remove admin rights.
--    Changes made from the SQL editor / service role (no auth.uid()) are allowed,
--    so you can still promote the first admin by hand.
create or replace function public.protect_is_admin()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or public.is_admin() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.is_admin := false;
  elsif new.is_admin is distinct from old.is_admin then
    raise exception 'Only admins can change admin rights';
  end if;

  return new;
end;
$$;

drop trigger if exists protect_is_admin on profiles;
create trigger protect_is_admin
  before insert or update on profiles
  for each row execute function public.protect_is_admin();
