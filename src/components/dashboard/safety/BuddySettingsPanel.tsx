/**
 * Buddy Settings Panel Component
 *
 * Allows parents to customize their child's buddy personality and name.
 */

import { useState, useEffect } from 'react';
import { useChatBuddy, useUpdateBuddyName, useUpdateBuddyPersonality } from '@/hooks/queries/useBuddyChat';
import { useChildProfile, useUpdateChildProfile } from '@/hooks/queries/useChildProfiles';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LoadingSpinner } from '@/components/shared/feedback/LoadingState';
import { Loader2, Save, Sparkles, Clock } from 'lucide-react';
import type { ChatBuddy } from '@/services/buddyChat';
import lunoImage from '@/assets/landing/luno.png';
import { toast } from 'sonner';

function SessionTimeLimitControl({ childId, childName }: { childId: string; childName: string }) {
  const { data: child } = useChildProfile(childId);
  const updateChild = useUpdateChildProfile();

  const totalMin = child?.session_time_limit_minutes ?? 0;
  const [hours, setHours] = useState(Math.floor(totalMin / 60));
  const [minutes, setMinutes] = useState(totalMin % 60);
  const [enabled, setEnabled] = useState(totalMin > 0);

  // Sync local state when DB value loads / changes
  useEffect(() => {
    const val = child?.session_time_limit_minutes ?? 0;
    setHours(Math.floor(val / 60));
    setMinutes(val % 60);
    setEnabled(val > 0);
  }, [child?.session_time_limit_minutes]);

  const handleSave = async () => {
    const total = enabled ? hours * 60 + minutes : null;
    if (enabled && (total === 0 || total === null)) {
      toast.error('Please enter at least 1 minute');
      return;
    }
    try {
      await updateChild.mutateAsync({
        id: childId,
        updates: { session_time_limit_minutes: total },
      });
      toast.success(
        total ? `Daily limit set to ${hours > 0 ? `${hours}h ` : ''}${minutes > 0 ? `${minutes}m` : ''}`.trim() : 'Daily limit removed'
      );
    } catch {
      toast.error('Failed to update session limit');
    }
  };

  return (
    <div className="rounded-lg border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <Label className="text-body-sm font-semibold">Daily Screen Time Limit</Label>
        </div>
        <Switch
          checked={enabled}
          onCheckedChange={async (on) => {
            setEnabled(on);
            if (!on) {
              // Save null immediately when toggling off so refresh persists
              try {
                await updateChild.mutateAsync({
                  id: childId,
                  updates: { session_time_limit_minutes: null },
                });
                toast.success('Daily limit removed');
              } catch {
                toast.error('Failed to update');
                setEnabled(true); // revert on failure
              }
            }
          }}
        />
      </div>
      <p className="text-caption text-muted-foreground">
        {enabled
          ? `${childName} will see a "Time's up" screen after using the app for this long each day.`
          : `No limit — ${childName} can use the app as long as they want.`}
      </p>
      {enabled && (
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Input
              type="number"
              min={0}
              max={23}
              value={hours}
              onChange={(e) => setHours(Math.max(0, Math.min(23, parseInt(e.target.value) || 0)))}
              className="w-16 text-center"
            />
            <span className="text-body-sm text-muted-foreground">hrs</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Input
              type="number"
              min={0}
              max={59}
              value={minutes}
              onChange={(e) => setMinutes(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
              className="w-16 text-center"
            />
            <span className="text-body-sm text-muted-foreground">min</span>
          </div>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={updateChild.isPending}
            className="ml-2"
          >
            {updateChild.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Save'}
          </Button>
        </div>
      )}
    </div>
  );
}

interface BuddySettingsPanelProps {
  childId: string;
  childName: string;
}

export function BuddySettingsPanel({ childId, childName }: BuddySettingsPanelProps) {
  const { data: buddy, isLoading } = useChatBuddy(childId);
  const { mutate: updateName, isPending: isUpdatingName } = useUpdateBuddyName();
  const { mutate: updatePersonality, isPending: isUpdatingPersonality } = useUpdateBuddyPersonality();

  const [traits, setTraits] = useState({
    curious: 5,
    patient: 5,
    playful: 5,
    educational: 5,
    empathetic: 5,
  });
  const [useCustom, setUseCustom] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (buddy) {
      // Merge with defaults — DB may return empty {} for new buddies
      setTraits({
        curious: 5,
        patient: 5,
        playful: 5,
        educational: 5,
        empathetic: 5,
        ...buddy.personality_traits,
      });
      setUseCustom(buddy.use_custom_personality ?? false);
    }
  }, [buddy]);

  useEffect(() => {
    if (buddy) {
      const traitsChanged = JSON.stringify(traits) !== JSON.stringify(buddy.personality_traits);
      setHasChanges(traitsChanged);
    }
  }, [traits, buddy]);

  const handleToggleCustom = (enabled: boolean) => {
    setUseCustom(enabled);
    if (buddy) {
      updatePersonality({
        buddyId: buddy.id,
        traits,
        useCustomPersonality: enabled,
      });
    }
  };

  const handleSave = () => {
    if (!buddy) return;
    if (JSON.stringify(traits) !== JSON.stringify(buddy.personality_traits)) {
      updatePersonality({ buddyId: buddy.id, traits, useCustomPersonality: useCustom });
    }
  };

  const handleReset = () => {
    const defaultTraits = {
      curious: 5,
      patient: 5,
      playful: 5,
      educational: 5,
      empathetic: 5,
    };
    setTraits(defaultTraits);
    if (buddy) {
      updatePersonality({
        buddyId: buddy.id,
        traits: defaultTraits,
        useCustomPersonality: useCustom,
      });
    }
  };

  const traitDescriptions: Record<keyof typeof traits, string> = {
    curious: 'How often Luno asks questions and encourages exploration',
    patient: 'How calm and understanding Luno is with repeated questions',
    playful: 'How fun and silly Luno is in conversations',
    educational: 'How focused Luno is on teaching and learning opportunities',
    empathetic: 'How caring and emotionally supportive Luno is',
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Luno Settings</CardTitle>
          <CardDescription>Loading Luno settings...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner size="lg" className="text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!buddy) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Luno Settings</CardTitle>
          <CardDescription>No Luno settings found for {childName}</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              Luno will be automatically set up when {childName} starts their first chat.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          {childName}'s Luno Settings
        </CardTitle>
        <CardDescription>
          Customize Luno's personality and behavior
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Buddy Avatar & Name */}
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={buddy.buddy_avatar_url || lunoImage} alt="Luno" />
            <AvatarFallback className="bg-primary/20 text-primary text-body-lg">
              L
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h3 className="text-body-lg font-semibold">Luno</h3>
            <p className="text-body-sm text-muted-foreground">{childName}'s AI companion</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 rounded-lg bg-muted p-4">
          <div className="text-center">
            <p className="text-h4 font-bold">{buddy.total_messages}</p>
            <p className="text-caption text-muted-foreground">Total Messages</p>
          </div>
          <div className="text-center">
            <p className="text-h4 font-bold">
              {Array.isArray(buddy.conversation_context)
                ? buddy.conversation_context.length
                : 0}
            </p>
            <p className="text-caption text-muted-foreground">Context Messages</p>
          </div>
          <div className="text-center">
            <p className="text-h4 font-bold">
              {buddy.last_interaction_at
                ? new Date(buddy.last_interaction_at).toLocaleDateString()
                : 'Never'}
            </p>
            <p className="text-caption text-muted-foreground">Last Chat</p>
          </div>
        </div>

        {/* Custom personality toggle */}
        <div className="flex items-start gap-4 rounded-lg border border-border bg-muted/30 p-4">
          <Switch
            id="use-custom-personality"
            checked={useCustom}
            onCheckedChange={handleToggleCustom}
            disabled={isUpdatingPersonality}
          />
          <div className="flex-1 space-y-1">
            <Label htmlFor="use-custom-personality" className="text-body-sm font-semibold cursor-pointer">
              Customize Luno's personality
            </Label>
            <p className="text-caption text-muted-foreground">
              {useCustom
                ? `Luno uses the sliders below for ${childName}.`
                : `Luno automatically adapts based on ${childName}'s age. Turn this on to adjust manually.`}
            </p>
          </div>
        </div>

        {/* Personality Traits */}
        <div className={`space-y-4 ${!useCustom ? 'opacity-50 pointer-events-none select-none' : ''}`}>
          <h3 className="font-semibold">Personality Traits</h3>
          <p className="text-body-sm text-muted-foreground">
            Adjust the sliders to customize how Luno interacts with {childName}.
          </p>

          {Object.entries(traits).map(([trait, value]) => (
            <div key={trait} className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor={trait} className="capitalize">
                  {trait}
                </Label>
                <span className="text-body-sm font-medium">{value}/10</span>
              </div>
              <Slider
                id={trait}
                value={[value]}
                onValueChange={([newValue]) =>
                  setTraits((prev) => ({ ...prev, [trait]: newValue }))
                }
                min={1}
                max={10}
                step={1}
                disabled={!useCustom}
                className="w-full"
              />
              <p className="text-caption text-muted-foreground">
                {traitDescriptions[trait as keyof typeof traits]}
              </p>
            </div>
          ))}
        </div>

        {/* Session Time Limit */}
        <SessionTimeLimitControl childId={childId} childName={childName} />

        {/* Actions */}
        {hasChanges && (
          <Alert>
            <AlertDescription>
              You have unsaved changes. Click Save to apply them.
            </AlertDescription>
          </Alert>
        )}

        <div className="flex gap-2">
          <Button
            onClick={handleSave}
            disabled={!useCustom || !hasChanges || isUpdatingName || isUpdatingPersonality}
            className="flex-1"
          >
            {isUpdatingName || isUpdatingPersonality ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={!useCustom || isUpdatingName || isUpdatingPersonality}
          >
            Reset
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
