import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, Users } from 'lucide-react';
import Layout from '../components/Layout';
import PlayerAvatar from '../components/PlayerAvatar';
import RoleBadge from '../components/RoleBadge';
import Spinner, { EmptyState } from '../components/Feedback';
import { usePlayers, useAllPlayerStats } from '../hooks/useQueries';
import type { Profile, PlayerCareerStats } from '../types';

export default function Players() {
  const { data: players, isLoading } = usePlayers();
  const { data: stats } = useAllPlayerStats();
  const [search, setSearch] = useState('');

  const statsMap = useMemo(() => {
    const map = new Map<string, PlayerCareerStats>();
    (stats ?? []).forEach((s) => map.set(s.player_id, s));
    return map;
  }, [stats]);

  const filtered = useMemo(() => {
    if (!search.trim()) return players ?? [];
    const q = search.toLowerCase();
    return (players ?? []).filter(
      (p) =>
        p.full_name.toLowerCase().includes(q) ||
        p.village?.toLowerCase().includes(q),
    );
  }, [players, search]);

  return (
    <Layout>
      <div className="page-container">
        <div className="mb-5">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Players</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {players?.length ?? 0} registered players
          </p>
        </div>

        {/* Search */}
        <div className="relative mb-5">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or village..."
            className="input-field pl-10"
          />
        </div>

        {/* Player List */}
        {isLoading ? (
          <Spinner className="py-12" />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<Users className="w-12 h-12" />}
            title={search ? "No players found" : "No players yet"}
            message={search ? "Try a different search term." : "Players will appear here once registered."}
          />
        ) : (
          <div className="space-y-3">
            {filtered.map((player) => (
              <PlayerCard key={player.id} player={player} stats={statsMap.get(player.id)} />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}

function PlayerCard({ player, stats }: { player: Profile; stats?: PlayerCareerStats }) {
  return (
    <Link to={`/players/${player.id}`} className="block">
      <div className="card p-4 flex items-center gap-4 hover:shadow-card-hover transition-all active:scale-[0.98]">
        <PlayerAvatar profile={player} size="md" />
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 dark:text-white truncate">{player.full_name}</h3>
          <div className="mt-1">
            <RoleBadge role={player.playing_role} />
          </div>
        </div>
        <div className="flex gap-4 text-center shrink-0">
          <div>
            <p className="text-lg font-bold text-cricket-600 dark:text-cricket-400">
              {stats?.total_runs ?? 0}
            </p>
            <p className="text-[10px] text-gray-400 uppercase">Runs</p>
          </div>
          <div>
            <p className="text-lg font-bold text-cricket-600 dark:text-cricket-400">
              {stats?.total_wickets ?? 0}
            </p>
            <p className="text-[10px] text-gray-400 uppercase">Wkts</p>
          </div>
        </div>
      </div>
    </Link>
  );
}
