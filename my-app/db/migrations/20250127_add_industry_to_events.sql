-- Add industry field to events table
ALTER TABLE public.events 
ADD COLUMN industry text[] DEFAULT '{}'::text[] NOT NULL;

-- Create index for industry field for better query performance
CREATE INDEX idx_events_industry ON public.events USING gin (industry); 