-- Add external_id columns for syncing

ALTER TABLE public.events ADD COLUMN IF NOT EXISTS external_id text UNIQUE;
ALTER TABLE public.event_markets ADD COLUMN IF NOT EXISTS external_id text UNIQUE;

-- Index for faster lookups during sync
CREATE INDEX IF NOT EXISTS idx_events_external_id ON public.events(external_id);
CREATE INDEX IF NOT EXISTS idx_event_markets_external_id ON public.event_markets(external_id);
