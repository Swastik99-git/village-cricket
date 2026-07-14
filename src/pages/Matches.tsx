import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Trophy, ChevronRight, Plus } from 'lucide-react';
import Layout from '../components/Layout';
import Spinner, { EmptyState } from '../components/Feedback';
import { useMatches } from '../hooks/useQueries';
import { useAuth } from '../context/AuthContext';
import { formatDate, formatTime } from '../lib/format';
import type { Match } from '../types';

type Tab = 'upcoming' | 'completed';

export default function Matches() {
  const { data: matches, isLoading } = useMatches();
  const { profile } = useAuth();
  const [tab, setTab] = useState<Tab>('upcoming');

  const filtered = (matches ?? []).filter((m) => m.status === tab);
  const sorted =
    tab === 'upcoming'
      ? filtered.sort((a, b) => new Date(a.match_date).getTime() - new Date(b.match_date).getTime())
      : filtered.sort((a, b) => new Date(b.match_date).getTime() - new Date(a.match_date).getTime());

  return (
    <Layout>
      <div className="page-container">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Matches</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {matches?.length ?? 0} total matches
            </p>
          </div>
          {profile?.is_admin && (
            <Link to="/admin/match" className="btn-primary text-sm py-2.5 px-4">
              <Plus className="w-4 h-4" /> New
            </Link>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl mb-5">
          <button
            onClick={() => setTab('upcoming')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              tab === 'upcoming'
                ? 'bg-white dark:bg-gray-900 text-cricket-600 dark:text-cricket-400 shadow-soft'
                : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            Upcoming
          </button>
          <button
            onClick={() => setTab('completed')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              tab === 'completed'
                ? 'bg-white dark:bg-gray-900 text-cricket-600 dark:text-cricket-400 shadow-soft'
                : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            Completed
          </button>
        </div>

        {/* Match List */}
        {isLoading ? (
          <Spinner className="py-12" />
        ) : sorted.length === 0 ? (
          <EmptyState
            icon={<Trophy className="w-12 h-12" />}
            title={tab === 'upcoming' ? 'No upcoming matches' : 'No completed matches'}
            message={tab === 'upcoming' ? 'New matches will appear here when scheduled.' : 'Completed match results will show here.'}
          />
        ) : (
          <div className="space-y-3">
            {sorted.map((match) => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}

function MatchCard({ match }: { match: Match }) {
  return (
    <Link to={`/matches/${match.id}`} className="block">
      <div className="card p-4 hover:shadow-card-hover transition-all active:scale-[0.98]">
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="w-4 h-4 text-cricket-500" />
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {formatDate(match.match_date)} · {formatTime(match.match_date)}
          </span>
          {match.venue && (
            <>
              <span className="text-gray-300">·</span>
              <span className="text-xs text-gray-500 dark:text-gray-400 truncate flex items-center gap-0.5">
                <MapPin className="w-3 h-3" />{match.venue}
              </span>
            </>
          )}
        </div>
        <div className="flex items-center justify-between">
          <div className="flex-1 text-left">
            <p className="font-semibold text-gray-900 dark:text-white text-sm">{match.team_a}</p>
            {match.status === 'completed' && match.team_a_score && (
              <p className="text-xs text-gray-400 mt-0.5">{match.team_a_score} ({match.team_a_overs} ov)</p>
            )}
          </div>
          <div className="px-3">
            <span className="text-xs text-gray-400 font-medium">VS</span>
          </div>
          <div className="flex-1 text-right">
            <p className="font-semibold text-gray-900 dark:text-white text-sm">{match.team_b}</p>
            {match.status === 'completed' && match.team_b_score && (
              <p className="text-xs text-gray-400 mt-0.5">{match.team_b_score} ({match.team_b_overs} ov)</p>
            )}
          </div>
          <ChevronRight className="w-4 h-4 text-gray-300 ml-2" />
        </div>
        {match.status === 'completed' && match.winner && (
          <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
            <p className="text-xs text-cricket-600 dark:text-cricket-400 font-medium flex items-center gap-1">
              <Trophy className="w-3.5 h-3.5" />
              {match.winner} won
            </p>
          </div>
        )}
      </div>
    </Link>
  );
}
