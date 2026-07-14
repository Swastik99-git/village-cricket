

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
