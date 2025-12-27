-- Create broker_profiles table to store broker contacts
create table if not exists public.broker_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade,
  name text not null,
  firm text not null,
  email text not null,
  notes text
);

comment on table public.broker_profiles is 'Stores broker contact details linked to app users';
