import { useState, type FormEvent } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { ChevronLeft, AlertCircle, Check } from 'lucide-react';
import Layout from '../../components/Layout';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { useQueryClient } from '@tanstack/react-query';

export default function CreateMatch() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [teamA, setTeamA] = useState('');
  const [teamB, setTeamB] = useState('');
  const [matchDate, setMatchDate] = useState('');
  const [matchTime, setMatchTime] = useState('');
  const [venue, setVenue] = useState('');
  const [status, setStatus] = useState<'upcoming' | 'completed'>('upcoming');
  const [toss, setToss] = useState('');
  const [winner, setWinner] = useState('');
  const [teamAScore, setTeamAScore] = useState('');
  const [teamBScore, setTeamBScore] = useState('');
  const [teamAOvers, setTeamAOvers] = useState('');
  const [teamBOvers, setTeamBOvers] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!profile?.is_admin) return <Navigate to="/" replace />;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!teamA.trim() || !teamB.trim() || !matchDate) {
      setError('Team names and match date are required.');
      return;
    }
    setSaving(true);
    const dateTime = new Date(`${matchDate}T${matchTime || '10:00'}`).toISOString();
    const { error } = await supabase.from('matches').insert({
      team_a: teamA.trim(),
      team_b: teamB.trim(),
      match_date: dateTime,
      venue: venue.trim(),
      status,
      toss: toss.trim(),
      winner: winner.trim(),
      team_a_score: teamAScore.trim(),
      team_b_score: teamBScore.trim(),
      team_a_overs: teamAOvers.trim(),
      team_b_overs: teamBOvers.trim(),
      notes: notes.trim(),
    });
    setSaving(false);
    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
      queryClient.invalidateQueries({ queryKey: ['matches'] });
      setTimeout(() => navigate('/matches'), 1500);
    }
  }

  return (
    <Layout>
      <div className="page-container">
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 mb-4 hover:text-cricket-600 transition-colors">
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-5">Create Match</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-cricket-50 dark:bg-cricket-900/20 text-cricket-700 dark:text-cricket-300 text-sm">
              <Check className="w-4 h-4 shrink-0" /> Match created! Redirecting...
            </div>
          )}

          <div className="card p-5 space-y-4">
            <div>
              <label className="label-field">Team A *</label>
              <input className="input-field" value={teamA} onChange={(e) => setTeamA(e.target.value)} required placeholder="e.g. Village Warriors" />
            </div>
            <div>
              <label className="label-field">Team B *</label>
              <input className="input-field" value={teamB} onChange={(e) => setTeamB(e.target.value)} required placeholder="e.g. Riverside CC" />
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
              <input className="input-field" value={venue} onChange={(e) => setVenue(e.target.value)} placeholder="e.g. Village Ground" />
            </div>
            <div>
              <label className="label-field">Status</label>
              <select className="input-field" value={status} onChange={(e) => setStatus(e.target.value as 'upcoming' | 'completed')}>
                <option value="upcoming">Upcoming</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          {status === 'completed' && (
            <div className="card p-5 space-y-4 animate-fade-in">
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Match Result</h3>
              <div>
                <label className="label-field">Toss</label>
                <input className="input-field" value={toss} onChange={(e) => setToss(e.target.value)} placeholder="e.g. Village Warriors won toss, elected to bat" />
              </div>
              <div>
                <label className="label-field">Winner</label>
                <input className="input-field" value={winner} onChange={(e) => setWinner(e.target.value)} placeholder="e.g. Village Warriors" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label-field">Team A Score</label>
                  <input className="input-field" value={teamAScore} onChange={(e) => setTeamAScore(e.target.value)} placeholder="120/7" />
                </div>
                <div>
                  <label className="label-field">Team A Overs</label>
                  <input className="input-field" value={teamAOvers} onChange={(e) => setTeamAOvers(e.target.value)} placeholder="15.2" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label-field">Team B Score</label>
                  <input className="input-field" value={teamBScore} onChange={(e) => setTeamBScore(e.target.value)} placeholder="85/10" />
                </div>
                <div>
                  <label className="label-field">Team B Overs</label>
                  <input className="input-field" value={teamBOvers} onChange={(e) => setTeamBOvers(e.target.value)} placeholder="12.4" />
                </div>
              </div>
              <div>
                <label className="label-field">Match Notes</label>
                <textarea className="input-field min-h-[80px] resize-none" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Brief summary of the match..." />
              </div>
            </div>
          )}

          <button type="submit" disabled={saving} className="btn-primary w-full">
            {saving ? 'Creating...' : 'Create Match'}
          </button>
        </form>
      </div>
    </Layout>
  );
}
