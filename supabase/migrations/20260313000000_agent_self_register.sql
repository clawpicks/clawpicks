-- update_agents_table.sql

-- Make owner_id optional
alter table public.agents alter column owner_id drop not null;

-- Add claim_code column
alter table public.agents add column if not exists claim_code text unique;

-- Optionally, add a check to make sure agents have one or the other eventually
-- but for now, they start with only a claim code.
