-- policies.sql

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.agents enable row level security;
alter table public.api_keys enable row level security;
alter table public.sports enable row level security;
alter table public.leagues enable row level security;
alter table public.events enable row level security;
alter table public.event_markets enable row level security;
alter table public.picks enable row level security;
alter table public.follows enable row level security;
alter table public.submission_logs enable row level security;

-- Public read access for most tables
drop policy if exists "Public profiles are viewable by everyone." on public.profiles;
create policy "Public profiles are viewable by everyone." on public.profiles for select using (true);

drop policy if exists "Agents are viewable by everyone." on public.agents;
create policy "Agents are viewable by everyone." on public.agents for select using (true);

drop policy if exists "Sports are viewable by everyone." on public.sports;
create policy "Sports are viewable by everyone." on public.sports for select using (true);

drop policy if exists "Leagues are viewable by everyone." on public.leagues;
create policy "Leagues are viewable by everyone." on public.leagues for select using (true);

drop policy if exists "Events are viewable by everyone." on public.events;
create policy "Events are viewable by everyone." on public.events for select using (true);

drop policy if exists "Event markets are viewable by everyone." on public.event_markets;
create policy "Event markets are viewable by everyone." on public.event_markets for select using (true);

drop policy if exists "Picks are viewable by everyone." on public.picks;
create policy "Picks are viewable by everyone." on public.picks for select using (true);
drop policy if exists "Allow anyone to insert picks." on public.picks;
create policy "Allow anyone to insert picks." on public.picks for insert with check (true);

drop policy if exists "Follows are viewable by everyone." on public.follows;
create policy "Follows are viewable by everyone." on public.follows for select using (true);

-- Authenticated Users can manage their own profile
drop policy if exists "Users can insert their own profile." on public.profiles;
create policy "Users can insert their own profile." on public.profiles for insert with check (auth.uid() = id);

drop policy if exists "Users can update own profile." on public.profiles;
create policy "Users can update own profile." on public.profiles for update using (auth.uid() = id);

-- Users can manage their agents
drop policy if exists "Users can manage their agents." on public.agents;
create policy "Users can manage their agents." on public.agents for all using (auth.uid() = owner_id);

drop policy if exists "Allow anonymous bankroll updates." on public.agents;
create policy "Allow anonymous bankroll updates." on public.agents for update using (true);

drop policy if exists "Users can manage API keys for their agents." on public.api_keys;
create policy "Users can manage API keys for their agents." on public.api_keys for all using (
  exists (select 1 from public.agents a where a.id = api_keys.agent_id and a.owner_id = auth.uid())
);

drop policy if exists "Allow API key lookup." on public.api_keys;
create policy "Allow API key lookup." on public.api_keys for select using (true);

-- Users can manage their follows
drop policy if exists "Users can manage their follows." on public.follows;
create policy "Users can manage their follows." on public.follows for all using (auth.uid() = user_id);

-- Picks: Insert handled securely. Since agents submit picks via an API using API keys, the server will
-- validate the API key and insert using service_role or a special auth context.
-- We can enforce that picks can only be inserted if they belong to a valid agent, but keeping it service_role managed is easier for MVP API layer.

-- Submission logs: Viewable by owner
drop policy if exists "Users can view submission logs for their agents." on public.submission_logs;
create policy "Users can view submission logs for their agents." on public.submission_logs for select using (
  exists (select 1 from public.agents a where a.id = submission_logs.agent_id and a.owner_id = auth.uid())
);
