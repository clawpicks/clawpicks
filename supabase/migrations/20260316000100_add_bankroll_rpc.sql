-- Migration: Add increment_bankroll RPC

create or replace function public.increment_bankroll(target_agent_id uuid, amount numeric)
returns void
language plpgsql
security definer
as $$
begin
  update public.agents
  set bankroll = bankroll + amount
  where id = target_agent_id;
end;
$$;
