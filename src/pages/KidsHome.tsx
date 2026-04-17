/**
 * Kids Home Dashboard
 *
 * Central hub for children — redesigned to match loveable KidsMainDashboard.
 * 2x2 space cards (Chat/Stories/Journeys/Family), "What's happening" suggestions,
 * mood-aware gradients and greetings.
 *
 * Gamification elements (streak, stars, missions, badges, rewards) kept in code
 * but commented out of the UI.
 */

import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { useChild } from '@/contexts/ChildContext';
import { useChildProfile } from '@/hooks/queries';
/* Gamification hooks — kept for re-enabling later
import { useGamificationStats, useChildBadges } from '@/hooks/queries/useGamification';
import { useRewardCount } from '@/hooks/queries/useJourneyRewards';
import { useDailyMissions, useClaimMissionBonus } from '@/hooks/queries/useDailyMissions';
*/
import { useChatBuddy } from '@/hooks/queries/useBuddyChat';
import { useChildSharedMoments } from '@/hooks/queries/useSharedMoments';
import { useTodaysMood } from '@/hooks/queries/useMoodCheckin';
import { KidNotificationBell } from '@/components/kids/KidNotificationBell';
import { PasswordChangeRequestButton } from '@/components/kids/PasswordChangeRequestButton';
import lunoHero from '@/assets/landing/luno-hero.png';
import lunoChat from '@/assets/landing/luno-chat.png';
import lumiStories from '@/assets/landing/lumi-stories.png';
import loloJourneys from '@/assets/landing/lolo-journeys.png';
import lotiFamily from '@/assets/landing/loti-family.png';

const GUIDE_IMAGES: Record<string, string> = {
  chat: lunoChat,
  stories: lumiStories,
  journeys: loloJourneys,
  family: lotiFamily,
};

const MOOD_GRADIENTS: Record<string, string> = {
  happy: 'linear-gradient(165deg, #E8F6F4 0%, #F3EFF8 40%, #FEF0EA 70%, #FDF6E8 100%)',
  excited: 'linear-gradient(165deg, #E8F6F4 0%, #F3EFF8 40%, #FEF0EA 70%, #FDF6E8 100%)',
  tired: 'linear-gradient(165deg, #FDF6E8 0%, #FEF0EA 40%, #F3EFF8 70%, #F5F3EE 100%)',
  sad: 'linear-gradient(165deg, #FDF6E8 0%, #FEF0EA 40%, #F3EFF8 70%, #F5F3EE 100%)',
  worried: 'linear-gradient(165deg, #FDF6E8 0%, #FEF0EA 40%, #F3EFF8 70%, #F5F3EE 100%)',
  angry: 'linear-gradient(165deg, #FDF6E8 0%, #FEF0EA 40%, #F3EFF8 70%, #F5F3EE 100%)',
  calm: 'linear-gradient(165deg, #FAFAF7 0%, #F5F3EE 50%, #E8F6F4 100%)',
  notsure: 'linear-gradient(165deg, #FAFAF7 0%, #F5F3EE 50%, #E8F6F4 100%)',
};

const LUNO_GREETINGS: Record<string, string> = {
  happy: "Let's make today awesome! Where do you want to go?",
  excited: "I can feel the energy! What should we explore?",
  tired: "Let's take it easy. Something gentle sounds nice.",
  sad: "I'm glad you're here. Let's find something good.",
  worried: "I'm here. Let's do something together.",
  angry: "It's okay. Want to try something that helps?",
  calm: "Nice and easy. What sounds good?",
  notsure: "No worries. Let's just see what happens.",
};

function getTimeOfDay() {
  const h = new Date().getHours();
  if (h >= 6 && h < 12) return 'morning';
  if (h >= 12 && h < 17) return 'afternoon';
  if (h >= 17 && h < 21) return 'evening';
  return 'night';
}

function getGreeting(time: string, name: string) {
  if (time === 'morning') return `Good morning, ${name}!`;
  if (time === 'afternoon') return `Good afternoon, ${name}!`;
  if (time === 'evening') return `Good evening, ${name}!`;
  return `Time to wind down, ${name}`;
}

const SPACES = [
  { key: 'chat', name: 'Chat', guide: 'Luno', color: '#3ECDC6', softColor: '#B4DED7', bgTint: '#E8F6F4', subtitle: 'Ask anything you\'re curious about' },
  { key: 'stories', name: 'Stories', guide: 'Lumi', color: '#B8A5D4', softColor: '#D4C8E8', bgTint: '#F3EFF8', subtitle: 'Create a new story or continue one' },
  { key: 'journeys', name: 'Journeys', guide: 'Lolo', color: '#E8946A', softColor: '#F0C4AD', bgTint: '#FEF0EA', subtitle: 'Explore a new journey' },
  { key: 'family', name: 'Family', guide: 'Loti', color: '#D4A843', softColor: '#E8D5A0', bgTint: '#FDF6E8', subtitle: 'See your family\'s world' },
];

const FLOAT_ELEMENTS = Array.from({ length: 12 }, (_, i) => ({
  id: i,
  type: i % 3 === 0 ? 'star' : i % 3 === 1 ? 'cloud' : 'sparkle',
  left: `${5 + Math.random() * 90}%`,
  top: `${5 + Math.random() * 90}%`,
  size: 6 + Math.random() * 10,
  delay: Math.random() * 20,
  duration: 22 + Math.random() * 12,
  opacity: 0.12 + Math.random() * 0.06,
}));

const MOMENT_STYLES: Record<string, { bg: string; color: string; icon: string }> = {
  journey_complete: { bg: '#FEF0EA', color: '#E8946A', icon: '🧭' },
  story_created: { bg: '#F3EFF8', color: '#B8A5D4', icon: '📖' },
  story_read: { bg: '#F3EFF8', color: '#B8A5D4', icon: '📖' },
  curiosity: { bg: '#E8F6F4', color: '#3ECDC6', icon: '?' },
  family_listen: { bg: '#FDF6E8', color: '#D4A843', icon: '💛' },
  mood_checkin: { bg: '#F5F3EE', color: '#9B978E', icon: '😊' },
};

export function KidsHomePage() {
  const { childId } = useParams<{ childId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { enterKidsMode, exitKidsMode } = useChild();
  const { data: child, isLoading, isError } = useChildProfile(childId);
  const { data: buddy } = useChatBuddy(childId);
  const { data: sharedMoments = [] } = useChildSharedMoments(childId);
  const { data: todaysMood } = useTodaysMood(childId);

  const mood = (location.state as any)?.mood || 'happy';
  const time = useMemo(() => getTimeOfDay(), []);

  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (child) enterKidsMode(child);
    return () => { exitKidsMode(); };
  }, [child, enterKidsMode, exitKidsMode]);

  const gradient = MOOD_GRADIENTS[mood] || MOOD_GRADIENTS.happy;
  const lunoGreeting = LUNO_GREETINGS[mood] || LUNO_GREETINGS.happy;
  const isNight = time === 'night';

  // At night, reorder: Stories & Family first
  const orderedSpaces = isNight
    ? [SPACES[1], SPACES[3], SPACES[0], SPACES[2]]
    : SPACES;

  const suggestions = [
    { icon: '📖', text: 'Your story with Lumi is waiting to continue', space: 'stories' },
    { icon: '🧭', text: `${child?.name || 'Your'} journeys — ready when you are`, space: 'journeys' },
    { icon: '💛', text: 'See what your family has shared', space: 'family' },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: gradient, fontFamily: "'DM Sans', sans-serif" }}>
        <div className="text-center">
          <div style={{ fontSize: 48 }} className="animate-bounce mb-4">✨</div>
          <p style={{ fontSize: 18, fontWeight: 600, color: '#3ECDC6' }}>Getting ready...</p>
        </div>
      </div>
    );
  }

  if (isError || !child) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: gradient, fontFamily: "'DM Sans', sans-serif" }}>
        <div className="text-center">
          <p style={{ fontSize: 48 }} className="mb-4">😅</p>
          <p style={{ fontSize: 20, fontWeight: 600, color: '#2A2926', marginBottom: 8 }}>Oops!</p>
          <p style={{ fontSize: 14, color: '#6B675E', marginBottom: 20 }}>We couldn't find your profile.</p>
          <button onClick={() => navigate('/play')} className="px-6 py-2.5 rounded-full text-white font-semibold" style={{ background: '#3ECDC6', fontSize: 15 }}>Go Back</button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="kids-home-scope min-h-screen relative overflow-hidden flex flex-col"
      style={{ background: gradient, fontFamily: "'DM Sans', sans-serif" }}
    >
      {/* Floating bg */}
      {FLOAT_ELEMENTS.map((el) => (
        <div key={el.id} className="absolute pointer-events-none" style={{ left: el.left, top: el.top, opacity: el.opacity, animation: `kidsFloat ${el.duration}s ease-in-out ${el.delay}s infinite alternate` }}>
          {el.type === 'star' && (
            <svg width={el.size} height={el.size} viewBox="0 0 24 24" fill="none">
              <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 16.8l-6.2 4.5 2.4-7.4L2 9.4h7.6L12 2z" fill="#D4A843" opacity="0.6" />
            </svg>
          )}
          {el.type === 'cloud' && <div style={{ width: el.size * 2.5, height: el.size, borderRadius: el.size, background: 'rgba(180,222,215,0.4)', filter: 'blur(4px)' }} />}
          {el.type === 'sparkle' && <div style={{ width: el.size * 0.6, height: el.size * 0.6, borderRadius: '50%', background: 'rgba(184,165,212,0.5)', filter: 'blur(1px)', animation: `kidsTwinkle ${3 + Math.random() * 2}s ease-in-out infinite` }} />}
        </div>
      ))}

      {/* Top bar */}
      <header className="relative z-10 flex items-center justify-between px-6 pt-5 pb-2">
        <button
          onClick={() => setShowConfirm(true)}
          className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/40 transition-colors"
          aria-label="Go back"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M13 4l-6 6 6 6" stroke="#2A2926" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <span style={{ fontSize: 20, fontWeight: 600, color: '#2A2926' }}>
          {getGreeting(time, child.name)}
        </span>
        <div className="flex items-center gap-2">
          <KidNotificationBell childId={childId!} />
          <PasswordChangeRequestButton
            childId={childId!}
            childName={child.name}
            className="rounded-full bg-white/50 backdrop-blur-sm hover:bg-white/70"
          />
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex flex-col items-center px-6 relative z-10">
        <div className="max-w-[520px] w-full flex flex-col items-center">
          {/* Luno */}
          <div className="mb-1 flex flex-col items-center" style={{ animation: 'lunoBreath 4s ease-in-out infinite' }}>
            <img src={lunoHero} alt="Luno" className="drop-shadow-2xl" style={{ width: 100, height: 100, objectFit: 'contain' }} />
          </div>
          <p className="text-center mb-6" style={{ fontSize: 17, color: '#6B675E', maxWidth: 380, lineHeight: 1.5 }}>
            {lunoGreeting}
          </p>

          {/* 2x2 Space Cards */}
          <div className="grid grid-cols-2 gap-4 w-full mb-8">
            {orderedSpaces.map((space, i) => {
              const dimmed = isNight && (space.key === 'chat' || space.key === 'journeys');
              return (
                <button
                  key={space.key}
                  onClick={() => navigate(`/kids/${childId}/${space.key}`, { state: { mood } })}
                  className="flex flex-col items-center text-center focus:outline-none group"
                  style={{
                    background: `linear-gradient(145deg, #FFFFFF 60%, ${space.bgTint} 100%)`,
                    border: `2px solid ${space.softColor}`,
                    borderRadius: 20,
                    padding: '24px 16px 20px',
                    boxShadow: '0 4px 16px rgba(42,41,38,0.08)',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease-out',
                    opacity: dimmed ? 0.6 : 1,
                    animation: `kidsFadeIn 0.4s ease-out ${i * 0.08}s both`,
                  }}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.transform = 'scale(1.05)';
                    el.style.borderColor = space.color;
                    el.style.boxShadow = '0 8px 28px rgba(42,41,38,0.12)';
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.transform = 'scale(1)';
                    el.style.borderColor = space.softColor;
                    el.style.boxShadow = '0 4px 16px rgba(42,41,38,0.08)';
                  }}
                  aria-label={`Go to ${space.name} with ${space.guide}`}
                >
                  <div
                    className="rounded-full flex items-center justify-center mb-3 overflow-hidden"
                    style={{ width: 60, height: 60, background: space.bgTint }}
                  >
                    <img src={GUIDE_IMAGES[space.key]} alt={space.guide} style={{ width: 52, height: 52, objectFit: 'contain' }} />
                  </div>
                  <span style={{ fontSize: 18, fontWeight: 600, color: '#2A2926', marginBottom: 4 }}>{space.name}</span>
                  <span style={{ fontSize: 13, color: '#6B675E', lineHeight: 1.4 }}>{space.subtitle}</span>
                </button>
              );
            })}
          </div>

          {/* What's happening */}
          <div className="w-full mb-6">
            <h3 style={{ fontSize: 16, fontWeight: 600, color: '#2A2926', marginBottom: 12 }}>
              What's happening today
            </h3>
            <div className="flex flex-col gap-2">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => navigate(`/kids/${childId}/${s.space}`, { state: { mood } })}
                  className="w-full flex items-center gap-3 text-left hover:bg-white/60 transition-colors"
                  style={{
                    background: 'rgba(255,255,255,0.5)',
                    borderRadius: 12,
                    padding: '14px 16px',
                    border: '1px solid rgba(232,230,225,0.6)',
                    cursor: 'pointer',
                    animation: `kidsFadeIn 0.4s ease-out ${0.4 + i * 0.08}s both`,
                  }}
                >
                  <span style={{ fontSize: 18 }}>{s.icon}</span>
                  <span style={{ fontSize: 14, color: '#2A2926', fontWeight: 500 }}>{s.text}</span>
                </button>
              ))}
            </div>
          </div>

          {/* My Moments */}
          {(() => {
            // Build moments from shared_moments + today's mood
            const moments: { id: string; name: string; type: string; date: string }[] = [];

            for (const m of sharedMoments.slice(0, 8)) {
              moments.push({
                id: m.id,
                name: m.title,
                type: m.moment_type,
                date: new Date(m.shared_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
              });
            }

            if (todaysMood) {
              moments.push({
                id: 'mood-today',
                name: `Feeling ${todaysMood.mood || 'good'} today`,
                type: 'mood_checkin',
                date: 'Today',
              });
            }

            if (moments.length === 0) return null;

            return (
              <div className="w-full mb-6" style={{ animation: 'kidsFadeIn 0.4s ease-out 0.5s both' }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: '#2A2926', marginBottom: 12 }}>
                  My Moments ✨
                </h3>
                <div className="flex gap-3 overflow-x-auto pb-3 kids-moments-scroll">
                  {moments.map((m) => {
                    const s = MOMENT_STYLES[m.type] || MOMENT_STYLES.curiosity;
                    return (
                      <div
                        key={m.id}
                        className="flex-shrink-0 flex flex-col items-center text-center"
                        style={{
                          width: 160,
                          height: 180,
                          background: '#FFFFFF',
                          borderRadius: 16,
                          border: '1px solid #E8E6E1',
                          padding: 16,
                          boxShadow: '0 2px 8px rgba(42,41,38,0.06)',
                        }}
                      >
                        <div
                          className="rounded-full flex items-center justify-center mb-3"
                          style={{ width: 60, height: 60, background: s.bg }}
                        >
                          <span style={{ fontSize: s.icon.length > 1 ? 24 : 22, fontWeight: 700, color: s.color }}>{s.icon}</span>
                        </div>
                        <span style={{
                          fontSize: 14, fontWeight: 600, color: '#2A2926', lineHeight: 1.3,
                          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                        }}>
                          {m.name}
                        </span>
                        <span style={{ fontSize: 11, color: '#9B978E', marginTop: 'auto' }}>{m.date}</span>
                      </div>
                    );
                  })}
                </div>
                <button
                  onClick={() => navigate(`/kids/${childId}/moments`, { state: { mood } })}
                  className="mt-2"
                  style={{ fontSize: 13, color: '#3ECDC6', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  See all →
                </button>
              </div>
            );
          })()}

          {/* Gamification sections — commented out of UI, backend still active
          {/* Daily Missions *}
          {/* Badges Teaser *}
          {/* Journey Rewards Teaser *}
          {/* Streak & Star counters (were in header) *}
          */}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-5 text-center">
        <span style={{ fontSize: 12, color: '#9B978E' }}>Made with 💛 for curious minds</span>
      </footer>

      {/* Switch profile confirmation */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm px-6" onClick={() => setShowConfirm(false)}>
          <div
            className="bg-white rounded-2xl p-8 max-w-sm w-full text-center"
            style={{ boxShadow: '0 16px 48px rgba(42,41,38,0.15)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <span style={{ fontSize: 40, display: 'block', marginBottom: 12 }}>🌊</span>
            <h3 style={{ fontSize: 20, fontWeight: 600, color: '#2A2926', marginBottom: 8 }}>
              Want to switch?
            </h3>
            <p style={{ fontSize: 15, color: '#6B675E', marginBottom: 24 }}>
              Your place is saved. You can come back anytime.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-3 rounded-xl font-semibold"
                style={{ border: '1.5px solid #E8E6E1', color: '#2A2926', fontSize: 15, background: '#FFFFFF' }}
              >
                Stay here
              </button>
              <button
                onClick={() => { setShowConfirm(false); navigate('/play'); }}
                className="flex-1 py-3 rounded-xl font-semibold text-white"
                style={{ background: '#3ECDC6', fontSize: 15, border: 'none' }}
              >
                Switch
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .kids-moments-scroll::-webkit-scrollbar { height: 4px; }
        .kids-moments-scroll::-webkit-scrollbar-track { background: transparent; }
        .kids-moments-scroll::-webkit-scrollbar-thumb { background: #E8E6E1; border-radius: 4px; }
        .kids-moments-scroll::-webkit-scrollbar-thumb:hover { background: #D4D1CC; }
        .kids-moments-scroll { scrollbar-width: thin; scrollbar-color: #E8E6E1 transparent; }
        .kids-home-scope h1,
        .kids-home-scope h2,
        .kids-home-scope h3 { font-family: 'DM Serif Display', Georgia, serif !important; }
        @keyframes kidsFloat {
          0% { transform: translateY(0) translateX(0); }
          100% { transform: translateY(-20px) translateX(10px); }
        }
        @keyframes kidsTwinkle {
          0%, 100% { opacity: 0.2; transform: scale(0.8); }
          50% { opacity: 0.5; transform: scale(1.2); }
        }
        @keyframes lunoBreath {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        @keyframes kidsFadeIn {
          from { opacity: 0; transform: translateY(16px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}
