-- Allow anonymous users to create and update generations
-- This enables callbacks to work even without authentication

-- Drop existing policies
DROP POLICY IF EXISTS "Users can insert their own generations" ON public.generations;
DROP POLICY IF EXISTS "Users can update their own generations" ON public.generations;

-- Create new policies that allow anonymous generations
CREATE POLICY "Users can insert their own generations or anonymous"
  ON public.generations FOR INSERT
  WITH CHECK (
    auth.uid() = user_id 
    OR user_id = '00000000-0000-0000-0000-000000000000'::uuid
  );

CREATE POLICY "Users can update their own generations or anonymous"
  ON public.generations FOR UPDATE
  USING (
    auth.uid() = user_id 
    OR user_id = '00000000-0000-0000-0000-000000000000'::uuid
  );

-- Allow anyone to view anonymous generations (for callbacks)
CREATE POLICY "Anyone can view anonymous generations"
  ON public.generations FOR SELECT
  USING (
    user_id = '00000000-0000-0000-0000-000000000000'::uuid
  );

-- Allow tracks to be inserted for anonymous generations
DROP POLICY IF EXISTS "Users can insert tracks for their generations" ON public.tracks;

CREATE POLICY "Users can insert tracks for their generations or anonymous"
  ON public.tracks FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.generations
      WHERE generations.id = tracks.generation_id
      AND (
        generations.user_id = auth.uid()
        OR generations.user_id = '00000000-0000-0000-0000-000000000000'::uuid
      )
    )
  );

