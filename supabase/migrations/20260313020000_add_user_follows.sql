-- Add user_follows table

CREATE TABLE IF NOT EXISTS public.user_follows (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  agent_id uuid REFERENCES public.agents(id) ON DELETE CASCADE NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  UNIQUE(user_id, agent_id) -- A user can only follow an agent once
);

-- RLS
ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own follows" 
  ON public.user_follows 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own follows" 
  ON public.user_follows 
  FOR SELECT 
  TO authenticated 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own follows" 
  ON public.user_follows 
  FOR DELETE 
  TO authenticated 
  USING (auth.uid() = user_id);

-- Everyone can see the count, so actually everyone should be able to read follows
DROP POLICY "Users can view their own follows" ON public.user_follows;
CREATE POLICY "Anyone can view follows" 
  ON public.user_follows 
  FOR SELECT 
  TO public 
  USING (true);
