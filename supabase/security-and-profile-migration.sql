-- Run this once in Supabase SQL Editor.

alter table profiles add column if not exists avatar_url text;

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

 drop policy if exists "Public profiles are viewable by everyone" on profiles;
 drop policy if exists "Users can insert their own profile" on profiles;
 drop policy if exists "Users can update their own profile" on profiles;
 drop policy if exists "Confirmed bookings are viewable by everyone" on bookings;
 drop policy if exists "Users can create bookings" on bookings;
 drop policy if exists "Users can update their own bookings" on bookings;
 drop policy if exists "Guests can cancel with booking id" on bookings;

create policy "Members can view their own profile"
  on profiles for select
  using (auth.uid() = id);

create policy "Members can insert their own profile"
  on profiles for insert
  with check (auth.uid() = id);

create policy "Members can update their own profile"
  on profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Members can view their own bookings"
  on bookings for select
  using (auth.uid() = user_id);

create policy "Anyone can create guest bookings"
  on bookings for insert
  with check (user_id is null or auth.uid() = user_id);

create policy "Members can update their own bookings"
  on bookings for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create or replace function cancel_guest_booking(
  p_booking_id uuid,
  p_verification text,
  p_reason text default null
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  update bookings
  set status = 'cancelled', cancellation_reason = p_reason, updated_at = now()
  where id = p_booking_id
    and user_id is null
    and status = 'confirmed'
    and (lower(guest_email) = lower(trim(p_verification)) or guest_phone = trim(p_verification));

  return found;
end;
$$;

revoke all on function cancel_guest_booking(uuid, text, text) from public;
grant execute on function cancel_guest_booking(uuid, text, text) to anon, authenticated;

-- RPC: Member cancels their own booking (security definer, bypasses RLS)
create or replace function cancel_member_booking(
  p_booking_id uuid,
  p_reason text default null
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  update bookings
  set status = 'cancelled', cancellation_reason = p_reason, updated_at = now()
  where id = p_booking_id
    and user_id = auth.uid()
    and status = 'confirmed';

  return found;
end;
$$;

revoke all on function cancel_member_booking(uuid, text) from public;
grant execute on function cancel_member_booking(uuid, text) to anon, authenticated;

create policy "Members can manage their avatar"
  on storage.objects for all
  using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1])
  with check (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);
