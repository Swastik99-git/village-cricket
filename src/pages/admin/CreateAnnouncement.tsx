import { useState, type FormEvent } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { ChevronLeft, AlertCircle, Check, Megaphone } from 'lucide-react';
import Layout from '../../components/Layout';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { useQueryClient } from '@tanstack/react-query';
import type { AnnouncementCategory, AnnouncementPriority } from '../../types';

export default function CreateAnnouncement() {
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [category, setCategory] = useState<AnnouncementCategory>('general');
  const [priority, setPriority] = useState<AnnouncementPriority>('medium');
  const [publishDate, setPublishDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!profile?.is_admin) return <Navigate to="/" replace />;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!title.trim() || !body.trim()) {
      setError('Title and description are required.');
      return;
    }
    if (!publishDate) {
      setError('Publish date is required.');
      return;
    }
    setSaving(true);
    const publishAt = new Date(publishDate).toISOString();
    const expiresAt = expiryDate ? new Date(expiryDate).toISOString() : null;

    const { error } = await supabase.from('announcements').insert({
      title: title.trim(),
      body: body.trim(),
      category,
      priority,
      created_by: user!.id,
      created_at: publishAt,
      expires_at: expiresAt,
    });
    setSaving(false);
    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      setTimeout(() => navigate('/admin/announcements'), 1500);
    }
  }

  return (
    <Layout>
      <div className="page-container">
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 mb-4 hover:text-cricket-600 transition-colors">
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        <div className="flex items-center gap-2 mb-5">
          <div className="w-10 h-10 rounded-xl bg-cricket-50 dark:bg-gray-800 flex items-center justify-center text-cricket-600 dark:text-cricket-400">
            <Megaphone className="w-5 h-5" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">New Announcement</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-cricket-50 dark:bg-cricket-900/20 text-cricket-700 dark:text-cricket-300 text-sm">
              <Check className="w-4 h-4 shrink-0" /> Announcement published! Redirecting...
            </div>
          )}

          <div className="card p-5 space-y-4">
            <div>
              <label className="label-field">Title *</label>
              <input className="input-field" value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="e.g. Practice match this Sunday" />
            </div>
            <div>
              <label className="label-field">Description *</label>
              <textarea className="input-field min-h-[140px] resize-none" value={body} onChange={(e) => setBody(e.target.value)} required placeholder="Write your announcement here..." />
            </div>
            <div>
              <label className="label-field">Category *</label>
              <select className="input-field" value={category} onChange={(e) => setCategory(e.target.value as AnnouncementCategory)}>
                <option value="general">General</option>
                <option value="match">Match</option>
                <option value="tournament">Tournament</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div>
              <label className="label-field">Priority *</label>
              <select className="input-field" value={priority} onChange={(e) => setPriority(e.target.value as AnnouncementPriority)}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div>
              <label className="label-field">Publish Date *</label>
              <input type="datetime-local" className="input-field" value={publishDate} onChange={(e) => setPublishDate(e.target.value)} required />
            </div>
            <div>
              <label className="label-field">Expiry Date (Optional)</label>
              <input type="datetime-local" className="input-field" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} />
            </div>
          </div>

          <button type="submit" disabled={saving} className="btn-primary w-full">
            {saving ? 'Publishing...' : 'Publish Announcement'}
          </button>
        </form>
      </div>
    </Layout>
  );
}
