import { type ReactNode } from 'react';
import BottomNav from './BottomNav';

interface LayoutProps {
  children: ReactNode;
  showNav?: boolean;
}

export default function Layout({ children, showNav = true }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-md mx-auto min-h-screen bg-gray-50 dark:bg-gray-950 relative">
        <main className={showNav ? 'pb-24' : ''}>{children}</main>
        {showNav && <BottomNav />}
      </div>
    </div>
  );
}
