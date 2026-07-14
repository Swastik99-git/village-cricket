
-- match_players table
CREATE TABLE IF NOT EXISTS match_players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  player_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE match_players ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "match_players_select_all" ON match_players;
CREATE POLICY "match_players_select_all" ON match_players FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "match_players_insert_admin" ON match_players;
CREATE POLICY "match_players_insert_admin" ON match_players FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  );

DROP POLICY IF EXISTS "match_players_delete_admin" ON match_players;
CREATE POLICY "match_players_delete_admin" ON match_players FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  );

CREATE UNIQUE INDEX IF NOT EXISTS idx_match_players_match_player
  ON match_players(match_id, player_id);
CREATE INDEX IF NOT EXISTS idx_match_players_match ON match_players(match_id);

-- Add columns to match_performances
ALTER TABLE match_performances ADD COLUMN IF NOT EXISTS fours int NOT NULL DEFAULT 0;
ALTER TABLE match_performances ADD COLUMN IF NOT EXISTS sixes int NOT NULL DEFAULT 0;
ALTER TABLE match_performances ADD COLUMN IF NOT EXISTS catches int NOT NULL DEFAULT 0;
ALTER TABLE match_performances ADD COLUMN IF NOT EXISTS run_outs int NOT NULL DEFAULT 0;

-- Add columns to matches
ALTER TABLE matches ADD COLUMN IF NOT EXISTS winning_margin text DEFAULT '';
ALTER TABLE matches ADD COLUMN IF NOT EXISTS man_of_match_player_id uuid REFERENCES profiles(id) ON DELETE SET NULL;

-- Add provider column to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS provider text NOT NULL DEFAULT 'email';

-- Drop and recreate the career stats view with new fields
DROP VIEW IF EXISTS player_career_stats;

CREATE VIEW player_career_stats AS
SELECT
  p.player_id,
  COUNT(DISTINCT p.match_id) AS matches_played,
  COALESCE(SUM(p.runs), 0) AS total_runs,
  COALESCE(SUM(p.wickets), 0) AS total_wickets,
  COALESCE(SUM(p.balls_faced), 0) AS total_balls_faced,
  COALESCE(SUM(p.overs_bowled), 0) AS total_overs_bowled,
  COALESCE(SUM(p.runs_conceded), 0) AS total_runs_conceded,
  COALESCE(SUM(p.fours), 0) AS total_fours,
  COALESCE(SUM(p.sixes), 0) AS total_sixes,
  COALESCE(SUM(p.catches), 0) AS total_catches,
  COALESCE(SUM(p.run_outs), 0) AS total_run_outs,
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

-- Update the trigger function to handle Google OAuth
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_first boolean;
  provider_val text;
  full_name_val text;
  photo_url_val text;
BEGIN
  SELECT COUNT(*) = 0 INTO is_first FROM profiles;

  provider_val := COALESCE(NEW.raw_app_meta_data->>'provider', 'email');

  IF provider_val = 'google' THEN
    full_name_val := COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      split_part(NEW.email, '@', 1)
    );
    photo_url_val := COALESCE(
      NEW.raw_user_meta_data->>'avatar_url',
      NEW.raw_user_meta_data->>'picture',
      ''
    );
  ELSE
    full_name_val := COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1));
    photo_url_val := '';
  END IF;

  INSERT INTO profiles (id, full_name, is_admin, provider, photo_url)
  VALUES (
    NEW.id,
    full_name_val,
    is_first,
    provider_val,
    photo_url_val
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;
