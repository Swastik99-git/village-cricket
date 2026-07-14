import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { Match, Announcement, PlayerCareerStats, Profile, PerformanceWithPlayer, PerformanceWithMatch, MatchPlayerWithProfile } from '../types';

// --- Matches ---
export function useMatches() {
  return useQuery({
    queryKey: ['matches'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('matches')
        .select('*')
        .order('match_date', { ascending: false });
      if (error) throw error;
      return data as Match[];
    },
  });
}

export function useMatch(matchId: string | undefined) {
  return useQuery({
    queryKey: ['match', matchId],
    queryFn: async () => {
      if (!matchId) return null;
      const { data, error } = await supabase
        .from('matches')
        .select('*')
        .eq('id', matchId)
        .maybeSingle();
      if (error) throw error;
      return data as Match | null;
    },
    enabled: !!matchId,
  });
}

// --- Match Players ---
export function useMatchPlayers(matchId: string | undefined) {
  return useQuery({
    queryKey: ['match-players', matchId],
    queryFn: async () => {
      if (!matchId) return [];
      const { data, error } = await supabase
        .from('match_players')
        .select('*, profiles!match_players_player_id_fkey(id, full_name, photo_url, playing_role)')
        .eq('match_id', matchId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data as MatchPlayerWithProfile[];
    },
    enabled: !!matchId,
  });
}

// --- Performances ---
export function useMatchPerformances(matchId: string | undefined) {
  return useQuery({
    queryKey: ['match-performances', matchId],
    queryFn: async () => {
      if (!matchId) return [];
      const { data, error } = await supabase
        .from('match_performances')
        .select('*, profiles!match_performances_player_id_fkey(id, full_name, photo_url, playing_role)')
        .eq('match_id', matchId)
        .order('batting_order', { ascending: true });
      if (error) throw error;
      return data as PerformanceWithPlayer[];
    },
    enabled: !!matchId,
  });
}

export function usePlayerPerformances(playerId: string | undefined) {
  return useQuery({
    queryKey: ['player-performances', playerId],
    queryFn: async () => {
      if (!playerId) return [];
      const { data, error } = await supabase
        .from('match_performances')
        .select('*, matches!match_performances_match_id_fkey(id, team_a, team_b, match_date, status)')
        .eq('player_id', playerId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as PerformanceWithMatch[];
    },
    enabled: !!playerId,
  });
}

// --- Players ---
export function usePlayers() {
  return useQuery({
    queryKey: ['players'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('full_name', { ascending: true });
      if (error) throw error;
      return data as Profile[];
    },
  });
}

export function usePlayer(playerId: string | undefined) {
  return useQuery({
    queryKey: ['player', playerId],
    queryFn: async () => {
      if (!playerId) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', playerId)
        .maybeSingle();
      if (error) throw error;
      return data as Profile | null;
    },
    enabled: !!playerId,
  });
}

export function usePlayerStats(playerId: string | undefined) {
  return useQuery({
    queryKey: ['player-stats', playerId],
    queryFn: async () => {
      if (!playerId) return null;
      const { data, error } = await supabase
        .from('player_career_stats')
        .select('*')
        .eq('player_id', playerId)
        .maybeSingle();
      if (error) throw error;
      return data as PlayerCareerStats | null;
    },
    enabled: !!playerId,
  });
}

// --- Career stats for all players (for player cards + leaderboard) ---
export function useAllPlayerStats() {
  return useQuery({
    queryKey: ['all-player-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('player_career_stats')
        .select('*');
      if (error) throw error;
      return data as PlayerCareerStats[];
    },
  });
}

// --- Announcements ---
export function useAnnouncements() {
  return useQuery({
    queryKey: ['announcements'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      return data as Announcement[];
    },
  });
}

// --- Leaderboard ---
export function useLeaderboard(period: 'all' | 'monthly') {
  return useQuery({
    queryKey: ['leaderboard', period],
    queryFn: async () => {
      let query = supabase.from('match_performances').select(`
        player_id,
        runs,
        wickets,
        match_id,
        matches!inner(match_date)
      `);

      if (period === 'monthly') {
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        query = query.gte('matches.match_date', firstDay);
      }

      const { data, error } = await query;
      if (error) throw error;

      const byPlayer = new Map<string, { runs: number; wickets: number; matches: Set<string> }>();
      for (const row of data as unknown as Array<{
        player_id: string;
        runs: number;
        wickets: number;
        match_id: string;
        matches: { match_date: string };
      }>) {
        if (!byPlayer.has(row.player_id)) {
          byPlayer.set(row.player_id, { runs: 0, wickets: 0, matches: new Set() });
        }
        const entry = byPlayer.get(row.player_id)!;
        entry.runs += row.runs ?? 0;
        entry.wickets += row.wickets ?? 0;
        entry.matches.add(row.match_id);
      }

      const { data: players } = await supabase
        .from('profiles')
        .select('id, full_name, photo_url, playing_role');
      const playerMap = new Map((players ?? []).map((p) => [p.id, p]));

      const result = Array.from(byPlayer.entries()).map(([playerId, stats]) => ({
        player_id: playerId,
        full_name: playerMap.get(playerId)?.full_name ?? 'Unknown',
        photo_url: playerMap.get(playerId)?.photo_url ?? '',
        playing_role: playerMap.get(playerId)?.playing_role ?? 'batsman',
        total_runs: stats.runs,
        total_wickets: stats.wickets,
        matches_played: stats.matches.size,
      }));

      return {
        topRunScorers: [...result].sort((a, b) => b.total_runs - a.total_runs).slice(0, 10),
        topWicketTakers: [...result].sort((a, b) => b.total_wickets - a.total_wickets).slice(0, 10),
        mostMatches: [...result].sort((a, b) => b.matches_played - a.matches_played).slice(0, 10),
      };
    },
  });
}

// --- Invalidate all cricket queries (helper for mutations) ---
export function useInvalidateCricket() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ['matches'] });
    queryClient.invalidateQueries({ queryKey: ['match-players'] });
    queryClient.invalidateQueries({ queryKey: ['match-performances'] });
    queryClient.invalidateQueries({ queryKey: ['player-stats'] });
    queryClient.invalidateQueries({ queryKey: ['all-player-stats'] });
    queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
    queryClient.invalidateQueries({ queryKey: ['player-performances'] });
  };
}
