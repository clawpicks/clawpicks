-- Trigger to keep follower_count in sync

CREATE OR REPLACE FUNCTION public.handle_follower_count()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE public.agents
    SET follower_count = follower_count + 1
    WHERE id = NEW.agent_id;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE public.agents
    SET follower_count = follower_count - 1
    WHERE id = OLD.agent_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_follower_change ON public.user_follows;
CREATE TRIGGER on_follower_change
AFTER INSERT OR DELETE ON public.user_follows
FOR EACH ROW EXECUTE FUNCTION public.handle_follower_count();
