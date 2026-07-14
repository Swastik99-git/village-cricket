import { useState, type FormEvent } from 'react';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import { ChevronLeft, AlertCircle, Check, Edit2, Trash2, X, Plus, Megaphone } from 'lucide-react';
import Layout from '../../components/Layout';
import CategoryBadge from '../../components/CategoryBadge';
import Spinner, { EmptyState } from '../../components/Feedback';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { useAnnouncements } from '../../hooks/useQueries';
import { useQueryClient } from '@tanstack/react-query';
import { formatDate, timeAgo } from '../../lib/format';
import type { Announcement, AnnouncementCategory, AnnouncementPriority } from '../../types';

export default function ManageAnnouncements() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: announcements, isLoading } = useAnnouncements();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editBody, setEditBody] = useState('');
  const [editCategory, setEditCategory] = useState<AnnouncementCategory>('general');
  const [editPriority, setEditPriority] = useState<AnnouncementPriority>('medium');
  const [editPublishDate, setEditPublishDate] = useState('');
  const [editExpiryDate, setEditExpiryDate] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  if (!profile?.is_admin) return <Navigate to="/" replace />;

  function startEdit(ann: Announcement) {
    setEditingId(ann.id);
    setEditTitle(ann.title);
    setEditBody(ann.body);
    setEditCategory(ann.category);
    setEditPriority(ann.priority);
    setEditPublishDate(toLocalInput(ann.created_at));
    setEditExpiryDate(ann.expires_at ? toLocalInput(ann.expires_at) : '');
    setError(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setError(null);
  }

  function toLocalInput(iso: string): string {
    const d = new Date(iso);
    const off = d.getTimezoneOffset();
    const local = new Date(d.getTime() - off * 60000);
    return local.toISOString().slice(0, 16);
  }

  async function handleUpdate(e: FormEvent) {
    e.preventDefault();
    if (!editingId) return;
    setError(null);
    if (!editTitle.trim() || !editBody.trim()) {
      setError('Title and description are required.');
      return;
    }
    setSaving(true);
    const publishAt = new Date(editPublishDate).toISOString();
    const expiresAt = editExpiryDate ? new Date(editExpiryDate).toISOString() : null;

    const { error } = await supabase
      .from('announcements')
      .update({
        title: editTitle.trim(),
        body: editBody.trim(),
        category: editCategory,
        priority: editPriority,
        created_at: publishAt,
        expires_at: expiresAt,
      })
      .eq('id', editingId);

    setSaving(false);
    if (error) {
      setError(error.message);
    } else {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      setEditingId(null);
    }
  }

  async function handleDelete(id: string) {
    setError(null);
    setDeletingId(id);
    const { error } = await supabase.from('announcements').delete().eq('id', id);
    setDeletingId(null);
    if (error) {
      setError(error.message);
    } else {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
    }
  }

  return (
    <Layout>
      <div className="page-container">
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 mb-4 hover:text-cricket-600 transition-colors">
          <ChevronLeft className="w-4 h-4" /> Back
        </button>

        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-cricket-50 dark:bg-gray-800 flex items-center justify-center text-cricket-600 dark:text-cricket-400">
              <Megaphone className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Manage Announcements</h1>
          </div>
          <Link to="/admin/announcement" className="btn-primary text-sm py-2 px-3">
            <Plus className="w-4 h-4" /> New
          </Link>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 text-sm mb-4">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}

        {isLoading ? (
          <Spinner className="py-12" />
        ) : !announcements || announcements.length === 0 ? (
          <EmptyState title="No announcements yet" message="Create your first announcement." />
        ) : (
          <div className="space-y-3">
            {announcements.map((ann) =>
              editingId === ann.id ? (
                <form key={ann.id} onSubmit={handleUpdate} className="card p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Edit Announcement</h3>
                    <button type="button" onClick={cancelEdit} className="text-gray-400 hover:text-gray-600">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <div>
                    <label className="label-field text-xs">Title</label>
                    <input className="input-field py-2" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} required />
                  </div>
                  <div>
                    <label className="label-field text-xs">Description</label>
                    <textarea className="input-field min-h-[100px] resize-none py-2" value={editBody} onChange={(e) => setEditBody(e.target.value)} required />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label-field text-xs">Category</label>
                      <select className="input-field py-2" value={editCategory} onChange={(e) => setEditCategory(e.target.value as AnnouncementCategory)}>
                        <option value="general">General</option>
                        <option value="match">Match</option>
                        <option value="tournament">Tournament</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </div>
                    <div>
                      <label className="label-field text-xs">Priority</label>
                      <select className="input-field py-2" value={editPriority} onChange={(e) => setEditPriority(e.target.value as AnnouncementPriority)}>
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="label-field text-xs">Publish Date</label>
                    <input type="datetime-local" className="input-field py-2" value={editPublishDate} onChange={(e) => setEditPublishDate(e.target.value)} required />
                  </div>
                  <div>
                    <label className="label-field text-xs">Expiry Date (Optional)</label>
                    <input type="datetime-local" className="input-field py-2" value={editExpiryDate} onChange={(e) => setEditExpiryDate(e.target.value)} />
                  </div>
                  <button type="submit" disabled={saving} className="btn-primary w-full">
                    <Check className="w-4 h-4" /> {saving ? 'Updating...' : 'Update Announcement'}
                  </button>
                </form>
              ) : (
                <div key={ann.id} className="card p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <CategoryBadge category={ann.category} />
                        <span className="text-xs text-gray-400">{formatDate(ann.created_at)}</span>
                      </div>
                      <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{ann.title}</h3>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => startEdit(ann)} className="p-2 rounded-lg text-cricket-600 dark:text-cricket-400 hover:bg-cricket-50 dark:hover:bg-gray-800 transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(ann.id)}
                        disabled={deletingId === ann.id}
                        className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
                      >
                        {deletingId === ann.id ? <Spinner size="sm" /> : <Trash2 className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed line-clamp-2">{ann.body}</p>
                  <p className="text-xs text-gray-400 mt-2">{timeAgo(ann.created_at)}</p>
                </div>
              ),
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
