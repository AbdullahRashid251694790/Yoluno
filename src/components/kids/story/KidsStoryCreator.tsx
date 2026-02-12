/**
 * Kids Story Creator
 *
 * Simplified 2-step story creation wizard for children.
 * Steps: Theme -> Creating
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

type Step = 'theme' | 'creating' | 'success';

// Kid-friendly themes with emojis
const THEMES = [
  { id: 'adventure', label: 'Adventure', emoji: '🗺️', color: 'from-amber-400 to-orange-500' },
  { id: 'magic', label: 'Magic', emoji: '✨', color: 'from-purple-400 to-pink-500' },
  { id: 'animals', label: 'Animals', emoji: '🐾', color: 'from-green-400 to-emerald-500' },
  { id: 'space', label: 'Space', emoji: '🚀', color: 'from-indigo-400 to-blue-500' },
  { id: 'friendship', label: 'Friendship', emoji: '💝', color: 'from-pink-400 to-rose-500' },
  { id: 'nature', label: 'Nature', emoji: '🌳', color: 'from-lime-400 to-green-500' },
  { id: 'family', label: 'Family', emoji: '👨‍👩‍👧‍👦', color: 'from-sky-400 to-cyan-500' },
] as const;

export function KidsStoryCreator({ childId, onClose, onSuccess }: KidsStoryCreatorProps) {
  const [step, setStep] = useState<Step>('theme');
  const [generatedStoryId, setGeneratedStoryId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const handleThemeSelect = async (themeId: string) => {
    setStep('creating');

    try {
      const story = await generateStory({
        childProfileId: childId,
        theme: themeId,
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
    } catch (error: any) {
      console.error('Story generation failed:', error);
      const message = error?.message || '';
      if (message.includes('limit') || message.includes('429')) {
        toast.error("You've used all 3 stories this month! Come back next month.");
      } else {
        toast.error('Oops! Something went wrong. Try again!');
      }
      setStep('theme');
    }
  };

  const handleReadNow = () => {
    if (generatedStoryId && onSuccess) {
      onSuccess(generatedStoryId);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-b from-purple-100 via-pink-50 to-white flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-4 safe-area-inset-top">
        {step === 'theme' ? (
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
          {step === 'creating' && 'Creating Magic...'}
          {step === 'success' && 'Your Story!'}
        </h1>

        <div className="w-10" />
      </header>

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
