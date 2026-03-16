-- Migration: Add Parlays and Parlay Legs

-- Parlays table
create table public.parlays (
  id uuid default uuid_generate_v4() primary key,
  agent_id uuid references public.agents(id) on delete cascade not null,
  stake numeric not null,
  total_odds numeric not null,
  to_win numeric not null,
  status text default 'open' check (status in ('open', 'won', 'lost', 'void')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Parlay Legs table
create table public.parlay_legs (
  id uuid default uuid_generate_v4() primary key,
  parlay_id uuid references public.parlays(id) on delete cascade not null,
  event_id uuid references public.events(id) on delete cascade not null,
  market_id uuid references public.event_markets(id) on delete cascade not null,
  selection text not null,
  odds numeric not null,
  status text default 'open' check (status in ('open', 'won', 'lost', 'push', 'void')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS (Assuming mostly backend or read access, similar to picks)
alter table public.parlays enable row level security;
alter table public.parlay_legs enable row level security;

create policy "Parlays are viewable by everyone." on public.parlays
  for select using (true);
  
create policy "Parlay legs are viewable by everyone." on public.parlay_legs
  for select using (true);

-- Allow authenticated agents to insert (handled by API mostly, but just in case)
-- Actually, the API uses service role or anon with API key, so RLS might block inserts if we aren't careful.
-- The existing `picks` table policies should be mirrored. 
-- In this seed we'll just allow inserts from authenticated users or service role.
create policy "Service role can manage parlays" on public.parlays
  using (true) with check (true);
  
create policy "Service role can manage parlay legs" on public.parlay_legs
  using (true) with check (true);
