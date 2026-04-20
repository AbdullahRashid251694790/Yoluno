/**
 * Story Wizard Page (parent-facing)
 *
 * Uses the exact same 6-step flow as the kids story creator:
 *   Theme → Character → Setting → [Family?] → Length → Narrator → Generate
 *
 * After the story is generated successfully, the parent is returned to
 * /dashboard/stories with a toast — NOT sent into kids mode.
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useChildProfile, queryKeys } from '@/hooks/queries';
import { generateStory, type StoryCharacter } from '@/services/storyGeneration';
import { type TTSVoice } from '@/services/textToSpeech';
import { toast } from 'sonner';
import lumiStories from '@/assets/landing/lumi-stories.png';
import lunoHero from '@/assets/landing/luno-hero.png';
import lumiHome from '@/assets/landing/lumi-home.png';
import loloHome from '@/assets/landing/lolo-home.png';
import lotiHome from '@/assets/landing/loti-home.png';

const THEME_OPTIONS = [
  'An adventure',
  'Something funny',
  'A magical tale',
  'A scary-but-not-too-scary story',
  'Something about my life',
  'Surprise me!',
];

// Built dynamically per child — the first option uses the child's name
function getCharacterOptions(childName: string | undefined): string[] {
  return [
    childName || 'Me!',
    'A brave animal',
    'A magical creature',
    "Someone new — I'll describe them",
    'You choose, Lumi!',
  ];
}

const SETTING_OPTIONS = [
  'A forest',
  'Outer space',
  'Under the ocean',
  'A magical kingdom',
  'My neighbourhood',
  'Surprise me!',
];

const LENGTH_OPTIONS: { key: 'short' | 'medium' | 'long'; label: string; desc: string }[] = [
  { key: 'short', label: 'Short', desc: '5 pages' },
  { key: 'medium', label: 'Medium', desc: '6 pages' },
  { key: 'long', label: 'Long', desc: '8 pages' },
];

const NARRATORS: { voice: TTSVoice; name: string; image: string; color: string; bg: string }[] = [
  { voice: 'echo',    name: 'Luno', image: lunoHero,  color: '#3ECDC6', bg: '#E8F6F4' },
  { voice: 'shimmer', name: 'Lumi', image: lumiHome,  color: '#B8A5D4', bg: '#F3EFF8' },
  { voice: 'fable',   name: 'Lolo', image: loloHome,  color: '#E8946A', bg: '#FEF0EA' },
  { voice: 'nova',    name: 'Loti', image: lotiHome,  color: '#D4A843', bg: '#FDF6E8' },
];

const themeToMood: Record<string, string> = {
  'An adventure': 'adventurous',
  'Something funny': 'funny',
  'A magical tale': 'magical',
  'A scary-but-not-too-scary story': 'mysterious',
  'Something about my life': 'calm',
  'Surprise me!': 'adventurous',
};

const LOADING_MESSAGES = [
  'Mixing up some magic words...',
  'Sprinkling story dust...',
  'Waking up the characters...',
  'Painting the adventure...',
  'Adding a sprinkle of wonder...',
  'The story fairies are busy...',
];

type Screen = 'theme' | 'character' | 'setting' | 'family' | 'length' | 'narrator' | 'loading';

export function StoryWizardPage() {
  const { childId } = useParams<{ childId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fromDashboard = searchParams.get('from') === 'dashboard';
  const { data: child, isLoading: childLoading } = useChildProfile(childId);

  const [screen, setScreen] = useState<Screen>('theme');
  const [theme, setTheme] = useState('');
  const [character, setCharacter] = useState('');
  const [customCharacterName, setCustomCharacterName] = useState('');
  const [showCustomCharacterInput, setShowCustomCharacterInput] = useState(false);
  const [setting, setSetting] = useState('');
  const [includeFamily, setIncludeFamily] = useState(false);
  const [storyLength, setStoryLength] = useState<'short' | 'medium' | 'long'>('medium');
  const [narratorVoice, setNarratorVoice] = useState<TTSVoice>('shimmer');
  const [loadingMsgIndex, setLoadingMsgIndex] = useState(0);

  // Rotate loading messages
  useEffect(() => {
    if (screen !== 'loading') return;
    const interval = setInterval(() => {
      setLoadingMsgIndex((i) => (i + 1) % LOADING_MESSAGES.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [screen]);

  const exitTo = fromDashboard ? '/dashboard/stories' : `/kids/${childId}/stories`;
  const handleClose = () => navigate(exitTo);

  const handleTheme = (t: string) => {
    setTheme(t);
    setScreen('character');
  };

  const handleCharacter = (c: string) => {
    if (c === "Someone new — I'll describe them") {
      setCharacter(c);
      setShowCustomCharacterInput(true);
      return;
    }
    setCharacter(c);
    setShowCustomCharacterInput(false);
    setScreen('setting');
  };

  const handleCustomCharacterConfirm = () => {
    if (!customCharacterName.trim()) return;
    setCharacter(customCharacterName.trim());
    setShowCustomCharacterInput(false);
    setScreen('setting');
  };

  // True when the child (by name) was chosen as the main character
  const isChildMain = !!child?.name && character === child.name;

  const handleSetting = (s: string) => {
    setSetting(s);
    if (isChildMain) {
      setScreen('family');
    } else {
      setIncludeFamily(false);
      setScreen('length');
    }
  };

  const handleFamily = (include: boolean) => {
    setIncludeFamily(include);
    setScreen('length');
  };

  const handleLength = (len: 'short' | 'medium' | 'long') => {
    setStoryLength(len);
    setScreen('narrator');
  };

  const handleNarrator = async (voice: TTSVoice) => {
    setNarratorVoice(voice);
    setScreen('loading');
    await generate(voice);
  };

  const generate = async (voice: TTSVoice) => {
    if (!childId) return;
    try {
      const characters: StoryCharacter[] = [];
      let characterPhrase = '';
      if (isChildMain && child?.name) {
        characters.push({ name: child.name });
        characterPhrase = `featuring ${child.name}`;
      } else if (character === 'A brave animal') {
        characterPhrase = 'about a brave animal character (Lumi, please invent the animal and give it a name)';
      } else if (character === 'A magical creature') {
        characterPhrase = 'about a magical creature character (Lumi, please invent the creature and give it a name)';
      } else if (character === 'You choose, Lumi!' || character === '') {
        characterPhrase = '(Lumi, please invent a wonderful main character)';
      } else {
        characters.push({ name: character });
        characterPhrase = `featuring ${character}`;
      }

      const themeString = `${theme} ${characterPhrase} set in ${setting.toLowerCase()}`;
      const mood = themeToMood[theme] || 'adventurous';

      const story = await generateStory({
        childProfileId: childId,
        theme: themeString,
        characters,
        mood,
        values: [],
        storyLength,
        includeFamily,
        narratorVoice: voice,
        createdBy: 'parent',
      });

      // Invalidate stories cache so the list refreshes
      queryClient.invalidateQueries({ queryKey: queryKeys.stories.all });

      toast.success(`"${story.title}" created! Illustrations are being drawn in the background.`);
      navigate(exitTo);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to create story — please try again');
      navigate(exitTo);
    }
  };

  if (childLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{
          background: 'linear-gradient(165deg, #F3EFF8 0%, #E8F6F4 30%, #FDF6E8 70%, #FEF0EA 100%)',
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        <div className="text-center">
          <div style={{ fontSize: 48 }} className="animate-bounce mb-4">📖</div>
          <p style={{ fontSize: 16, color: '#B8A5D4', fontWeight: 600 }}>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-6"
      style={{
        background: 'linear-gradient(165deg, #F3EFF8 0%, #E8F6F4 30%, #FDF6E8 70%, #FEF0EA 100%)',
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      <div
        className="bg-white rounded-2xl p-8 max-w-md w-full text-center"
        style={{ boxShadow: '0 16px 48px rgba(42,41,38,0.15)' }}
      >
        {/* Lumi avatar */}
        <div className="mb-4" style={{ animation: 'lumiBreath 4s ease-in-out infinite' }}>
          <img
            src={lumiStories}
            alt="Lumi"
            className="mx-auto drop-shadow-2xl"
            style={{ width: 80, height: 80, objectFit: 'contain' }}
          />
        </div>

        {child && (
          <p className="mb-3" style={{ fontSize: 13, color: '#9B978E' }}>
            Creating a story for <strong style={{ color: '#B8A5D4' }}>{child.name}</strong>
          </p>
        )}

        {/* Theme */}
        {screen === 'theme' && (
          <>
            <p className="mb-6" style={{ fontSize: 18, fontWeight: 600, color: '#2A2926' }}>
              What kind of story shall we make today?
            </p>
            <div className="flex flex-col gap-2">
              {THEME_OPTIONS.map((opt) => (
                <OptionButton key={opt} label={opt} onClick={() => handleTheme(opt)} />
              ))}
            </div>
            <CancelButton onClick={handleClose} />
          </>
        )}

        {/* Character */}
        {screen === 'character' && !showCustomCharacterInput && (
          <>
            <p className="mb-6" style={{ fontSize: 18, fontWeight: 600, color: '#2A2926' }}>
              Who's the main character?
            </p>
            <div className="flex flex-col gap-2">
              {getCharacterOptions(child?.name).map((opt) => (
                <OptionButton key={opt} label={opt} onClick={() => handleCharacter(opt)} />
              ))}
            </div>
            <BackCancel onBack={() => setScreen('theme')} onCancel={handleClose} />
          </>
        )}

        {/* Custom character input */}
        {screen === 'character' && showCustomCharacterInput && (
          <>
            <p className="mb-4" style={{ fontSize: 18, fontWeight: 600, color: '#2A2926' }}>
              What's their name?
            </p>
            <input
              type="text"
              value={customCharacterName}
              onChange={(e) => setCustomCharacterName(e.target.value)}
              placeholder="Type a name..."
              autoFocus
              onKeyDown={(e) => { if (e.key === 'Enter') handleCustomCharacterConfirm(); }}
              className="w-full rounded-xl px-4 py-3 mb-4 outline-none"
              style={{ border: '1.5px solid #E8E6E1', fontSize: 15, color: '#2A2926', background: '#F5F3EE' }}
            />
            <button
              onClick={handleCustomCharacterConfirm}
              disabled={!customCharacterName.trim()}
              className="w-full py-3 rounded-xl text-white font-semibold transition hover:opacity-90 disabled:opacity-40"
              style={{ background: '#B8A5D4', fontSize: 15, border: 'none' }}
            >
              Continue →
            </button>
            <BackCancel onBack={() => setShowCustomCharacterInput(false)} onCancel={handleClose} />
          </>
        )}

        {/* Setting */}
        {screen === 'setting' && (
          <>
            <p className="mb-6" style={{ fontSize: 18, fontWeight: 600, color: '#2A2926' }}>
              Where does it happen?
            </p>
            <div className="flex flex-col gap-2">
              {SETTING_OPTIONS.map((opt) => (
                <OptionButton key={opt} label={opt} onClick={() => handleSetting(opt)} />
              ))}
            </div>
            <BackCancel onBack={() => setScreen('character')} onCancel={handleClose} />
          </>
        )}

        {/* Include family */}
        {screen === 'family' && (
          <>
            <p className="mb-2" style={{ fontSize: 18, fontWeight: 600, color: '#2A2926' }}>
              Should your family be in the story?
            </p>
            <p className="mb-6" style={{ fontSize: 13, color: '#9B978E', fontStyle: 'italic' }}>
              Lumi will include real family members you've added
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => handleFamily(true)}
                className="flex-1 py-4 rounded-xl font-semibold text-white transition hover:opacity-90"
                style={{ background: '#B8A5D4', fontSize: 15, border: 'none' }}
              >
                💛 Yes, include them
              </button>
              <button
                onClick={() => handleFamily(false)}
                className="flex-1 py-4 rounded-xl font-semibold transition hover:bg-gray-50"
                style={{ border: '1.5px solid #E8E6E1', color: '#2A2926', fontSize: 15, background: '#FFFFFF' }}
              >
                No, not this time
              </button>
            </div>
            <BackCancel onBack={() => setScreen('setting')} onCancel={handleClose} />
          </>
        )}

        {/* Length */}
        {screen === 'length' && (
          <>
            <p className="mb-6" style={{ fontSize: 18, fontWeight: 600, color: '#2A2926' }}>
              How long should it be?
            </p>
            <div className="flex flex-col gap-2">
              {LENGTH_OPTIONS.map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => handleLength(opt.key)}
                  className="w-full py-3 px-4 rounded-xl text-left transition-all"
                  style={{ background: '#FFFFFF', border: '1.5px solid #E8E6E1', cursor: 'pointer' }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = '#B8A5D4';
                    (e.currentTarget as HTMLElement).style.background = '#F3EFF8';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = '#E8E6E1';
                    (e.currentTarget as HTMLElement).style.background = '#FFFFFF';
                  }}
                >
                  <p style={{ fontSize: 15, fontWeight: 600, color: '#2A2926' }}>{opt.label}</p>
                  <p style={{ fontSize: 12, color: '#9B978E', marginTop: 2 }}>{opt.desc}</p>
                </button>
              ))}
            </div>
            <BackCancel
              onBack={() => setScreen(isChildMain ? 'family' : 'setting')}
              onCancel={handleClose}
            />
          </>
        )}

        {/* Narrator */}
        {screen === 'narrator' && (
          <>
            <p className="mb-2" style={{ fontSize: 18, fontWeight: 600, color: '#2A2926' }}>
              Who should read it?
            </p>
            <p className="mb-6" style={{ fontSize: 13, color: '#9B978E', fontStyle: 'italic' }}>
              Pick a narrator voice
            </p>
            <div className="grid grid-cols-2 gap-3">
              {NARRATORS.map((n) => (
                <button
                  key={n.voice}
                  onClick={() => handleNarrator(n.voice)}
                  className="flex flex-col items-center p-4 rounded-xl transition-all hover:scale-105"
                  style={{
                    background: '#FFFFFF',
                    border: `1.5px solid ${n.color}`,
                    boxShadow: `0 2px 8px ${n.color}30`,
                    cursor: 'pointer',
                  }}
                >
                  <div
                    className="rounded-full flex items-center justify-center mb-2 overflow-hidden"
                    style={{ width: 56, height: 56, background: n.bg }}
                  >
                    <img src={n.image} alt={n.name} style={{ width: 48, height: 48, objectFit: 'contain' }} />
                  </div>
                  <span style={{ fontSize: 15, fontWeight: 600, color: n.color }}>{n.name}</span>
                </button>
              ))}
            </div>
            <BackCancel onBack={() => setScreen('length')} onCancel={handleClose} />
          </>
        )}

        {/* Loading */}
        {screen === 'loading' && (
          <>
            <p className="mb-2" style={{ fontSize: 22, fontWeight: 600, color: '#2A2926' }}>
              Lumi is dreaming up the story...
            </p>
            <p className="mb-6" style={{ fontSize: 14, color: '#9B978E', fontStyle: 'italic', minHeight: 20 }}>
              {LOADING_MESSAGES[loadingMsgIndex]}
            </p>
            <div className="flex gap-1.5 justify-center">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    background: '#B8A5D4',
                    animation: `dotPulse 1.2s ease-in-out ${i * 0.2}s infinite`,
                  }}
                />
              ))}
            </div>
            <p className="mt-6" style={{ fontSize: 12, color: '#9B978E' }}>
              This usually takes about a minute. Don't close the window!
            </p>
          </>
        )}
      </div>

      <style>{`
        @keyframes lumiBreath {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        @keyframes dotPulse {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
        }
      `}</style>
    </div>
  );
}

// ─── Shared UI helpers ──────────────────────────────────────────────────────

function OptionButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full py-3 px-4 rounded-xl text-left transition-all"
      style={{ background: '#FFFFFF', border: '1.5px solid #E8E6E1', fontSize: 15, color: '#2A2926', cursor: 'pointer' }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = '#B8A5D4';
        (e.currentTarget as HTMLElement).style.background = '#F3EFF8';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = '#E8E6E1';
        (e.currentTarget as HTMLElement).style.background = '#FFFFFF';
      }}
    >
      {label}
    </button>
  );
}

function CancelButton({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="mt-4" style={{ fontSize: 13, color: '#9B978E', background: 'none', border: 'none', cursor: 'pointer' }}>
      Cancel
    </button>
  );
}

function BackCancel({ onBack, onCancel }: { onBack: () => void; onCancel: () => void }) {
  return (
    <div className="flex justify-between mt-4 px-2">
      <button onClick={onBack} style={{ fontSize: 13, color: '#B8A5D4', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}>
        ← Back
      </button>
      <button onClick={onCancel} style={{ fontSize: 13, color: '#9B978E', background: 'none', border: 'none', cursor: 'pointer' }}>
        Cancel
      </button>
    </div>
  );
}
