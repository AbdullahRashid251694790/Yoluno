/**
 * App Component
 *
 * Root component with providers and routing.
 */

import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useSearchParams } from 'react-router-dom';
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
import { ForgotPasswordPage } from '@/pages/ForgotPassword';
import { ResetPasswordPage } from '@/pages/ResetPassword';
import { VerifyEmailPage } from '@/pages/VerifyEmail';
import { KidsBadgesPage } from '@/pages/KidsBadges';
import { NotFoundPage } from '@/pages/NotFound';

// Landing pages (lazy-loaded)
import LandingLayout from '@/components/landing/LandingLayout';
import ScrollToTop from '@/components/landing/ScrollToTop';
const RecordForFamilyPage = lazy(() => import('@/pages/RecordForFamilyPage'));
const LandingHomePage = lazy(() => import('@/pages/landing/HomePage'));
const LandingFeaturesPage = lazy(() => import('@/pages/landing/FeaturesPage'));
const LandingForParentsPage = lazy(() => import('@/pages/landing/ForParentsPage'));
const LandingPricingPage = lazy(() => import('@/pages/landing/PricingPage'));
const LandingAboutPage = lazy(() => import('@/pages/landing/AboutPage'));
const LandingBlogPage = lazy(() => import('@/pages/landing/BlogPage'));
const LandingBlogPostPage = lazy(() => import('@/pages/landing/BlogPostPage'));
const LandingFAQsPage = lazy(() => import('@/pages/landing/FAQsPage'));
const LandingSafetyCharterPage = lazy(() => import('@/pages/landing/SafetyCharterPage'));
const LandingHowAIWorksPage = lazy(() => import('@/pages/landing/HowAIWorksPage'));
const LandingDataPracticesPage = lazy(() => import('@/pages/landing/DataPracticesPage'));
const LandingPrivacyPolicyPage = lazy(() => import('@/pages/landing/PrivacyPolicyPage'));

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
  const location = useLocation();

  if (isLoading) {
    return null;
  }

  if (!isAuthenticated) {
    // Preserve the intended destination so we can redirect back after login
    const redirectTo = location.pathname + location.search;
    return <Navigate to={`/login?redirect=${encodeURIComponent(redirectTo)}`} replace />;
  }

  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const [searchParams] = useSearchParams();

  if (isLoading) {
    return null;
  }

  if (isAuthenticated) {
    // Redirect to the originally intended page, or dashboard by default
    const redirectTo = searchParams.get('redirect') || '/dashboard';
    return <Navigate to={redirectTo} replace />;
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
              <ScrollToTop />
              <Routes>
                {/* Landing site pages */}
                <Route
                  path="/"
                  element={
                    <LandingLayout><Suspense fallback={null}><LandingHomePage /></Suspense></LandingLayout>
                  }
                />
                <Route path="/features" element={<LandingLayout><Suspense fallback={null}><LandingFeaturesPage /></Suspense></LandingLayout>} />
                <Route path="/for-parents" element={<LandingLayout><Suspense fallback={null}><LandingForParentsPage /></Suspense></LandingLayout>} />
                <Route path="/pricing" element={<LandingLayout><Suspense fallback={null}><LandingPricingPage /></Suspense></LandingLayout>} />
                <Route path="/about" element={<LandingLayout><Suspense fallback={null}><LandingAboutPage /></Suspense></LandingLayout>} />
                <Route path="/blog" element={<LandingLayout><Suspense fallback={null}><LandingBlogPage /></Suspense></LandingLayout>} />
                <Route path="/blog/:slug" element={<LandingLayout><Suspense fallback={null}><LandingBlogPostPage /></Suspense></LandingLayout>} />
                <Route path="/faqs" element={<LandingLayout><Suspense fallback={null}><LandingFAQsPage /></Suspense></LandingLayout>} />
                <Route path="/safety-charter" element={<LandingLayout><Suspense fallback={null}><LandingSafetyCharterPage /></Suspense></LandingLayout>} />
                <Route path="/how-ai-works" element={<LandingLayout><Suspense fallback={null}><LandingHowAIWorksPage /></Suspense></LandingLayout>} />
                <Route path="/data-practices" element={<LandingLayout><Suspense fallback={null}><LandingDataPracticesPage /></Suspense></LandingLayout>} />
                <Route path="/privacy-policy" element={<LandingLayout><Suspense fallback={null}><LandingPrivacyPolicyPage /></Suspense></LandingLayout>} />
                {/* Public voice recording invite (no auth, no layout) */}
                <Route
                  path="/record-for-family/:token"
                  element={<Suspense fallback={null}><RecordForFamilyPage /></Suspense>}
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

                {/* Public (no redirect) routes */}
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
                <Route path="/verify-email" element={<VerifyEmailPage />} />

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
                <Route
                  path="/kids/:childId/badges"
                  element={
                    <ProtectedRoute>
                      <KidsBadgesPage />
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
