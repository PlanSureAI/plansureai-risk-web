-- Create properties table
create table if not exists public.properties (
  id uuid primary key default gen_random_uuid(),
  address text not null,
  postcode text,
  city text,
  property_type text,
  bedrooms integer,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  user_id uuid references auth.users (id) on delete cascade
);

comment on table public.properties is 'Stores property information';

-- Create EPC certificates table
create table if not exists public.epc_certificates (
  id uuid primary key default gen_random_uuid(),
  property_id uuid references public.properties (id) on delete cascade,
  current_energy_rating text,
  current_energy_efficiency integer,
  expiry_date date,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

comment on table public.epc_certificates is 'Stores Energy Performance Certificate data for properties';

-- Add indexes for better query performance
create index if not exists idx_properties_user_id on public.properties(user_id);
create index if not exists idx_epc_certificates_property_id on public.epc_certificates(property_id);
