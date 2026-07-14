import { Link, Navigate } from 'react-router-dom';
import { Trophy, Megaphone, ClipboardList, Shield, ChevronRight, Calendar } from 'lucide-react';
import Layout from '../../components/Layout';
import { useAuth } from '../../context/AuthContext';
import { useMatches } from '../../hooks/useQueries';
import { formatDate } from '../../lib/format';

export default function Admin() {
  const { profile, loading } = useAuth();
  const { data: matches } = useMatches();

  if (loading) return <Layout><div className="page-container" /></Layout>;
  if (!profile?.is_admin) return <Navigate to="/" replace />;

  const completedMatches = (matches ?? []).filter((m) => m.status === 'completed');

  const actions = [
    {
      to: '/admin/match',
      icon: Trophy,
      title: 'Create Match',
      desc: 'Schedule a new match with teams and venue',
    },
    {
      to: '/admin/announcement',
      icon: Megaphone,
      title: 'Publish Announcement',
      desc: 'Share news and updates with the community',
    },
  ];

  return (
    <Layout>
      <div className="page-container">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-10 h-10 rounded-xl bg-cricket-600 flex items-center justify-center text-white">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Panel</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Manage matches and content</p>
          </div>
        </div>

        <div className="space-y-3 mb-6">
          {actions.map(({ to, icon: Icon, title, desc }) => (
            <Link key={to} to={to} className="card p-4 flex items-center gap-4 hover:shadow-card-hover transition-all active:scale-[0.98]">
              <div className="w-12 h-12 rounded-xl bg-cricket-50 dark:bg-gray-800 flex items-center justify-center text-cricket-600 dark:text-cricket-400">
                <Icon className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900 dark:text-white">{title}</p>
                <p className="text-xs text-gray-400">{desc}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-300" />
            </Link>
          ))}
        </div>

        {/* Scorecard Entry — pick a match */}
        <div className="mb-3">
          <h2 className="section-title mb-3 flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-cricket-600 dark:text-cricket-400" /> Enter Scorecard
          </h2>
          {completedMatches.length === 0 ? (
            <div className="card p-5">
              <p className="text-sm text-gray-400 text-center">No completed matches. Create a match and mark it completed first.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {completedMatches.map((m) => (
                <Link
                  key={m.id}
                  to={`/admin/scorecard/${m.id}`}
                  className="card p-4 flex items-center gap-3 hover:shadow-card-hover transition-all active:scale-[0.98]"
                >
                  <div className="w-10 h-10 rounded-xl bg-cricket-50 dark:bg-gray-800 flex items-center justify-center text-cricket-600 dark:text-cricket-400">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white text-sm truncate">
                      {m.team_a} vs {m.team_b}
                    </p>
                    <p className="text-xs text-gray-400">{formatDate(m.match_date)}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
