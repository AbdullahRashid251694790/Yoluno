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

const themeColors: Record<string, { bg: string; border: string; activeBg: string }> = {
  friendship: { bg: 'bg-lolo/8', border: 'border-lolo/20', activeBg: 'bg-lolo/15' },
  kindness: { bg: 'bg-lolo/8', border: 'border-lolo/20', activeBg: 'bg-lolo/15' },
  adventure: { bg: 'bg-gold/8', border: 'border-gold/20', activeBg: 'bg-gold/15' },
  animals: { bg: 'bg-primary/8', border: 'border-primary/20', activeBg: 'bg-primary/15' },
  nature: { bg: 'bg-primary/8', border: 'border-primary/20', activeBg: 'bg-primary/15' },
  bedtime: { bg: 'bg-lumi/8', border: 'border-lumi/20', activeBg: 'bg-lumi/15' },
  colors: { bg: 'bg-lala/8', border: 'border-lala/20', activeBg: 'bg-lala/15' },
  shapes: { bg: 'bg-primary/8', border: 'border-primary/20', activeBg: 'bg-primary/15' },
  family: { bg: 'bg-gold/8', border: 'border-gold/20', activeBg: 'bg-gold/15' },
  space: { bg: 'bg-lumi/8', border: 'border-lumi/20', activeBg: 'bg-lumi/15' },
  dinosaurs: { bg: 'bg-primary/8', border: 'border-primary/20', activeBg: 'bg-primary/15' },
  magic: { bg: 'bg-lumi/8', border: 'border-lumi/20', activeBg: 'bg-lumi/15' },
  sports: { bg: 'bg-primary/8', border: 'border-primary/20', activeBg: 'bg-primary/15' },
  science: { bg: 'bg-primary/8', border: 'border-primary/20', activeBg: 'bg-primary/15' },
  mystery: { bg: 'bg-lumi/8', border: 'border-lumi/20', activeBg: 'bg-lumi/15' },
  fantasy: { bg: 'bg-lumi/8', border: 'border-lumi/20', activeBg: 'bg-lumi/15' },
  history: { bg: 'bg-gold/8', border: 'border-gold/20', activeBg: 'bg-gold/15' },
  invention: { bg: 'bg-gold/8', border: 'border-gold/20', activeBg: 'bg-gold/15' },
  courage: { bg: 'bg-lolo/8', border: 'border-lolo/20', activeBg: 'bg-lolo/15' },
};

const moodEmojis: Record<string, string> = {
  adventurous: '🌟', calm: '😌', funny: '😄',
  magical: '✨', exciting: '🎉', peaceful: '🕊️', mysterious: '🔮',
};

const moodColors: Record<string, { bg: string; border: string; activeBg: string }> = {
  adventurous: { bg: 'bg-gold/8', border: 'border-gold/20', activeBg: 'bg-gold/15' },
  calm: { bg: 'bg-primary/8', border: 'border-primary/20', activeBg: 'bg-primary/15' },
  funny: { bg: 'bg-lala/8', border: 'border-lala/20', activeBg: 'bg-lala/15' },
  magical: { bg: 'bg-lumi/8', border: 'border-lumi/20', activeBg: 'bg-lumi/15' },
  exciting: { bg: 'bg-lolo/8', border: 'border-lolo/20', activeBg: 'bg-lolo/15' },
  peaceful: { bg: 'bg-primary/8', border: 'border-primary/20', activeBg: 'bg-primary/15' },
  mysterious: { bg: 'bg-lumi/8', border: 'border-lumi/20', activeBg: 'bg-lumi/15' },
};

const valueEmojis: Record<string, string> = {
  kindness: '💕', honesty: '💎', courage: '🦁', friendship: '🤝',
  perseverance: '💪', respect: '🙏', responsibility: '⭐',
  gratitude: '🙏', empathy: '❤️', creativity: '🎨',
};

const valueColors: Record<string, { bg: string; border: string; activeBg: string }> = {
  kindness: { bg: 'bg-lolo/8', border: 'border-lolo/20', activeBg: 'bg-lolo/15' },
  honesty: { bg: 'bg-primary/8', border: 'border-primary/20', activeBg: 'bg-primary/15' },
  courage: { bg: 'bg-gold/8', border: 'border-gold/20', activeBg: 'bg-gold/15' },
  friendship: { bg: 'bg-primary/8', border: 'border-primary/20', activeBg: 'bg-primary/15' },
  perseverance: { bg: 'bg-lolo/8', border: 'border-lolo/20', activeBg: 'bg-lolo/15' },
  respect: { bg: 'bg-lumi/8', border: 'border-lumi/20', activeBg: 'bg-lumi/15' },
  responsibility: { bg: 'bg-gold/8', border: 'border-gold/20', activeBg: 'bg-gold/15' },
  gratitude: { bg: 'bg-primary/8', border: 'border-primary/20', activeBg: 'bg-primary/15' },
  empathy: { bg: 'bg-lolo/8', border: 'border-lolo/20', activeBg: 'bg-lolo/15' },
  creativity: { bg: 'bg-lumi/8', border: 'border-lumi/20', activeBg: 'bg-lumi/15' },
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
  'bg-gold', 'bg-primary', 'bg-lumi', 'bg-lolo', 'bg-primary',
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
        createdBy: 'child',
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
            <p className="text-center text-muted-foreground text-body-sm font-body">What should your story be about?</p>
            <div className="grid grid-cols-3 gap-3">
              {themes.map((theme) => {
                const colors = themeColors[theme] || { bg: 'bg-primary/8', border: 'border-primary/20', activeBg: 'bg-primary/15' };
                return (
                  <button
                    key={theme}
                    onClick={() => setState((p) => ({ ...p, theme, customTheme: '' }))}
                    className={cn(
                      'flex flex-col items-center gap-2 rounded-3xl p-4 transition-all duration-300 active:scale-95',
                      'border-2',
                      state.theme === theme
                        ? `${colors.activeBg} border-primary shadow-[0_4px_24px_rgba(61,214,200,0.15)]`
                        : `${colors.bg} ${colors.border} hover:shadow-warm`
                    )}
                  >
                    <span className="text-h3">{themeEmojis[theme] || '📖'}</span>
                    <span className={cn('text-caption font-bold capitalize', state.theme === theme ? 'text-primary' : 'text-foreground')}>{theme}</span>
                  </button>
                );
              })}
            </div>
            <div className="pt-2">
              <p className="text-caption text-muted-foreground mb-2 text-center">Or make up your own!</p>
              <Input
                placeholder="e.g., robot friends, underwater adventure..."
                value={state.customTheme}
                onChange={(e) => setState((p) => ({ ...p, customTheme: e.target.value, theme: '' }))}
                className="rounded-[40px] text-center bg-white/60 backdrop-blur-md border-white/60"
              />
            </div>
          </div>
        );

      // ── Step 1: Characters ────────────────────────────────────────────────────
      case 1:
        return (
          <div className="space-y-4">
            <p className="text-center text-muted-foreground text-body-sm">Who should be in the story? (Optional)</p>
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
                <span className="text-body-sm text-muted-foreground">Boy or girl?</span>
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
                      'px-5 py-2.5 rounded-[40px] text-body-sm font-bold transition-all duration-300 border-2',
                      state.customCharacterGender === g
                        ? g === 'boy'
                          ? 'bg-primary text-white shadow-[0_4px_16px_rgba(61,214,200,0.25)]'
                          : 'bg-lolo text-white shadow-[0_4px_16px_rgba(230,130,90,0.25)]'
                        : g === 'boy'
                          ? 'bg-primary/8 border-primary/20 text-foreground hover:shadow-warm'
                          : 'bg-lolo/8 border-lolo/20 text-foreground hover:shadow-warm'
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
                      'inline-flex items-center gap-1 rounded-full px-4 py-2 text-body-sm font-bold',
                      char.gender === 'boy' && 'bg-primary/10 text-primary',
                      char.gender === 'girl' && 'bg-lolo/10 text-foreground',
                      !char.gender && 'bg-primary/10 text-foreground'
                    )}
                  >
                    {char.gender === 'boy' && '👦 '}
                    {char.gender === 'girl' && '👧 '}
                    {char.name}
                    <button onClick={() => removeCharacter(i)} className="ml-1 text-body-lg leading-none">×</button>
                  </span>
                ))}
              </div>
            )}
            <button
              type="button"
              onClick={() => setState((p) => ({ ...p, includeFamily: !p.includeFamily }))}
              className={cn(
                'w-full flex items-center justify-center gap-3 rounded-3xl p-4 transition-all duration-300 text-body-sm font-bold border-2',
                state.includeFamily
                  ? 'bg-gold/15 border-gold text-gold shadow-[0_4px_16px_rgba(212,168,67,0.15)]'
                  : 'bg-gold/8 border-gold/20 text-muted-foreground hover:shadow-warm'
              )}
            >
              <span className="text-h4">👨‍👩‍👧</span>
              Include my family in the story
              {state.includeFamily && <Check className="h-4 w-4 ml-auto" />}
            </button>
          </div>
        );

      // ── Step 2: Mood ──────────────────────────────────────────────────────────
      case 2:
        return (
          <div className="space-y-5">
            <p className="text-center text-muted-foreground text-body-sm">What feeling should the story have?</p>
            <div className="grid grid-cols-2 gap-3">
              {storyMoods.map((mood) => {
                const colors = moodColors[mood] || { bg: 'bg-primary/8', border: 'border-primary/20', activeBg: 'bg-primary/15' };
                return (
                  <button
                    key={mood}
                    onClick={() => setState((p) => ({ ...p, mood }))}
                    className={cn(
                      'flex items-center gap-3 rounded-3xl p-4 transition-all duration-300 active:scale-95',
                      'border-2',
                      state.mood === mood
                        ? `${colors.activeBg} border-primary shadow-[0_4px_24px_rgba(61,214,200,0.15)]`
                        : `${colors.bg} ${colors.border} hover:shadow-warm`
                    )}
                  >
                    <span className="text-h4">{moodEmojis[mood] || '📖'}</span>
                    <span className={cn('font-bold capitalize text-body-sm', state.mood === mood ? 'text-primary' : 'text-foreground')}>{mood}</span>
                  </button>
                );
              })}
            </div>
            <div>
              <p className="text-body-sm font-bold text-center mb-3 text-foreground">How long?</p>
              <div className="flex gap-2">
                {(['short', 'medium', 'long'] as const).map((len) => {
                  const lenColors: Record<string, string> = { short: 'bg-lala/8 border-lala/20', medium: 'bg-primary/8 border-primary/20', long: 'bg-lumi/8 border-lumi/20' };
                  return (
                    <button
                      key={len}
                      onClick={() => setState((p) => ({ ...p, storyLength: len }))}
                      className={cn(
                        'flex-1 rounded-[40px] py-3 text-body-sm font-bold capitalize transition-all duration-300 border-2',
                        state.storyLength === len
                          ? 'bg-primary text-white shadow-[0_4px_16px_rgba(61,214,200,0.25)]'
                          : `${lenColors[len]} text-foreground hover:shadow-warm`
                      )}
                    >
                      {len === 'short' ? '⚡ Short' : len === 'medium' ? '📖 Medium' : '📚 Long'}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <p className="text-body-sm font-bold text-center mb-3 text-foreground flex items-center justify-center gap-2">
                <Volume2 className="h-4 w-4" /> Who reads the story?
              </p>
              <div className="grid grid-cols-3 gap-2">
                {voiceOptions.map((v, i) => {
                  const voiceColors = ['bg-lolo/8 border-lolo/20', 'bg-lala/8 border-lala/20', 'bg-lumi/8 border-lumi/20', 'bg-primary/8 border-primary/20', 'bg-gold/8 border-gold/20', 'bg-lolo/8 border-lolo/20'];
                  return (
                    <button
                      key={v.value}
                      onClick={() => setState((p) => ({ ...p, narratorVoice: v.value }))}
                      className={cn(
                        'flex flex-col items-center gap-1 rounded-2xl py-3 transition-all duration-300 border-2',
                        state.narratorVoice === v.value
                          ? 'bg-primary/15 border-primary shadow-[0_4px_16px_rgba(61,214,200,0.15)]'
                          : `${voiceColors[i % voiceColors.length]} hover:shadow-warm`
                      )}
                    >
                      <span className="text-body-lg">{v.emoji}</span>
                      <span className={cn('text-caption font-bold', state.narratorVoice === v.value ? 'text-primary' : 'text-foreground')}>{v.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        );

      // ── Step 3: Values ────────────────────────────────────────────────────────
      case 3:
        return (
          <div className="space-y-4">
            <p className="text-center text-muted-foreground text-body-sm">
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
                      'flex items-center gap-3 rounded-3xl p-3 transition-all duration-300 text-body-sm font-bold border-2',
                      (() => {
                        const c = valueColors[value] || { bg: 'bg-lolo/8', border: 'border-lolo/20', activeBg: 'bg-lolo/15' };
                        return selected
                          ? `${c.activeBg} border-lolo shadow-[0_4px_16px_rgba(230,130,90,0.15)] text-lolo`
                          : `${c.bg} ${c.border} text-foreground hover:shadow-warm`;
                      })(),
                      disabled && 'opacity-40 cursor-not-allowed'
                    )}
                  >
                    <span className="text-body-lg">{valueEmojis[value] || '⭐'}</span>
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
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary to-lolo flex items-center justify-center animate-pulse">
                  <Wand2 className="h-16 w-16 text-white animate-bounce" />
                </div>
                <Sparkles className="absolute -top-2 -right-2 h-8 w-8 text-lala animate-spin" />
                <Sparkles
                  className="absolute -bottom-2 -left-2 h-6 w-6 text-lolo animate-spin"
                  style={{ animationDirection: 'reverse' }}
                />
              </div>
              <div className="text-center space-y-2">
                <h2 className="text-body-lg font-display font-bold text-foreground">Making your story...</h2>
                <p className="text-body-sm text-muted-foreground">A little magic is happening! ✨</p>
                <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary mt-4" />
              </div>
            </div>
          );
        }

        if (generatedStory) {
          return (
            <div className="space-y-4 text-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-primary flex items-center justify-center mx-auto">
                <BookOpen className="h-10 w-10 text-white" />
              </div>
              <div>
                <h2 className="text-body-lg font-display font-bold text-foreground">{generatedStory.title}</h2>
                {generatedStory.hasPages && generatedStory.pageCount && (
                  <p className="text-body-sm text-muted-foreground mt-1">
                    {generatedStory.pageCount} pages · illustrations being created...
                  </p>
                )}
              </div>
              <div className="max-h-40 overflow-y-auto rounded-2xl bg-primary/5 p-4 text-left">
                <p className="text-body-sm leading-relaxed whitespace-pre-wrap text-foreground/70">
                  {generatedStory.content}
                </p>
              </div>
              <div className="rounded-2xl bg-lala/10 border border-lala p-3">
                <p className="text-body-sm text-lala font-medium">
                  🎨 Your storybook is ready! Pictures are being drawn in the background.
                </p>
              </div>
            </div>
          );
        }

        return (
          <div className="space-y-4">
            <p className="text-center text-muted-foreground text-body-sm">Ready? Here's your story! 🎉</p>
            <div className="rounded-3xl bg-white/50 backdrop-blur-md border border-white/60 shadow-warm p-5 space-y-3">
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
    <div className="fixed inset-0 z-50 flex flex-col overflow-hidden" style={{ background: 'linear-gradient(180deg, hsl(270 60% 92%) 0%, hsl(340 50% 94%) 40%, hsl(42 60% 97%) 100%)' }}>
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
                  ? 'bg-primary flex-1'
                  : i === currentStep
                    ? `${STEP_COLORS[i]} flex-[2]`
                    : 'bg-muted flex-1'
              )}
            />
          ))}
        </div>

        <span className="text-caption font-bold text-primary shrink-0">
          {currentStep + 1}/{STEPS.length}
        </span>
      </header>

      {/* Step title */}
      <div className="px-4 pb-3 flex-shrink-0">
        <h1 className="text-h4 font-display font-bold text-foreground">
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
                className="w-full rounded-full bg-primary hover:bg-primary/90 text-white font-display font-bold text-body-lg h-14"
              >
                <BookOpen className="mr-2 h-5 w-5" />
                Read My Story!
              </Button>
            ) : (
              <Button
                onClick={handleGenerate}
                disabled={isGenerating}
                size="lg"
                className="w-full rounded-full bg-gradient-to-r from-primary to-lolo hover:from-primary/90 hover:to-lolo/90 text-white font-display font-bold text-body-lg h-14"
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
                'w-full rounded-full font-display font-bold text-body-lg h-14',
                canProceed()
                  ? 'bg-gradient-to-r from-primary to-lolo hover:from-primary/90 hover:to-lolo/90 text-white'
                  : 'bg-muted text-muted-foreground'
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
    <div className="flex items-center gap-2 text-body-sm">
      <span className="text-primary">{icon}</span>
      <span className="font-bold text-muted-foreground w-20 shrink-0">{label}:</span>
      <span className="capitalize text-foreground truncate">{value}</span>
    </div>
  );
}
