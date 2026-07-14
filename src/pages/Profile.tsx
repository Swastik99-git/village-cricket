import { useState, useRef, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Camera, LogOut, Lock, Sun, Moon, Shield, ChevronRight, Check, AlertCircle } from 'lucide-react';
import Layout from '../components/Layout';
import PlayerAvatar from '../components/PlayerAvatar';
import RoleBadge from '../components/RoleBadge';
import Spinner from '../components/Feedback';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { usePlayerStats } from '../hooks/useQueries';
import { supabase } from '../lib/supabase';
import type { PlayingRole } from '../types';

export default function Profile() {
  const { user, profile, loading, signOut, refreshProfile } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [editing, setEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const [village, setVillage] = useState(profile?.village ?? '');
  const [playingRole, setPlayingRole] = useState<PlayingRole>((profile?.playing_role as PlayingRole) ?? 'batsman');
  const [battingStyle, setBattingStyle] = useState(profile?.batting_style ?? '');
  const [bowlingStyle, setBowlingStyle] = useState(profile?.bowling_style ?? '');

  const { data: stats } = usePlayerStats(user?.id);
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  if (loading) return <Layout><div className="page-container"><Spinner className="py-20" /></div></Layout>;
  if (!user) {
    navigate('/login');
    return null;
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    setError(null);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('profile-photos')
        .upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ photo_url: urlData.publicUrl })
        .eq('id', user.id);
      if (updateError) throw updateError;

      await refreshProfile();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload photo');
    } finally {
      setUploading(false);
    }
  }

  async function handleSaveProfile(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: fullName.trim(),
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
      setTimeout(() => {
        setEditing(false);
        setSuccess(false);
      }, 1500);
    }
  }

  async function handleSignOut() {
    await signOut();
    navigate('/login');
  }

  return (
    <Layout>
      <div className="page-container">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-5">My Profile</h1>

        {/* Profile Card */}
        <div className="card p-6 mb-5 text-center">
          <div className="relative inline-block mb-4">
            <PlayerAvatar
              profile={{ photo_url: profile?.photo_url ?? '', full_name: profile?.full_name ?? '' }}
              size="xl"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-cricket-600 text-white flex items-center justify-center shadow-lg hover:bg-cricket-700 transition-colors disabled:opacity-50"
            >
              {uploading ? <Spinner size="sm" /> : <Camera className="w-4 h-4" />}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              className="hidden"
            />
          </div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">{profile?.full_name}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
          {profile?.village && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{profile.village}</p>
          )}
          <div className="mt-3 flex items-center justify-center gap-2">
            <RoleBadge role={profile?.playing_role ?? 'batsman'} />
            {profile?.is_admin && (
              <span className="chip bg-cricket-600 text-white flex items-center gap-1">
                <Shield className="w-3 h-3" /> Admin
              </span>
            )}
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm mb-4">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Stats Summary */}
        {stats && (
          <div className="grid grid-cols-3 gap-3 mb-5">
            <div className="card p-4 text-center">
              <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.matches_played}</p>
              <p className="text-xs text-gray-400">Matches</p>
            </div>
            <div className="card p-4 text-center">
              <p className="text-xl font-bold text-cricket-600 dark:text-cricket-400">{stats.total_runs}</p>
              <p className="text-xs text-gray-400">Runs</p>
            </div>
            <div className="card p-4 text-center">
              <p className="text-xl font-bold text-cricket-600 dark:text-cricket-400">{stats.total_wickets}</p>
              <p className="text-xs text-gray-400">Wickets</p>
            </div>
          </div>
        )}

        {/* Edit / View Toggle */}
        {!editing ? (
          <div className="card p-5 mb-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 dark:text-white">Personal Information</h3>
              <button onClick={() => setEditing(true)} className="btn-ghost text-sm text-cricket-600 dark:text-cricket-400">
                Edit
              </button>
            </div>
            <div className="space-y-3">
              <InfoRow label="Full Name" value={profile?.full_name} />
              <InfoRow label="Village" value={profile?.village} />
              <InfoRow label="Playing Role" value={roleLabel(profile?.playing_role)} />
              <InfoRow label="Batting Style" value={profile?.batting_style} />
              <InfoRow label="Bowling Style" value={profile?.bowling_style} />
            </div>
          </div>
        ) : (
          <form onSubmit={handleSaveProfile} className="card p-5 mb-5">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Edit Information</h3>
            <div className="space-y-4">
              <div>
                <label className="label-field">Full Name</label>
                <input className="input-field" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
              </div>
              <div>
                <label className="label-field">Village</label>
                <input className="input-field" value={village} onChange={(e) => setVillage(e.target.value)} />
              </div>
              <div>
                <label className="label-field">Playing Role</label>
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
                <input className="input-field" value={battingStyle} onChange={(e) => setBattingStyle(e.target.value)} placeholder="e.g. Right-hand" />
              </div>
              <div>
                <label className="label-field">Bowling Style</label>
                <input className="input-field" value={bowlingStyle} onChange={(e) => setBowlingStyle(e.target.value)} placeholder="e.g. Right-arm medium" />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button type="button" onClick={() => setEditing(false)} className="btn-ghost flex-1">
                Cancel
              </button>
              <button type="submit" disabled={saving} className="btn-primary flex-1">
                {success ? <><Check className="w-4 h-4" /> Saved!</> : saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        )}

        {/* Settings */}
        <div className="card overflow-hidden mb-5">
          <button
            onClick={() => setShowPasswordForm(!showPasswordForm)}
            className="w-full flex items-center gap-3 px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500">
              <Lock className="w-4 h-4" />
            </div>
            <span className="flex-1 text-left text-sm font-medium text-gray-900 dark:text-white">Change Password</span>
            <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${showPasswordForm ? 'rotate-90' : ''}`} />
          </button>
          {showPasswordForm && <ChangePasswordForm />}
          <div className="border-t border-gray-100 dark:border-gray-800">
            <button
              onClick={toggleTheme}
              className="w-full flex items-center gap-3 px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500">
                {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
              </div>
              <span className="flex-1 text-left text-sm font-medium text-gray-900 dark:text-white">
                {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
              </span>
              <span className="text-xs text-gray-400">{theme === 'light' ? 'Off' : 'On'}</span>
            </button>
          </div>
        </div>

        {/* Admin Link */}
        {profile?.is_admin && (
          <Link to="/admin" className="card p-4 mb-5 flex items-center gap-3 hover:shadow-card-hover transition-all active:scale-[0.98]">
            <div className="w-10 h-10 rounded-xl bg-cricket-50 dark:bg-gray-800 flex items-center justify-center text-cricket-600 dark:text-cricket-400">
              <Shield className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900 dark:text-white text-sm">Admin Panel</p>
              <p className="text-xs text-gray-400">Manage matches & announcements</p>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-300" />
          </Link>
        )}

        {/* Sign Out */}
        <button onClick={handleSignOut} className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl border border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400 font-semibold hover:bg-red-50 dark:hover:bg-red-900/20 transition-all active:scale-[0.98]">
          <LogOut className="w-5 h-5" /> Sign Out
        </button>
      </div>
    </Layout>
  );
}

function InfoRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
      <span className="text-sm font-medium text-gray-900 dark:text-white">{value || 'Not set'}</span>
    </div>
  );
}

function ChangePasswordForm() {
  const { updatePassword } = useAuth();
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    const { error } = await updatePassword(newPassword);
    setLoading(false);
    if (error) {
      setError(error);
    } else {
      setSuccess(true);
      setNewPassword('');
      setConfirm('');
      setTimeout(() => setSuccess(false), 3000);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="px-5 pb-5 pt-2 space-y-3 border-t border-gray-100 dark:border-gray-800">
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-cricket-50 dark:bg-cricket-900/20 text-cricket-700 dark:text-cricket-300 text-sm">
          <Check className="w-4 h-4 shrink-0" />
          <span>Password updated successfully!</span>
        </div>
      )}
      <div>
        <label className="label-field">New Password</label>
        <input type="password" className="input-field" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
      </div>
      <div>
        <label className="label-field">Confirm Password</label>
        <input type="password" className="input-field" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
      </div>
      <button type="submit" disabled={loading} className="btn-primary w-full text-sm">
        {loading ? 'Updating...' : 'Update Password'}
      </button>
    </form>
  );
}

function roleLabel(role?: string): string {
  const labels: Record<string, string> = {
    batsman: 'Batsman',
    bowler: 'Bowler',
    all_rounder: 'All-Rounder',
    wicket_keeper: 'Wicket Keeper',
  };
  return labels[role ?? ''] ?? 'Not set';
}
