import { Link, Navigate } from 'react-router-dom';
import { Trophy, Megaphone, ClipboardList, Shield, ChevronRight } from 'lucide-react';
import Layout from '../../components/Layout';
import { useAuth } from '../../context/AuthContext';

export default function Admin() {
  const { profile, loading } = useAuth();

  if (loading) return <Layout><div className="page-container" /></Layout>;
  if (!profile?.is_admin) return <Navigate to="/" replace />;

  const actions = [
    {
      to: '/admin/match',
      icon: Trophy,
      title: 'Create Match',
      desc: 'Schedule a new match with teams and venue',
    },
    {
      to: '/admin/scorecard',
      icon: ClipboardList,
      title: 'Enter Scorecard',
      desc: 'Add batting & bowling performances for a match',
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

        <div className="space-y-3">
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
      </div>
    </Layout>
  );
}
