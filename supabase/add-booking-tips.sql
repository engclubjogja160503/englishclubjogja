-- ============================================================
-- Booking tips: every booking (member or guest) now comes with a QRIS tip
-- and a screenshot of the payment.
-- Run in Supabase SQL Editor BEFORE deploying the matching code.
-- Additive and safe to re-run: the site that is live now keeps working,
-- because the new guest-booking parameters all have defaults.
-- ============================================================

-- 1. What each booking paid, and where its screenshot lives.
--    tip_amount   = the amount the person confirmed (pre-filled from the screenshot)
--    tip_detected = what the site read off the screenshot, so admins can spot edits
--    payment_proof = path of the screenshot in the payment-proofs bucket
alter table bookings add column if not exists tip_amount integer;
alter table bookings add column if not exists tip_detected integer;
alter table bookings add column if not exists payment_proof text;

-- 2. A private bucket for the screenshots (images only, max 5 MB each).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('payment-proofs', 'payment-proofs', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- 3. Anyone booking (guests are not signed in) may upload a screenshot,
--    but only admins can open them. Nobody can list, change or delete them from the site.
drop policy if exists "Anyone booking can upload a payment proof" on storage.objects;
create policy "Anyone booking can upload a payment proof"
  on storage.objects for insert
  to anon, authenticated
  with check (bucket_id = 'payment-proofs');

drop policy if exists "Admins can view payment proofs" on storage.objects;
create policy "Admins can view payment proofs"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'payment-proofs' and public.is_admin());

-- 4. Guest bookings: same rules as before, plus the tip fields.
--    The old 9-argument version is replaced (not overloaded), so calls from
--    the current site still resolve to this function through the defaults.
drop function if exists public.create_guest_booking(uuid, text, text, text, text, text, text, text, text);

create or replace function public.create_guest_booking(
  p_event_id uuid,
  p_name text,
  p_phone text,
  p_email text,
  p_age_range text default null,
  p_mbti text default null,
  p_occupation text default null,
  p_domicile text default null,
  p_instagram text default null,
  p_tip_amount integer default null,
  p_tip_detected integer default null,
  p_payment_proof text default null
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
    guest_age_range, guest_mbti, guest_occupation, guest_domicile, guest_instagram,
    tip_amount, tip_detected, payment_proof
  ) values (
    p_event_id, null, 'confirmed', false,
    trim(p_name), trim(p_phone), trim(p_email),
    p_age_range, p_mbti, p_occupation, p_domicile, nullif(trim(p_instagram), ''),
    p_tip_amount, p_tip_detected, nullif(trim(p_payment_proof), '')
  )
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.create_guest_booking(uuid, text, text, text, text, text, text, text, text, integer, integer, text) from public;
grant execute on function public.create_guest_booking(uuid, text, text, text, text, text, text, text, text, integer, integer, text) to anon, authenticated;
