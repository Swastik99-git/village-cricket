import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Check, UserCircle } from 'lucide-react';
import Layout from '../../components/Layout';
import PlayerAvatar from '../../components/PlayerAvatar';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import type { PlayingRole } from '../../types';

export default function CompleteProfile() {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const [village, setVillage] = useState('');
  const [playingRole, setPlayingRole] = useState<PlayingRole>('batsman');
  const [battingStyle, setBattingStyle] = useState('');
  const [bowlingStyle, setBowlingStyle] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({
        village: village.trim(),
        playing_role: playingRole,
        batting_style: battingStyle.trim(),
        bowling_style: bowlingStyle.trim(),
      })
      .eq('id', user!.id);
    setSaving(false);
    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
      await refreshProfile();
      setTimeout(() => navigate('/'), 1500);
    }
  }

  return (
    <Layout showNav={false}>
      <div className="page-container pt-12">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-cricket-50 dark:bg-gray-800 text-cricket-600 dark:text-cricket-400 mb-3">
            <UserCircle className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Complete Your Profile</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1.5">
            Welcome{profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''}! Tell us a bit about yourself to get started.
          </p>
        </div>

        <div className="flex justify-center mb-6">
          <PlayerAvatar
            profile={{ photo_url: profile?.photo_url ?? '', full_name: profile?.full_name ?? '' }}
            size="xl"
          />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-cricket-50 dark:bg-cricket-900/20 text-cricket-700 dark:text-cricket-300 text-sm">
              <Check className="w-4 h-4 shrink-0" />
              Profile saved! Redirecting to Home...
            </div>
          )}

          <div className="card p-5 space-y-4">
            <div>
              <label className="label-field">Village *</label>
              <input
                className="input-field"
                value={village}
                onChange={(e) => setVillage(e.target.value)}
                required
                placeholder="e.g. Rampur"
              />
            </div>
            <div>
              <label className="label-field">Playing Role *</label>
              <select
                className="input-field"
                value={playingRole}
                onChange={(e) => setPlayingRole(e.target.value as PlayingRole)}
              >
                <option value="batsman">Batsman</option>
                <option value="bowler">Bowler</option>
                <option value="all_rounder">All-Rounder</option>
                <option value="wicket_keeper">Wicket Keeper</option>
              </select>
            </div>
            <div>
              <label className="label-field">Batting Style</label>
              <input
                className="input-field"
                value={battingStyle}
                onChange={(e) => setBattingStyle(e.target.value)}
                placeholder="e.g. Right-hand"
              />
            </div>
            <div>
              <label className="label-field">Bowling Style</label>
              <input
                className="input-field"
                value={bowlingStyle}
                onChange={(e) => setBowlingStyle(e.target.value)}
                placeholder="e.g. Right-arm medium"
              />
            </div>
          </div>

          <button type="submit" disabled={saving} className="btn-primary w-full">
            {saving ? 'Saving...' : 'Save & Continue'}
          </button>
        </form>
      </div>
    </Layout>
  );
}
