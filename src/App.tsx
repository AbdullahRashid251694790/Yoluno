/**
 * App Component
 *
 * Root component with providers and routing.
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ChildProvider } from '@/contexts/ChildContext';
import { ChatProvider } from '@/contexts/ChatContext';

// Pages
import { LoginPage } from '@/pages/Login';
import { SignupPage } from '@/pages/Signup';
import { DashboardPage } from '@/pages/Dashboard';
import { ChildSelectPage } from '@/pages/ChildSelect';
import { KidsHomePage } from '@/pages/KidsHome';
import { KidsChatPage } from '@/pages/KidsChat';
import { KidsStoriesPage } from '@/pages/KidsStories';
import { StoryWizardPage } from '@/pages/StoryWizard';
import { KidsJourneyDetailPage } from '@/pages/KidsJourneyDetail';
import { KidsJourneysPage } from '@/pages/KidsJourneys';
import { KidsFamilyPage } from '@/pages/KidsFamily';
import { KidsRewardGalleryPage } from '@/pages/KidsRewardGallery';
import { KidsMoodCheckPage } from '@/pages/KidsMoodCheck';
import { LandingPage } from '@/pages/Landing';
import { NotFoundPage } from '@/pages/NotFound';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ChildProvider>
          <ChatProvider>
            <BrowserRouter>
              <Routes>
                {/* Public routes */}
                <Route
                  path="/"
                  element={
                    <PublicRoute>
                      <LandingPage />
                    </PublicRoute>
                  }
                />
                <Route
                  path="/login"
                  element={
                    <PublicRoute>
                      <LoginPage />
                    </PublicRoute>
                  }
                />
                <Route
                  path="/signup"
                  element={
                    <PublicRoute>
                      <SignupPage />
                    </PublicRoute>
                  }
                />

                {/* Protected routes */}
                <Route
                  path="/dashboard/*"
                  element={
                    <ProtectedRoute>
                      <DashboardPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/play"
                  element={
                    <ProtectedRoute>
                      <ChildSelectPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/kids/:childId"
                  element={
                    <ProtectedRoute>
                      <KidsHomePage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/kids/:childId/mood"
                  element={
                    <ProtectedRoute>
                      <KidsMoodCheckPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/kids/:childId/chat"
                  element={
                    <ProtectedRoute>
                      <KidsChatPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/kids/:childId/stories"
                  element={
                    <ProtectedRoute>
                      <KidsStoriesPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/story-wizard/:childId"
                  element={
                    <ProtectedRoute>
                      <StoryWizardPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/kids/:childId/journeys"
                  element={
                    <ProtectedRoute>
                      <KidsJourneysPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/kids/:childId/journeys/:journeyId"
                  element={
                    <ProtectedRoute>
                      <KidsJourneyDetailPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/kids/:childId/family"
                  element={
                    <ProtectedRoute>
                      <KidsFamilyPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/kids/:childId/rewards"
                  element={
                    <ProtectedRoute>
                      <KidsRewardGalleryPage />
                    </ProtectedRoute>
                  }
                />

                {/* 404 */}
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </BrowserRouter>
            <Toaster position="top-right" richColors />
          </ChatProvider>
        </ChildProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
