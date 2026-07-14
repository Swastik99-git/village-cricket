import { CATEGORY_LABELS, CATEGORY_COLORS, type AnnouncementCategory } from '../types';

export default function CategoryBadge({ category, className = '' }: { category: AnnouncementCategory; className?: string }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${CATEGORY_COLORS[category]} ${className}`}>
      {CATEGORY_LABELS[category]}
    </span>
  );
}
