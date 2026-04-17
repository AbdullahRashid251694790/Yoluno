/**
 * Kids Mood Check Page
 *
 * Daily mood check-in screen where children select how they're feeling.
 * After selection, shows mood-specific activity options (matching loveable).
 *
 * Flow: ChildSelect → MoodCheck (select mood → activity picker) → Chat/Stories/Journeys/Family/Home
 */

import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useChild } from '@/contexts/ChildContext';
import { useChildProfile } from '@/hooks/queries';
import { useTodaysMood, useLogMoodCheckin } from '@/hooks/queries/useMoodCheckin';
import { MOOD_IMAGES } from '@/components/chat/ChatAvatar';
import {
  moodConfigs,
  getAllMoods,
  getLunoMoodResponse,
  getSuggestedActivities,
} from '@/lib/moodResponses';
import type { MoodType } from '@/services/moodCheckin';
import lunoHero from '@/assets/landing/luno-hero.png';
import lunoHome from '@/assets/landing/luno-home.png';
import lumiHome from '@/assets/landing/lumi-home.png';
import loloHome from '@/assets/landing/lolo-home.png';
import lotiHome from '@/assets/landing/loti-home.png';

const MOOD_COLORS: Record<MoodType, string> = {
  happy: '#4CAF50',
  sad: '#5C6BC0',
  angry: '#EF5350',
  calm: '#3ECDC6',
  worried: '#AB47BC',
  tired: '#FF7043',
  excited: '#FFA726',
  notsure: '#78909C',
};

const GUIDE_IMAGES: Record<string, string> = {
  chat: lunoHome,
  stories: lumiHome,
  journeys: loloHome,
  family: lotiHome,
};

/* ─── Mood-specific activity options (from loveable) ─── */
interface MoodOption {
  key: string;
  title: string;
  subtitle: string;
  color: string;
  bgColor: string;
  icon: string;
}

const POSITIVE_OPTIONS: MoodOption[] = [
  { key: 'chat', title: 'Chat with Luno', subtitle: "Ask anything you're curious about!", color: '#3ECDC6', bgColor: '#E8F6F4', icon: '🌊' },
  { key: 'stories', title: 'A story with Lumi', subtitle: 'Start an adventure', color: '#B8A5D4', bgColor: '#F3EFF8', icon: '📖' },
  { key: 'journeys', title: 'A challenge with Lolo', subtitle: 'Take on a fun challenge', color: '#E8946A', bgColor: '#FEF0EA', icon: '🌿' },
  { key: 'family', title: 'Family time with Loti', subtitle: 'See what your family shared', color: '#D4A843', bgColor: '#FDF6E8', icon: '🏠' },
  { key: 'explore', title: 'Just explore', subtitle: 'See what catches your eye', color: '#3ECDC6', bgColor: '#F5F3EE', icon: '✨' },
];

const GENTLE_OPTIONS: MoodOption[] = [
  { key: 'chat', title: 'Quiet chat with Luno', subtitle: 'A peaceful conversation at your pace', color: '#3ECDC6', bgColor: '#E8F6F4', icon: '🌊' },
  { key: 'stories', title: 'A cozy story with Lumi', subtitle: 'A gentle, comforting tale', color: '#B8A5D4', bgColor: '#F3EFF8', icon: '📖' },
  { key: 'journeys', title: 'A gentle moment with Lolo', subtitle: 'A quiet reflection — just for you', color: '#E8946A', bgColor: '#FEF0EA', icon: '🌿' },
  { key: 'family', title: 'Family time with Loti', subtitle: 'Listen to family voices and look at memories', color: '#D4A843', bgColor: '#FDF6E8', icon: '🏠' },
  { key: 'explore', title: 'Just explore', subtitle: 'Do your own thing at your own pace', color: '#3ECDC6', bgColor: '#F5F3EE', icon: '✨' },
];

const CALM_OPTIONS: MoodOption[] = [
  { key: 'chat', title: 'Chat with Luno', subtitle: 'Follow your curiosity', color: '#3ECDC6', bgColor: '#E8F6F4', icon: '🌊' },
  { key: 'stories', title: 'A story with Lumi', subtitle: 'See where imagination takes you', color: '#B8A5D4', bgColor: '#F3EFF8', icon: '📖' },
  { key: 'journeys', title: 'A moment with Lolo', subtitle: 'Something to grow with', color: '#E8946A', bgColor: '#FEF0EA', icon: '🌿' },
  { key: 'family', title: 'Family time with Loti', subtitle: 'Connect with your people', color: '#D4A843', bgColor: '#FDF6E8', icon: '🏠' },
  { key: 'explore', title: 'Just explore', subtitle: 'See what feels right', color: '#3ECDC6', bgColor: '#F5F3EE', icon: '✨' },
];

const MOOD_CONFIG: Record<MoodType, { gradient: string; greeting: string; options: MoodOption[]; floatCount: number; floatSpeed: number }> = {
  happy:   { gradient: 'linear-gradient(165deg, #E8F6F4 0%, #F3EFF8 40%, #FEF0EA 70%, #FDF6E8 100%)', greeting: "That's wonderful! What shall we explore?", options: POSITIVE_OPTIONS, floatCount: 14, floatSpeed: 20 },
  excited: { gradient: 'linear-gradient(165deg, #E8F6F4 0%, #F3EFF8 40%, #FEF0EA 70%, #FDF6E8 100%)', greeting: "Love that energy! Let's go!", options: POSITIVE_OPTIONS, floatCount: 14, floatSpeed: 20 },
  calm:    { gradient: 'linear-gradient(165deg, #FAFAF7 0%, #F5F3EE 50%, #E8F6F4 100%)', greeting: 'Nice. Ready when you are.', options: CALM_OPTIONS, floatCount: 10, floatSpeed: 28 },
  notsure: { gradient: 'linear-gradient(165deg, #FAFAF7 0%, #F5F3EE 50%, #E8F6F4 100%)', greeting: "That's fine! Let's just see what feels right.", options: CALM_OPTIONS, floatCount: 10, floatSpeed: 28 },
  sad:     { gradient: 'linear-gradient(165deg, #FDF6E8 0%, #FEF0EA 40%, #F3EFF8 70%, #F5F3EE 100%)', greeting: "I'm here. Let's find something that feels good.", options: GENTLE_OPTIONS, floatCount: 8, floatSpeed: 30 },
  angry:   { gradient: 'linear-gradient(165deg, #FDF6E8 0%, #FEF0EA 40%, #F3EFF8 70%, #F5F3EE 100%)', greeting: "It's okay to feel that way. Want to do something together?", options: GENTLE_OPTIONS, floatCount: 8, floatSpeed: 30 },
  worried: { gradient: 'linear-gradient(165deg, #FDF6E8 0%, #FEF0EA 40%, #F3EFF8 70%, #F5F3EE 100%)', greeting: "That's okay. Let's take it slow today.", options: GENTLE_OPTIONS, floatCount: 8, floatSpeed: 30 },
  tired:   { gradient: 'linear-gradient(165deg, #FDF6E8 0%, #FEF0EA 40%, #F3EFF8 70%, #F5F3EE 100%)', greeting: "It's okay to feel tired. Let's do something gentle.", options: GENTLE_OPTIONS, floatCount: 8, floatSpeed: 30 },
};

const buildFloats = (count: number, speed: number) =>
  Array.from({ length: count }, (_, i) => ({
    id: i,
    type: i % 3 === 0 ? 'star' : i % 3 === 1 ? 'cloud' : 'sparkle',
    left: `${5 + Math.random() * 90}%`,
    top: `${5 + Math.random() * 90}%`,
    size: 6 + Math.random() * 10,
    delay: Math.random() * 20,
    duration: speed + Math.random() * 10,
    opacity: 0.12 + Math.random() * 0.06,
  }));

const MOOD_SELECT_FLOATS = buildFloats(16, 20);

export function KidsMoodCheckPage() {
  const { childId } = useParams<{ childId: string }>();
  const navigate = useNavigate();
  const { enterKidsMode, exitKidsMode } = useChild();

  const [selectedMood, setSelectedMood] = useState<MoodType | null>(null);
  const [showActivities, setShowActivities] = useState(false);

  const { data: child, isLoading: childLoading, isError: childError } = useChildProfile(childId);
  const { data: todaysMood, isLoading: moodLoading } = useTodaysMood(childId);
  const logMoodMutation = useLogMoodCheckin();

  // If already checked in today, redirect to home
  useEffect(() => {
    if (todaysMood && !moodLoading && !selectedMood) {
      navigate(`/kids/${childId}`, { replace: true });
    }
  }, [todaysMood, moodLoading, childId, navigate, selectedMood]);

  // Enter kids mode when child loads
  useEffect(() => {
    if (child) enterKidsMode(child);
    return () => { exitKidsMode(); };
  }, [child, enterKidsMode, exitKidsMode]);

  const moods = useMemo(() => getAllMoods(), []);

  const handleMoodSelect = async (mood: MoodType) => {
    if (selectedMood) return;
    setSelectedMood(mood);

    const response = getLunoMoodResponse(mood);
    const suggestedActivities = getSuggestedActivities(mood);

    try {
      await logMoodMutation.mutateAsync({
        childId: childId!,
        data: { mood, luno_response: response, suggested_activity: suggestedActivities[0]?.title },
      });
    } catch (error) {
      console.error('Failed to log mood:', error);
    }

    // Brief pause then show activities
    setTimeout(() => setShowActivities(true), 600);
  };

  const handleActivitySelect = (key: string) => {
    const basePath = `/kids/${childId}`;
    switch (key) {
      case 'chat':
        navigate(`${basePath}/chat?mood=${selectedMood}`, { replace: true });
        break;
      case 'stories':
        navigate(`${basePath}/stories`, { replace: true });
        break;
      case 'journeys':
        navigate(`${basePath}/journeys`, { replace: true });
        break;
      case 'family':
        navigate(`${basePath}/family`, { replace: true });
        break;
      case 'explore':
      default:
        navigate(basePath, { replace: true });
    }
  };

  const handleBack = () => navigate('/play', { replace: true });

  // Loading / already checked in
  if (childLoading || moodLoading || (todaysMood && !selectedMood)) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(165deg, #E8F6F4 0%, #F3EFF8 40%, #FEF0EA 70%, #FDF6E8 100%)', fontFamily: "'DM Sans', sans-serif" }}>
        <div className="text-center">
          <div style={{ fontSize: 48 }} className="animate-bounce mb-4">✨</div>
          <p style={{ fontSize: 18, fontWeight: 600, color: '#3ECDC6' }}>Getting ready...</p>
        </div>
      </div>
    );
  }

  if (childError || !child) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(165deg, #E8F6F4 0%, #F3EFF8 40%, #FEF0EA 70%, #FDF6E8 100%)', fontFamily: "'DM Sans', sans-serif" }}>
        <div className="text-center">
          <p style={{ fontSize: 48 }} className="mb-4">😅</p>
          <p style={{ fontSize: 20, fontWeight: 600, color: '#2A2926', marginBottom: 8 }}>Oops!</p>
          <p style={{ fontSize: 14, color: '#6B675E', marginBottom: 20 }}>We couldn't find your profile.</p>
          <button onClick={handleBack} className="px-6 py-2.5 rounded-full text-white font-semibold" style={{ background: '#3ECDC6', fontSize: 15 }}>Go Back</button>
        </div>
      </div>
    );
  }

  const moodConfig = selectedMood ? MOOD_CONFIG[selectedMood] : null;
  const currentGradient = moodConfig?.gradient || 'linear-gradient(165deg, #E8F6F4 0%, #F3EFF8 40%, #FEF0EA 70%, #FDF6E8 100%)';
  const floats = showActivities && moodConfig ? buildFloats(moodConfig.floatCount, moodConfig.floatSpeed) : MOOD_SELECT_FLOATS;

  return (
    <div
      className="kids-mood-scope min-h-screen relative overflow-hidden flex flex-col"
      style={{ background: currentGradient, fontFamily: "'DM Sans', sans-serif", transition: 'background 0.8s ease' }}
    >
      {/* Floating background */}
      {floats.map((el) => (
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

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-8 relative z-10">
        {!showActivities ? (
          /* ─── Mood selection screen ─── */
          <div className="max-w-[600px] w-full flex flex-col items-center">
            <div className="mb-2 flex flex-col items-center" style={{ animation: 'lunoBreath 4s ease-in-out infinite' }}>
              <img src={lunoHero} alt="Luno" className="drop-shadow-2xl" style={{ width: 140, height: 140, objectFit: 'contain' }} />
              <span style={{ fontSize: 14, fontWeight: 600, color: '#2A2926', marginTop: 8 }}>Luno</span>
            </div>

            <h1 className="text-center mb-1" style={{ fontSize: 28, fontWeight: 600, color: '#2A2926' }}>
              Hey {child.name}!
            </h1>
            <p className="text-center mb-1" style={{ fontSize: 18, color: '#6B675E' }}>
              How are you feeling today?
            </p>
            <p className="text-center mb-8" style={{ fontSize: 13, color: '#9B978E', fontStyle: 'italic' }}>
              There's no wrong answer
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 w-full max-w-[520px]">
              {moods.map((mood, i) => {
                const isSelected = selectedMood === mood;
                const config = moodConfigs[mood];
                return (
                  <button
                    key={mood}
                    onClick={() => handleMoodSelect(mood)}
                    disabled={logMoodMutation.isPending || !!selectedMood}
                    className="flex flex-col items-center justify-center focus:outline-none"
                    style={{
                      minHeight: 130, background: isSelected ? '#E8F6F4' : '#FFFFFF',
                      border: `2px solid ${isSelected ? '#3ECDC6' : 'transparent'}`,
                      borderRadius: 16, padding: 16,
                      boxShadow: '0 2px 8px rgba(42,41,38,0.06)',
                      transform: isSelected ? 'scale(1.05)' : 'scale(1)',
                      transition: 'all 0.3s ease-out', cursor: 'pointer',
                      animation: `kidsFadeIn 0.4s ease-out ${i * 0.05}s both`, position: 'relative',
                    }}
                  >
                    {isSelected && (
                      <div style={{ position: 'absolute', top: 8, right: 8 }}>
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <circle cx="8" cy="8" r="8" fill="#3ECDC6" />
                          <path d="M5 8l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                    )}
                    <img src={MOOD_IMAGES[mood]} alt={config.label} loading="lazy" style={{ width: 64, height: 64, objectFit: 'contain', marginBottom: 8 }} />
                    <span style={{ fontSize: 14, fontWeight: 500, color: MOOD_COLORS[mood] }}>{config.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          /* ─── Activity picker (after mood selection) ─── */
          <div className="max-w-[500px] w-full flex flex-col items-center" style={{ animation: 'kidsFadeIn 0.5s ease-out both' }}>
            <div className="mb-2 flex flex-col items-center" style={{ animation: 'lunoBreath 4s ease-in-out infinite' }}>
              <img src={lunoHero} alt="Luno" className="drop-shadow-2xl" style={{ width: 120, height: 120, objectFit: 'contain' }} />
              <span style={{ fontSize: 14, fontWeight: 600, color: '#2A2926', marginTop: 8 }}>Luno</span>
            </div>

            <h1 className="text-center mb-1" style={{ fontSize: 28, fontWeight: 600, color: '#2A2926' }}>
              Hey {child.name}!
            </h1>
            <p className="text-center mb-8" style={{ fontSize: 17, color: '#6B675E', maxWidth: 400, lineHeight: 1.5 }}>
              {moodConfig?.greeting}
            </p>

            <h2 className="text-center mb-5" style={{ fontSize: 20, fontWeight: 600, color: '#2A2926' }}>
              What would you like to do?
            </h2>

            <div className="w-full flex flex-col gap-3">
              {moodConfig?.options.map((opt, i) => (
                <button
                  key={opt.key}
                  onClick={() => handleActivitySelect(opt.key)}
                  className="w-full flex items-center gap-4 text-left focus:outline-none group"
                  style={{
                    background: '#FFFFFF', border: '1.5px solid #E8E6E1', borderRadius: 16,
                    padding: '20px 24px', cursor: 'pointer', transition: 'all 0.25s ease-out',
                    animation: `kidsFadeIn 0.4s ease-out ${i * 0.08}s both`,
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = opt.color;
                    (e.currentTarget as HTMLElement).style.transform = 'scale(1.02)';
                    (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 20px rgba(42,41,38,0.1)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = '#E8E6E1';
                    (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
                    (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                  }}
                >
                  <div
                    className="flex-shrink-0 rounded-full flex items-center justify-center overflow-hidden"
                    style={{ width: 48, height: 48, background: opt.bgColor }}
                  >
                    {GUIDE_IMAGES[opt.key] ? (
                      <img src={GUIDE_IMAGES[opt.key]} alt={opt.title} style={{ width: 40, height: 40, objectFit: 'contain' }} />
                    ) : (
                      <span style={{ fontSize: 20 }}>{opt.icon}</span>
                    )}
                  </div>
                  <div>
                    <span style={{ fontSize: 16, fontWeight: 600, color: '#2A2926', display: 'block' }}>{opt.title}</span>
                    <span style={{ fontSize: 13, color: '#9B978E', display: 'block', marginTop: 2 }}>{opt.subtitle}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-6 text-center">
        <span style={{ fontSize: 13, color: '#9B978E' }}>Made with 💛 for curious minds</span>
      </footer>

      <style>{`
        .kids-mood-scope h1,
        .kids-mood-scope h2,
        .kids-mood-scope h3 { font-family: 'DM Serif Display', Georgia, serif !important; }
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
