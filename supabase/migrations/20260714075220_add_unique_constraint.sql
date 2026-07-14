

CREATE UNIQUE INDEX IF NOT EXISTS idx_match_performances_match_player
  ON match_performances(match_id, player_id);
