-- ============================================================================
-- Village Cricket Management System — Complete Database Schema
-- ============================================================================
-- This file recreates the ENTIRE database from scratch.
-- Run it directly in your Supabase SQL Editor (or psql).
-- Execution order is carefully sequenced:
--   1. Extensions
--   2. Tables (parents before children)
--   3. Indexes
--   4. RLS policies
--   5. Storage bucket + storage policies
--   6. View
--   7. Function + Trigger
-- No seed/sample data is used by the application.
-- ============================================================================

-- ============================================================================
-- 1. EXTENSIONS
-- ============================================================================

-- pgcrypto provides gen_random_uuid() used by all primary keys
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================================
-- 2. TABLES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- profiles
--   One row per auth user. Created automatically by the handle_new_user()
--   trigger on auth.users. The first user becomes an admin.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS profiles (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name     text        NOT NULL DEFAULT '',
  village       text                 DEFAULT '',
  playing_role  text        NOT NULL DEFAULT 'batsman',
  batting_style text                 DEFAULT '',
  bowling_style text                 DEFAULT '',
  photo_url     text                 DEFAULT '',
  is_admin      boolean     NOT NULL DEFAULT false,
  created_at    timestamptz NOT NULL DEFAULT now(),
  provider      text        NOT NULL DEFAULT 'email',
  CONSTRAINT profiles_id_fkey
    FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- ----------------------------------------------------------------------------
-- matches
--   A cricket match between two teams.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS matches (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_a                   text        NOT NULL DEFAULT '',
  team_b                   text        NOT NULL DEFAULT '',
  match_date               timestamptz NOT NULL DEFAULT now(),
  venue                    text                 DEFAULT '',
  status                   text        NOT NULL DEFAULT 'upcoming',
  toss                     text                 DEFAULT '',
  winner                   text                 DEFAULT '',
  team_a_score             text                 DEFAULT '',
  team_b_score             text                 DEFAULT '',
  team_a_overs             text                 DEFAULT '',
  team_b_overs             text                 DEFAULT '',
  notes                    text                 DEFAULT '',
  created_at               timestamptz NOT NULL DEFAULT now(),
  winning_margin           text                 DEFAULT '',
  man_of_match_player_id   uuid,
  CONSTRAINT matches_man_of_match_player_id_fkey
    FOREIGN KEY (man_of_match_player_id) REFERENCES profiles(id) ON DELETE SET NULL
);

-- ----------------------------------------------------------------------------
-- match_performances
--   Per-player batting/bowling/fielding stats for a single match.
--   Unique on (match_id, player_id) — one performance row per player per match.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS match_performances (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id       uuid        NOT NULL,
  player_id      uuid        NOT NULL,
  batting_order  integer             DEFAULT 0,
  runs           integer     NOT NULL DEFAULT 0,
  balls_faced    integer     NOT NULL DEFAULT 0,
  is_out         boolean     NOT NULL DEFAULT false,
  dismissal      text                 DEFAULT '',
  bowling_order  integer             DEFAULT 0,
  wickets        integer     NOT NULL DEFAULT 0,
  overs_bowled   numeric     NOT NULL DEFAULT 0,
  runs_conceded  integer     NOT NULL DEFAULT 0,
  maidens        integer     NOT NULL DEFAULT 0,
  created_at     timestamptz NOT NULL DEFAULT now(),
  fours          integer     NOT NULL DEFAULT 0,
  sixes          integer     NOT NULL DEFAULT 0,
  catches        integer     NOT NULL DEFAULT 0,
  run_outs       integer     NOT NULL DEFAULT 0,
  CONSTRAINT match_performances_match_id_fkey
    FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE,
  CONSTRAINT match_performances_player_id_fkey
    FOREIGN KEY (player_id) REFERENCES profiles(id) ON DELETE CASCADE
);

-- ----------------------------------------------------------------------------
-- match_players
--   Which players are selected for a given match (no count limit).
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS match_players (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id   uuid        NOT NULL,
  player_id  uuid        NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT match_players_match_id_fkey
    FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE,
  CONSTRAINT match_players_player_id_fkey
    FOREIGN KEY (player_id) REFERENCES profiles(id) ON DELETE CASCADE
);

-- ----------------------------------------------------------------------------
-- announcements
--   Community announcements with category, priority, and optional expiry.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS announcements (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title       text        NOT NULL DEFAULT '',
  body        text        NOT NULL DEFAULT '',
  author_id   uuid,
  created_at  timestamptz NOT NULL DEFAULT now(),
  category    text        NOT NULL DEFAULT 'general',
  priority    text        NOT NULL DEFAULT 'medium',
  created_by  uuid,
  expires_at  timestamptz,
  CONSTRAINT announcements_author_id_fkey
    FOREIGN KEY (author_id) REFERENCES profiles(id) ON DELETE SET NULL,
  CONSTRAINT announcements_created_by_fkey
    FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE SET NULL
);

-- ============================================================================
-- 3. INDEXES
-- ============================================================================

-- matches
CREATE INDEX IF NOT EXISTS idx_matches_date ON matches(match_date);

-- match_performances
CREATE INDEX IF NOT EXISTS idx_performances_match ON match_performances(match_id);
CREATE INDEX IF NOT EXISTS idx_performances_player ON match_performances(player_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_match_performances_match_player
  ON match_performances(match_id, player_id);

-- match_players
CREATE INDEX IF NOT EXISTS idx_match_players_match ON match_players(match_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_match_players_match_player
  ON match_players(match_id, player_id);

-- announcements
CREATE INDEX IF NOT EXISTS idx_announcements_created_at ON announcements(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_announcements_category ON announcements(category);

-- ============================================================================
-- 4. ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS on every table
ALTER TABLE profiles            ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches             ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_performances  ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_players       ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements       ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- profiles
--   All authenticated users can read (player list is shared).
--   A user can insert their own row (used by the signup trigger).
--   A user can update their own row; admins can update any row.
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "profiles_select_all" ON profiles;
CREATE POLICY "profiles_select_all" ON profiles FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_admin" ON profiles;
CREATE POLICY "profiles_update_admin" ON profiles FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true));

-- ----------------------------------------------------------------------------
-- matches
--   All authenticated users can read; admin-only insert/update.
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "matches_select_all" ON matches;
CREATE POLICY "matches_select_all" ON matches FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "matches_insert_admin" ON matches;
CREATE POLICY "matches_insert_admin" ON matches FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  );

DROP POLICY IF EXISTS "matches_update_admin" ON matches;
CREATE POLICY "matches_update_admin" ON matches FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true));

-- ----------------------------------------------------------------------------
-- match_performances
--   All authenticated users can read; admin-only insert/update/delete.
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "performances_select_all" ON match_performances;
CREATE POLICY "performances_select_all" ON match_performances FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "performances_insert_admin" ON match_performances;
CREATE POLICY "performances_insert_admin" ON match_performances FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  );

DROP POLICY IF EXISTS "performances_update_admin" ON match_performances;
CREATE POLICY "performances_update_admin" ON match_performances FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true));

DROP POLICY IF EXISTS "performances_delete_admin" ON match_performances;
CREATE POLICY "performances_delete_admin" ON match_performances FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  );

-- ----------------------------------------------------------------------------
-- match_players
--   All authenticated users can read; admin-only insert/delete.
-- ----------------------------------------------------------------------------
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

-- ----------------------------------------------------------------------------
-- announcements
--   All authenticated users can read; admin-only insert/update/delete.
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "announcements_select_all" ON announcements;
CREATE POLICY "announcements_select_all" ON announcements FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "announcements_insert_admin" ON announcements;
CREATE POLICY "announcements_insert_admin" ON announcements FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  );

DROP POLICY IF EXISTS "announcements_update_admin" ON announcements;
CREATE POLICY "announcements_update_admin" ON announcements FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true));

DROP POLICY IF EXISTS "announcements_delete_admin" ON announcements;
CREATE POLICY "announcements_delete_admin" ON announcements FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  );

-- ============================================================================
-- 5. STORAGE BUCKET + STORAGE POLICIES
-- ============================================================================

-- Profile photos bucket (public read, authenticated write)
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-photos', 'profile-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Public read
DROP POLICY IF EXISTS "Public read profile photos" ON storage.objects;
CREATE POLICY "Public read profile photos" ON storage.objects
  FOR SELECT TO anon, authenticated USING (bucket_id = 'profile-photos');

-- Authenticated users can upload
DROP POLICY IF EXISTS "Authenticated upload profile photos" ON storage.objects;
CREATE POLICY "Authenticated upload profile photos" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'profile-photos');

-- Authenticated users can update
DROP POLICY IF EXISTS "Users update own profile photos" ON storage.objects;
CREATE POLICY "Users update own profile photos" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'profile-photos');

-- Authenticated users can delete
DROP POLICY IF EXISTS "Users delete own profile photos" ON storage.objects;
CREATE POLICY "Users delete own profile photos" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'profile-photos');

-- ============================================================================
-- 6. VIEW
-- ============================================================================

-- player_career_stats
--   Aggregated career stats per player, derived from match_performances.
--   Powers the player profile stats cards and the leaderboard.
CREATE OR REPLACE VIEW player_career_stats AS
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

-- ============================================================================
-- 7. FUNCTION + TRIGGER
-- ============================================================================

-- handle_new_user()
--   Fires AFTER INSERT on auth.users. Auto-creates a profiles row for every
--   new signup. The very first user becomes admin. Handles both email and
--   Google OAuth signups (extracts name + avatar from raw_user_meta_data).
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

-- Trigger: fire on every new auth user
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================
