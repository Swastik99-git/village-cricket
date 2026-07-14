import { Link, useParams } from 'react-router-dom';
import { ChevronLeft, MapPin, Calendar, Trophy, Award, Target, Shield, Edit, Star } from 'lucide-react';
import Layout from '../components/Layout';
import PlayerAvatar from '../components/PlayerAvatar';
import Spinner, { EmptyState, ErrorState } from '../components/Feedback';
import { useMatch, useMatchPerformances, useMatchPlayers } from '../hooks/useQueries';
import { useAuth } from '../context/AuthContext';
import { formatDateTime } from '../lib/format';

export default function MatchDetails() {
  const { id } = useParams<{ id: string }>();
  const { data: match, isLoading, error, refetch } = useMatch(id);
  const { data: performances, isLoading: perfLoading } = useMatchPerformances(id);
  const { data: matchPlayers } = useMatchPlayers(id);
  const { profile } = useAuth();

  if (isLoading) return <Layout><div className="page-container"><Spinner className="py-20" /></div></Layout>;
  if (error) return <Layout><div className="page-container"><ErrorState message={error.message} onRetry={refetch} /></div></Layout>;
  if (!match) return <Layout><div className="page-container"><EmptyState title="Match not found" /></div></Layout>;

  const battingPerformances = (performances ?? [])
    .filter((p) => p.balls_faced > 0 || p.runs > 0 || p.batting_order > 0)
    .sort((a, b) => (a.batting_order || 999) - (b.batting_order || 999));
  const bowlingPerformances = (performances ?? [])
    .filter((p) => p.overs_bowled > 0 || p.wickets > 0)
    .sort((a, b) => b.wickets - a.wickets || a.runs_conceded - b.runs_conceded);

  const motmPlayer = matchPlayers?.find((mp) => mp.player_id === match.man_of_match_player_id);

  return (
    <Layout>
      <div className="page-container">
        <div className="flex items-center justify-between mb-4">
          <Link to="/matches" className="inline-flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-cricket-600 dark:hover:text-cricket-400 transition-colors">
            <ChevronLeft className="w-4 h-4" /> Back to Matches
          </Link>
          {profile?.is_admin && (
            <Link to={`/admin/match/${match.id}/edit`} className="btn-ghost text-sm text-cricket-600 dark:text-cricket-400">
              <Edit className="w-4 h-4" /> Edit
            </Link>
          )}
        </div>

        {/* Match Header */}
        <div className="card p-5 mb-5">
          <div className="flex items-center gap-2 mb-4">
            <span className={`chip ${match.status === 'completed' ? 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400' : 'bg-cricket-100 dark:bg-cricket-900/40 text-cricket-700 dark:text-cricket-300'}`}>
              {match.status === 'completed' ? 'Completed' : 'Upcoming'}
            </span>
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" /> {formatDateTime(match.match_date)}
            </span>
          </div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1 text-center">
              <p className="font-bold text-gray-900 dark:text-white">{match.team_a}</p>
              {match.status === 'completed' && match.team_a_score && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {match.team_a_score}
                  {match.team_a_overs && <span className="text-xs"> · {match.team_a_overs} ov</span>}
                </p>
              )}
            </div>
            <div className="px-4 text-gray-400 font-bold text-sm">VS</div>
            <div className="flex-1 text-center">
              <p className="font-bold text-gray-900 dark:text-white">{match.team_b}</p>
              {match.status === 'completed' && match.team_b_score && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {match.team_b_score}
                  {match.team_b_overs && <span className="text-xs"> · {match.team_b_overs} ov</span>}
                </p>
              )}
            </div>
          </div>
          {match.venue && (
            <div className="flex items-center justify-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 mb-3">
              <MapPin className="w-4 h-4" /> {match.venue}
            </div>
          )}
          {match.toss && (
            <p className="text-xs text-gray-400 text-center mb-2">Toss: {match.toss}</p>
          )}
          {match.status === 'completed' && match.winner && (
            <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 flex flex-col items-center gap-1">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-cricket-500" />
                <p className="text-sm font-semibold text-cricket-600 dark:text-cricket-400">
                  {match.winner} won
                  {match.winning_margin && <span className="text-gray-500 dark:text-gray-400 font-normal"> {match.winning_margin}</span>}
                </p>
              </div>
            </div>
          )}
          {match.status === 'completed' && motmPlayer && (
            <div className="mt-2 flex items-center justify-center gap-2">
              <Star className="w-4 h-4 text-amber-400" />
              <p className="text-xs font-medium text-amber-600 dark:text-amber-400">
                MoM: {motmPlayer.profiles?.full_name}
              </p>
            </div>
          )}
          {match.notes && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-3 leading-relaxed">{match.notes}</p>
          )}
        </div>

        {/* Scorecard */}
        {match.status === 'completed' && (
          <>
            {perfLoading ? (
              <Spinner className="py-8" />
            ) : battingPerformances.length === 0 && bowlingPerformances.length === 0 ? (
              <EmptyState title="No scorecard data" message="Scorecard hasn't been entered yet." />
            ) : (
              <>
                {/* Batting Scorecard */}
                {battingPerformances.length > 0 && (
                  <div className="mb-5">
                    <h2 className="section-title mb-3 flex items-center gap-2">
                      <Award className="w-5 h-5 text-cricket-500" /> Batting
                    </h2>
                    <div className="card overflow-hidden">
                      <div className="grid grid-cols-12 gap-1 px-3 py-2.5 bg-gray-50 dark:bg-gray-800 text-xs font-semibold text-gray-400 uppercase">
                        <div className="col-span-4">Player</div>
                        <div className="col-span-1 text-center">R</div>
                        <div className="col-span-1 text-center">B</div>
                        <div className="col-span-1 text-center">4s</div>
                        <div className="col-span-1 text-center">6s</div>
                        <div className="col-span-4 text-right">Dismissal</div>
                      </div>
                      {battingPerformances.map((p) => (
                        <div key={p.id} className="grid grid-cols-12 gap-1 px-3 py-3 border-t border-gray-100 dark:border-gray-800 items-center">
                          <div className="col-span-4 flex items-center gap-2 min-w-0">
                            <PlayerAvatar profile={p.profiles!} size="sm" />
                            <Link to={`/players/${p.player_id}`} className="text-sm font-medium text-gray-900 dark:text-white truncate hover:text-cricket-600">
                              {p.profiles?.full_name}
                            </Link>
                          </div>
                          <div className="col-span-1 text-center text-sm font-bold text-gray-900 dark:text-white">
                            {p.runs}{!p.is_out && p.balls_faced > 0 ? '*' : ''}
                          </div>
                          <div className="col-span-1 text-center text-sm text-gray-500 dark:text-gray-400">{p.balls_faced}</div>
                          <div className="col-span-1 text-center text-sm text-gray-500 dark:text-gray-400">{p.fours}</div>
                          <div className="col-span-1 text-center text-sm text-gray-500 dark:text-gray-400">{p.sixes}</div>
                          <div className="col-span-4 text-right text-xs text-gray-400 truncate">{p.dismissal || 'not out'}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Bowling Scorecard */}
                {bowlingPerformances.length > 0 && (
                  <div className="mb-5">
                    <h2 className="section-title mb-3 flex items-center gap-2">
                      <Target className="w-5 h-5 text-cricket-500" /> Bowling
                    </h2>
                    <div className="card overflow-hidden">
                      <div className="grid grid-cols-12 gap-1 px-3 py-2.5 bg-gray-50 dark:bg-gray-800 text-xs font-semibold text-gray-400 uppercase">
                        <div className="col-span-5">Player</div>
                        <div className="col-span-2 text-center">O</div>
                        <div className="col-span-1 text-center">M</div>
                        <div className="col-span-2 text-center">W</div>
                        <div className="col-span-2 text-right">Runs</div>
                      </div>
                      {bowlingPerformances.map((p) => (
                        <div key={p.id} className="grid grid-cols-12 gap-1 px-3 py-3 border-t border-gray-100 dark:border-gray-800 items-center">
                          <div className="col-span-5 flex items-center gap-2 min-w-0">
                            <PlayerAvatar profile={p.profiles!} size="sm" />
                            <Link to={`/players/${p.player_id}`} className="text-sm font-medium text-gray-900 dark:text-white truncate hover:text-cricket-600">
                              {p.profiles?.full_name}
                            </Link>
                          </div>
                          <div className="col-span-2 text-center text-sm text-gray-700 dark:text-gray-300">{p.overs_bowled}</div>
                          <div className="col-span-1 text-center text-sm text-gray-500 dark:text-gray-400">{p.maidens}</div>
                          <div className="col-span-2 text-center text-sm font-bold text-cricket-600 dark:text-cricket-400">{p.wickets}</div>
                          <div className="col-span-2 text-right text-sm text-gray-700 dark:text-gray-300">{p.runs_conceded}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Fielding */}
                {(performances ?? []).some((p) => p.catches > 0 || p.run_outs > 0) && (
                  <div className="mb-5">
                    <h2 className="section-title mb-3 flex items-center gap-2">
                      <Shield className="w-5 h-5 text-cricket-500" /> Fielding
                    </h2>
                    <div className="card overflow-hidden">
                      <div className="grid grid-cols-12 gap-1 px-3 py-2.5 bg-gray-50 dark:bg-gray-800 text-xs font-semibold text-gray-400 uppercase">
                        <div className="col-span-8">Player</div>
                        <div className="col-span-2 text-center">Catches</div>
                        <div className="col-span-2 text-center">Run Outs</div>
                      </div>
                      {(performances ?? [])
                        .filter((p) => p.catches > 0 || p.run_outs > 0)
                        .map((p) => (
                          <div key={p.id} className="grid grid-cols-12 gap-1 px-3 py-3 border-t border-gray-100 dark:border-gray-800 items-center">
                            <div className="col-span-8 flex items-center gap-2 min-w-0">
                              <PlayerAvatar profile={p.profiles!} size="sm" />
                              <Link to={`/players/${p.player_id}`} className="text-sm font-medium text-gray-900 dark:text-white truncate hover:text-cricket-600">
                                {p.profiles?.full_name}
                              </Link>
                            </div>
                            <div className="col-span-2 text-center text-sm text-gray-700 dark:text-gray-300">{p.catches}</div>
                            <div className="col-span-2 text-center text-sm text-gray-700 dark:text-gray-300">{p.run_outs}</div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* Selected Players (for upcoming matches) */}
        {match.status === 'upcoming' && matchPlayers && matchPlayers.length > 0 && (
          <div className="mb-5">
            <h2 className="section-title mb-3">Selected Players</h2>
            <div className="card p-4">
              <div className="flex flex-wrap gap-2">
                {matchPlayers.map((mp) => (
                  <div key={mp.id} className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-full bg-cricket-50 dark:bg-gray-800">
                    <PlayerAvatar profile={mp.profiles!} size="sm" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{mp.profiles?.full_name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
