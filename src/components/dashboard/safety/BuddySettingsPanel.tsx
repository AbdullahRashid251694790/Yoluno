/**
 * Buddy Settings Panel Component
 *
 * Allows parents to customize their child's buddy personality and name.
 */

import { useState, useEffect } from 'react';
import { useChatBuddy, useUpdateBuddyName, useUpdateBuddyPersonality } from '@/hooks/queries/useBuddyChat';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Save, Sparkles } from 'lucide-react';
import type { ChatBuddy } from '@/services/buddyChat';

interface BuddySettingsPanelProps {
  childId: string;
  childName: string;
}

export function BuddySettingsPanel({ childId, childName }: BuddySettingsPanelProps) {
  const { data: buddy, isLoading } = useChatBuddy(childId);
  const { mutate: updateName, isPending: isUpdatingName } = useUpdateBuddyName();
  const { mutate: updatePersonality, isPending: isUpdatingPersonality } = useUpdateBuddyPersonality();

  const [buddyName, setBuddyName] = useState('');
  const [traits, setTraits] = useState({
    curious: 5,
    patient: 5,
    playful: 5,
    educational: 5,
    empathetic: 5,
  });
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (buddy) {
      setBuddyName(buddy.buddy_name);
      setTraits(buddy.personality_traits);
    }
  }, [buddy]);

  useEffect(() => {
    if (buddy) {
      const nameChanged = buddyName !== buddy.buddy_name;
      const traitsChanged = JSON.stringify(traits) !== JSON.stringify(buddy.personality_traits);
      setHasChanges(nameChanged || traitsChanged);
    }
  }, [buddyName, traits, buddy]);

  const handleSave = () => {
    if (!buddy) return;

    // Update name if changed
    if (buddyName !== buddy.buddy_name) {
      updateName({ buddyId: buddy.id, name: buddyName });
    }

    // Update personality if changed
    if (JSON.stringify(traits) !== JSON.stringify(buddy.personality_traits)) {
      updatePersonality({ buddyId: buddy.id, traits });
    }
  };

  const handleReset = () => {
    if (buddy) {
      setBuddyName(buddy.buddy_name);
      setTraits(buddy.personality_traits);
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
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
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
            <AvatarImage src={buddy.buddy_avatar_url || undefined} />
            <AvatarFallback className="bg-primary/20 text-primary text-xl">
              {buddyName[0]}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-2">
            <Label htmlFor="buddy-name">Luno's Name</Label>
            <Input
              id="buddy-name"
              value={buddyName}
              onChange={(e) => setBuddyName(e.target.value)}
              placeholder="Enter Luno's name"
              maxLength={20}
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 rounded-lg bg-muted p-4">
          <div className="text-center">
            <p className="text-2xl font-bold">{buddy.total_messages}</p>
            <p className="text-xs text-muted-foreground">Total Messages</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">
              {buddy.conversation_context.length}
            </p>
            <p className="text-xs text-muted-foreground">Context Messages</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">
              {buddy.last_interaction_at
                ? new Date(buddy.last_interaction_at).toLocaleDateString()
                : 'Never'}
            </p>
            <p className="text-xs text-muted-foreground">Last Chat</p>
          </div>
        </div>

        {/* Personality Traits */}
        <div className="space-y-4">
          <h3 className="font-semibold">Personality Traits</h3>
          <p className="text-sm text-muted-foreground">
            Adjust the sliders to customize how Luno interacts with {childName}.
          </p>

          {Object.entries(traits).map(([trait, value]) => (
            <div key={trait} className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor={trait} className="capitalize">
                  {trait}
                </Label>
                <span className="text-sm font-medium">{value}/10</span>
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
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                {traitDescriptions[trait as keyof typeof traits]}
              </p>
            </div>
          ))}
        </div>

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
            disabled={!hasChanges || isUpdatingName || isUpdatingPersonality}
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
            disabled={!hasChanges || isUpdatingName || isUpdatingPersonality}
          >
            Reset
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
