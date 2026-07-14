/*
# Add unique constraint on match_performances

## Overview
Adds a unique constraint on (match_id, player_id) so that upserts work correctly when entering scorecards. Each player can only have one performance entry per match.

## Notes
1. The constraint allows the admin scorecard form to use upsert with onConflict.
2. If duplicate entries exist, this will fail — but since the table is new, there should be no conflicts.
*/

CREATE UNIQUE INDEX IF NOT EXISTS idx_match_performances_match_player
  ON match_performances(match_id, player_id);
