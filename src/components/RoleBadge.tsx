import { type ReactNode } from 'react';

interface RoleBadgeProps {
  role: string;
  label?: string;
}

const roleConfig: Record<string, { bg: string; text: string; label: string }> = {
  batsman: { bg: 'bg-blue-100 dark:bg-blue-900/40', text: 'text-blue-700 dark:text-blue-300', label: 'Batsman' },
  bowler: { bg: 'bg-purple-100 dark:bg-purple-900/40', text: 'text-purple-700 dark:text-purple-300', label: 'Bowler' },
  all_rounder: { bg: 'bg-amber-100 dark:bg-amber-900/40', text: 'text-amber-700 dark:text-amber-300', label: 'All-Rounder' },
  wicket_keeper: { bg: 'bg-rose-100 dark:bg-rose-900/40', text: 'text-rose-700 dark:text-rose-300', label: 'Wicket Keeper' },
};

export default function RoleBadge({ role, label }: RoleBadgeProps) {
  const config = roleConfig[role] ?? roleConfig.batsman;
  return (
    <span className={`chip ${config.bg} ${config.text}`}>
      {label ?? config.label}
    </span>
  );
}

interface StatPillProps {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  accent?: 'green' | 'blue' | 'amber' | 'gray';
}

const accentConfig = {
  green: 'text-cricket-600 dark:text-cricket-400',
  blue: 'text-blue-600 dark:text-blue-400',
  amber: 'text-amber-600 dark:text-amber-400',
  gray: 'text-gray-700 dark:text-gray-300',
};

export function StatPill({ label, value, icon, accent = 'gray' }: StatPillProps) {
  return (
    <div className="flex items-center gap-2">
      {icon && <span className={accentConfig[accent]}>{icon}</span>}
      <div>
        <p className={`text-lg font-bold ${accentConfig[accent]}`}>{value}</p>
        <p className="text-xs text-gray-400 dark:text-gray-500">{label}</p>
      </div>
    </div>
  );
}
