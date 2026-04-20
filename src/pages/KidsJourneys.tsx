/**
 * Kids Journeys Page
 *
 * Matches loveable design. Kids side shows Active/Done tabs only —
 * "Explore Journeys" is removed; instead a "Request New Journey" button
 * lets the child ask the parent to unlock one.
 */

import { useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { useChildProfile, useRequestJourney } from '@/hooks/queries';
import { useActiveJourneys, useCompletedJourneys } from '@/hooks/queries/useJourneys';
import loloJourneys from '@/assets/landing/lolo-journeys.png';
import type { JourneyWithSteps } from '@/types/domain';

type TabKey = 'active' | 'done';

const FLOAT_ELEMENTS = Array.from({ length: 14 }, (_, i) => ({
  id: i,
  type: i % 4 === 0 ? 'compass' : i % 4 === 1 ? 'star' : i % 4 === 2 ? 'sparkle' : 'dot',
  left: `${5 + Math.random() * 90}%`,
  top: `${5 + Math.random() * 90}%`,
  size: 6 + Math.random() * 10,
  delay: Math.random() * 20,
  duration: 22 + Math.random() * 12,
  opacity: 0.08 + Math.random() * 0.06,
}));

function SteppingStones({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {Array.from({ length: total }, (_, i) => {
        const dayNum = i + 1;
        const isCompleted = dayNum < current;
        const isCurrent = dayNum === current;
        return (
          <div
            key={i}
            className="relative"
            style={{
              width: 20,
              height: 20,
              borderRadius: '50%',
              background: isCompleted || isCurrent ? '#E8946A' : 'transparent',
              border: isCompleted || isCurrent ? '2px solid #E8946A' : '2px solid #E8E6E1',
              transition: 'all 0.3s',
            }}
          >
            {isCurrent && (
              <div
                className="absolute inset-0 rounded-full"
                style={{
                  border: '2px solid #E8946A',
                  animation: 'stonePulse 2s ease-in-out infinite',
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export function KidsJourneysPage() {
  const { childId } = useParams<{ childId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const mood = (location.state as any)?.mood || 'happy';

  const { data: child, isLoading: childLoading } = useChildProfile(childId);
  const { data: activeJourneys = [], isLoading: activeLoading } = useActiveJourneys(childId);
  const { data: completedJourneys = [] } = useCompletedJourneys(childId);
  const requestJourney = useRequestJourney();

  const hasActive = activeJourneys.length > 0;
  const hasCompleted = completedJourneys.length > 0;
  const isEmpty = !hasActive && !hasCompleted;

  const [activeTab, setActiveTab] = useState<TabKey>(hasActive ? 'active' : 'done');
  const [requested, setRequested] = useState(false);

  const greeting = (() => {
    if (hasActive) {
      const j = activeJourneys[0];
      return `You're on Day ${(j.currentStep ?? 0) + 1} of ${j.title}. Ready for today's step?`;
    }
    if (hasCompleted) {
      const j = completedJourneys[0];
      return `You finished ${j.title}! How does that feel? Want to start something new?`;
    }
    return 'Every journey starts with one small step. Ask a parent to unlock one for you!';
  })();

  const handleBack = () => navigate(`/kids/${childId}`, { state: { mood } });

  const handleRequest = () => {
    if (!childId) return;
    requestJourney.mutate(childId, {
      onSuccess: () => {
        setRequested(true);
        toast.success('Request sent! Your parent will be notified.');
      },
      onError: (err: any) => {
        if (err?.response?.status === 429) {
          toast.info('You already sent a request recently. Please wait a bit!');
        } else {
          toast.error(err?.response?.data?.error || 'Something went wrong');
        }
      },
    });
  };

  if (childLoading || activeLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{
          background: 'linear-gradient(165deg, #FEF0EA 0%, #FDF6E8 30%, #E8F6F4 60%, #F3EFF8 100%)',
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        <div className="text-center">
          <div style={{ fontSize: 48 }} className="animate-bounce mb-4">🧭</div>
          <p style={{ fontSize: 18, fontWeight: 600, color: '#E8946A' }}>Loading your journeys...</p>
        </div>
      </div>
    );
  }

  if (!child) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{
          background: 'linear-gradient(165deg, #FEF0EA 0%, #FDF6E8 30%, #E8F6F4 60%, #F3EFF8 100%)',
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        <div className="text-center">
          <p style={{ fontSize: 48 }} className="mb-4">😅</p>
          <p style={{ fontSize: 20, fontWeight: 600, color: '#2A2926', marginBottom: 8 }}>Oops!</p>
          <p style={{ fontSize: 14, color: '#6B675E', marginBottom: 20 }}>We couldn't find your profile.</p>
          <button
            onClick={handleBack}
            className="px-6 py-2.5 rounded-full text-white font-semibold"
            style={{ background: '#E8946A', fontSize: 15 }}
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const tabs: { key: TabKey; label: string; icon: string; count: number }[] = [
    { key: 'active', label: 'Active', icon: '▶', count: activeJourneys.length },
    { key: 'done', label: 'Done', icon: '☆', count: completedJourneys.length },
  ];

  return (
    <div
      className="kids-journeys-scope min-h-screen relative overflow-hidden flex flex-col"
      style={{
        background: 'linear-gradient(165deg, #FEF0EA 0%, #FDF6E8 30%, #E8F6F4 60%, #F3EFF8 100%)',
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      {/* Floating elements */}
      {FLOAT_ELEMENTS.map((el) => (
        <div
          key={el.id}
          className="absolute pointer-events-none"
          style={{
            left: el.left,
            top: el.top,
            opacity: el.opacity,
            animation: `kidsFloat ${el.duration}s ease-in-out ${el.delay}s infinite alternate`,
          }}
        >
          {el.type === 'compass' && (
            <svg width={el.size} height={el.size} viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="#E8946A" strokeWidth="1.5" opacity="0.5" />
              <path d="M12 2v4M12 18v4M2 12h4M18 12h4" stroke="#E8946A" strokeWidth="1" opacity="0.4" />
            </svg>
          )}
          {el.type === 'star' && (
            <svg width={el.size} height={el.size} viewBox="0 0 24 24" fill="none">
              <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 16.8l-6.2 4.5 2.4-7.4L2 9.4h7.6L12 2z" fill="#D4A843" opacity="0.5" />
            </svg>
          )}
          {el.type === 'sparkle' && (
            <div style={{ width: el.size * 0.6, height: el.size * 0.6, borderRadius: '50%', background: 'rgba(232,148,106,0.4)', filter: 'blur(1px)', animation: `kidsTwinkle ${3 + Math.random() * 2}s ease-in-out infinite` }} />
          )}
          {el.type === 'dot' && (
            <div style={{ width: el.size * 0.4, height: el.size * 0.4, borderRadius: '50%', background: 'rgba(180,222,215,0.5)' }} />
          )}
        </div>
      ))}

      {/* Top bar */}
      <header className="relative z-10 flex items-center justify-between px-5 pt-5 pb-2">
        <button
          onClick={handleBack}
          className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/40 transition-colors"
          aria-label="Go back"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M13 4l-6 6 6 6" stroke="#2A2926" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div className="flex items-center gap-2">
          <img src={loloJourneys} alt="Lolo" style={{ width: 32, height: 32, objectFit: 'contain' }} />
          <span style={{ fontSize: 20, fontWeight: 600, color: '#2A2926' }}>My Journeys</span>
        </div>
        <button
          onClick={handleRequest}
          disabled={requestJourney.isPending || requested}
          className="px-4 py-2 rounded-full text-white transition hover:opacity-90 disabled:opacity-60"
          style={{ background: '#E8946A', fontSize: 14, fontWeight: 600 }}
        >
          {requested ? '✓ Sent!' : 'Request New Journey'}
        </button>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center px-5 pb-8 relative z-10">
        <div className="max-w-[600px] w-full flex flex-col items-center">
          {/* Lolo greeting */}
          <div className="flex flex-col items-center my-6" style={{ animation: 'loloBreath 4s ease-in-out infinite' }}>
            <img
              src={loloJourneys}
              alt="Lolo"
              className="drop-shadow-2xl mb-3"
              style={{ width: 100, height: 100, objectFit: 'contain' }}
            />
            <p className="text-center" style={{ fontSize: 17, color: '#6B675E', maxWidth: 400, lineHeight: 1.5 }}>
              {greeting}
            </p>
          </div>

          {/* Empty state (no journeys at all) */}
          {isEmpty ? (
            <div className="flex flex-col items-center text-center mt-4 mb-8 w-full">
              <div
                className="rounded-full flex items-center justify-center mb-5"
                style={{ width: 120, height: 120, background: 'linear-gradient(135deg, #E8946A, #F0B08A)', boxShadow: '0 8px 32px rgba(232,148,106,0.2)' }}
              >
                <span style={{ fontSize: 60 }}>🧭</span>
              </div>
              <h2 style={{ fontSize: 24, fontWeight: 600, color: '#2A2926', marginBottom: 8 }}>
                No Journeys Yet
              </h2>
              <p style={{ fontSize: 16, color: '#6B675E', maxWidth: 380, lineHeight: 1.5, marginBottom: 24 }}>
                A journey is a small adventure you do a little bit of each day. Ask a parent to unlock one for you!
              </p>
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto justify-center">
                <button
                  onClick={handleRequest}
                  disabled={requestJourney.isPending || requested}
                  className="px-6 py-3 rounded-full font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
                  style={{ background: '#E8946A', fontSize: 15, border: 'none' }}
                >
                  {requested ? '✓ Request Sent!' : 'Ask for a Journey'}
                </button>
                <button
                  onClick={handleBack}
                  className="px-6 py-3 rounded-full font-semibold transition hover:bg-white/60"
                  style={{ border: '1.5px solid #E8E6E1', color: '#2A2926', background: '#FFFFFF', fontSize: 15 }}
                >
                  Go Back Home
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Tabs */}
              <div className="flex items-center gap-6 mb-6 w-full justify-center">
                {tabs.map((t) => (
                  <button
                    key={t.key}
                    onClick={() => setActiveTab(t.key)}
                    className="flex items-center gap-1.5 pb-2 transition-all"
                    style={{
                      fontSize: 15,
                      fontWeight: activeTab === t.key ? 600 : 400,
                      color: activeTab === t.key ? '#2A2926' : '#9B978E',
                      borderBottom: activeTab === t.key ? '2px solid #E8946A' : '2px solid transparent',
                    }}
                  >
                    <span style={{ fontSize: 13 }}>{t.icon}</span>
                    {t.label}
                    <span
                      className="ml-1 px-1.5 py-0.5 rounded-full"
                      style={{
                        fontSize: 12,
                        background: activeTab === t.key ? '#FEF0EA' : '#F5F3EE',
                        color: activeTab === t.key ? '#E8946A' : '#9B978E',
                      }}
                    >
                      {t.count}
                    </span>
                  </button>
                ))}
              </div>

              {/* Active journeys */}
              {activeTab === 'active' && hasActive && (
                <div className="w-full flex flex-col gap-4">
                  {activeJourneys.map((j: JourneyWithSteps, i: number) => {
                    const current = (j.currentStep ?? 0) + 1;
                    const total = j.totalSteps ?? 0;
                    const nextStep = j.steps.find((s) => !s.isCompleted);
                    const lastCompleted = [...j.steps].reverse().find((s) => s.isCompleted);

                    return (
                      <div
                        key={j.id}
                        className="w-full"
                        style={{
                          background: '#FFFFFF',
                          borderRadius: 16,
                          borderLeft: '4px solid #E8946A',
                          padding: 24,
                          boxShadow: '0 4px 12px rgba(42,41,38,0.06)',
                          animation: `kidsFadeIn 0.4s ease-out ${i * 0.1}s both`,
                        }}
                      >
                        <h3 style={{ fontSize: 20, fontWeight: 600, color: '#2A2926', marginBottom: 4 }}>{j.title}</h3>
                        <p style={{ fontSize: 15, color: '#E8946A', fontWeight: 500, marginBottom: 16 }}>
                          Day {Math.min(current, total)} of {total}
                        </p>

                        {total > 0 && (
                          <div className="mb-5">
                            <SteppingStones current={current} total={total} />
                          </div>
                        )}

                        {nextStep && (
                          <p style={{ fontSize: 15, color: '#6B675E', fontStyle: 'italic', marginBottom: 12 }}>
                            Today: {nextStep.title}
                          </p>
                        )}

                        {lastCompleted && (
                          <div
                            className="mb-5"
                            style={{
                              background: '#FAFAF7',
                              borderRadius: 12,
                              padding: '12px 16px',
                              border: '1px solid #F5F3EE',
                            }}
                          >
                            <p style={{ fontSize: 13, color: '#9B978E', lineHeight: 1.5 }}>
                              Last time: "{lastCompleted.title}"
                            </p>
                          </div>
                        )}

                        <button
                          onClick={() => navigate(`/kids/${childId}/journeys/${j.id}`, { state: { mood } })}
                          className="w-full py-3.5 rounded-xl font-semibold text-white transition hover:opacity-90"
                          style={{ background: '#E8946A', fontSize: 15, border: 'none' }}
                        >
                          Continue today's step
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Active tab but no active journeys */}
              {activeTab === 'active' && !hasActive && (
                <div className="text-center py-12">
                  <p style={{ fontSize: 15, color: '#9B978E' }}>No active journeys right now.</p>
                  <button
                    onClick={handleRequest}
                    disabled={requestJourney.isPending || requested}
                    className="mt-4 px-6 py-2.5 rounded-full font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
                    style={{ background: '#E8946A', fontSize: 14 }}
                  >
                    {requested ? '✓ Request Sent!' : 'Request New Journey'}
                  </button>
                </div>
              )}

              {/* Completed journeys */}
              {activeTab === 'done' && (
                <>
                  {completedJourneys.length === 0 ? (
                    <div className="text-center py-12">
                      <p style={{ fontSize: 15, color: '#9B978E' }}>No completed journeys yet. Keep going!</p>
                    </div>
                  ) : (
                    <div className="w-full flex flex-col gap-4">
                      {completedJourneys.map((j: JourneyWithSteps, i: number) => (
                        <div
                          key={j.id}
                          className="w-full"
                          style={{
                            background: '#FEF0EA',
                            borderRadius: 16,
                            borderLeft: '4px solid #E8946A',
                            padding: 24,
                            animation: `kidsFadeIn 0.4s ease-out ${i * 0.1}s both`,
                          }}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <span style={{ fontSize: 16, color: '#3ECDC6' }}>✓</span>
                            <h3 style={{ fontSize: 18, fontWeight: 600, color: '#2A2926' }}>{j.title}</h3>
                            <span style={{ fontSize: 13, color: '#3ECDC6', fontWeight: 600 }}>Completed</span>
                          </div>
                          {j.completedAt && (
                            <p style={{ fontSize: 13, color: '#9B978E', marginBottom: 8 }}>
                              Completed on {new Date(j.completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </p>
                          )}
                          <p style={{ fontSize: 15, color: '#6B675E', lineHeight: 1.5, marginBottom: 16 }}>
                            You did {j.totalSteps} day{j.totalSteps !== 1 ? 's' : ''} of {j.title}. That's something to be proud of.
                          </p>
                          <button
                            onClick={() => navigate(`/kids/${childId}/journeys/${j.id}`, { state: { mood } })}
                            className="text-left transition hover:opacity-80"
                            style={{ fontSize: 14, color: '#E8946A', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}
                          >
                            Look back at your reflections →
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-5 text-center">
        <span style={{ fontSize: 12, color: '#9B978E' }}>Made with 💛 for curious minds</span>
      </footer>

      <style>{`
        .kids-journeys-scope h1,
        .kids-journeys-scope h2,
        .kids-journeys-scope h3 { font-family: 'DM Serif Display', Georgia, serif !important; }
        @keyframes kidsFloat {
          0% { transform: translateY(0) translateX(0); }
          100% { transform: translateY(-20px) translateX(10px); }
        }
        @keyframes kidsTwinkle {
          0%, 100% { opacity: 0.2; transform: scale(0.8); }
          50% { opacity: 0.5; transform: scale(1.2); }
        }
        @keyframes loloBreath {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        @keyframes kidsFadeIn {
          from { opacity: 0; transform: translateY(16px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes stonePulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.6); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
