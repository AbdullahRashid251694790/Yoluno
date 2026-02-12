/**
 * Story Wizard Page
 *
 * Multi-step story creation wizard with theme, characters, mood, values selection.
 */

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useChildProfile, queryKeys } from '@/hooks/queries';
import { generateStory, getThemeSuggestions, storyMoods, storyValues, type StoryCharacter } from '@/services/storyGeneration';
import { type TTSVoice, getRecommendedVoice } from '@/services/textToSpeech';
import { LoadingState, ErrorState } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import {
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Wand2,
  Users,
  Palette,
  Heart,
  BookOpen,
  Loader2,
  Check,
  Volume2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const STEPS = ['Theme', 'Characters', 'Mood', 'Values', 'Generate'];

// Theme emojis for visual appeal
const themeEmojis: Record<string, string> = {
  friendship: '🤝',
  kindness: '💝',
  adventure: '🗺️',
  animals: '🐾',
  nature: '🌳',
  bedtime: '🌙',
  colors: '🌈',
  shapes: '🔷',
  family: '👨‍👩‍👧',
  space: '🚀',
  dinosaurs: '🦕',
  magic: '✨',
  sports: '⚽',
  science: '🔬',
  mystery: '🔍',
  fantasy: '🏰',
  history: '📜',
  invention: '💡',
  courage: '🦁',
};

// Mood emojis
const moodEmojis: Record<string, string> = {
  adventurous: '🌟',
  calm: '😌',
  funny: '😄',
  magical: '✨',
  exciting: '🎉',
  peaceful: '🕊️',
  mysterious: '🔮',
};

// Value emojis
const valueEmojis: Record<string, string> = {
  kindness: '💕',
  honesty: '💎',
  courage: '🦁',
  friendship: '🤝',
  perseverance: '💪',
  respect: '🙏',
  responsibility: '⭐',
  gratitude: '🙏',
  empathy: '❤️',
  creativity: '🎨',
};

// Voice options for narration
const voiceOptions: { value: TTSVoice; label: string; description: string }[] = [
  { value: 'shimmer', label: 'Shimmer', description: 'Warm & friendly' },
  { value: 'nova', label: 'Nova', description: 'Clear & engaging' },
  { value: 'alloy', label: 'Alloy', description: 'Balanced & natural' },
  { value: 'echo', label: 'Echo', description: 'Calm & soothing' },
  { value: 'fable', label: 'Fable', description: 'Expressive & dramatic' },
  { value: 'onyx', label: 'Onyx', description: 'Deep & resonant' },
];

interface StoryWizardState {
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

export function StoryWizardPage() {
  const { childId } = useParams<{ childId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: child, isLoading, isError } = useChildProfile(childId);

  const [currentStep, setCurrentStep] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedStory, setGeneratedStory] = useState<{
    id?: string;
    title: string;
    content: string;
    moral: string;
    illustrationUrl?: string | null;
    coverImageUrl?: string | null;
    hasPages?: boolean;
    pageCount?: number;
  } | null>(null);

  const [wizardState, setWizardState] = useState<StoryWizardState>({
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

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else {
      navigate(`/kids/${childId}/stories`);
    }
  };

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0: // Theme
        return wizardState.theme !== '' || wizardState.customTheme !== '';
      case 1: // Characters
        return true; // Optional
      case 2: // Mood
        return wizardState.mood !== '';
      case 3: // Values
        return true; // Optional
      case 4: // Generate
        return true;
      default:
        return true;
    }
  };

  const handleGenerate = async () => {
    if (!childId) return;

    setIsGenerating(true);
    try {
      const story = await generateStory({
        childProfileId: childId,
        theme: wizardState.customTheme || wizardState.theme,
        characters: wizardState.characters.length > 0 ? wizardState.characters : undefined,
        mood: wizardState.mood,
        values: wizardState.values.length > 0 ? wizardState.values : undefined,
        storyLength: wizardState.storyLength,
        includeFamily: wizardState.includeFamily,
        narratorVoice: wizardState.narratorVoice,
      });

      setGeneratedStory({
        id: story.id,
        title: story.title,
        content: story.content,
        moral: story.moral,
        illustrationUrl: story.illustrationUrl,
        coverImageUrl: story.cover_image_url,
        hasPages: story.has_pages,
        pageCount: story.pages?.length,
      });

      // Store voice preference for this story in localStorage
      if (story.id) {
        const voicePrefs = JSON.parse(localStorage.getItem('storyVoicePrefs') || '{}');
        voicePrefs[story.id] = wizardState.narratorVoice;
        localStorage.setItem('storyVoicePrefs', JSON.stringify(voicePrefs));
      }

      console.log('Story generated:', { story, id: story.id, warning: story.warning, childId, voice: wizardState.narratorVoice });

      // Invalidate stories cache so the list updates
      console.log('Invalidating stories cache for childId:', childId);
      await queryClient.invalidateQueries({
        queryKey: queryKeys.stories.listByChild(childId),
      });

      if (story.warning) {
        // Story was saved but illustration failed
        toast.success('Story created!', {
          description: `"${story.title}" saved (illustration unavailable).`,
        });
      } else {
        toast.success('Story created!', {
          description: `"${story.title}" has been saved to your library!`,
        });
      }
    } catch (error: any) {
      console.error('Failed to generate story:', error);
      const message = error?.message || '';
      if (message.includes('limit') || message.includes('429')) {
        toast.error('Story limit reached', {
          description: 'You can create up to 3 stories per month per child.',
        });
      } else {
        toast.error('Failed to generate story', {
          description: 'Please try again.',
        });
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFinish = () => {
    navigate(`/kids/${childId}/stories`);
  };

  const toggleValue = (value: string) => {
    setWizardState((prev) => ({
      ...prev,
      values: prev.values.includes(value)
        ? prev.values.filter((v) => v !== value)
        : [...prev.values, value].slice(0, 3), // Max 3 values
    }));
  };

  const addCharacter = () => {
    if (wizardState.customCharacter.trim()) {
      setWizardState((prev) => ({
        ...prev,
        characters: [
          ...prev.characters,
          {
            name: prev.customCharacter.trim(),
            gender: prev.customCharacterGender,
          },
        ].slice(0, 5),
        customCharacter: '',
        customCharacterGender: undefined,
      }));
    }
  };

  const removeCharacter = (index: number) => {
    setWizardState((prev) => ({
      ...prev,
      characters: prev.characters.filter((_, i) => i !== index),
    }));
  };

  if (isLoading) {
    return <LoadingState message="Loading..." fullPage />;
  }

  if (isError || !child) {
    return (
      <ErrorState
        title="Child not found"
        message="The child profile could not be loaded."
        onRetry={() => navigate('/dashboard')}
        retryLabel="Back to Dashboard"
        fullPage
      />
    );
  }

  const progress = ((currentStep + 1) / STEPS.length) * 100;
  const isLastStep = currentStep === STEPS.length - 1;

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Theme
        return (
          <div className="space-y-4">
            <p className="text-muted-foreground text-sm">
              What should the story be about?
            </p>
            <div className="grid grid-cols-3 gap-3">
              {themes.map((theme) => (
                <button
                  key={theme}
                  onClick={() => setWizardState((prev) => ({ ...prev, theme, customTheme: '' }))}
                  className={cn(
                    'flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all hover:scale-105',
                    wizardState.theme === theme
                      ? 'border-primary bg-primary/10'
                      : 'border-muted hover:border-primary/50'
                  )}
                >
                  <span className="text-2xl">{themeEmojis[theme] || '📖'}</span>
                  <span className="text-sm font-medium capitalize">{theme}</span>
                </button>
              ))}
            </div>
            <div className="pt-4">
              <Label htmlFor="customTheme">Or enter your own theme:</Label>
              <Input
                id="customTheme"
                placeholder="e.g., underwater adventure, robot friends..."
                value={wizardState.customTheme}
                onChange={(e) =>
                  setWizardState((prev) => ({ ...prev, customTheme: e.target.value, theme: '' }))
                }
                className="mt-2"
              />
            </div>
          </div>
        );

      case 1: // Characters
        return (
          <div className="space-y-4">
            <p className="text-muted-foreground text-sm">
              Who should be in the story? (Optional)
            </p>
            <div className="flex gap-2">
              <Input
                placeholder="Add a character name..."
                value={wizardState.customCharacter}
                onChange={(e) =>
                  setWizardState((prev) => ({ ...prev, customCharacter: e.target.value }))
                }
                onKeyDown={(e) => e.key === 'Enter' && addCharacter()}
              />
            </div>
            {wizardState.customCharacter.trim() && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Gender:</span>
                <button
                  type="button"
                  onClick={() =>
                    setWizardState((prev) => ({
                      ...prev,
                      customCharacterGender: prev.customCharacterGender === 'boy' ? undefined : 'boy',
                    }))
                  }
                  className={cn(
                    'px-3 py-1 rounded-full text-sm border-2 transition-all',
                    wizardState.customCharacterGender === 'boy'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-muted hover:border-blue-300'
                  )}
                >
                  👦 Boy
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setWizardState((prev) => ({
                      ...prev,
                      customCharacterGender: prev.customCharacterGender === 'girl' ? undefined : 'girl',
                    }))
                  }
                  className={cn(
                    'px-3 py-1 rounded-full text-sm border-2 transition-all',
                    wizardState.customCharacterGender === 'girl'
                      ? 'border-pink-500 bg-pink-50 text-pink-700'
                      : 'border-muted hover:border-pink-300'
                  )}
                >
                  👧 Girl
                </button>
                <Button onClick={addCharacter} size="sm" disabled={!wizardState.customCharacter.trim()}>
                  Add
                </Button>
              </div>
            )}
            {wizardState.characters.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {wizardState.characters.map((char, index) => (
                  <span
                    key={index}
                    className={cn(
                      'inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm',
                      char.gender === 'boy' && 'bg-blue-100 text-blue-800',
                      char.gender === 'girl' && 'bg-pink-100 text-pink-800',
                      !char.gender && 'bg-primary/10'
                    )}
                  >
                    {char.gender === 'boy' && '👦 '}
                    {char.gender === 'girl' && '👧 '}
                    {char.name}
                    <button
                      onClick={() => removeCharacter(index)}
                      className="ml-1 text-muted-foreground hover:text-foreground"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
            <div className="flex items-center space-x-2 pt-4">
              <Checkbox
                id="includeFamily"
                checked={wizardState.includeFamily}
                onCheckedChange={(checked) =>
                  setWizardState((prev) => ({ ...prev, includeFamily: !!checked }))
                }
              />
              <Label htmlFor="includeFamily" className="text-sm">
                Include family members in the story
              </Label>
            </div>
          </div>
        );

      case 2: // Mood
        return (
          <div className="space-y-4">
            <p className="text-muted-foreground text-sm">
              What feeling should the story have?
            </p>
            <div className="grid grid-cols-2 gap-3">
              {storyMoods.map((mood) => (
                <button
                  key={mood}
                  onClick={() => setWizardState((prev) => ({ ...prev, mood }))}
                  className={cn(
                    'flex items-center gap-3 rounded-xl border-2 p-4 transition-all hover:scale-105',
                    wizardState.mood === mood
                      ? 'border-primary bg-primary/10'
                      : 'border-muted hover:border-primary/50'
                  )}
                >
                  <span className="text-2xl">{moodEmojis[mood] || '📖'}</span>
                  <span className="font-medium capitalize">{mood}</span>
                </button>
              ))}
            </div>
            <div className="pt-4">
              <Label>Story Length</Label>
              <div className="mt-2 flex gap-2">
                {(['short', 'medium', 'long'] as const).map((length) => (
                  <Button
                    key={length}
                    variant={wizardState.storyLength === length ? 'default' : 'outline'}
                    onClick={() => setWizardState((prev) => ({ ...prev, storyLength: length }))}
                    className="flex-1 capitalize"
                  >
                    {length}
                  </Button>
                ))}
              </div>
            </div>
            <div className="pt-4">
              <Label className="flex items-center gap-2">
                <Volume2 className="h-4 w-4" />
                Narrator Voice
              </Label>
              <p className="text-muted-foreground text-xs mt-1 mb-2">
                Choose a voice for reading the story aloud
              </p>
              <div className="grid grid-cols-3 gap-2">
                {voiceOptions.map((voice) => (
                  <button
                    key={voice.value}
                    onClick={() => setWizardState((prev) => ({ ...prev, narratorVoice: voice.value }))}
                    className={cn(
                      'flex flex-col items-center gap-1 rounded-lg border-2 p-3 transition-all hover:scale-105',
                      wizardState.narratorVoice === voice.value
                        ? 'border-primary bg-primary/10'
                        : 'border-muted hover:border-primary/50'
                    )}
                  >
                    <span className="text-sm font-medium">{voice.label}</span>
                    <span className="text-xs text-muted-foreground">{voice.description}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      case 3: // Values
        return (
          <div className="space-y-4">
            <p className="text-muted-foreground text-sm">
              What lessons should the story teach? (Pick up to 3)
            </p>
            <div className="grid grid-cols-2 gap-3">
              {storyValues.map((value) => (
                <button
                  key={value}
                  onClick={() => toggleValue(value)}
                  disabled={
                    wizardState.values.length >= 3 && !wizardState.values.includes(value)
                  }
                  className={cn(
                    'flex items-center gap-3 rounded-xl border-2 p-3 transition-all',
                    wizardState.values.includes(value)
                      ? 'border-primary bg-primary/10'
                      : 'border-muted hover:border-primary/50',
                    wizardState.values.length >= 3 &&
                      !wizardState.values.includes(value) &&
                      'opacity-50 cursor-not-allowed'
                  )}
                >
                  <span className="text-xl">{valueEmojis[value] || '⭐'}</span>
                  <span className="text-sm font-medium capitalize">{value}</span>
                  {wizardState.values.includes(value) && (
                    <Check className="ml-auto h-4 w-4 text-primary" />
                  )}
                </button>
              ))}
            </div>
          </div>
        );

      case 4: // Generate
        return (
          <div className="space-y-6">
            {generatedStory ? (
              <div className="space-y-4">
                <div className="rounded-xl bg-gradient-to-r from-pink-500/10 to-purple-500/10 p-4">
                  <h3 className="text-lg font-bold">{generatedStory.title}</h3>
                  {generatedStory.hasPages && generatedStory.pageCount && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {generatedStory.pageCount} pages with illustrations generating...
                    </p>
                  )}
                </div>
                {(generatedStory.coverImageUrl || generatedStory.illustrationUrl) && (
                  <div className="rounded-xl overflow-hidden border-2 border-primary/20">
                    <img
                      src={generatedStory.coverImageUrl || generatedStory.illustrationUrl!}
                      alt={`Cover for ${generatedStory.title}`}
                      className="w-full h-auto max-h-[250px] object-cover"
                    />
                  </div>
                )}
                <div className="max-h-[200px] overflow-y-auto rounded-lg bg-muted/50 p-4">
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">
                    {generatedStory.content}
                  </p>
                </div>
                <div className="rounded-lg bg-purple-100 p-3 text-center">
                  <p className="text-sm text-purple-800">
                    Your storybook is ready! Illustrations are being created in the background.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-muted-foreground text-sm">
                  Ready to create the story! Here's what we'll make:
                </p>
                <div className="rounded-xl bg-muted/50 p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <Palette className="h-4 w-4 text-primary" />
                    <span className="text-sm">
                      <strong>Theme:</strong>{' '}
                      {wizardState.customTheme || wizardState.theme || 'Not selected'}
                    </span>
                  </div>
                  {wizardState.characters.length > 0 && (
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-primary" />
                      <span className="text-sm">
                        <strong>Characters:</strong> {wizardState.characters.map(c => c.name).join(', ')}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Wand2 className="h-4 w-4 text-primary" />
                    <span className="text-sm">
                      <strong>Mood:</strong> {wizardState.mood}
                    </span>
                  </div>
                  {wizardState.values.length > 0 && (
                    <div className="flex items-center gap-2">
                      <Heart className="h-4 w-4 text-primary" />
                      <span className="text-sm">
                        <strong>Values:</strong> {wizardState.values.join(', ')}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-primary" />
                    <span className="text-sm">
                      <strong>Length:</strong> {wizardState.storyLength}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Volume2 className="h-4 w-4 text-primary" />
                    <span className="text-sm">
                      <strong>Narrator:</strong> {voiceOptions.find(v => v.value === wizardState.narratorVoice)?.label || wizardState.narratorVoice}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  const stepIcons = [Palette, Users, Wand2, Heart, BookOpen];
  const StepIcon = stepIcons[currentStep];

  return (
    <div className="min-h-screen bg-gradient-to-b from-pastel-pink to-pastel-purple p-4">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-8">
          <Button variant="ghost" size="sm" onClick={handleBack} className="text-charcoal-muted">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {currentStep > 0 ? 'Back' : 'Cancel'}
          </Button>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="mb-2 flex justify-between text-sm">
            <span>
              Step {currentStep + 1} of {STEPS.length}
            </span>
            <span>{STEPS[currentStep]}</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Step content */}
        <Card className="border-0 shadow-xl bg-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-charcoal">
              <StepIcon className="h-5 w-5 text-cyan" />
              Create a Story for {child.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="min-h-[300px]">{renderStepContent()}</div>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="mt-6 flex justify-end gap-3">
          {isLastStep ? (
            generatedStory ? (
              <Button onClick={handleFinish} className="gap-2">
                <Check className="h-4 w-4" />
                Done
              </Button>
            ) : (
              <Button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="gap-2"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating Magic...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Generate Story
                  </>
                )}
              </Button>
            )
          ) : (
            <Button onClick={handleNext} disabled={!canProceed()} className="gap-2">
              Next
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
