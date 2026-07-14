/*
# Player Career Statistics View

## Overview
Creates a view `player_career_stats` that aggregates career statistics for each player from match_performances.

## View: player_career_stats
Columns:
- `player_id` (uuid) — references profiles.id
- `matches_played` (int) — count of distinct matches with a performance entry
- `total_runs` (int) — sum of runs
- `total_wickets` (int) — sum of wickets
- `total_balls_faced` (int)
- `total_overs_bowled` (numeric)
- `total_runs_conceded` (int)
- `highest_score` (int) — max runs in a single match (only when not out counts too)
- `best_bowling_wickets` (int) — max wickets in a single match
- `best_bowling_runs` (int) — runs conceded in that best-wickets match
- `batting_average` (numeric) — total_runs / (innings where out), null if no outs
- `strike_rate` (numeric) — runs per 100 balls faced
- `bowling_average` (numeric) — runs_conceded per wicket
- `economy` (numeric) — runs per over

## Security
Views inherit RLS from underlying tables. SELECT granted to authenticated.

## Notes
1. This is a VIEW, not a table — it recomputes on query.
2. `best_bowling` is computed as the match with the most wickets; if tied, fewest runs conceded.
*/

CREATE OR REPLACE VIEW player_career_stats AS
SELECT
  p.player_id,
  COUNT(DISTINCT p.match_id) AS matches_played,
  COALESCE(SUM(p.runs), 0) AS total_runs,
  COALESCE(SUM(p.wickets), 0) AS total_wickets,
  COALESCE(SUM(p.balls_faced), 0) AS total_balls_faced,
  COALESCE(SUM(p.overs_bowled), 0) AS total_overs_bowled,
  COALESCE(SUM(p.runs_conceded), 0) AS total_runs_conceded,
  COALESCE(MAX(p.runs), 0) AS highest_score,
  COALESCE(MAX(p.wickets), 0) AS best_bowling_wickets,
  (
    SELECT COALESCE(p2.runs_conceded, 0)
    FROM match_performances p2
    WHERE p2.player_id = p.player_id
    ORDER BY p2.wickets DESC, p2.runs_conceded ASC
    LIMIT 1
  ) AS best_bowling_runs,
  CASE
    WHEN COUNT(*) FILTER (WHERE p.is_out = true) > 0
    THEN ROUND(SUM(p.runs)::numeric / NULLIF(COUNT(*) FILTER (WHERE p.is_out = true), 0), 2)
    ELSE NULL
  END AS batting_average,
  CASE
    WHEN SUM(p.balls_faced) > 0
    THEN ROUND(SUM(p.runs)::numeric / SUM(p.balls_faced) * 100, 2)
    ELSE NULL
  END AS strike_rate,
  CASE
    WHEN SUM(p.wickets) > 0
    THEN ROUND(SUM(p.runs_conceded)::numeric / NULLIF(SUM(p.wickets), 0), 2)
    ELSE NULL
  END AS bowling_average,
  CASE
    WHEN SUM(p.overs_bowled) > 0
    THEN ROUND(SUM(p.runs_conceded)::numeric / NULLIF(SUM(p.overs_bowled), 0), 2)
    ELSE NULL
  END AS economy
FROM match_performances p
GROUP BY p.player_id;

GRANT SELECT ON player_career_stats TO authenticated;
