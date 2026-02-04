/**
 * Kids Story Creator
 *
 * Simplified 3-step story creation wizard for children.
 * Steps: Theme -> Avatar -> Creating
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { generateStory } from '@/services/storyGeneration';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/hooks/queries/keys';
import { toast } from 'sonner';
import { Sparkles, ArrowLeft, Loader2, BookOpen, Wand2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KidsStoryCreatorProps {
  childId: string;
  onClose: () => void;
  onSuccess?: (storyId: string) => void;
}

type Step = 'theme' | 'avatar' | 'creating' | 'success';
type Avatar = 'Lolo' | 'Lumi' | 'Luno';

// Kid-friendly themes with emojis
const THEMES = [
  { id: 'adventure', label: 'Adventure', emoji: '🗺️', color: 'from-amber-400 to-orange-500' },
  { id: 'magic', label: 'Magic', emoji: '✨', color: 'from-purple-400 to-pink-500' },
  { id: 'animals', label: 'Animals', emoji: '🐾', color: 'from-green-400 to-emerald-500' },
  { id: 'space', label: 'Space', emoji: '🚀', color: 'from-indigo-400 to-blue-500' },
  { id: 'friendship', label: 'Friendship', emoji: '💝', color: 'from-pink-400 to-rose-500' },
  { id: 'nature', label: 'Nature', emoji: '🌳', color: 'from-lime-400 to-green-500' },
] as const;

// Avatars with colors
const AVATARS: { id: Avatar; label: string; color: string; description: string }[] = [
  { id: 'Lolo', label: 'Lolo', color: 'from-amber-300 to-orange-400', description: 'Brave & curious' },
  { id: 'Lumi', label: 'Lumi', color: 'from-pink-300 to-purple-400', description: 'Kind & magical' },
  { id: 'Luno', label: 'Luno', color: 'from-cyan-300 to-blue-400', description: 'Wise & gentle' },
];

export function KidsStoryCreator({ childId, onClose, onSuccess }: KidsStoryCreatorProps) {
  const [step, setStep] = useState<Step>('theme');
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null);
  const [selectedAvatar, setSelectedAvatar] = useState<Avatar | null>(null);
  const [generatedStoryId, setGeneratedStoryId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const handleThemeSelect = (themeId: string) => {
    setSelectedTheme(themeId);
    setStep('avatar');
  };

  const handleAvatarSelect = async (avatar: Avatar) => {
    setSelectedAvatar(avatar);
    setStep('creating');

    try {
      const story = await generateStory({
        childProfileId: childId,
        theme: selectedTheme!,
        avatar,
        mood: 'magical',
        storyLength: 'short',
        narratorVoice: 'nova',
        includeFamily: false,
      });

      // Invalidate stories cache
      await queryClient.invalidateQueries({
        queryKey: queryKeys.stories.byChild(childId),
      });

      setGeneratedStoryId(story.id || null);
      setStep('success');
      toast.success('Your story is ready!');
    } catch (error) {
      console.error('Story generation failed:', error);
      toast.error('Oops! Something went wrong. Try again!');
      setStep('avatar');
    }
  };

  const handleReadNow = () => {
    if (generatedStoryId && onSuccess) {
      onSuccess(generatedStoryId);
    }
    onClose();
  };

  const handleBack = () => {
    if (step === 'avatar') {
      setStep('theme');
      setSelectedTheme(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-b from-purple-100 via-pink-50 to-white flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-4 safe-area-inset-top">
        {step === 'avatar' ? (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBack}
            className="rounded-full bg-white/50 backdrop-blur-sm hover:bg-white/70"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        ) : step === 'theme' ? (
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="rounded-full bg-white/50 backdrop-blur-sm hover:bg-white/70"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        ) : (
          <div className="w-10" />
        )}

        <h1 className="text-xl font-display font-bold text-purple-800">
          {step === 'theme' && 'Pick a Theme!'}
          {step === 'avatar' && 'Choose Your Hero!'}
          {step === 'creating' && 'Creating Magic...'}
          {step === 'success' && 'Your Story!'}
        </h1>

        <div className="w-10" />
      </header>

      {/* Progress dots */}
      {(step === 'theme' || step === 'avatar') && (
        <div className="flex justify-center gap-2 pb-4">
          <div
            className={cn(
              'w-3 h-3 rounded-full transition-all',
              step === 'theme' ? 'bg-purple-500 scale-110' : 'bg-purple-300'
            )}
          />
          <div
            className={cn(
              'w-3 h-3 rounded-full transition-all',
              step === 'avatar' ? 'bg-purple-500 scale-110' : 'bg-purple-300'
            )}
          />
        </div>
      )}

      {/* Content */}
      <main className="flex-1 overflow-auto px-4 pb-8">
        {/* Theme Selection */}
        {step === 'theme' && (
          <div className="space-y-4">
            <p className="text-center text-muted-foreground mb-6">
              What should your story be about?
            </p>
            <div className="grid grid-cols-2 gap-4">
              {THEMES.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => handleThemeSelect(theme.id)}
                  className={cn(
                    'relative p-6 rounded-2xl bg-gradient-to-br shadow-lg',
                    'transform transition-all duration-200 active:scale-95 hover:scale-105',
                    'focus:outline-none focus:ring-4 focus:ring-purple-300',
                    theme.color
                  )}
                >
                  <span className="text-4xl block mb-2">{theme.emoji}</span>
                  <span className="text-white font-display font-bold text-lg drop-shadow-md">
                    {theme.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Avatar Selection */}
        {step === 'avatar' && (
          <div className="space-y-4">
            <p className="text-center text-muted-foreground mb-6">
              Who will be the hero of your story?
            </p>
            <div className="grid gap-4">
              {AVATARS.map((avatar) => (
                <button
                  key={avatar.id}
                  onClick={() => handleAvatarSelect(avatar.id)}
                  className={cn(
                    'relative p-6 rounded-2xl bg-gradient-to-r shadow-lg',
                    'transform transition-all duration-200 active:scale-95 hover:scale-105',
                    'focus:outline-none focus:ring-4 focus:ring-purple-300',
                    'flex items-center gap-4',
                    avatar.color
                  )}
                >
                  <div className="w-16 h-16 rounded-full bg-white/30 flex items-center justify-center text-3xl">
                    {avatar.id === 'Lolo' && '🦁'}
                    {avatar.id === 'Lumi' && '🦋'}
                    {avatar.id === 'Luno' && '🐢'}
                  </div>
                  <div className="text-left">
                    <span className="text-white font-display font-bold text-xl drop-shadow-md block">
                      {avatar.label}
                    </span>
                    <span className="text-white/80 text-sm">{avatar.description}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Creating State */}
        {step === 'creating' && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
            <div className="relative">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center animate-pulse">
                <Wand2 className="h-16 w-16 text-white animate-bounce" />
              </div>
              <Sparkles className="absolute -top-2 -right-2 h-8 w-8 text-yellow-400 animate-spin" />
              <Sparkles className="absolute -bottom-2 -left-2 h-6 w-6 text-pink-400 animate-spin" style={{ animationDirection: 'reverse' }} />
            </div>
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-display font-bold text-purple-800">
                Making your story...
              </h2>
              <p className="text-muted-foreground">
                A little magic is happening!
              </p>
              <Loader2 className="h-6 w-6 animate-spin mx-auto text-purple-500 mt-4" />
            </div>
          </div>
        )}

        {/* Success State */}
        {step === 'success' && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center">
              <BookOpen className="h-16 w-16 text-white" />
            </div>
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-display font-bold text-purple-800">
                Your story is ready!
              </h2>
              <p className="text-muted-foreground">
                Time for an adventure!
              </p>
            </div>
            <div className="flex flex-col gap-3 w-full max-w-xs">
              <Button
                size="lg"
                onClick={handleReadNow}
                className="w-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-display font-bold text-lg h-14"
              >
                <BookOpen className="mr-2 h-5 w-5" />
                Read Now!
              </Button>
              <Button
                variant="ghost"
                size="lg"
                onClick={onClose}
                className="w-full rounded-full"
              >
                Read Later
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
