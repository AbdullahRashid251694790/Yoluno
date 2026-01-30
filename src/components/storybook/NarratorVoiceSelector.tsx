/**
 * Narrator Voice Selector Component
 *
 * Dropdown for selecting AI voices or family Voice Vault recordings
 * as the narrator for story playback.
 */

import { useMemo } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
  SelectSeparator,
} from '@/components/ui/select';
import { useVoiceClipsForNarration } from '@/hooks/queries/useVoiceVault';
import { Mic, Volume2 } from 'lucide-react';

// AI voice options (OpenAI TTS voices)
const AI_VOICES = [
  { id: 'nova', name: 'Nova', description: 'Warm and friendly' },
  { id: 'shimmer', name: 'Shimmer', description: 'Soft and gentle' },
  { id: 'alloy', name: 'Alloy', description: 'Balanced and clear' },
  { id: 'echo', name: 'Echo', description: 'Neutral and smooth' },
  { id: 'fable', name: 'Fable', description: 'Expressive storyteller' },
  { id: 'onyx', name: 'Onyx', description: 'Deep and rich' },
] as const;

export type NarratorVoice =
  | { type: 'ai'; voiceId: string }
  | { type: 'voice_vault'; clipId: string; audioUrl: string };

interface NarratorVoiceSelectorProps {
  value: NarratorVoice;
  onChange: (voice: NarratorVoice) => void;
  childId?: string;
  disabled?: boolean;
  className?: string;
}

export function NarratorVoiceSelector({
  value,
  onChange,
  childId,
  disabled = false,
  className,
}: NarratorVoiceSelectorProps) {
  // Fetch voice vault clips for narration
  const { data: voiceClipsData } = useVoiceClipsForNarration(childId);
  const voiceClips = voiceClipsData?.items || [];

  // Get current selection value string
  const currentValue = useMemo(() => {
    if (value.type === 'ai') {
      return `ai:${value.voiceId}`;
    }
    return `vault:${value.clipId}`;
  }, [value]);

  // Handle selection change
  const handleChange = (newValue: string) => {
    if (newValue.startsWith('ai:')) {
      const voiceId = newValue.replace('ai:', '');
      onChange({ type: 'ai', voiceId });
    } else if (newValue.startsWith('vault:')) {
      const clipId = newValue.replace('vault:', '');
      const clip = voiceClips.find((c) => c.id === clipId);
      if (clip) {
        onChange({ type: 'voice_vault', clipId, audioUrl: clip.audio_url });
      }
    }
  };

  // Get display name for current selection
  const getDisplayName = () => {
    if (value.type === 'ai') {
      const aiVoice = AI_VOICES.find((v) => v.id === value.voiceId);
      return aiVoice?.name || 'AI Voice';
    }
    const clip = voiceClips.find((c) => c.id === value.clipId);
    return clip?.family_member_name || clip?.title || 'Family Voice';
  };

  return (
    <Select
      value={currentValue}
      onValueChange={handleChange}
      disabled={disabled}
    >
      <SelectTrigger className={className}>
        <div className="flex items-center gap-2">
          {value.type === 'ai' ? (
            <Volume2 className="h-4 w-4 text-muted-foreground" />
          ) : (
            <Mic className="h-4 w-4 text-primary" />
          )}
          <SelectValue>{getDisplayName()}</SelectValue>
        </div>
      </SelectTrigger>
      <SelectContent>
        {/* AI Voices */}
        <SelectGroup>
          <SelectLabel className="flex items-center gap-2">
            <Volume2 className="h-3 w-3" />
            AI Voices
          </SelectLabel>
          {AI_VOICES.map((voice) => (
            <SelectItem key={voice.id} value={`ai:${voice.id}`}>
              <div className="flex flex-col">
                <span>{voice.name}</span>
                <span className="text-xs text-muted-foreground">
                  {voice.description}
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectGroup>

        {/* Voice Vault Clips */}
        {voiceClips.length > 0 && (
          <>
            <SelectSeparator />
            <SelectGroup>
              <SelectLabel className="flex items-center gap-2">
                <Mic className="h-3 w-3" />
                Family Voices
              </SelectLabel>
              {voiceClips.map((clip) => (
                <SelectItem key={clip.id} value={`vault:${clip.id}`}>
                  <div className="flex flex-col">
                    <span>
                      {clip.family_member_name || clip.title}
                    </span>
                    {clip.description && (
                      <span className="text-xs text-muted-foreground">
                        {clip.description}
                      </span>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectGroup>
          </>
        )}
      </SelectContent>
    </Select>
  );
}

// Export AI voices for use elsewhere
export { AI_VOICES };
