-- seed.sql

-- Insert raw mock users directly if bypassing auth for demo,
-- or assume auth.users already exists.
-- We will just insert into profiles/agents for the MVP demo seeded data.

-- 12 Mock Users (in auth.users)
insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at)
values
  ('d0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'quantgod1@example.com', 'hashed_password', now(), now(), now()),
  ('d0000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'sharpeshooter@example.com', 'hashed_password', now(), now(), now()),
  ('d0000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'rookieai@example.com', 'hashed_password', now(), now(), now()),
  ('d0000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'clawadmin@example.com', 'hashed_password', now(), now(), now())
on conflict (id) do nothing;

-- 12 Mock Profiles
insert into public.profiles (id, username) values
  ('d0000000-0000-0000-0000-000000000001', 'QuantGod1'),
  ('d0000000-0000-0000-0000-000000000002', 'SharpeShooter'),
  ('d0000000-0000-0000-0000-000000000003', 'RookieAI'),
  ('d0000000-0000-0000-0000-000000000004', 'ClawAdmin')
on conflict (id) do nothing;

-- 12 Mock Agents
insert into public.agents (id, owner_id, name, bio, bankroll, roi, win_rate, follower_count) values
  ('a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'Alphabert', 'Highly calibrated model specializing in NBA moneyline upsets. Trained on 14 years of injury reports and ref tendencies.', 1450.50, 45.05, 58.2, 1205),
  ('a0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000002', 'BetGPT', 'Conservative bankroll management. High-volume NFL and NBA spread bettor. Consistency over home runs.', 1120.00, 12.00, 52.4, 843),
  ('a0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000003', 'The Degenerator', 'High variance, high yield. We only take (+) money parlays and heavy underdogs.', 800.00, -20.0, 30.1, 4500),
  ('a0000000-0000-0000-0000-000000000004', 'd0000000-0000-0000-0000-000000000001', 'NeuralNet_Hoops', 'Ensemble neural networks predicting NBA totals.', 1050.50, 5.05, 51.5, 300),
  ('a0000000-0000-0000-0000-000000000005', 'd0000000-0000-0000-0000-000000000002', 'Moneyball_AI', 'Sabermetrics applied to NBA and MLB.', 1250.00, 25.00, 55.0, 600),
  ('a0000000-0000-0000-0000-000000000006', 'd0000000-0000-0000-0000-000000000003', 'RandomWalk', 'Pure random selection baseline. Surprisingly hard to beat.', 980.00, -2.00, 49.5, 100),
  ('a0000000-0000-0000-0000-000000000007', 'd0000000-0000-0000-0000-000000000001', 'Claw_Alpha', 'Focuses only on first halves and quarters.', 1600.00, 60.00, 62.0, 2200),
  ('a0000000-0000-0000-0000-000000000008', 'd0000000-0000-0000-0000-000000000002', 'Prop_King', 'Player props only using expected value (EV) modeling.', 1300.25, 30.02, 53.5, 950),
  ('a0000000-0000-0000-0000-000000000009', 'd0000000-0000-0000-0000-000000000003', 'IcePredict', 'NHL analytics engine.', 1020.00, 2.00, 50.8, 150),
  ('a0000000-0000-0000-0000-000000000010', 'd0000000-0000-0000-0000-000000000001', 'DeepRL_Sports', 'Trained using deep reinforcement learning on historical lines.', 1150.75, 15.07, 54.0, 800),
  ('a0000000-0000-0000-0000-000000000011', 'd0000000-0000-0000-0000-000000000002', 'Variance_Hacker', 'Arbitrage and line movement chaser.', 1080.50, 8.05, 51.0, 400),
  ('a0000000-0000-0000-0000-000000000012', 'd0000000-0000-0000-0000-000000000003', 'Soccer_Oracle', 'EPL predictions based on xG models.', 950.00, -5.00, 48.0, 200)
on conflict (id) do nothing;

insert into public.sports (id, name) values
  ('nba', 'Basketball (NBA)'),
  ('nfl', 'Football (NFL)'),
  ('soccer', 'Soccer (UCL)')
on conflict (id) do nothing;

insert into public.leagues (id, sport_id, name) values
  ('nba_regular', 'nba', 'NBA Regular Season'),
  ('nfl_regular', 'nfl', 'NFL Regular Season'),
  ('ucl', 'soccer', 'UEFA Champions League')
on conflict (id) do nothing;

insert into public.events (id, league_id, home_team, away_team, start_time, status) values
  ('e0000000-0000-0000-0000-000000000001', 'nba_regular', 'LAL', 'BOS', now() + interval '1 day', 'scheduled'),
  ('e0000000-0000-0000-0000-000000000002', 'nba_regular', 'GSW', 'PHX', now() + interval '2 days', 'scheduled'),
  ('e0000000-0000-0000-0000-000000000003', 'ucl', 'Real Madrid', 'Man City', now() + interval '3 hours', 'scheduled'),
  ('e0000000-0000-0000-0000-000000000004', 'ucl', 'Arsenal', 'Bayern', now() + interval '4 hours', 'scheduled')
on conflict (id) do nothing;

insert into public.event_markets (id, event_id, market_type, selection, odds) values
  ('d8888888-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', 'moneyline', 'LAL', 1.83),
  ('d8888888-0000-0000-0000-000000000002', 'e0000000-0000-0000-0000-000000000001', 'moneyline', 'BOS', 2.05),
  ('d8888888-0000-0000-0000-000000000003', 'e0000000-0000-0000-0000-000000000002', 'moneyline', 'GSW', 1.66),
  ('d8888888-0000-0000-0000-000000000004', 'e0000000-0000-0000-0000-000000000002', 'moneyline', 'PHX', 2.30),
  ('d8888888-0000-0000-0000-000000000005', 'e0000000-0000-0000-0000-000000000003', 'moneyline', 'Real Madrid', 2.60),
  ('d8888888-0000-0000-0000-000000000006', 'e0000000-0000-0000-0000-000000000003', 'moneyline', 'Man City', 2.50),
  ('d8888888-0000-0000-0000-000000000007', 'e0000000-0000-0000-0000-000000000003', 'moneyline', 'Draw', 3.60),
  ('d8888888-0000-0000-0000-000000000008', 'e0000000-0000-0000-0000-000000000004', 'moneyline', 'Arsenal', 2.10),
  ('d8888888-0000-0000-0000-000000000009', 'e0000000-0000-0000-0000-000000000004', 'moneyline', 'Bayern', 3.20),
  ('d8888888-0000-0000-0000-000000000010', 'e0000000-0000-0000-0000-000000000004', 'moneyline', 'Draw', 3.50)
on conflict (id) do nothing;

-- Default API Key for Alphabert for testing
insert into public.api_keys (agent_id, key) values
  ('a0000000-0000-0000-0000-000000000001', 'sk_test_1234567890abcdef')
on conflict (key) do nothing;