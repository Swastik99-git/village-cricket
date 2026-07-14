import { useState, type FormEvent } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { ChevronLeft, AlertCircle, Check, Plus, Trash2, Save } from 'lucide-react';
import Layout from '../../components/Layout';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { useQueryClient } from '@tanstack/react-query';
import { useMatches, usePlayers } from '../../hooks/useQueries';
import Spinner, { EmptyState } from '../../components/Feedback';


interface PerfEntry {
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
}

function emptyEntry(order: number): PerfEntry {
  return {
    player_id: '',
    batting_order: order,
    runs: 0,
    balls_faced: 0,
    is_out: true,
    dismissal: '',
    bowling_order: 0,
    wickets: 0,
    overs_bowled: 0,
    runs_conceded: 0,
    maidens: 0,
  };
}

export default function Scorecard() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: matches, isLoading: matchesLoading } = useMatches();
  const { data: players } = usePlayers();

  const [selectedMatch, setSelectedMatch] = useState('');
  const [entries, setEntries] = useState<PerfEntry[]>([emptyEntry(1), emptyEntry(2)]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!profile?.is_admin) return <Navigate to="/" replace />;

  const completedMatches = (matches ?? []).filter((m) => m.status === 'completed');

  function updateEntry(index: number, field: keyof PerfEntry, value: string | number | boolean) {
    setEntries((prev) => prev.map((e, i) => (i === index ? { ...e, [field]: value } : e)));
  }

  function addEntry() {
    setEntries((prev) => [...prev, emptyEntry(prev.length + 1)]);
  }

  function removeEntry(index: number) {
    setEntries((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!selectedMatch) {
      setError('Please select a match.');
      return;
    }
    const validEntries = entries.filter((e) => e.player_id);
    if (validEntries.length === 0) {
      setError('Add at least one player performance.');
      return;
    }
    setSaving(true);
    const rows = validEntries.map((e) => ({
      match_id: selectedMatch,
      player_id: e.player_id,
      batting_order: Number(e.batting_order) || 0,
      runs: Number(e.runs) || 0,
      balls_faced: Number(e.balls_faced) || 0,
      is_out: e.is_out,
      dismissal: e.dismissal,
      bowling_order: Number(e.bowling_order) || 0,
      wickets: Number(e.wickets) || 0,
      overs_bowled: Number(e.overs_bowled) || 0,
      runs_conceded: Number(e.runs_conceded) || 0,
      maidens: Number(e.maidens) || 0,
    }));
    const { error } = await supabase.from('match_performances').upsert(rows, { onConflict: 'match_id,player_id' });
    setSaving(false);
    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
      queryClient.invalidateQueries({ queryKey: ['matches'] });
      queryClient.invalidateQueries({ queryKey: ['match-performances'] });
      queryClient.invalidateQueries({ queryKey: ['player-stats'] });
      queryClient.invalidateQueries({ queryKey: ['all-player-stats'] });
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
      queryClient.invalidateQueries({ queryKey: ['player-performances'] });
      setTimeout(() => navigate(`/matches/${selectedMatch}`), 1500);
    }
  }

  return (
    <Layout>
      <div className="page-container">
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 mb-4 hover:text-cricket-600 transition-colors">
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-5">Enter Scorecard</h1>

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

          {/* Match Selection */}
          <div className="card p-5">
            <label className="label-field">Select Match *</label>
            {matchesLoading ? (
              <Spinner className="py-4" />
            ) : completedMatches.length === 0 ? (
              <EmptyState title="No completed matches" message="Create and mark a match as completed first." />
            ) : (
              <select className="input-field" value={selectedMatch} onChange={(e) => setSelectedMatch(e.target.value)} required>
                <option value="">Choose a match...</option>
                {completedMatches.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.team_a} vs {m.team_b} — {new Date(m.match_date).toLocaleDateString()}
                  </option>
                ))}
              </select>
            )}
          </div>

          {selectedMatch && (
            <div className="space-y-3 animate-fade-in">
              {entries.map((entry, index) => (
                <div key={index} className="card p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-gray-400 uppercase">Player {index + 1}</span>
                    {entries.length > 1 && (
                      <button type="button" onClick={() => removeEntry(index)} className="text-red-400 hover:text-red-600">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="label-field">Player *</label>
                      <select
                        className="input-field"
                        value={entry.player_id}
                        onChange={(e) => updateEntry(index, 'player_id', e.target.value)}
                        required
                      >
                        <option value="">Select player...</option>
                        {(players ?? []).map((p) => (
                          <option key={p.id} value={p.id}>{p.full_name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Batting */}
                    <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
                      <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Batting</p>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="label-field text-xs">Runs</label>
                          <input type="number" className="input-field py-2" value={entry.runs} onChange={(e) => updateEntry(index, 'runs', e.target.value)} />
                        </div>
                        <div>
                          <label className="label-field text-xs">Balls</label>
                          <input type="number" className="input-field py-2" value={entry.balls_faced} onChange={(e) => updateEntry(index, 'balls_faced', e.target.value)} />
                        </div>
                        <div>
                          <label className="label-field text-xs">Order</label>
                          <input type="number" className="input-field py-2" value={entry.batting_order} onChange={(e) => updateEntry(index, 'batting_order', e.target.value)} />
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
                    <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
                      <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Bowling</p>
                      <div className="grid grid-cols-4 gap-2">
                        <div>
                          <label className="label-field text-xs">Wkts</label>
                          <input type="number" className="input-field py-2" value={entry.wickets} onChange={(e) => updateEntry(index, 'wickets', e.target.value)} />
                        </div>
                        <div>
                          <label className="label-field text-xs">Overs</label>
                          <input type="number" step="0.1" className="input-field py-2" value={entry.overs_bowled} onChange={(e) => updateEntry(index, 'overs_bowled', e.target.value)} />
                        </div>
                        <div>
                          <label className="label-field text-xs">Runs</label>
                          <input type="number" className="input-field py-2" value={entry.runs_conceded} onChange={(e) => updateEntry(index, 'runs_conceded', e.target.value)} />
                        </div>
                        <div>
                          <label className="label-field text-xs">Mdn</label>
                          <input type="number" className="input-field py-2" value={entry.maidens} onChange={(e) => updateEntry(index, 'maidens', e.target.value)} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              <button type="button" onClick={addEntry} className="btn-secondary w-full">
                <Plus className="w-4 h-4" /> Add Player
              </button>

              <button type="submit" disabled={saving} className="btn-primary w-full">
                <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Scorecard'}
              </button>
            </div>
          )}
        </form>
      </div>
    </Layout>
  );
}
