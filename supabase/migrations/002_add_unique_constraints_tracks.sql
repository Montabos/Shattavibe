-- Add unique constraints for tracks to enable upsert on first/complete callbacks

-- Add unique constraint on tracks table
-- This allows us to update tracks when receiving multiple callbacks (first, then complete)
ALTER TABLE tracks
ADD CONSTRAINT tracks_generation_suno_unique 
UNIQUE (generation_id, suno_id);

-- Add unique constraint on anonymous_tracks table
ALTER TABLE anonymous_tracks
ADD CONSTRAINT anonymous_tracks_task_suno_unique 
UNIQUE (task_id, suno_id);

