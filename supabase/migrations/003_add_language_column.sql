-- Add language column to generations table
ALTER TABLE generations
ADD COLUMN IF NOT EXISTS language TEXT;

-- Add language column to anonymous_generations table
ALTER TABLE anonymous_generations
ADD COLUMN IF NOT EXISTS language TEXT;

-- Add comment to explain the column
COMMENT ON COLUMN generations.language IS 'Language code for music generation (e.g., en, fr, es, de, etc.)';
COMMENT ON COLUMN anonymous_generations.language IS 'Language code for music generation (e.g., en, fr, es, de, etc.)';

