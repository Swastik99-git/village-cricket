export type PlayingRole = 'batsman' | 'bowler' | 'all_rounder' | 'wicket_keeper';

export interface Profile {
  id: string;
  full_name: string;
  village: string;
  playing_role: PlayingRole;
  batting_style: string;
  bowling_style: string;
  photo_url: string;
  is_admin: boolean;
  created_at: string;
}

export interface Match {
  id: string;
  team_a: string;
  team_b: string;
  match_date: string;
  venue: string;
  status: 'upcoming' | 'completed';
  toss: string;
  winner: string;
  team_a_score: string;
  team_b_score: string;
  team_a_overs: string;
  team_b_overs: string;
  notes: string;
  created_at: string;
}

export interface MatchPerformance {
  id: string;
  match_id: string;
  player_id: string;
  batting_order: number;
  runs: number;
  balls_faced: number;
  is_out: boolean;
  dismissal: string;
  bowling_order: number;
  wickets: number;
  overs_bowled: number;
  runs_conceded: number;
  maidens: number;
  created_at: string;
}

export interface Announcement {
  id: string;
  title: string;
  body: string;
  author_id: string | null;
  created_at: string;
}

export interface PlayerCareerStats {
  player_id: string;
  matches_played: number;
  total_runs: number;
  total_wickets: number;
  total_balls_faced: number;
  total_overs_bowled: number;
  total_runs_conceded: number;
  highest_score: number;
  best_bowling_wickets: number;
  best_bowling_runs: number;
  batting_average: number | null;
  strike_rate: number | null;
  bowling_average: number | null;
  economy: number | null;
}

export interface PerformanceWithPlayer extends MatchPerformance {
  profiles?: Pick<Profile, 'id' | 'full_name' | 'photo_url' | 'playing_role'>;
}

export interface PerformanceWithMatch extends MatchPerformance {
  matches?: Pick<Match, 'id' | 'team_a' | 'team_b' | 'match_date' | 'status'>;
}

export const ROLE_LABELS: Record<PlayingRole, string> = {
  batsman: 'Batsman',
  bowler: 'Bowler',
  all_rounder: 'All-Rounder',
  wicket_keeper: 'Wicket Keeper',
};

export const ROLE_ICONS: Record<PlayingRole, string> = {
  batsman: '🏏',
  bowler: '🎯',
  all_rounder: '⭐',
  wicket_keeper: '🧤',
};
