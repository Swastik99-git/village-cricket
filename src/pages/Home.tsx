import { Link } from 'react-router-dom';
import { Trophy, Users, BarChart3, Megaphone, ChevronRight, Calendar, MapPin, TrendingUp, Award } from 'lucide-react';
import Layout from '../components/Layout';
import PlayerAvatar from '../components/PlayerAvatar';
import Spinner, { EmptyState } from '../components/Feedback';
import { useAuth } from '../context/AuthContext';
import { useMatches, useAnnouncements, useMatchPerformances } from '../hooks/useQueries';
import { formatDate, formatTime, isToday, timeAgo } from '../lib/format';
import type { Match } from '../types';

export default function Home() {
  const { profile } = useAuth();
  const { data: matches, isLoading: matchesLoading } = useMatches();
  const { data: announcements, isLoading: annLoading } = useAnnouncements();

  const todaysMatch = matches?.find((m) => isToday(m.match_date) && m.status === 'upcoming');
  const latestCompleted = matches?.find((m) => m.status === 'completed');
  const upcomingMatches = matches
    ?.filter((m) => m.status === 'upcoming' && !isToday(m.match_date))
    .sort((a, b) => new Date(a.match_date).getTime() - new Date(b.match_date).getTime())
    .slice(0, 3);

  return (
    <Layout>
      {/* Hero */}
      <div className="bg-gradient-to-br from-cricket-600 to-cricket-800 dark:from-cricket-800 dark:to-gray-900 px-5 pt-10 pb-8 rounded-b-3xl">
        <div className="max-w-md mx-auto">
          <p className="text-cricket-100 text-sm font-medium">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
          <h1 className="text-2xl font-bold text-white mt-1">
            {profile?.full_name ? `Hello, ${profile.full_name.split(' ')[0]}!` : 'Welcome!'}
          </h1>
          <p className="text-cricket-100 text-sm mt-1">
            Here's what's happening in your village cricket today.
          </p>
        </div>
      </div>

      <div className="page-container -mt-4">
        {/* Today's Match */}
        {matchesLoading ? (
          <Spinner className="py-8" />
        ) : todaysMatch ? (
          <TodayMatchCard match={todaysMatch} />
        ) : (
          <div className="card p-5 mb-6">
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
              No match scheduled for today.
            </p>
          </div>
        )}

        {/* Top 3 Performers */}
        {latestCompleted && <TopPerformers matchId={latestCompleted.id} />}

        {/* Quick Navigation */}
        <section className="mb-6">
          <h2 className="section-title mb-3">Quick Access</h2>
          <div className="grid grid-cols-2 gap-3">
            <QuickCard to="/matches" icon={<Trophy className="w-5 h-5" />} label="Matches" desc="View all" />
            <QuickCard to="/players" icon={<Users className="w-5 h-5" />} label="Players" desc="Browse squad" />
            <QuickCard to="/leaderboard" icon={<BarChart3 className="w-5 h-5" />} label="Leaderboard" desc="Top stats" />
            <QuickCard to="/profile" icon={<Award className="w-5 h-5" />} label="My Profile" desc="Edit info" />
          </div>
        </section>

        {/* Upcoming Matches */}
        <section className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="section-title">Upcoming Matches</h2>
            <Link to="/matches" className="text-sm text-cricket-600 dark:text-cricket-400 font-medium">
              View all
            </Link>
          </div>
          {upcomingMatches && upcomingMatches.length > 0 ? (
            <div className="space-y-3">
              {upcomingMatches.map((match) => (
                <UpcomingMatchCard key={match.id} match={match} />
              ))}
            </div>
          ) : (
            <div className="card p-5">
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                No upcoming matches scheduled.
              </p>
            </div>
          )}
        </section>

        {/* Announcements */}
        <section className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Megaphone className="w-5 h-5 text-cricket-600 dark:text-cricket-400" />
            <h2 className="section-title">Announcements</h2>
          </div>
          {annLoading ? (
            <Spinner className="py-4" />
          ) : announcements && announcements.length > 0 ? (
            <div className="space-y-3">
              {announcements.slice(0, 3).map((ann) => (
                <div key={ann.id} className="card p-4">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{ann.title}</h3>
                    <span className="text-xs text-gray-400 shrink-0">{timeAgo(ann.created_at)}</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{ann.body}</p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No announcements" message="Check back later for updates." />
          )}
        </section>

        {/* About Founder */}
        <FounderSection />
      </div>
    </Layout>
  );
}

function TodayMatchCard({ match }: { match: Match }) {
  return (
    <Link to={`/matches/${match.id}`} className="block mb-6 animate-slide-up">
      <div className="card p-5 border-cricket-200 dark:border-cricket-800">
        <div className="flex items-center gap-2 mb-3">
          <span className="chip bg-cricket-100 dark:bg-cricket-900/40 text-cricket-700 dark:text-cricket-300">
            Today's Match
          </span>
          <span className="text-xs text-gray-400">{formatTime(match.match_date)}</span>
        </div>
        <div className="flex items-center justify-between mb-3">
          <div className="text-center flex-1">
            <p className="font-bold text-gray-900 dark:text-white">{match.team_a}</p>
          </div>
          <div className="px-3 text-gray-400 font-bold text-sm">VS</div>
          <div className="text-center flex-1">
            <p className="font-bold text-gray-900 dark:text-white">{match.team_b}</p>
          </div>
        </div>
        {match.venue && (
          <div className="flex items-center justify-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
            <MapPin className="w-4 h-4" />
            <span>{match.venue}</span>
          </div>
        )}
      </div>
    </Link>
  );
}

function TopPerformers({ matchId }: { matchId: string }) {
  const { data: performances, isLoading } = useMatchPerformances(matchId);

  if (isLoading) return <Spinner className="py-4" />;
  if (!performances || performances.length === 0) return null;

  const topBatsmen = [...performances]
    .sort((a, b) => b.runs - a.runs)
    .slice(0, 3)
    .filter((p) => p.runs > 0);
  const topBowlers = [...performances]
    .sort((a, b) => b.wickets - a.wickets || a.runs_conceded - b.runs_conceded)
    .slice(0, 3)
    .filter((p) => p.wickets > 0);

  if (topBatsmen.length === 0 && topBowlers.length === 0) return null;

  return (
    <section className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp className="w-5 h-5 text-cricket-600 dark:text-cricket-400" />
        <h2 className="section-title">Top Performers</h2>
      </div>
      <div className="card p-4">
        {topBatsmen.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Batting</p>
            <div className="space-y-2">
              {topBatsmen.map((p, i) => (
                <div key={p.id} className="flex items-center gap-3">
                  <span className="text-sm font-bold text-gray-400 w-5">{i + 1}</span>
                  <PlayerAvatar profile={p.profiles!} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {p.profiles?.full_name}
                    </p>
                    <p className="text-xs text-gray-400">{p.balls_faced} balls</p>
                  </div>
                  <span className="text-lg font-bold text-cricket-600 dark:text-cricket-400">{p.runs}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {topBowlers.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Bowling</p>
            <div className="space-y-2">
              {topBowlers.map((p, i) => (
                <div key={p.id} className="flex items-center gap-3">
                  <span className="text-sm font-bold text-gray-400 w-5">{i + 1}</span>
                  <PlayerAvatar profile={p.profiles!} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {p.profiles?.full_name}
                    </p>
                    <p className="text-xs text-gray-400">{p.overs_bowled} ov, {p.runs_conceded} runs</p>
                  </div>
                  <span className="text-lg font-bold text-cricket-600 dark:text-cricket-400">{p.wickets}w</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function QuickCard({ to, icon, label, desc }: { to: string; icon: React.ReactNode; label: string; desc: string }) {
  return (
    <Link to={to} className="card p-4 flex items-center gap-3 hover:shadow-card-hover transition-all active:scale-[0.98]">
      <div className="w-10 h-10 rounded-xl bg-cricket-50 dark:bg-gray-800 text-cricket-600 dark:text-cricket-400 flex items-center justify-center">
        {icon}
      </div>
      <div className="flex-1">
        <p className="font-semibold text-gray-900 dark:text-white text-sm">{label}</p>
        <p className="text-xs text-gray-400">{desc}</p>
      </div>
      <ChevronRight className="w-4 h-4 text-gray-300" />
    </Link>
  );
}

function UpcomingMatchCard({ match }: { match: Match }) {
  return (
    <Link to={`/matches/${match.id}`} className="block">
      <div className="card p-4 hover:shadow-card-hover transition-all active:scale-[0.98]">
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="w-4 h-4 text-cricket-500" />
          <span className="text-xs text-gray-500 dark:text-gray-400">{formatDate(match.match_date)}</span>
          {match.venue && (
            <>
              <span className="text-gray-300">·</span>
              <span className="text-xs text-gray-500 dark:text-gray-400 truncate">{match.venue}</span>
            </>
          )}
        </div>
        <div className="flex items-center justify-between">
          <span className="font-semibold text-gray-900 dark:text-white text-sm">{match.team_a}</span>
          <span className="text-xs text-gray-400 font-medium">VS</span>
          <span className="font-semibold text-gray-900 dark:text-white text-sm">{match.team_b}</span>
        </div>
      </div>
    </Link>
  );
}

function FounderSection() {
  return (
    <section className="mb-2">
      <h2 className="section-title mb-3">About the Founder</h2>
      <div className="card p-5">
        <div className="flex items-center gap-4 mb-4">
          <img
            src="https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=200"
            alt="Swastik Biswal"
            className="w-16 h-16 rounded-full object-cover ring-2 ring-cricket-100 dark:ring-gray-700"
          />
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white">Swastik Biswal</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Founder & Developer</p>
          </div>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
          This platform was created by Swastik Biswal to keep village cricket organized, maintain accurate
          player statistics, and preserve every memorable match for our community.
        </p>
        <div className="flex flex-wrap gap-2">
          <a
            href="https://wa.me/919999999999"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary text-sm py-2 px-3"
          >
            WhatsApp
          </a>
          <a
            href="https://instagram.com"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary text-sm py-2 px-3"
          >
            Instagram
          </a>
          <a href="mailto:swastik@example.com" className="btn-secondary text-sm py-2 px-3">
            Email
          </a>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary text-sm py-2 px-3"
          >
            GitHub
          </a>
        </div>
        <Link to="/about-founder" className="block mt-4 text-sm text-cricket-600 dark:text-cricket-400 font-medium text-center">
          Learn more about the founder →
        </Link>
      </div>
    </section>
  );
}
