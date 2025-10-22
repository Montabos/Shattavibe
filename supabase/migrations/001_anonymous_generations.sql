-- Migration for anonymous user generations
-- These tables are public (no user_id required) and accessible via task_id

-- Ensure UUID extension is enabled
create extension if not exists "uuid-ossp";

-- Anonymous Generations Table (no authentication required)
create table if not exists public.anonymous_generations (
  id uuid primary key default gen_random_uuid(),
  task_id text not null unique,
  prompt text not null,
  model text not null,
  instrumental boolean default false not null,
  vocal_gender text,
  status generation_status default 'pending' not null,
  error_message text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Anonymous Tracks Table
create table if not exists public.anonymous_tracks (
  id uuid primary key default gen_random_uuid(),
  task_id text references public.anonymous_generations(task_id) on delete cascade not null,
  suno_id text not null unique,
  title text not null,
  tags text not null,
  prompt text not null,
  model_name text not null,
  audio_url text not null,
  source_audio_url text not null,
  stream_audio_url text not null,
  image_url text not null,
  duration numeric not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Indexes
create index if not exists idx_anonymous_generations_task_id on public.anonymous_generations(task_id);
create index if not exists idx_anonymous_tracks_task_id on public.anonymous_tracks(task_id);

-- Enable RLS
alter table public.anonymous_generations enable row level security;
alter table public.anonymous_tracks enable row level security;

-- Public read/write policies (anyone can read/write via task_id)
create policy "Anyone can view anonymous generations"
  on public.anonymous_generations for select
  using (true);

create policy "Anyone can insert anonymous generations"
  on public.anonymous_generations for insert
  with check (true);

create policy "Anyone can update anonymous generations"
  on public.anonymous_generations for update
  using (true);

create policy "Anyone can view anonymous tracks"
  on public.anonymous_tracks for select
  using (true);

create policy "Anyone can insert anonymous tracks"
  on public.anonymous_tracks for insert
  with check (true);

-- Auto-cleanup: Delete anonymous generations older than 7 days
create or replace function public.cleanup_old_anonymous_generations()
returns void as $$
begin
  delete from public.anonymous_generations
  where created_at < now() - interval '7 days';
end;
$$ language plpgsql;

-- Trigger for updated_at on anonymous_generations
create trigger set_updated_at_anonymous
  before update on public.anonymous_generations
  for each row
  execute function public.handle_updated_at();

-- Grant permissions
grant all on public.anonymous_generations to anon, authenticated;
grant all on public.anonymous_tracks to anon, authenticated;

-- Comments
comment on table public.anonymous_generations is 'Anonymous user music generations (auto-deleted after 7 days)';
comment on table public.anonymous_tracks is 'Music tracks from anonymous generations';

