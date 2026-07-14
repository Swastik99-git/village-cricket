import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';

import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import ForgotPassword from './pages/auth/ForgotPassword';
import CompleteProfile from './pages/auth/CompleteProfile';
import Home from './pages/Home';
import Players from './pages/Players';
import PlayerProfile from './pages/PlayerProfile';
import Matches from './pages/Matches';
import MatchDetails from './pages/MatchDetails';
import Leaderboard from './pages/Leaderboard';
import Profile from './pages/Profile';
import AboutFounder from './pages/AboutFounder';
import Admin from './pages/admin/Admin';
import CreateMatch from './pages/admin/CreateMatch';
import EditMatch from './pages/admin/EditMatch';
import Scorecard from './pages/admin/Scorecard';
import CreateAnnouncement from './pages/admin/CreateAnnouncement';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export default function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route
                path="/complete-profile"
                element={
                  <ProtectedRoute>
                    <CompleteProfile />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Home />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/matches"
                element={
                  <ProtectedRoute>
                    <Matches />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/matches/:id"
                element={
                  <ProtectedRoute>
                    <MatchDetails />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/players"
                element={
                  <ProtectedRoute>
                    <Players />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/players/:id"
                element={
                  <ProtectedRoute>
                    <PlayerProfile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/leaderboard"
                element={
                  <ProtectedRoute>
                    <Leaderboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/about-founder"
                element={
                  <ProtectedRoute>
                    <AboutFounder />
                  </ProtectedRoute>
                }
              />

              {/* Admin routes */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute>
                    <Admin />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/match"
                element={
                  <ProtectedRoute>
                    <CreateMatch />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/match/:id/edit"
                element={
                  <ProtectedRoute>
                    <EditMatch />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/scorecard/:id"
                element={
                  <ProtectedRoute>
                    <Scorecard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/announcement"
                element={
                  <ProtectedRoute>
                    <CreateAnnouncement />
                  </ProtectedRoute>
                }
              />

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
