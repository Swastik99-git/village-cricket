import { useState, useMemo } from 'react';
import { Search, Megaphone, Filter } from 'lucide-react';
import Layout from '../components/Layout';
import CategoryBadge from '../components/CategoryBadge';
import Spinner, { EmptyState } from '../components/Feedback';
import { useAnnouncements } from '../hooks/useQueries';
import { formatDate } from '../lib/format';
import type { AnnouncementCategory } from '../types';

type FilterCategory = 'all' | AnnouncementCategory;

export default function Announcements() {
  const { data: announcements, isLoading } = useAnnouncements();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterCategory>('all');

  const filtered = useMemo(() => {
    if (!announcements) return [];
    let result = [...announcements].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
    if (filter !== 'all') {
      result = result.filter((a) => a.category === filter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (a) => a.title.toLowerCase().includes(q) || a.body.toLowerCase().includes(q),
      );
    }
    return result;
  }, [announcements, filter, search]);

  const filterOptions: { value: FilterCategory; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'general', label: 'General' },
    { value: 'match', label: 'Match' },
    { value: 'tournament', label: 'Tournament' },
    { value: 'urgent', label: 'Urgent' },
  ];

  return (
    <Layout>
      <div className="page-container">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-10 h-10 rounded-xl bg-cricket-50 dark:bg-gray-800 flex items-center justify-center text-cricket-600 dark:text-cricket-400">
            <Megaphone className="w-5 h-5" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Announcements</h1>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            className="input-field pl-10"
            placeholder="Search announcements..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-2 mb-5 overflow-x-auto pb-1">
          <Filter className="w-4 h-4 text-gray-400 shrink-0" />
          {filterOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setFilter(opt.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                filter === opt.value
                  ? 'bg-cricket-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Results */}
        {isLoading ? (
          <Spinner className="py-12" />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<Megaphone className="w-12 h-12" />}
            title="No announcements yet"
            message={search || filter !== 'all' ? 'Try adjusting your search or filter.' : 'Check back later for updates.'}
          />
        ) : (
          <div className="space-y-3">
            {filtered.map((ann) => (
              <div key={ann.id} className="card p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CategoryBadge category={ann.category} />
                  <span className="text-xs text-gray-400">{formatDate(ann.created_at)}</span>
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-1">{ann.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{ann.body}</p>
                {ann.expires_at && (
                  <p className="text-xs text-gray-400 mt-2">Expires: {formatDate(ann.expires_at)}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
