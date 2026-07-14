import { Link, useParams } from 'react-router-dom';
import { MapPin, ChevronLeft, Activity, Trophy } from 'lucide-react';
import Layout from '../components/Layout';
import PlayerAvatar from '../components/PlayerAvatar';
import RoleBadge from '../components/RoleBadge';
import Spinner, { EmptyState, ErrorState } from '../components/Feedback';
import { usePlayer, usePlayerStats, usePlayerPerformances } from '../hooks/useQueries';
import { formatDate } from '../lib/format';
import type { PlayingRole } from '../types';

export default function PlayerProfile() {
  const { id } = useParams<{ id: string }>();
  const { data: player, isLoading, error, refetch } = usePlayer(id);
  const { data: stats } = usePlayerStats(id);
  const { data: performances, isLoading: perfLoading } = usePlayerPerformances(id);

  if (isLoading) return <Layout><div className="page-container"><Spinner className="py-20" /></div></Layout>;
  if (error) return <Layout><div className="page-container"><ErrorState message={error.message} onRetry={refetch} /></div></Layout>;
  if (!player) return <Layout><div className="page-container"><EmptyState title="Player not found" /></div></Layout>;

  return (
    <Layout>
      <div className="page-container">
        <Link to="/players" className="inline-flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 mb-4 hover:text-cricket-600 dark:hover:text-cricket-400 transition-colors">
          <ChevronLeft className="w-4 h-4" /> Back to Players
        </Link>

        {/* Profile Header */}
        <div className="card p-6 mb-5 text-center">
          <div className="flex justify-center mb-4">
            <PlayerAvatar profile={player} size="xl" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">{player.full_name}</h1>
          {player.village && (
            <div className="flex items-center justify-center gap-1 mt-1 text-sm text-gray-500 dark:text-gray-400">
              <MapPin className="w-4 h-4" />
              <span>{player.village}</span>
            </div>
          )}
          <div className="mt-3">
            <RoleBadge role={player.playing_role as PlayingRole} />
          </div>
        </div>

        {/* Bio Details */}
        <div className="card p-5 mb-5">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">Playing Details</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500 dark:text-gray-400">Batting Style</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {player.batting_style || 'Not specified'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500 dark:text-gray-400">Bowling Style</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {player.bowling_style || 'Not specified'}
              </span>
            </div>
          </div>
        </div>

        {/* Career Statistics */}
        <div className="mb-5">
          <h2 className="section-title mb-3">Career Statistics</h2>
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="Matches" value={stats?.matches_played ?? 0} icon={<Activity className="w-4 h-4" />} />
            <StatCard label="Total Runs" value={stats?.total_runs ?? 0} />
            <StatCard label="Total Wickets" value={stats?.total_wickets ?? 0} />
            <StatCard label="Highest Score" value={stats?.highest_score ?? 0} />
            <StatCard
              label="Best Bowling"
              value={stats?.best_bowling_wickets ? `${stats.best_bowling_wickets}/${stats.best_bowling_runs}` : '-'}
            />
            <StatCard
              label="Batting Avg"
              value={stats?.batting_average ?? '-'}
            />
          </div>
        </div>

        {/* Recent Performances */}
        <div>
          <h2 className="section-title mb-3">Recent Matches</h2>
          {perfLoading ? (
            <Spinner className="py-4" />
          ) : performances && performances.length > 0 ? (
            <div className="space-y-3">
              {performances.slice(0, 5).map((perf) => (
                <Link key={perf.id} to={`/matches/${perf.match_id}`}>
                  <div className="card p-4 hover:shadow-card-hover transition-all active:scale-[0.98]">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {perf.matches?.team_a} vs {perf.matches?.team_b}
                      </p>
                      <span className="text-xs text-gray-400">{formatDate(perf.matches?.match_date ?? '')}</span>
                    </div>
                    <div className="flex gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <Trophy className="w-3.5 h-3.5 text-cricket-500" />
                        <span className="text-gray-600 dark:text-gray-400">
                          {perf.runs} runs{perf.is_out ? '' : '*'} ({perf.balls_faced}b)
                        </span>
                      </div>
                      {perf.wickets > 0 && (
                        <div className="flex items-center gap-1">
                          <Activity className="w-3.5 h-3.5 text-cricket-500" />
                          <span className="text-gray-600 dark:text-gray-400">
                            {perf.wickets} wkt ({perf.overs_bowled} ov)
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState title="No matches played yet" message="Performance data will appear here after matches are recorded." />
          )}
        </div>
      </div>
    </Layout>
  );
}

function StatCard({ label, value, icon }: { label: string; value: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <div className="card p-4">
      <div className="flex items-center gap-1.5 mb-1">
        {icon && <span className="text-cricket-500">{icon}</span>}
        <p className="text-xs text-gray-400 uppercase tracking-wide">{label}</p>
      </div>
      <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
    </div>
  );
}
