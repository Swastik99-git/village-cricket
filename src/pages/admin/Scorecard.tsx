import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate, useParams, Navigate } from 'react-router-dom';
import { ChevronLeft, AlertCircle, Check, Save, Award, Target, Shield } from 'lucide-react';
import Layout from '../../components/Layout';
import PlayerAvatar from '../../components/PlayerAvatar';
import Spinner, { EmptyState } from '../../components/Feedback';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { useMatch, useMatchPlayers, useMatchPerformances, useInvalidateCricket } from '../../hooks/useQueries';
import type { MatchPlayerWithProfile, PerformanceWithPlayer } from '../../types';

interface PerfEntry {
  player_id: string;
  full_name: string;
  photo_url: string;
  playing_role: string;
  runs: number;
  balls_faced: number;
  fours: number;
  sixes: number;
  is_out: boolean;
  dismissal: string;
  batting_order: number;
  wickets: number;
  overs_bowled: number;
  runs_conceded: number;
  maidens: number;
  catches: number;
  run_outs: number;
}

function entryFromPlayer(mp: MatchPlayerWithProfile, order: number, existing?: PerformanceWithPlayer): PerfEntry {
  return {
    player_id: mp.player_id,
    full_name: mp.profiles?.full_name ?? 'Unknown',
    photo_url: mp.profiles?.photo_url ?? '',
    playing_role: mp.profiles?.playing_role ?? 'batsman',
    runs: existing?.runs ?? 0,
    balls_faced: existing?.balls_faced ?? 0,
    fours: existing?.fours ?? 0,
    sixes: existing?.sixes ?? 0,
    is_out: existing?.is_out ?? false,
    dismissal: existing?.dismissal ?? '',
    batting_order: existing?.batting_order ?? order,
    wickets: existing?.wickets ?? 0,
    overs_bowled: existing?.overs_bowled ?? 0,
    runs_conceded: existing?.runs_conceded ?? 0,
    maidens: existing?.maidens ?? 0,
    catches: existing?.catches ?? 0,
    run_outs: existing?.run_outs ?? 0,
  };
}

export default function Scorecard() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const { id: matchId } = useParams<{ id: string }>();
  const invalidate = useInvalidateCricket();

  const { data: match, isLoading: matchLoading } = useMatch(matchId);
  const { data: matchPlayers, isLoading: mpLoading } = useMatchPlayers(matchId);
  const { data: existingPerfs } = useMatchPerformances(matchId);

  const [entries, setEntries] = useState<PerfEntry[]>([]);
  const [teamAScore, setTeamAScore] = useState('');
  const [teamBScore, setTeamBScore] = useState('');
  const [teamAOvers, setTeamAOvers] = useState('');
  const [teamBOvers, setTeamBOvers] = useState('');
  const [winner, setWinner] = useState('');
  const [winningMargin, setWinningMargin] = useState('');
  const [manOfMatch, setManOfMatch] = useState('');
  const [, setStatus] = useState<'upcoming' | 'completed'>('completed');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [initialized, setInitialized] = useState(false);

  if (!profile?.is_admin) return <Navigate to="/" replace />;

  useEffect(() => {
    if (mpLoading || matchLoading || initialized) return;
    if (matchPlayers && matchPlayers.length > 0) {
      const perfMap = new Map((existingPerfs ?? []).map((p) => [p.player_id, p]));
      setEntries(matchPlayers.map((mp, i) => entryFromPlayer(mp, i + 1, perfMap.get(mp.player_id))));
    }
    if (match) {
      setTeamAScore(match.team_a_score || '');
      setTeamBScore(match.team_b_score || '');
      setTeamAOvers(match.team_a_overs || '');
      setTeamBOvers(match.team_b_overs || '');
      setWinner(match.winner || '');
      setWinningMargin(match.winning_margin || '');
      setManOfMatch(match.man_of_match_player_id || '');
      setStatus(match.status === 'completed' ? 'completed' : 'completed');
    }
    setInitialized(true);
  }, [matchPlayers, existingPerfs, match, mpLoading, matchLoading, initialized]);

  function updateEntry(index: number, field: keyof PerfEntry, value: string | number | boolean) {
    setEntries((prev) => prev.map((e, i) => (i === index ? { ...e, [field]: value } : e)));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!matchId) return;
    if (entries.length === 0) {
      setError('No players selected for this match.');
      return;
    }
    setSaving(true);

    // Update match details
    const { error: matchError } = await supabase
      .from('matches')
      .update({
        status: 'completed',
        team_a_score: teamAScore.trim(),
        team_b_score: teamBScore.trim(),
        team_a_overs: teamAOvers.trim(),
        team_b_overs: teamBOvers.trim(),
        winner: winner.trim(),
        winning_margin: winningMargin.trim(),
        man_of_match_player_id: manOfMatch || null,
      })
      .eq('id', matchId);

    if (matchError) {
      setSaving(false);
      setError(matchError.message);
      return;
    }

    // Upsert performances
    const rows = entries.map((e) => ({
      match_id: matchId,
      player_id: e.player_id,
      batting_order: Number(e.batting_order) || 0,
      runs: Number(e.runs) || 0,
      balls_faced: Number(e.balls_faced) || 0,
      is_out: e.is_out,
      dismissal: e.dismissal,
      fours: Number(e.fours) || 0,
      sixes: Number(e.sixes) || 0,
      bowling_order: 0,
      wickets: Number(e.wickets) || 0,
      overs_bowled: Number(e.overs_bowled) || 0,
      runs_conceded: Number(e.runs_conceded) || 0,
      maidens: Number(e.maidens) || 0,
      catches: Number(e.catches) || 0,
      run_outs: Number(e.run_outs) || 0,
    }));

    const { error: perfError } = await supabase
      .from('match_performances')
      .upsert(rows, { onConflict: 'match_id,player_id' });

    setSaving(false);
    if (perfError) {
      setError(perfError.message);
    } else {
      setSuccess(true);
      invalidate();
      setTimeout(() => navigate(`/matches/${matchId}`), 1500);
    }
  }

  if (matchLoading || mpLoading) return <Layout><div className="page-container"><Spinner className="py-20" /></div></Layout>;

  return (
    <Layout>
      <div className="page-container">
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 mb-4 hover:text-cricket-600 transition-colors">
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Scorecard</h1>
        {match && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
            {match.team_a} vs {match.team_b}
          </p>
        )}

        {entries.length === 0 ? (
          <EmptyState title="No players selected" message="Add players to this match before entering the scorecard." />
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" /> {error}
              </div>
            )}
            {success && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-cricket-50 dark:bg-cricket-900/20 text-cricket-700 dark:text-cricket-300 text-sm">
                <Check className="w-4 h-4 shrink-0" /> Scorecard saved! Redirecting...
              </div>
            )}

            {/* Match Summary */}
            <div className="card p-5 space-y-4">
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Match Summary</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label-field text-xs">{match?.team_a} Score</label>
                  <input className="input-field py-2" value={teamAScore} onChange={(e) => setTeamAScore(e.target.value)} placeholder="120/7" />
                </div>
                <div>
                  <label className="label-field text-xs">Overs</label>
                  <input className="input-field py-2" value={teamAOvers} onChange={(e) => setTeamAOvers(e.target.value)} placeholder="15.2" />
                </div>
                <div>
                  <label className="label-field text-xs">{match?.team_b} Score</label>
                  <input className="input-field py-2" value={teamBScore} onChange={(e) => setTeamBScore(e.target.value)} placeholder="85/10" />
                </div>
                <div>
                  <label className="label-field text-xs">Overs</label>
                  <input className="input-field py-2" value={teamBOvers} onChange={(e) => setTeamBOvers(e.target.value)} placeholder="12.4" />
                </div>
              </div>
              <div>
                <label className="label-field text-xs">Winner</label>
                <input className="input-field py-2" value={winner} onChange={(e) => setWinner(e.target.value)} placeholder="e.g. Village Warriors" />
              </div>
              <div>
                <label className="label-field text-xs">Winning Margin</label>
                <input className="input-field py-2" value={winningMargin} onChange={(e) => setWinningMargin(e.target.value)} placeholder="e.g. by 35 runs" />
              </div>
              <div>
                <label className="label-field text-xs">Man of the Match</label>
                <select className="input-field py-2" value={manOfMatch} onChange={(e) => setManOfMatch(e.target.value)}>
                  <option value="">None</option>
                  {entries.map((e) => (
                    <option key={e.player_id} value={e.player_id}>{e.full_name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Per-Player Performance */}
            {entries.map((entry, index) => (
              <div key={entry.player_id} className="card p-4">
                <div className="flex items-center gap-3 mb-3">
                  <PlayerAvatar profile={{ photo_url: entry.photo_url, full_name: entry.full_name }} size="sm" />
                  <p className="font-semibold text-gray-900 dark:text-white text-sm">{entry.full_name}</p>
                </div>

                {/* Batting */}
                <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
                  <p className="text-xs font-semibold text-gray-400 uppercase mb-2 flex items-center gap-1">
                    <Award className="w-3.5 h-3.5" /> Batting
                  </p>
                  <div className="grid grid-cols-4 gap-2">
                    <div>
                      <label className="label-field text-xs">Runs</label>
                      <input type="number" className="input-field py-2 text-sm" value={entry.runs} onChange={(e) => updateEntry(index, 'runs', e.target.value)} />
                    </div>
                    <div>
                      <label className="label-field text-xs">Balls</label>
                      <input type="number" className="input-field py-2 text-sm" value={entry.balls_faced} onChange={(e) => updateEntry(index, 'balls_faced', e.target.value)} />
                    </div>
                    <div>
                      <label className="label-field text-xs">4s</label>
                      <input type="number" className="input-field py-2 text-sm" value={entry.fours} onChange={(e) => updateEntry(index, 'fours', e.target.value)} />
                    </div>
                    <div>
                      <label className="label-field text-xs">6s</label>
                      <input type="number" className="input-field py-2 text-sm" value={entry.sixes} onChange={(e) => updateEntry(index, 'sixes', e.target.value)} />
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mt-2">
                    <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <input type="checkbox" checked={entry.is_out} onChange={(e) => updateEntry(index, 'is_out', e.target.checked)} className="w-4 h-4 rounded text-cricket-600" />
                      Out
                    </label>
                    <input className="input-field flex-1 py-2 text-sm" value={entry.dismissal} onChange={(e) => updateEntry(index, 'dismissal', e.target.value)} placeholder="Dismissal (e.g. b Smith)" />
                  </div>
                </div>

                {/* Bowling */}
                <div className="pt-3 mt-3 border-t border-gray-100 dark:border-gray-800">
                  <p className="text-xs font-semibold text-gray-400 uppercase mb-2 flex items-center gap-1">
                    <Target className="w-3.5 h-3.5" /> Bowling
                  </p>
                  <div className="grid grid-cols-4 gap-2">
                    <div>
                      <label className="label-field text-xs">Overs</label>
                      <input type="number" step="0.1" className="input-field py-2 text-sm" value={entry.overs_bowled} onChange={(e) => updateEntry(index, 'overs_bowled', e.target.value)} />
                    </div>
                    <div>
                      <label className="label-field text-xs">Mdn</label>
                      <input type="number" className="input-field py-2 text-sm" value={entry.maidens} onChange={(e) => updateEntry(index, 'maidens', e.target.value)} />
                    </div>
                    <div>
                      <label className="label-field text-xs">Runs</label>
                      <input type="number" className="input-field py-2 text-sm" value={entry.runs_conceded} onChange={(e) => updateEntry(index, 'runs_conceded', e.target.value)} />
                    </div>
                    <div>
                      <label className="label-field text-xs">Wkts</label>
                      <input type="number" className="input-field py-2 text-sm" value={entry.wickets} onChange={(e) => updateEntry(index, 'wickets', e.target.value)} />
                    </div>
                  </div>
                </div>

                {/* Fielding */}
                <div className="pt-3 mt-3 border-t border-gray-100 dark:border-gray-800">
                  <p className="text-xs font-semibold text-gray-400 uppercase mb-2 flex items-center gap-1">
                    <Shield className="w-3.5 h-3.5" /> Fielding
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="label-field text-xs">Catches</label>
                      <input type="number" className="input-field py-2 text-sm" value={entry.catches} onChange={(e) => updateEntry(index, 'catches', e.target.value)} />
                    </div>
                    <div>
                      <label className="label-field text-xs">Run Outs</label>
                      <input type="number" className="input-field py-2 text-sm" value={entry.run_outs} onChange={(e) => updateEntry(index, 'run_outs', e.target.value)} />
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <button type="submit" disabled={saving} className="btn-primary w-full">
              <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Scorecard'}
            </button>
          </form>
        )}
      </div>
    </Layout>
  );
}
