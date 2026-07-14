import { type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Spinner from '../components/Feedback';

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { session, loading, needsProfileCompletion } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (needsProfileCompletion && location.pathname !== '/complete-profile') {
    return <Navigate to="/complete-profile" replace />;
  }

  return <>{children}</>;
}
