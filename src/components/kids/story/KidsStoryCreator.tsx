/**
 * Kids Story Creator
 *
 * Full 5-step story creation wizard for children — same options as the
 * parent StoryWizard but with a kid-friendly UI.
 * Steps: Theme → Characters → Mood → Values → Generate
 */

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useChildProfile } from '@/hooks/queries';
import { queryKeys } from '@/hooks/queries/keys';
import {
  generateStory,
  getThemeSuggestions,
  storyMoods,
  storyValues,
  type StoryCharacter,
} from '@/services/storyGeneration';
import { type TTSVoice, getRecommendedVoice } from '@/services/textToSpeech';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Wand2,
  BookOpen,
  Loader2,
  Check,
  Volume2,
  Users,
  Palette,
  Heart,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Constants ────────────────────────────────────────────────────────────────

const STEPS = ['Theme', 'Characters', 'Mood', 'Values', 'Generate'] as const;

const themeEmojis: Record<string, string> = {
  friendship: '🤝', kindness: '💝', adventure: '🗺️', animals: '🐾',
  nature: '🌳', bedtime: '🌙', colors: '🌈', shapes: '🔷',
  family: '👨‍👩‍👧', space: '🚀', dinosaurs: '🦕', magic: '✨',
  sports: '⚽', science: '🔬', mystery: '🔍', fantasy: '🏰',
  history: '📜', invention: '💡', courage: '🦁',
};

const moodEmojis: Record<string, string> = {
  adventurous: '🌟', calm: '😌', funny: '😄',
  magical: '✨', exciting: '🎉', peaceful: '🕊️', mysterious: '🔮',
};

const valueEmojis: Record<string, string> = {
  kindness: '💕', honesty: '💎', courage: '🦁', friendship: '🤝',
  perseverance: '💪', respect: '🙏', responsibility: '⭐',
  gratitude: '🙏', empathy: '❤️', creativity: '🎨',
};

const voiceOptions: { value: TTSVoice; label: string; emoji: string }[] = [
  { value: 'shimmer', label: 'Shimmer', emoji: '🌸' },
  { value: 'nova',    label: 'Nova',    emoji: '⭐' },
  { value: 'alloy',   label: 'Alloy',   emoji: '🎵' },
  { value: 'echo',    label: 'Echo',    emoji: '🌊' },
  { value: 'fable',   label: 'Fable',   emoji: '📖' },
  { value: 'onyx',    label: 'Onyx',    emoji: '🌙' },
];

const STEP_COLORS = [
  'bg-orange-400', 'bg-blue-400', 'bg-purple-400', 'bg-pink-400', 'bg-green-400',
];

// ─── Types ────────────────────────────────────────────────────────────────────

interface KidsStoryCreatorProps {
  childId: string;
  onClose: () => void;
  onSuccess?: (storyId: string) => void;
}

interface WizardState {
  theme: string;
  customTheme: string;
  characters: StoryCharacter[];
  customCharacter: string;
  customCharacterGender?: 'boy' | 'girl';
  mood: string;
  values: string[];
  includeFamily: boolean;
  storyLength: 'short' | 'medium' | 'long';
  narratorVoice: TTSVoice;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function KidsStoryCreator({ childId, onClose, onSuccess }: KidsStoryCreatorProps) {
  const queryClient = useQueryClient();
  const { data: child } = useChildProfile(childId);

  const [currentStep, setCurrentStep] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedStory, setGeneratedStory] = useState<{
    id?: string;
    title: string;
    content: string;
    hasPages?: boolean;
    pageCount?: number;
  } | null>(null);

  const [state, setState] = useState<WizardState>({
    theme: '',
    customTheme: '',
    characters: [],
    customCharacter: '',
    customCharacterGender: undefined,
    mood: 'adventurous',
    values: [],
    includeFamily: false,
    storyLength: 'medium',
    narratorVoice: child ? getRecommendedVoice(child.age) : 'nova',
  });

  const themes = child ? getThemeSuggestions(child.age) : [];
  const isLastStep = currentStep === STEPS.length - 1;

  const canProceed = () => {
    if (currentStep === 0) return state.theme !== '' || state.customTheme !== '';
    if (currentStep === 2) return state.mood !== '';
    return true;
  };

  const handleBack = () => {
    if (currentStep > 0) setCurrentStep((s) => s - 1);
    else onClose();
  };

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) setCurrentStep((s) => s + 1);
  };

  const addCharacter = () => {
    if (!state.customCharacter.trim()) return;
    setState((prev) => ({
      ...prev,
      characters: [
        ...prev.characters,
        { name: prev.customCharacter.trim(), gender: prev.customCharacterGender },
      ].slice(0, 5),
      customCharacter: '',
      customCharacterGender: undefined,
    }));
  };

  const removeCharacter = (index: number) =>
    setState((prev) => ({ ...prev, characters: prev.characters.filter((_, i) => i !== index) }));

  const toggleValue = (value: string) =>
    setState((prev) => ({
      ...prev,
      values: prev.values.includes(value)
        ? prev.values.filter((v) => v !== value)
        : [...prev.values, value].slice(0, 3),
    }));

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const story = await generateStory({
        childProfileId: childId,
        theme: state.customTheme || state.theme,
        characters: state.characters.length > 0 ? state.characters : undefined,
        mood: state.mood,
        values: state.values.length > 0 ? state.values : undefined,
        storyLength: state.storyLength,
        includeFamily: state.includeFamily,
        narratorVoice: state.narratorVoice,
      });

      if (story.id) {
        const prefs = JSON.parse(localStorage.getItem('storyVoicePrefs') || '{}');
        prefs[story.id] = state.narratorVoice;
        localStorage.setItem('storyVoicePrefs', JSON.stringify(prefs));
      }

      await queryClient.invalidateQueries({ queryKey: queryKeys.stories.listByChild(childId) });

      setGeneratedStory({
        id: story.id,
        title: story.title,
        content: story.content,
        hasPages: story.has_pages,
        pageCount: story.pages?.length,
      });

      toast.success('Your story is ready! 🎉');
    } catch (error: any) {
      const message = error?.message || '';
      if (message.includes('limit') || message.includes('429')) {
        toast.error("You've used all your stories this month! Come back next month. 📅");
      } else {
        toast.error('Oops! Something went wrong. Try again! 😅');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFinish = () => {
    if (generatedStory?.id && onSuccess) onSuccess(generatedStory.id);
    onClose();
  };

  const renderStep = () => {
    switch (currentStep) {
      // ── Step 0: Theme ────────────────────────────────────────────────────────
      case 0:
        return (
          <div className="space-y-5">
            <p className="text-center text-muted-foreground text-sm">What should your story be about?</p>
            <div className="grid grid-cols-3 gap-3">
              {themes.map((theme) => (
                <button
                  key={theme}
                  onClick={() => setState((p) => ({ ...p, theme, customTheme: '' }))}
                  className={cn(
                    'flex flex-col items-center gap-2 rounded-2xl border-2 p-4 transition-all active:scale-95',
                    state.theme === theme
                      ? 'border-purple-400 bg-purple-100 shadow-lg scale-105'
                      : 'border-gray-200 bg-white hover:border-purple-200 hover:bg-purple-50'
                  )}
                >
                  <span className="text-3xl">{themeEmojis[theme] || '📖'}</span>
                  <span className="text-xs font-bold capitalize text-gray-700">{theme}</span>
                </button>
              ))}
            </div>
            <div className="pt-2">
              <p className="text-xs text-muted-foreground mb-2 text-center">Or make up your own!</p>
              <Input
                placeholder="e.g., robot friends, underwater adventure..."
                value={state.customTheme}
                onChange={(e) => setState((p) => ({ ...p, customTheme: e.target.value, theme: '' }))}
                className="rounded-xl text-center"
              />
            </div>
          </div>
        );

      // ── Step 1: Characters ────────────────────────────────────────────────────
      case 1:
        return (
          <div className="space-y-4">
            <p className="text-center text-muted-foreground text-sm">Who should be in the story? (Optional)</p>
            <div className="flex gap-2">
              <Input
                placeholder="Add a character name..."
                value={state.customCharacter}
                onChange={(e) => setState((p) => ({ ...p, customCharacter: e.target.value }))}
                onKeyDown={(e) => e.key === 'Enter' && addCharacter()}
                className="rounded-xl"
              />
            </div>
            {state.customCharacter.trim() && (
              <div className="flex items-center justify-center gap-3">
                <span className="text-sm text-muted-foreground">Boy or girl?</span>
                {(['boy', 'girl'] as const).map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() =>
                      setState((p) => ({
                        ...p,
                        customCharacterGender: p.customCharacterGender === g ? undefined : g,
                      }))
                    }
                    className={cn(
                      'px-4 py-2 rounded-full text-sm font-bold border-2 transition-all',
                      state.customCharacterGender === g
                        ? g === 'boy'
                          ? 'border-blue-400 bg-blue-100 text-blue-700'
                          : 'border-pink-400 bg-pink-100 text-pink-700'
                        : 'border-gray-200 hover:border-gray-300'
                    )}
                  >
                    {g === 'boy' ? '👦 Boy' : '👧 Girl'}
                  </button>
                ))}
                <Button size="sm" onClick={addCharacter} className="rounded-full">
                  Add
                </Button>
              </div>
            )}
            {state.characters.length > 0 && (
              <div className="flex flex-wrap gap-2 justify-center">
                {state.characters.map((char, i) => (
                  <span
                    key={i}
                    className={cn(
                      'inline-flex items-center gap-1 rounded-full px-4 py-2 text-sm font-bold',
                      char.gender === 'boy' && 'bg-blue-100 text-blue-800',
                      char.gender === 'girl' && 'bg-pink-100 text-pink-800',
                      !char.gender && 'bg-purple-100 text-purple-800'
                    )}
                  >
                    {char.gender === 'boy' && '👦 '}
                    {char.gender === 'girl' && '👧 '}
                    {char.name}
                    <button onClick={() => removeCharacter(i)} className="ml-1 text-lg leading-none">×</button>
                  </span>
                ))}
              </div>
            )}
            <button
              type="button"
              onClick={() => setState((p) => ({ ...p, includeFamily: !p.includeFamily }))}
              className={cn(
                'w-full flex items-center justify-center gap-3 rounded-2xl border-2 p-4 transition-all text-sm font-bold',
                state.includeFamily
                  ? 'border-orange-400 bg-orange-100 text-orange-700'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-orange-200'
              )}
            >
              <span className="text-2xl">👨‍👩‍👧</span>
              Include my family in the story
              {state.includeFamily && <Check className="h-4 w-4 ml-auto" />}
            </button>
          </div>
        );

      // ── Step 2: Mood ──────────────────────────────────────────────────────────
      case 2:
        return (
          <div className="space-y-5">
            <p className="text-center text-muted-foreground text-sm">What feeling should the story have?</p>
            <div className="grid grid-cols-2 gap-3">
              {storyMoods.map((mood) => (
                <button
                  key={mood}
                  onClick={() => setState((p) => ({ ...p, mood }))}
                  className={cn(
                    'flex items-center gap-3 rounded-2xl border-2 p-4 transition-all active:scale-95',
                    state.mood === mood
                      ? 'border-purple-400 bg-purple-100 shadow-md'
                      : 'border-gray-200 bg-white hover:border-purple-200'
                  )}
                >
                  <span className="text-2xl">{moodEmojis[mood] || '📖'}</span>
                  <span className="font-bold capitalize text-sm">{mood}</span>
                </button>
              ))}
            </div>
            <div>
              <p className="text-sm font-bold text-center mb-3 text-gray-700">How long?</p>
              <div className="flex gap-2">
                {(['short', 'medium', 'long'] as const).map((len) => (
                  <button
                    key={len}
                    onClick={() => setState((p) => ({ ...p, storyLength: len }))}
                    className={cn(
                      'flex-1 rounded-2xl border-2 py-3 text-sm font-bold capitalize transition-all',
                      state.storyLength === len
                        ? 'border-green-400 bg-green-100 text-green-700'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-green-200'
                    )}
                  >
                    {len === 'short' ? '⚡ Short' : len === 'medium' ? '📖 Medium' : '📚 Long'}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm font-bold text-center mb-3 text-gray-700 flex items-center justify-center gap-2">
                <Volume2 className="h-4 w-4" /> Who reads the story?
              </p>
              <div className="grid grid-cols-3 gap-2">
                {voiceOptions.map((v) => (
                  <button
                    key={v.value}
                    onClick={() => setState((p) => ({ ...p, narratorVoice: v.value }))}
                    className={cn(
                      'flex flex-col items-center gap-1 rounded-xl border-2 py-3 transition-all',
                      state.narratorVoice === v.value
                        ? 'border-blue-400 bg-blue-100'
                        : 'border-gray-200 bg-white hover:border-blue-200'
                    )}
                  >
                    <span className="text-xl">{v.emoji}</span>
                    <span className="text-xs font-bold">{v.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      // ── Step 3: Values ────────────────────────────────────────────────────────
      case 3:
        return (
          <div className="space-y-4">
            <p className="text-center text-muted-foreground text-sm">
              What good things should the story teach? (Pick up to 3)
            </p>
            <div className="grid grid-cols-2 gap-3">
              {storyValues.map((value) => {
                const selected = state.values.includes(value);
                const disabled = state.values.length >= 3 && !selected;
                return (
                  <button
                    key={value}
                    onClick={() => toggleValue(value)}
                    disabled={disabled}
                    className={cn(
                      'flex items-center gap-3 rounded-2xl border-2 p-3 transition-all text-sm font-bold',
                      selected
                        ? 'border-pink-400 bg-pink-100 text-pink-800'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-pink-200',
                      disabled && 'opacity-40 cursor-not-allowed'
                    )}
                  >
                    <span className="text-xl">{valueEmojis[value] || '⭐'}</span>
                    <span className="capitalize">{value}</span>
                    {selected && <Check className="ml-auto h-4 w-4" />}
                  </button>
                );
              })}
            </div>
          </div>
        );

      // ── Step 4: Generate ──────────────────────────────────────────────────────
      case 4:
        if (isGenerating) {
          return (
            <div className="flex flex-col items-center justify-center py-12 space-y-6">
              <div className="relative">
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center animate-pulse">
                  <Wand2 className="h-16 w-16 text-white animate-bounce" />
                </div>
                <Sparkles className="absolute -top-2 -right-2 h-8 w-8 text-yellow-400 animate-spin" />
                <Sparkles
                  className="absolute -bottom-2 -left-2 h-6 w-6 text-pink-400 animate-spin"
                  style={{ animationDirection: 'reverse' }}
                />
              </div>
              <div className="text-center space-y-2">
                <h2 className="text-xl font-display font-bold text-purple-800">Making your story...</h2>
                <p className="text-sm text-muted-foreground">A little magic is happening! ✨</p>
                <Loader2 className="h-6 w-6 animate-spin mx-auto text-purple-500 mt-4" />
              </div>
            </div>
          );
        }

        if (generatedStory) {
          return (
            <div className="space-y-4 text-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center mx-auto">
                <BookOpen className="h-10 w-10 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-display font-bold text-purple-800">{generatedStory.title}</h2>
                {generatedStory.hasPages && generatedStory.pageCount && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {generatedStory.pageCount} pages · illustrations being created...
                  </p>
                )}
              </div>
              <div className="max-h-40 overflow-y-auto rounded-2xl bg-purple-50 p-4 text-left">
                <p className="text-sm leading-relaxed whitespace-pre-wrap text-gray-700">
                  {generatedStory.content}
                </p>
              </div>
              <div className="rounded-2xl bg-yellow-50 border border-yellow-200 p-3">
                <p className="text-sm text-yellow-800 font-medium">
                  🎨 Your storybook is ready! Pictures are being drawn in the background.
                </p>
              </div>
            </div>
          );
        }

        return (
          <div className="space-y-4">
            <p className="text-center text-muted-foreground text-sm">Ready? Here's your story! 🎉</p>
            <div className="rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 p-4 space-y-3">
              <SummaryRow icon={<Palette className="h-4 w-4" />} label="Theme" value={state.customTheme || state.theme || 'Not set'} />
              {state.characters.length > 0 && (
                <SummaryRow icon={<Users className="h-4 w-4" />} label="Characters" value={state.characters.map((c) => c.name).join(', ')} />
              )}
              <SummaryRow icon={<Wand2 className="h-4 w-4" />} label="Mood" value={state.mood} />
              {state.values.length > 0 && (
                <SummaryRow icon={<Heart className="h-4 w-4" />} label="Values" value={state.values.join(', ')} />
              )}
              <SummaryRow icon={<BookOpen className="h-4 w-4" />} label="Length" value={state.storyLength} />
              <SummaryRow
                icon={<Volume2 className="h-4 w-4" />}
                label="Narrator"
                value={voiceOptions.find((v) => v.value === state.narratorVoice)?.label || state.narratorVoice}
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gradient-to-b from-purple-100 via-pink-50 to-white overflow-hidden">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 pt-4 pb-2 flex-shrink-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleBack}
          className="rounded-full bg-white/60 backdrop-blur-sm shrink-0"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>

        {/* Step progress bars */}
        <div className="flex-1 flex items-center gap-1.5 overflow-hidden">
          {STEPS.map((step, i) => (
            <div
              key={step}
              className={cn(
                'h-2 rounded-full transition-all',
                i < currentStep
                  ? 'bg-green-400 flex-1'
                  : i === currentStep
                    ? `${STEP_COLORS[i]} flex-[2]`
                    : 'bg-gray-200 flex-1'
              )}
            />
          ))}
        </div>

        <span className="text-xs font-bold text-purple-700 shrink-0">
          {currentStep + 1}/{STEPS.length}
        </span>
      </header>

      {/* Step title */}
      <div className="px-4 pb-3 flex-shrink-0">
        <h1 className="text-2xl font-display font-bold text-purple-800">
          {currentStep === 0 && '🎨 Pick a Theme!'}
          {currentStep === 1 && '👥 Add Characters'}
          {currentStep === 2 && '🌟 Choose the Mood'}
          {currentStep === 3 && '💡 Pick Your Values'}
          {currentStep === 4 && (generatedStory ? '🎉 Your Story!' : '✨ Almost Ready!')}
        </h1>
      </div>

      {/* Step content */}
      <main className="flex-1 overflow-y-auto px-4 pb-4">
        {renderStep()}
      </main>

      {/* Footer navigation — hidden while generating */}
      {!(currentStep === 4 && isGenerating) && (
        <footer className="px-4 py-4 flex-shrink-0 border-t border-white/50 bg-white/30 backdrop-blur-sm">
          {isLastStep ? (
            generatedStory ? (
              <Button
                onClick={handleFinish}
                size="lg"
                className="w-full rounded-full bg-gradient-to-r from-green-400 to-emerald-500 hover:from-green-500 hover:to-emerald-600 text-white font-display font-bold text-lg h-14"
              >
                <BookOpen className="mr-2 h-5 w-5" />
                Read My Story!
              </Button>
            ) : (
              <Button
                onClick={handleGenerate}
                disabled={isGenerating}
                size="lg"
                className="w-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-display font-bold text-lg h-14"
              >
                <Sparkles className="mr-2 h-5 w-5" />
                Create My Story! ✨
              </Button>
            )
          ) : (
            <Button
              onClick={handleNext}
              disabled={!canProceed()}
              size="lg"
              className={cn(
                'w-full rounded-full font-display font-bold text-lg h-14',
                canProceed()
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white'
                  : 'bg-gray-200 text-gray-400'
              )}
            >
              Next
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          )}
        </footer>
      )}
    </div>
  );
}

function SummaryRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-purple-500">{icon}</span>
      <span className="font-bold text-gray-600 w-20 shrink-0">{label}:</span>
      <span className="capitalize text-gray-800 truncate">{value}</span>
    </div>
  );
}
