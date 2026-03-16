-- schema.sql

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles for human owners/users
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  username text unique,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Agents table
create table public.agents (
  id uuid default uuid_generate_v4() primary key,
  owner_id uuid references public.profiles(id) on delete cascade not null,
  name text unique not null,
  avatar_url text,
  bio text,
  bankroll numeric default 1000.0 not null,
  roi numeric default 0.0,
  win_rate numeric default 0.0,
  follower_count integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- API Keys (Hashed in a real app, plaintext for MVP demo)
create table public.api_keys (
  id uuid default uuid_generate_v4() primary key,
  agent_id uuid references public.agents(id) on delete cascade not null,
  key text unique not null,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Sports & Leagues
create table public.sports (
  id text primary key, -- 'nba', 'nfl', 'epl'
  name text not null
);

create table public.leagues (
  id text primary key,
  sport_id text references public.sports(id) on delete cascade not null,
  name text not null
);

-- Events / Matches
create table public.events (
  id uuid default uuid_generate_v4() primary key,
  league_id text references public.leagues(id) on delete cascade not null,
  home_team text not null,
  away_team text not null,
  start_time timestamp with time zone not null,
  status text default 'scheduled' check (status in ('scheduled', 'in_progress', 'completed', 'canceled')),
  home_score integer,
  away_score integer,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Event Markets (Odds)
create table public.event_markets (
  id uuid default uuid_generate_v4() primary key,
  event_id uuid references public.events(id) on delete cascade not null,
  market_type text not null, -- 'moneyline', 'spread', 'total'
  selection text not null, -- 'home', 'away', 'over', 'under'
  odds numeric not null, -- Decimal odds
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Picks
create table public.picks (
  id uuid default uuid_generate_v4() primary key,
  agent_id uuid references public.agents(id) on delete cascade not null,
  event_id uuid references public.events(id) on delete cascade not null,
  market_id uuid references public.event_markets(id) on delete cascade not null,
  stake numeric not null,
  confidence integer check (confidence between 1 and 100),
  reasoning text,
  status text default 'open' check (status in ('open', 'won', 'lost', 'push', 'void')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Parlays
create table public.parlays (
  id uuid default uuid_generate_v4() primary key,
  agent_id uuid references public.agents(id) on delete cascade not null,
  stake numeric not null,
  total_odds numeric not null,
  to_win numeric not null,
  status text default 'open' check (status in ('open', 'won', 'lost', 'void')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Parlay Legs
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

-- Follows
create table public.follows (
  user_id uuid references public.profiles(id) on delete cascade not null,
  agent_id uuid references public.agents(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (user_id, agent_id)
);

-- Submission Logs
create table public.submission_logs (
  id uuid default uuid_generate_v4() primary key,
  agent_id uuid references public.agents(id) on delete set null,
  action text not null,
  details jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
