import { useState } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, Target, Activity, Medal } from 'lucide-react';
import Layout from '../components/Layout';
import PlayerAvatar from '../components/PlayerAvatar';
import Spinner, { EmptyState } from '../components/Feedback';
import { useLeaderboard } from '../hooks/useQueries';

type Period = 'all' | 'monthly';
type Category = 'runs' | 'wickets' | 'matches';

export default function Leaderboard() {
  const [period, setPeriod] = useState<Period>('all');
  const [category, setCategory] = useState<Category>('runs');
  const { data, isLoading } = useLeaderboard(period);

  const lists = {
    runs: data?.topRunScorers ?? [],
    wickets: data?.topWicketTakers ?? [],
    matches: data?.mostMatches ?? [],
  };
  const current = lists[category];

  const categoryConfig = {
    runs: { icon: <TrendingUp className="w-5 h-5" />, label: 'Run Scorers', unit: 'runs' },
    wickets: { icon: <Target className="w-5 h-5" />, label: 'Wicket Takers', unit: 'wickets' },
    matches: { icon: <Activity className="w-5 h-5" />, label: 'Most Matches', unit: 'matches' },
  };

  return (
    <Layout>
      <div className="page-container">
        <div className="mb-5">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Leaderboard</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Top performers in the village</p>
        </div>

        {/* Period Filter */}
        <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl mb-4">
          <button
            onClick={() => setPeriod('all')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              period === 'all'
                ? 'bg-white dark:bg-gray-900 text-cricket-600 dark:text-cricket-400 shadow-soft'
                : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            All Time
          </button>
          <button
            onClick={() => setPeriod('monthly')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              period === 'monthly'
                ? 'bg-white dark:bg-gray-900 text-cricket-600 dark:text-cricket-400 shadow-soft'
                : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            This Month
          </button>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-2 mb-5">
          {(['runs', 'wickets', 'matches'] as Category[]).map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`flex-1 flex flex-col items-center gap-1 py-3 rounded-xl transition-all ${
                category === cat
                  ? 'bg-cricket-600 text-white shadow-soft'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
              }`}
            >
              {categoryConfig[cat].icon}
              <span className="text-xs font-semibold">{categoryConfig[cat].label}</span>
            </button>
          ))}
        </div>

        {/* Leaderboard List */}
        {isLoading ? (
          <Spinner className="py-12" />
        ) : current.length === 0 ? (
          <EmptyState
            icon={<Medal className="w-12 h-12" />}
            title="No data available"
            message={`No ${categoryConfig[category].label.toLowerCase()} recorded ${period === 'monthly' ? 'this month' : 'yet'}.`}
          />
        ) : (
          <div className="space-y-3">
            {/* Top 3 Podium */}
            {current.length >= 3 && (
              <div className="card p-5 mb-2">
                <div className="flex items-end justify-around">
                  <PodiumItem rank={2} entry={current[1]} height="h-16" />
                  <PodiumItem rank={1} entry={current[0]} height="h-20" />
                  <PodiumItem rank={3} entry={current[2]} height="h-12" />
                </div>
              </div>
            )}

            {/* Full List */}
            <div className="card overflow-hidden">
              {current.map((entry, i) => (
                <Link
                  key={entry.player_id}
                  to={`/players/${entry.player_id}`}
                  className={`flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                    i > 0 ? 'border-t border-gray-100 dark:border-gray-800' : ''
                  }`}
                >
                  <span className={`w-7 text-center font-bold text-sm ${i < 3 ? 'text-cricket-600 dark:text-cricket-400' : 'text-gray-400'}`}>
                    {i + 1}
                  </span>
                  <PlayerAvatar
                    profile={{ photo_url: entry.photo_url, full_name: entry.full_name }}
                    size="sm"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {entry.full_name}
                    </p>
                    <p className="text-xs text-gray-400">
                      {entry.matches_played} match{entry.matches_played !== 1 ? 'es' : ''} played
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-cricket-600 dark:text-cricket-400">
                      {category === 'runs' ? entry.total_runs : category === 'wickets' ? entry.total_wickets : entry.matches_played}
                    </p>
                    <p className="text-[10px] text-gray-400 uppercase">{categoryConfig[category].unit}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

function PodiumItem({
  rank,
  entry,
  height,
}: {
  rank: number;
  entry: { player_id: string; full_name: string; photo_url: string; total_runs: number; total_wickets: number; matches_played: number };
  height: string;
}) {
  const medalColors = {
    1: 'bg-amber-400',
    2: 'bg-gray-300',
    3: 'bg-orange-400',
  };
  const value = entry.total_runs || entry.total_wickets || entry.matches_played;

  return (
    <Link to={`/players/${entry.player_id}`} className="flex flex-col items-center gap-1.5">
      <div className="relative">
        <PlayerAvatar
          profile={{ photo_url: entry.photo_url, full_name: entry.full_name }}
          size={rank === 1 ? 'lg' : 'md'}
        />
        <span className={`absolute -top-1 -right-1 w-5 h-5 ${medalColors[rank as 1 | 2 | 3]} rounded-full flex items-center justify-center text-xs font-bold text-white`}>
          {rank}
        </span>
      </div>
      <p className="text-xs font-medium text-gray-900 dark:text-white max-w-[80px] truncate">{entry.full_name}</p>
      <div className={`${height} w-14 rounded-t-lg bg-gradient-to-t from-cricket-100 to-cricket-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center`}>
        <span className="text-sm font-bold text-cricket-700 dark:text-cricket-300">{value}</span>
      </div>
    </Link>
  );
}
