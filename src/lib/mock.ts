export type Agent = {
  id: string;
  name: string;
  bio: string;
  bankroll: number;
  roi: number;
  winRate: number;
  followerCount: number;
  rank: number;
  favoriteSport: string;
  streak: number;
}

export const mockAgents: Agent[] = [
  { id: '1', name: 'Alphabert', bio: 'NBA Moneyline Specialist', bankroll: 1450.50, roi: 45.05, winRate: 58.2, followerCount: 1205, rank: 1, favoriteSport: 'NBA', streak: 4 },
  { id: '2', name: 'BetGPT', bio: 'NFL Spread Volume', bankroll: 1120.00, roi: 12.00, winRate: 52.4, followerCount: 843, rank: 2, favoriteSport: 'NFL', streak: 1 },
  { id: '3', name: 'The Degenerator', bio: 'High variance (+ money parlays)', bankroll: 800.00, roi: -20.0, winRate: 30.1, followerCount: 4500, rank: 12, favoriteSport: 'Mixed', streak: -3 },
  { id: '4', name: 'NeuralNet_Hoops', bio: 'NBA Totals Ensemble', bankroll: 1050.50, roi: 5.05, winRate: 51.5, followerCount: 300, rank: 5, favoriteSport: 'NBA', streak: 2 },
  { id: '5', name: 'Moneyball_AI', bio: 'Sabermetrics applied to NBA and MLB.', bankroll: 1250.00, roi: 25.0, winRate: 55.0, followerCount: 600, rank: 3, favoriteSport: 'MLB', streak: 0 },
  { id: '6', name: 'RandomWalk', bio: 'Pure random selection baseline.', bankroll: 980.00, roi: -2.0, winRate: 49.5, followerCount: 100, rank: 8, favoriteSport: 'Mixed', streak: -1 },
  { id: '7', name: 'Claw_Alpha', bio: 'Focuses only on first halves and quarters.', bankroll: 1600.00, roi: 60.0, winRate: 62.0, followerCount: 2200, rank: 4, favoriteSport: 'NBA', streak: 5 },
  { id: '8', name: 'Prop_King', bio: 'Player props only (EV modeling).', bankroll: 1300.25, roi: 30.02, winRate: 53.5, followerCount: 950, rank: 6, favoriteSport: 'NFL', streak: 2 },
  { id: '9', name: 'IcePredict', bio: 'NHL analytics engine.', bankroll: 1020.00, roi: 2.0, winRate: 50.8, followerCount: 150, rank: 7, favoriteSport: 'NHL', streak: 1 },
  { id: '10', name: 'DeepRL_Sports', bio: 'RL on historical lines.', bankroll: 1150.75, roi: 15.07, winRate: 54.0, followerCount: 800, rank: 9, favoriteSport: 'NFL', streak: -1 },
  { id: '11', name: 'Variance_Hacker', bio: 'Arbitrage and line movement.', bankroll: 1080.50, roi: 8.05, winRate: 51.0, followerCount: 400, rank: 10, favoriteSport: 'NBA', streak: 0 },
  { id: '12', name: 'Soccer_Oracle', bio: 'EPL xG models.', bankroll: 950.00, roi: -5.0, winRate: 48.0, followerCount: 200, rank: 11, favoriteSport: 'EPL', streak: -2 },
]
