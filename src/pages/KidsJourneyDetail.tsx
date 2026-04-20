/**
 * Kids Journey Detail Page
 *
 * Styled to match the KidsJourneys page (loveable look):
 * same gradient background, floating compasses/stars/sparkles, Lolo
 * character, DM Sans body + DM Serif Display headings, orange accents.
 *
 * Shows all steps with stepping-stones progress, next-step CTA, and
 * a completion celebration.
 */

import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { useJourney, useCompleteStep } from '@/hooks/queries/useJourneys';
import loloJourneys from '@/assets/landing/lolo-journeys.png';

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

export function KidsJourneyDetailPage() {
  const { childId, journeyId } = useParams<{ childId: string; journeyId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const mood = (location.state as any)?.mood || 'happy';

  const { data: journey, isLoading, isError, refetch } = useJourney(journeyId);
  const completeStep = useCompleteStep();

  const handleBack = () => navigate(`/kids/${childId}/journeys`, { state: { mood } });

  const handleCompleteStep = async (stepId: string) => {
    if (!journeyId) return;
    try {
      await completeStep.mutateAsync({ stepId, journeyId });
      toast.success('Step completed!');
      refetch();
    } catch {
      // mutation handles error
    }
  };

  const pageBg = 'linear-gradient(165deg, #FEF0EA 0%, #FDF6E8 30%, #E8F6F4 60%, #F3EFF8 100%)';

  if (isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: pageBg, fontFamily: "'DM Sans', sans-serif" }}
      >
        <div className="text-center">
          <div style={{ fontSize: 48 }} className="animate-bounce mb-4">🧭</div>
          <p style={{ fontSize: 18, fontWeight: 600, color: '#E8946A' }}>Loading your journey...</p>
        </div>
      </div>
    );
  }

  if (isError || !journey) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: pageBg, fontFamily: "'DM Sans', sans-serif" }}
      >
        <div className="text-center">
          <p style={{ fontSize: 48 }} className="mb-4">😅</p>
          <p style={{ fontSize: 20, fontWeight: 600, color: '#2A2926', marginBottom: 8 }}>Journey not found</p>
          <button
            onClick={handleBack}
            className="px-6 py-2.5 rounded-full text-white font-semibold"
            style={{ background: '#E8946A', fontSize: 15 }}
          >
            Back to Journeys
          </button>
        </div>
      </div>
    );
  }

  const isCompleted = journey.status === 'completed';
  const currentStepIndex = journey.steps.findIndex((s) => !s.isCompleted);
  const nextStep = currentStepIndex >= 0 ? journey.steps[currentStepIndex] : null;
  const currentDay = (journey.currentStep ?? 0) + 1;
  const totalDays = journey.totalSteps ?? 0;

  return (
    <div
      className="kids-journey-detail-scope min-h-screen relative overflow-hidden flex flex-col"
      style={{ background: pageBg, fontFamily: "'DM Sans', sans-serif" }}
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
          <span style={{ fontSize: 18, fontWeight: 600, color: '#2A2926' }}>
            {journey.title}
          </span>
        </div>
        <span
          className="px-3 py-1 rounded-full"
          style={{
            fontSize: 12,
            fontWeight: 600,
            background: isCompleted ? '#3ECDC6' : '#FEF0EA',
            color: isCompleted ? '#FFFFFF' : '#E8946A',
          }}
        >
          {isCompleted ? 'Completed' : 'In Progress'}
        </span>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center px-5 pb-8 relative z-10">
        <div className="max-w-[600px] w-full flex flex-col items-center">
          {/* Lolo + headline */}
          <div className="flex flex-col items-center my-6" style={{ animation: 'loloBreath 4s ease-in-out infinite' }}>
            <img
              src={loloJourneys}
              alt="Lolo"
              className="drop-shadow-2xl mb-3"
              style={{ width: 90, height: 90, objectFit: 'contain' }}
            />
            <p className="text-center" style={{ fontSize: 17, color: '#6B675E', maxWidth: 400, lineHeight: 1.5 }}>
              {isCompleted
                ? `You did it! ${totalDays} day${totalDays !== 1 ? 's' : ''} of ${journey.title}. So proud of you.`
                : `Day ${Math.min(currentDay, totalDays)} of ${totalDays}. Let's keep going.`}
            </p>
          </div>

          {/* Progress overview card */}
          <div
            className="w-full mb-5"
            style={{
              background: '#FFFFFF',
              borderRadius: 16,
              borderLeft: '4px solid #E8946A',
              padding: 24,
              boxShadow: '0 4px 12px rgba(42,41,38,0.06)',
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <span style={{ fontSize: 14, color: '#6B675E', fontWeight: 500 }}>Your Progress</span>
              <span style={{ fontSize: 20, fontWeight: 700, color: '#E8946A' }}>{journey.progress}%</span>
            </div>
            {totalDays > 0 && (
              <div className="mb-4">
                <SteppingStones current={currentDay} total={totalDays} />
              </div>
            )}
            {isCompleted && (
              <div
                className="flex items-center gap-3 p-3 rounded-xl"
                style={{ background: '#FEF0EA' }}
              >
                <span style={{ fontSize: 28 }}>🏆</span>
                <div>
                  <p style={{ fontSize: 15, fontWeight: 600, color: '#E8946A', marginBottom: 2 }}>Journey Complete!</p>
                  <p style={{ fontSize: 13, color: '#6B675E' }}>Great job finishing all steps!</p>
                </div>
              </div>
            )}
          </div>

          {/* Next step CTA */}
          {nextStep && !isCompleted && (
            <div
              className="w-full mb-5"
              style={{
                background: '#FFFFFF',
                borderRadius: 16,
                border: '2px solid #E8946A',
                padding: 24,
                boxShadow: '0 4px 16px rgba(232,148,106,0.12)',
              }}
            >
              <div className="flex items-center gap-2 mb-3">
                <span style={{ fontSize: 14, color: '#E8946A', fontWeight: 600 }}>▶ Today's Step</span>
                <span style={{ fontSize: 13, color: '#9B978E' }}>Step {nextStep.stepNumber}</span>
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 600, color: '#2A2926', marginBottom: 6 }}>
                {nextStep.title}
              </h3>
              {nextStep.description && (
                <p style={{ fontSize: 14, color: '#6B675E', lineHeight: 1.5, marginBottom: 16 }}>
                  {nextStep.description}
                </p>
              )}
              <button
                onClick={() => handleCompleteStep(nextStep.id)}
                disabled={completeStep.isPending}
                className="w-full py-3.5 rounded-xl font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
                style={{ background: '#E8946A', fontSize: 15, border: 'none' }}
              >
                {completeStep.isPending ? 'Completing...' : 'Mark as Complete ✓'}
              </button>
            </div>
          )}

          {/* All steps list */}
          <div className="w-full mb-5">
            <h2 style={{ fontSize: 17, fontWeight: 600, color: '#2A2926', marginBottom: 12 }}>
              All Steps
            </h2>
            <div className="flex flex-col gap-3">
              {journey.steps.map((step, index) => {
                const isCurrent = index === currentStepIndex;
                return (
                  <div
                    key={step.id}
                    className="w-full"
                    style={{
                      background: step.isCompleted ? '#FEF0EA' : '#FFFFFF',
                      borderRadius: 14,
                      border: isCurrent ? '2px solid #E8946A' : '1px solid #E8E6E1',
                      padding: '16px 20px',
                      boxShadow: isCurrent ? '0 4px 12px rgba(232,148,106,0.1)' : '0 2px 6px rgba(42,41,38,0.04)',
                      animation: `kidsFadeIn 0.4s ease-out ${index * 0.04}s both`,
                    }}
                  >
                    <div className="flex items-start gap-3">
                      {/* Step circle */}
                      <div className="flex-shrink-0 mt-0.5">
                        {step.isCompleted ? (
                          <div
                            className="rounded-full flex items-center justify-center"
                            style={{ width: 28, height: 28, background: '#E8946A', color: '#fff', fontSize: 14, fontWeight: 700 }}
                          >
                            ✓
                          </div>
                        ) : isCurrent ? (
                          <div
                            className="rounded-full flex items-center justify-center relative"
                            style={{ width: 28, height: 28, border: '2px solid #E8946A', background: '#FFFFFF' }}
                          >
                            <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#E8946A' }} />
                            <div
                              className="absolute inset-0 rounded-full"
                              style={{ border: '2px solid #E8946A', animation: 'stonePulse 2s ease-in-out infinite' }}
                            />
                          </div>
                        ) : (
                          <div
                            className="rounded-full flex items-center justify-center"
                            style={{ width: 28, height: 28, border: '2px solid #E8E6E1', color: '#9B978E', fontSize: 12, fontWeight: 600 }}
                          >
                            {step.stepNumber}
                          </div>
                        )}
                      </div>

                      {/* Step content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span style={{ fontSize: 12, color: '#9B978E', fontWeight: 500 }}>
                            Day {step.stepNumber}
                          </span>
                          {step.isCompleted && step.completedAt && (
                            <span style={{ fontSize: 12, color: '#E8946A' }}>
                              · {new Date(step.completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </span>
                          )}
                        </div>
                        <p
                          style={{
                            fontSize: 15,
                            fontWeight: step.isCompleted || isCurrent ? 600 : 500,
                            color: step.isCompleted ? '#E8946A' : '#2A2926',
                            lineHeight: 1.4,
                            marginBottom: step.description ? 4 : 0,
                          }}
                        >
                          {step.title}
                        </p>
                        {step.description && (
                          <p style={{ fontSize: 13, color: '#6B675E', lineHeight: 1.5 }}>
                            {step.description}
                          </p>
                        )}
                      </div>

                      {/* Inline complete button for non-current, non-completed */}
                      {!step.isCompleted && !isCurrent && (
                        <button
                          onClick={() => handleCompleteStep(step.id)}
                          disabled={completeStep.isPending}
                          className="flex-shrink-0 px-3 py-1.5 rounded-full transition hover:bg-white/60 disabled:opacity-60"
                          style={{
                            fontSize: 12,
                            fontWeight: 600,
                            color: '#E8946A',
                            border: '1.5px solid #E8946A',
                            background: 'transparent',
                          }}
                        >
                          Complete
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Completion actions */}
          {isCompleted && (
            <div className="w-full flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={handleBack}
                className="px-6 py-3 rounded-full font-semibold transition hover:bg-white/60"
                style={{ border: '1.5px solid #E8E6E1', color: '#2A2926', background: '#FFFFFF', fontSize: 15 }}
              >
                ← Back to Journeys
              </button>
              <button
                onClick={() => navigate(`/kids/${childId}/moments`, { state: { mood } })}
                className="px-6 py-3 rounded-full font-semibold text-white transition hover:opacity-90"
                style={{ background: '#E8946A', fontSize: 15, border: 'none' }}
              >
                See My Moments ✨
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-5 text-center">
        <span style={{ fontSize: 12, color: '#9B978E' }}>Made with 💛 for curious minds</span>
      </footer>

      <style>{`
        .kids-journey-detail-scope h1,
        .kids-journey-detail-scope h2,
        .kids-journey-detail-scope h3 { font-family: 'DM Serif Display', Georgia, serif !important; }
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
