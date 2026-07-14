import { useState, useEffect, useMemo, type FormEvent } from 'react';
import { useNavigate, useParams, Navigate, Link } from 'react-router-dom';
import { ChevronLeft, AlertCircle, Check, Search, UserPlus, Trash2, Save, ClipboardList } from 'lucide-react';
import Layout from '../../components/Layout';
import PlayerAvatar from '../../components/PlayerAvatar';
import RoleBadge from '../../components/RoleBadge';
import Spinner from '../../components/Feedback';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { useMatch, useMatchPlayers, usePlayers, useInvalidateCricket } from '../../hooks/useQueries';
import type { Profile } from '../../types';

export default function EditMatch() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const { id: matchId } = useParams<{ id: string }>();
  const invalidate = useInvalidateCricket();

  const { data: match, isLoading: matchLoading } = useMatch(matchId);
  const { data: matchPlayers, isLoading: mpLoading } = useMatchPlayers(matchId);
  const { data: players } = usePlayers();

  const [teamA, setTeamA] = useState('');
  const [teamB, setTeamB] = useState('');
  const [matchDate, setMatchDate] = useState('');
  const [matchTime, setMatchTime] = useState('');
  const [venue, setVenue] = useState('');
  const [status, setStatus] = useState<'upcoming' | 'completed'>('upcoming');
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);
  const [playerSearch, setPlayerSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [initialized, setInitialized] = useState(false);

  if (!profile?.is_admin) return <Navigate to="/" replace />;

  useEffect(() => {
    if (matchLoading || mpLoading || initialized) return;
    if (match) {
      setTeamA(match.team_a);
      setTeamB(match.team_b);
      const d = new Date(match.match_date);
      setMatchDate(d.toISOString().split('T')[0]);
      setMatchTime(d.toTimeString().slice(0, 5));
      setVenue(match.venue);
      setStatus(match.status);
    }
    if (matchPlayers) {
      setSelectedPlayerIds(matchPlayers.map((mp) => mp.player_id));
    }
    setInitialized(true);
  }, [match, matchPlayers, matchLoading, mpLoading, initialized]);

  const selectedPlayers = useMemo(
    () => (players ?? []).filter((p) => selectedPlayerIds.includes(p.id)),
    [players, selectedPlayerIds],
  );

  const filteredPlayers = useMemo(() => {
    if (!playerSearch.trim()) return (players ?? []).filter((p) => !selectedPlayerIds.includes(p.id));
    const q = playerSearch.toLowerCase();
    return (players ?? []).filter(
      (p) =>
        !selectedPlayerIds.includes(p.id) &&
        (p.full_name.toLowerCase().includes(q) || p.village?.toLowerCase().includes(q)),
    );
  }, [players, playerSearch, selectedPlayerIds]);

  function togglePlayer(id: string) {
    setSelectedPlayerIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
    );
  }

  function removePlayer(id: string) {
    setSelectedPlayerIds((prev) => prev.filter((p) => p !== id));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!matchId) return;
    if (!teamA.trim() || !teamB.trim() || !matchDate) {
      setError('Team names and match date are required.');
      return;
    }
    setSaving(true);
    const dateTime = new Date(`${matchDate}T${matchTime || '10:00'}`).toISOString();

    const { error: matchError } = await supabase
      .from('matches')
      .update({
        team_a: teamA.trim(),
        team_b: teamB.trim(),
        match_date: dateTime,
        venue: venue.trim(),
        status,
      })
      .eq('id', matchId);

    if (matchError) {
      setSaving(false);
      setError(matchError.message);
      return;
    }

    // Sync players: delete all existing, re-insert current selection
    await supabase.from('match_players').delete().eq('match_id', matchId);
    if (selectedPlayerIds.length > 0) {
      const rows = selectedPlayerIds.map((pid) => ({ match_id: matchId, player_id: pid }));
      const { error: mpError } = await supabase.from('match_players').insert(rows);
      if (mpError) {
        setSaving(false);
        setError(mpError.message);
        return;
      }
    }

    setSaving(false);
    setSuccess(true);
    invalidate();
    setTimeout(() => navigate(`/matches/${matchId}`), 1500);
  }

  if (matchLoading || mpLoading) return <Layout><div className="page-container"><Spinner className="py-20" /></div></Layout>;

  return (
    <Layout>
      <div className="page-container">
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 mb-4 hover:text-cricket-600 transition-colors">
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-5">Edit Match</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-cricket-50 dark:bg-cricket-900/20 text-cricket-700 dark:text-cricket-300 text-sm">
              <Check className="w-4 h-4 shrink-0" /> Match updated! Redirecting...
            </div>
          )}

          {/* Match Details */}
          <div className="card p-5 space-y-4">
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Match Details</h3>
            <div>
              <label className="label-field">Team A *</label>
              <input className="input-field" value={teamA} onChange={(e) => setTeamA(e.target.value)} required />
            </div>
            <div>
              <label className="label-field">Team B *</label>
              <input className="input-field" value={teamB} onChange={(e) => setTeamB(e.target.value)} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label-field">Date *</label>
                <input type="date" className="input-field" value={matchDate} onChange={(e) => setMatchDate(e.target.value)} required />
              </div>
              <div>
                <label className="label-field">Time</label>
                <input type="time" className="input-field" value={matchTime} onChange={(e) => setMatchTime(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="label-field">Venue</label>
              <input className="input-field" value={venue} onChange={(e) => setVenue(e.target.value)} />
            </div>
            <div>
              <label className="label-field">Status</label>
              <select className="input-field" value={status} onChange={(e) => setStatus(e.target.value as 'upcoming' | 'completed')}>
                <option value="upcoming">Upcoming</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          {/* Player Management */}
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-3">
              <UserPlus className="w-5 h-5 text-cricket-600 dark:text-cricket-400" />
              <h3 className="font-semibold text-gray-900 dark:text-white">Manage Players</h3>
              {selectedPlayerIds.length > 0 && (
                <span className="chip bg-cricket-100 dark:bg-cricket-900/40 text-cricket-700 dark:text-cricket-300">
                  {selectedPlayerIds.length} selected
                </span>
              )}
            </div>

            {/* Selected Players */}
            {selectedPlayers.length > 0 && (
              <div className="space-y-2 mb-4">
                {selectedPlayers.map((p) => (
                  <div key={p.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-cricket-50 dark:bg-gray-800">
                    <PlayerAvatar profile={p} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{p.full_name}</p>
                      {p.village && <p className="text-xs text-gray-400 truncate">{p.village}</p>}
                    </div>
                    <RoleBadge role={p.playing_role} />
                    <button type="button" onClick={() => removePlayer(p.id)} className="text-red-400 hover:text-red-600 p-1">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Search */}
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                className="input-field pl-10"
                placeholder="Search players to add..."
                value={playerSearch}
                onChange={(e) => setPlayerSearch(e.target.value)}
              />
            </div>

            {/* Available Players */}
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {filteredPlayers.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">
                  {playerSearch ? 'No players found.' : 'All players selected.'}
                </p>
              ) : (
                filteredPlayers.map((p: Profile) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => togglePlayer(p.id)}
                    className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left"
                  >
                    <PlayerAvatar profile={p} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{p.full_name}</p>
                      {p.village && <p className="text-xs text-gray-400 truncate">{p.village}</p>}
                    </div>
                    <RoleBadge role={p.playing_role} />
                    <div className="w-6 h-6 rounded-full border-2 border-cricket-500 flex items-center justify-center shrink-0">
                      <span className="text-cricket-500 text-lg leading-none">+</span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          <button type="submit" disabled={saving} className="btn-primary w-full">
            <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Changes'}
          </button>

          {/* Scorecard Link */}
          {status === 'completed' && (
            <Link to={`/admin/scorecard/${matchId}`} className="btn-secondary w-full">
              <ClipboardList className="w-4 h-4" /> Edit Scorecard
            </Link>
          )}
        </form>
      </div>
    </Layout>
  );
}
