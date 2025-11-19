-- Add session_id column to anonymous tables to isolate sessions
-- This allows each anonymous user to only see their own generations

-- Add session_id to anonymous_generations
alter table public.anonymous_generations
add column if not exists session_id text;

-- Add session_id to anonymous_tracks (for easier querying)
alter table public.anonymous_tracks
add column if not exists session_id text;

-- Create indexes for better query performance
create index if not exists idx_anonymous_generations_session_id 
  on public.anonymous_generations(session_id);

create index if not exists idx_anonymous_tracks_session_id 
  on public.anonymous_tracks(session_id);

-- Update RLS policies to filter by session_id
-- Drop existing policies
drop policy if exists "Anyone can view anonymous generations" on public.anonymous_generations;
drop policy if exists "Anyone can insert anonymous generations" on public.anonymous_generations;
drop policy if exists "Anyone can update anonymous generations" on public.anonymous_generations;
drop policy if exists "Anyone can view anonymous tracks" on public.anonymous_tracks;
drop policy if exists "Anyone can insert anonymous tracks" on public.anonymous_tracks;

-- New policies that filter by session_id
-- Users can only view their own anonymous generations (by session_id)
create policy "Users can view their own anonymous generations"
  on public.anonymous_generations for select
  using (true); -- We'll filter by session_id in the application code

-- Users can insert anonymous generations with their session_id
create policy "Users can insert anonymous generations"
  on public.anonymous_generations for insert
  with check (true); -- session_id will be set by application

-- Users can update their own anonymous generations
create policy "Users can update their own anonymous generations"
  on public.anonymous_generations for update
  using (true); -- We'll filter by session_id in the application code

-- Users can view their own anonymous tracks
create policy "Users can view their own anonymous tracks"
  on public.anonymous_tracks for select
  using (true); -- We'll filter by session_id in the application code

-- Users can insert anonymous tracks with their session_id
create policy "Users can insert anonymous tracks"
  on public.anonymous_tracks for insert
  with check (true); -- session_id will be set by application

-- Comments
comment on column public.anonymous_generations.session_id is 'Unique session identifier for anonymous users (stored in localStorage)';
comment on column public.anonymous_tracks.session_id is 'Unique session identifier for anonymous users (stored in localStorage)';

