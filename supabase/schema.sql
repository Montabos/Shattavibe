-- Supabase Database Schema for ShattaVibe

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create enum for generation status
create type generation_status as enum ('pending', 'processing', 'completed', 'failed');

-- User Profiles Table
create table if not exists public.user_profiles (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null unique,
  username text,
  avatar_url text,
  credits_used integer default 0 not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Generations Table (Music generation tasks)
create table if not exists public.generations (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  task_id text not null unique,
  prompt text not null,
  model text not null,
  instrumental boolean default false not null,
  vocal_gender text,
  negative_tags text,
  status generation_status default 'pending' not null,
  error_message text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Tracks Table (Generated music tracks)
create table if not exists public.tracks (
  id uuid primary key default uuid_generate_v4(),
  generation_id uuid references public.generations(id) on delete cascade not null,
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

-- Indexes for better performance
create index if not exists idx_generations_user_id on public.generations(user_id);
create index if not exists idx_generations_task_id on public.generations(task_id);
create index if not exists idx_generations_status on public.generations(status);
create index if not exists idx_tracks_generation_id on public.tracks(generation_id);
create index if not exists idx_user_profiles_user_id on public.user_profiles(user_id);

-- Row Level Security (RLS) Policies

-- Enable RLS
alter table public.user_profiles enable row level security;
alter table public.generations enable row level security;
alter table public.tracks enable row level security;

-- User Profiles Policies
create policy "Users can view their own profile"
  on public.user_profiles for select
  using (auth.uid() = user_id);

create policy "Users can update their own profile"
  on public.user_profiles for update
  using (auth.uid() = user_id);

create policy "Users can insert their own profile"
  on public.user_profiles for insert
  with check (auth.uid() = user_id);

-- Generations Policies
create policy "Users can view their own generations"
  on public.generations for select
  using (auth.uid() = user_id);

create policy "Users can insert their own generations"
  on public.generations for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own generations"
  on public.generations for update
  using (auth.uid() = user_id);

create policy "Users can delete their own generations"
  on public.generations for delete
  using (auth.uid() = user_id);

-- Tracks Policies
create policy "Users can view tracks from their generations"
  on public.tracks for select
  using (
    exists (
      select 1 from public.generations
      where generations.id = tracks.generation_id
      and generations.user_id = auth.uid()
    )
  );

create policy "Users can insert tracks for their generations"
  on public.tracks for insert
  with check (
    exists (
      select 1 from public.generations
      where generations.id = tracks.generation_id
      and generations.user_id = auth.uid()
    )
  );

-- Functions

-- Function to update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- Triggers for updated_at
create trigger set_updated_at
  before update on public.user_profiles
  for each row
  execute function public.handle_updated_at();

create trigger set_updated_at
  before update on public.generations
  for each row
  execute function public.handle_updated_at();

-- Function to create user profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.user_profiles (user_id, username)
  values (new.id, new.raw_user_meta_data->>'username');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger for new user signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- Grant permissions
grant usage on schema public to anon, authenticated;
grant all on all tables in schema public to anon, authenticated;
grant all on all sequences in schema public to anon, authenticated;

-- Comments for documentation
comment on table public.user_profiles is 'User profile information';
comment on table public.generations is 'Music generation tasks and their status';
comment on table public.tracks is 'Generated music tracks from Suno API';

