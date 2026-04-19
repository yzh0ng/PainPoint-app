
-- Conditions enum
create type public.pain_condition as enum (
  'endometriosis','fibromyalgia','lower_back','migraine','post_surgical','arthritis','other','unspecified'
);

create type public.pain_type as enum (
  'sharp','dull','burning','throbbing','aching','stabbing','cramping','tingling','pressure','other'
);

create type public.pain_trigger as enum (
  'stress','sleep','exercise','weather','food','menstrual','posture','work','none','other'
);

-- profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  condition public.pain_condition not null default 'unspecified',
  reminder_time time without time zone default '20:00',
  reminders_enabled boolean not null default true,
  timezone text default 'UTC',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "users view own profile" on public.profiles
  for select to authenticated using (auth.uid() = id);
create policy "users update own profile" on public.profiles
  for update to authenticated using (auth.uid() = id);
create policy "users insert own profile" on public.profiles
  for insert to authenticated with check (auth.uid() = id);

-- pain_logs
create table public.pain_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  logged_at timestamptz not null default now(),
  region text not null,                    -- e.g. 'lower_back', 'left_hip'
  side text,                               -- 'left' | 'right' | 'center' | null
  pain_type public.pain_type not null,
  intensity smallint not null check (intensity between 0 and 10),
  trigger public.pain_trigger,
  note text,
  created_at timestamptz not null default now()
);

alter table public.pain_logs enable row level security;

create index pain_logs_user_logged_idx on public.pain_logs(user_id, logged_at desc);

create policy "users view own logs" on public.pain_logs
  for select to authenticated using (auth.uid() = user_id);
create policy "users insert own logs" on public.pain_logs
  for insert to authenticated with check (auth.uid() = user_id);
create policy "users update own logs" on public.pain_logs
  for update to authenticated using (auth.uid() = user_id);
create policy "users delete own logs" on public.pain_logs
  for delete to authenticated using (auth.uid() = user_id);

-- medications
create table public.medications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  dose text,
  notes text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.medications enable row level security;

create policy "users view own meds" on public.medications
  for select to authenticated using (auth.uid() = user_id);
create policy "users insert own meds" on public.medications
  for insert to authenticated with check (auth.uid() = user_id);
create policy "users update own meds" on public.medications
  for update to authenticated using (auth.uid() = user_id);
create policy "users delete own meds" on public.medications
  for delete to authenticated using (auth.uid() = user_id);

-- med_doses (when taken + perceived effect)
create table public.med_doses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  medication_id uuid not null references public.medications(id) on delete cascade,
  taken_at timestamptz not null default now(),
  effect smallint check (effect between 0 and 10),  -- 0 none, 10 great
  note text,
  created_at timestamptz not null default now()
);

alter table public.med_doses enable row level security;
create index med_doses_user_idx on public.med_doses(user_id, taken_at desc);

create policy "users view own doses" on public.med_doses
  for select to authenticated using (auth.uid() = user_id);
create policy "users insert own doses" on public.med_doses
  for insert to authenticated with check (auth.uid() = user_id);
create policy "users update own doses" on public.med_doses
  for update to authenticated using (auth.uid() = user_id);
create policy "users delete own doses" on public.med_doses
  for delete to authenticated using (auth.uid() = user_id);

-- updated_at trigger
create or replace function public.tg_set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.tg_set_updated_at();

-- auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)));
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
