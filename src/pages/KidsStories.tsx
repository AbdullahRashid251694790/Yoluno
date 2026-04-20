/**
 * Kids Stories Page
 *
 * Outer design matches loveable KidsStoriesPage (gradient, floating
 * elements, Lumi greeting, story grid cards, Create button, floating
 * helper). All backend and dialog functionality preserved:
 *   - Real stories via useStoriesByChild
 *   - Click → existing StorybookReader / legacy dialog
 *   - Create button → existing KidsStoryCreator
 *   - Audio TTS for legacy stories unchanged
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useStoriesByChild } from '@/hooks/queries/useStories';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Volume2, Pause, Square, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { StoryWithDetails } from '@/services/stories';
import { StorybookReader } from '@/components/storybook';
import { KidsStoryCreator } from '@/components/kids/story';
import { getUploadUrl, apiClient } from '@/integrations/api/client';
import { generateSpeech, playAudioFromBase64, type TTSVoice } from '@/services/textToSpeech';
import lumiStories from '@/assets/landing/lumi-stories.png';

const THEME_COLORS = ['#B8A5D4', '#D4A843', '#E8946A', '#3ECDC6'];

function themeColor(theme: string | null, idx: number): string {
  return THEME_COLORS[idx % THEME_COLORS.length];
}

// Extract a short 1-word label from a theme string (strip articles, take first meaningful word)
function shortTheme(theme: string | null): string {
  if (!theme) return '';
  const cleaned = theme.replace(/[!?.,]/g, '').trim();
  const words = cleaned.split(/\s+/);
  const STOP = new Set(['a', 'an', 'the', 'some', 'something', 'surprise', 'me']);
  // Take the first non-stop word, or fall back to the first word
  const pick = words.find((w) => !STOP.has(w.toLowerCase())) || words[0] || '';
  return pick.replace(/-.*$/, ''); // "scary-but-not-too-scary" → "scary"
}

const FLOAT_ELEMENTS = Array.from({ length: 10 }, (_, i) => ({
  id: i,
  type: i % 3 === 0 ? 'star' : i % 3 === 1 ? 'sparkle' : 'feather',
  left: `${5 + Math.random() * 90}%`,
  top: `${5 + Math.random() * 90}%`,
  size: 6 + Math.random() * 8,
  delay: Math.random() * 20,
  duration: 22 + Math.random() * 12,
  opacity: 0.1 + Math.random() * 0.08,
}));

export function KidsStoriesPage() {
  const { childId } = useParams<{ childId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const mood = (location.state as any)?.mood || 'happy';

  const { data: stories, isLoading, refetch } = useStoriesByChild(childId);

  // Reading progress (same data source as parent dashboard Stories tab)
  interface ReadingProgress {
    story_id: string;
    child_profile_id: string;
    last_page_read: number;
    total_pages: number;
  }
  const { data: readingProgress = [] } = useQuery<ReadingProgress[]>({
    queryKey: ['kids-story-reading-progress', childId],
    queryFn: async () => {
      const res = await apiClient.get<ReadingProgress[]>('/stories/reading-progress');
      return res.data;
    },
    enabled: !!childId,
    staleTime: 30_000,
  });

  const progressByStory: Record<string, ReadingProgress> = {};
  for (const p of readingProgress) {
    if (p.child_profile_id !== childId) continue;
    const existing = progressByStory[p.story_id];
    if (!existing || p.last_page_read > existing.last_page_read) {
      progressByStory[p.story_id] = p;
    }
  }

  const getStatus = (storyId: string, hasPages?: boolean): 'completed' | 'in-progress' | 'not-started' => {
    const p = progressByStory[storyId];
    if (!p || p.last_page_read === 0) return hasPages ? 'not-started' : 'completed';
    if (p.last_page_read >= p.total_pages - 1) return 'completed';
    return 'in-progress';
  };
  const [selectedStory, setSelectedStory] = useState<StoryWithDetails | null>(null);
  const [isCreatorOpen, setIsCreatorOpen] = useState(false);

  // Legacy audio playback
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [hasAudio, setHasAudio] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const isStorybookFormat = selectedStory && (selectedStory as { has_pages?: boolean }).has_pages;

  const getStoredVoice = useCallback((storyId: string): TTSVoice => {
    try {
      const voicePrefs = JSON.parse(localStorage.getItem('storyVoicePrefs') || '{}');
      return voicePrefs[storyId] || 'nova';
    } catch {
      return 'nova';
    }
  }, []);

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    setIsPlaying(false);
    setHasAudio(false);
  }, []);

  useEffect(() => {
    if (!selectedStory) stopAudio();
  }, [selectedStory, stopAudio]);

  const handlePlayAudio = useCallback(async () => {
    if (!selectedStory) return;
    if (isPlaying) {
      if (audioRef.current) {
        audioRef.current.pause();
        setIsPlaying(false);
      }
      return;
    }
    if (audioRef.current && audioRef.current.paused && audioRef.current.currentTime > 0) {
      audioRef.current.play();
      setIsPlaying(true);
      return;
    }
    setIsLoadingAudio(true);
    try {
      const voice = getStoredVoice(selectedStory.id);
      const response = await generateSpeech(selectedStory.content, { voice });
      stopAudio();
      const audio = playAudioFromBase64(response.audio);
      audioRef.current = audio;
      setIsPlaying(true);
      setHasAudio(true);
      audio.addEventListener('ended', () => {
        setIsPlaying(false);
        setHasAudio(false);
        audioRef.current = null;
      });
      audio.addEventListener('error', () => {
        toast.error('Failed to play audio');
        setIsPlaying(false);
        setHasAudio(false);
        audioRef.current = null;
      });
    } catch {
      toast.error('Failed to generate audio');
    } finally {
      setIsLoadingAudio(false);
    }
  }, [selectedStory, isPlaying, getStoredVoice, stopAudio]);

  const handleBack = () => navigate(`/kids/${childId}`, { state: { mood } });
  const handleCloseReader = () => setSelectedStory(null);
  const handleStoryCreated = (storyId: string) => {
    refetch().then(() => {
      const newStory = stories?.find((s) => s.id === storyId);
      if (newStory) setSelectedStory(newStory);
    });
  };

  const storyList = stories || [];
  const isEmpty = !isLoading && storyList.length === 0;

  const pageBg = 'linear-gradient(165deg, #F3EFF8 0%, #E8F6F4 30%, #FDF6E8 70%, #FEF0EA 100%)';

  return (
    <div
      className="kids-stories-scope min-h-screen relative overflow-hidden flex flex-col"
      style={{ background: pageBg, fontFamily: "'DM Sans', sans-serif" }}
    >
      {/* Floating bg */}
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
          {el.type === 'star' && (
            <svg width={el.size} height={el.size} viewBox="0 0 24 24" fill="none">
              <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 16.8l-6.2 4.5 2.4-7.4L2 9.4h7.6L12 2z" fill="#B8A5D4" opacity="0.5" />
            </svg>
          )}
          {el.type === 'sparkle' && (
            <div style={{ width: el.size * 0.6, height: el.size * 0.6, borderRadius: '50%', background: 'rgba(184,165,212,0.5)', filter: 'blur(1px)', animation: `kidsTwinkle ${3 + Math.random() * 2}s ease-in-out infinite` }} />
          )}
          {el.type === 'feather' && (
            <div style={{ width: el.size * 1.5, height: el.size * 0.5, borderRadius: el.size, background: 'rgba(212,168,67,0.3)', filter: 'blur(2px)', transform: 'rotate(30deg)' }} />
          )}
        </div>
      ))}

      {/* Top bar */}
      <header className="relative z-10 flex items-center justify-between px-5 pt-4 pb-3">
        <button
          onClick={handleBack}
          className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/40 transition-colors"
          aria-label="Back to dashboard"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M13 4l-6 6 6 6" stroke="#2A2926" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div className="flex items-center gap-2">
          <img src={lumiStories} alt="Lumi" style={{ width: 32, height: 32, objectFit: 'contain' }} />
          <span style={{ fontSize: 20, fontWeight: 600, color: '#2A2926' }}>My Stories</span>
        </div>
        <button
          onClick={() => setIsCreatorOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-white font-semibold transition-transform hover:scale-105"
          style={{ background: '#B8A5D4', fontSize: 14, border: 'none' }}
        >
          <span>✨</span> Create New Story
        </button>
      </header>

      {/* Main content */}
      <main className="flex-1 relative z-10 px-5 pb-8">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center pt-16">
            <div style={{ fontSize: 48 }} className="animate-bounce mb-4">📖</div>
            <p style={{ fontSize: 16, color: '#B8A5D4', fontWeight: 600 }}>Loading stories...</p>
          </div>
        ) : isEmpty ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center pt-16 max-w-[500px] mx-auto">
            <div className="mb-4" style={{ animation: 'lumiBreath 4s ease-in-out infinite' }}>
              <img
                src={lumiStories}
                alt="Lumi"
                className="drop-shadow-2xl"
                style={{ width: 120, height: 120, objectFit: 'contain' }}
              />
            </div>
            <h2 className="text-center mb-2" style={{ fontSize: 24, fontWeight: 600, color: '#2A2926' }}>
              Every great story starts here
            </h2>
            <p className="text-center mb-8" style={{ fontSize: 16, color: '#6B675E', maxWidth: 400, lineHeight: 1.5 }}>
              What kind of story do you want to make? You choose what happens — and Lumi helps bring it to life.
            </p>
          </div>
        ) : (
          /* Story grid */
          <div className="max-w-[900px] mx-auto">
            <div className="flex flex-wrap gap-5 mb-8 justify-center">
              {storyList.map((story, i) => {
                const coverUrl = (story as { cover_image_url?: string }).cover_image_url
                  || (story as { illustration_url?: string }).illustration_url;
                const color = themeColor(story.theme, i);
                const hasPages = (story as { has_pages?: boolean }).has_pages;
                return (
                  <button
                    key={story.id}
                    onClick={() => setSelectedStory(story)}
                    className="flex flex-col overflow-hidden rounded-2xl text-left group focus:outline-none"
                    style={{
                      background: '#FFFFFF',
                      boxShadow: '0 4px 16px rgba(42,41,38,0.1)',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease-out',
                      animation: `kidsFadeIn 0.4s ease-out ${i * 0.06}s both`,
                      width: 200,
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.transform = 'scale(1.03)';
                      (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 28px rgba(42,41,38,0.14)';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
                      (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 16px rgba(42,41,38,0.1)';
                    }}
                  >
                    {/* Cover */}
                    <div
                      className="w-full flex items-center justify-center overflow-hidden"
                      style={{
                        aspectRatio: '4/3',
                        background: coverUrl ? 'transparent' : `linear-gradient(135deg, ${color}22, ${color}44)`,
                      }}
                    >
                      {coverUrl ? (
                        <img
                          src={getUploadUrl(coverUrl) || ''}
                          alt={story.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div
                          className="rounded-full flex items-center justify-center"
                          style={{ width: 48, height: 48, background: `${color}33` }}
                        >
                          <span style={{ fontSize: 24 }}>📖</span>
                        </div>
                      )}
                    </div>
                    {/* Info */}
                    <div className="p-3 flex-1 flex flex-col">
                      <span
                        style={{
                          fontSize: 15,
                          fontWeight: 600,
                          color: '#2A2926',
                          marginBottom: 4,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {story.title}
                      </span>
                      {story.theme && (
                        <div className="flex items-center gap-1.5 mb-2">
                          <span
                            className="px-2 py-0.5 rounded-full capitalize"
                            style={{ fontSize: 11, background: '#F3EFF8', color: '#B8A5D4', fontWeight: 500 }}
                          >
                            {shortTheme(story.theme)}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center justify-between mt-auto">
                        {(() => {
                          const status = getStatus(story.id, hasPages);
                          return (
                            <span
                              style={{
                                fontSize: 12,
                                color: status === 'completed' ? '#3ECDC6' : '#B8A5D4',
                              }}
                            >
                              {status === 'completed'
                                ? '✅ Finished'
                                : status === 'in-progress'
                                  ? '✏️ In progress'
                                  : '📖 Ready to read'}
                            </span>
                          );
                        })()}
                        <span style={{ fontSize: 11, color: '#9B978E' }}>
                          {new Date(story.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

          </div>
        )}
      </main>

      {/* Floating create FAB (mobile) */}
      {!isEmpty && !isLoading && (
        <button
          onClick={() => setIsCreatorOpen(true)}
          className="fixed bottom-6 right-6 z-20 w-14 h-14 rounded-full flex items-center justify-center text-white shadow-lg md:hidden transition-transform hover:scale-110"
          style={{ background: '#B8A5D4', fontSize: 24, boxShadow: '0 4px 20px rgba(184,165,212,0.4)' }}
          aria-label="Create new story"
        >
          ✨
        </button>
      )}

      {/* Lumi helper (desktop) */}
      {!isEmpty && !isLoading && (
        <button
          onClick={() => setIsCreatorOpen(true)}
          className="fixed bottom-6 right-6 z-20 hidden md:flex items-center gap-2 px-4 py-3 rounded-2xl text-white shadow-lg transition-transform hover:scale-105"
          style={{ background: '#B8A5D4', boxShadow: '0 4px 20px rgba(184,165,212,0.4)' }}
        >
          <img src={lumiStories} alt="" style={{ width: 28, height: 28, objectFit: 'contain' }} />
          <span style={{ fontSize: 13, fontWeight: 500 }}>Want to start something new?</span>
        </button>
      )}

      {/* Footer */}
      <footer className="relative z-10 py-5 text-center">
        <span style={{ fontSize: 12, color: '#9B978E' }}>Made with 💛 for curious minds</span>
      </footer>

      {/* Storybook Reader — existing */}
      {selectedStory && isStorybookFormat && (
        <StorybookReader
          storyId={selectedStory.id}
          storyTitle={selectedStory.title}
          coverImageUrl={
            (selectedStory as { cover_image_url?: string }).cover_image_url ||
            (selectedStory as { illustration_url?: string }).illustration_url
          }
          theme={selectedStory.theme}
          mood={(selectedStory as { mood?: string }).mood}
          childId={childId}
          initialVoice={(selectedStory as { narrator_voice?: string }).narrator_voice || 'nova'}
          onClose={handleCloseReader}
        />
      )}

      {/* Legacy Story Dialog — existing */}
      <Dialog open={!!selectedStory && !isStorybookFormat} onOpenChange={(open) => !open && setSelectedStory(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-hidden flex flex-col bg-gradient-to-b from-lolo/10 to-primary/10">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="text-body-lg font-display pr-8">
              {selectedStory?.title}
            </DialogTitle>
            {selectedStory?.theme && (
              <p className="text-body-sm text-muted-foreground">Theme: {selectedStory.theme}</p>
            )}
          </DialogHeader>

          <div className="flex-1 overflow-y-auto py-4 space-y-4">
            {(selectedStory as { illustration_url?: string })?.illustration_url && (
              <div className="rounded-xl overflow-hidden border-2 border-lolo">
                <img
                  src={getUploadUrl((selectedStory as { illustration_url?: string }).illustration_url!) || ''}
                  alt={`Illustration for ${selectedStory?.title}`}
                  className="w-full h-auto max-h-[200px] object-cover"
                />
              </div>
            )}
            <div className="prose prose-sm max-w-none">
              <p className="whitespace-pre-wrap text-foreground leading-relaxed">
                {selectedStory?.content}
              </p>
            </div>
          </div>

          <div className="flex-shrink-0 pt-4 border-t">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handlePlayAudio} disabled={isLoadingAudio} className="gap-2">
                  {isLoadingAudio ? (
                    <><Loader2 className="h-4 w-4 animate-spin" />Loading...</>
                  ) : isPlaying ? (
                    <><Pause className="h-4 w-4" />Pause</>
                  ) : (
                    <><Volume2 className="h-4 w-4" />Read Aloud</>
                  )}
                </Button>
                {(isPlaying || hasAudio) && (
                  <Button variant="ghost" size="sm" onClick={stopAudio} className="gap-2">
                    <Square className="h-4 w-4" />Stop
                  </Button>
                )}
              </div>
              {(selectedStory as { mood?: string })?.mood && (
                <div className="flex items-center gap-2 text-body-sm text-muted-foreground">
                  <span className="font-medium">Mood:</span>
                  <span className="capitalize">{(selectedStory as { mood?: string }).mood}</span>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Kids Story Creator — existing */}
      {isCreatorOpen && (
        <KidsStoryCreator
          childId={childId!}
          onClose={() => setIsCreatorOpen(false)}
          onSuccess={handleStoryCreated}
        />
      )}

      <style>{`
        .kids-stories-scope h1,
        .kids-stories-scope h2,
        .kids-stories-scope h3 { font-family: 'DM Serif Display', Georgia, serif !important; }
        @keyframes kidsFloat {
          0% { transform: translateY(0) translateX(0); }
          100% { transform: translateY(-20px) translateX(10px); }
        }
        @keyframes kidsTwinkle {
          0%, 100% { opacity: 0.2; transform: scale(0.8); }
          50% { opacity: 0.5; transform: scale(1.2); }
        }
        @keyframes lumiBreath {
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

// Silence unused-var warning for themeColor signature parameter
// (kept in case theme-aware color palette is re-enabled).
void themeColor;
