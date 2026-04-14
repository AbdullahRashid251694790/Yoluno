/**
 * Record Voice Clip Dialog
 *
 * Dialog for recording and saving voice clips to the voice vault.
 */

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useFamilyMembers } from '@/hooks/queries/useFamily';
import { useCreateVoiceClip, type VoiceClipCategoryType } from '@/hooks/queries/useVoiceVault';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import { apiClient } from '@/integrations/api';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Mic, Square, Play, Pause, Loader2, RotateCcw, Save } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RecordVoiceClipDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CATEGORIES: { value: VoiceClipCategoryType; label: string }[] = [
  { value: 'encouragement', label: 'Encouragement' },
  { value: 'praise', label: 'Praise' },
  { value: 'celebration', label: 'Celebration' },
  { value: 'story', label: 'Story' },
  { value: 'memory', label: 'Memory' },
  { value: 'greeting', label: 'Greeting' },
  { value: 'message', label: 'Message' },
  { value: 'other', label: 'Other' },
];

export function RecordVoiceClipDialog({ open, onOpenChange }: RecordVoiceClipDialogProps) {
  const { user } = useAuth();
  const { data: familyMembers = [] } = useFamilyMembers(user?.id);
  const createVoiceClip = useCreateVoiceClip();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<VoiceClipCategoryType>('other');
  const [familyMemberId, setFamilyMemberId] = useState<string>('none');
  const [isUploading, setIsUploading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const {
    state: recordingState,
    isRecording,
    duration,
    audioBlob,
    audioUrl,
    startRecording,
    stopRecording,
    reset: resetRecording,
    error: recordingError,
  } = useAudioRecorder({
    maxDuration: 180000, // 3 minutes max
  });

  // Stop playback and reset form when dialog closes
  useEffect(() => {
    if (!open) {
      // Stop any playing audio immediately
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      setIsPlaying(false);
      resetForm();
    }
  }, [open]);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setCategory('other');
    setFamilyMemberId('none');
    setIsPlaying(false);
    resetRecording();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePlayPause = () => {
    if (!audioUrl) return;

    if (!audioRef.current) {
      audioRef.current = new Audio(audioUrl);
      audioRef.current.addEventListener('ended', () => setIsPlaying(false));
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleSave = async () => {
    if (!audioBlob || !title.trim()) {
      toast.error('Please record audio and enter a title');
      return;
    }

    setIsUploading(true);
    try {
      // Upload the audio file — derive extension from actual MIME type
      const ext = audioBlob.type.includes('ogg') ? 'ogg'
        : audioBlob.type.includes('mp4') ? 'mp4'
        : audioBlob.type.includes('wav') ? 'wav'
        : 'webm';
      const formData = new FormData();
      formData.append('file', audioBlob, `voice-clip-${Date.now()}.${ext}`);

      const uploadResponse = await apiClient.post<{ url: string; size: number }>(
        '/upload/voice-clips',
        formData
      );

      // Create the voice clip record
      await createVoiceClip.mutateAsync({
        title: title.trim(),
        description: description.trim() || undefined,
        category,
        family_member_id: familyMemberId !== 'none' ? familyMemberId : undefined,
        audio_url: uploadResponse.data.url,
        duration_seconds: duration,
        file_size_bytes: uploadResponse.data.size,
      });

      toast.success('Voice clip saved!');
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to save voice clip:', error);
      toast.error('Failed to save voice clip');
    } finally {
      setIsUploading(false);
    }
  };

  const canSave = audioBlob && title.trim() && !isUploading && !createVoiceClip.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Record Voice Clip</DialogTitle>
          <DialogDescription>
            Record a voice message from a family member to save in your vault.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Recording Area */}
          <div className="flex flex-col items-center gap-4 p-6 bg-muted rounded-lg">
            {/* Recording State Display */}
            <div className="text-center">
              <div className="text-h3 font-mono font-bold">
                {formatDuration(duration)}
              </div>
              <div className="text-body-sm text-muted-foreground mt-1">
                {recordingState === 'idle' && 'Ready to record'}
                {recordingState === 'recording' && 'Recording...'}
                {recordingState === 'stopped' && 'Recording complete'}
              </div>
            </div>

            {/* Recording Controls */}
            <div className="flex items-center gap-3">
              {recordingState === 'idle' && (
                <Button
                  size="lg"
                  onClick={startRecording}
                  className="rounded-full h-16 w-16"
                >
                  <Mic className="h-6 w-6" />
                </Button>
              )}

              {recordingState === 'recording' && (
                <Button
                  size="lg"
                  variant="destructive"
                  onClick={stopRecording}
                  className="rounded-full h-16 w-16 animate-pulse"
                >
                  <Square className="h-6 w-6" />
                </Button>
              )}

              {recordingState === 'stopped' && (
                <>
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={handlePlayPause}
                    className="rounded-full h-12 w-12"
                  >
                    {isPlaying ? (
                      <Pause className="h-5 w-5" />
                    ) : (
                      <Play className="h-5 w-5" />
                    )}
                  </Button>
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={resetRecording}
                    className="rounded-full h-12 w-12"
                  >
                    <RotateCcw className="h-5 w-5" />
                  </Button>
                </>
              )}
            </div>

            {recordingError && (
              <p className="text-body-sm text-destructive">{recordingError}</p>
            )}
          </div>

          {/* Form Fields */}
          <div className="space-y-3">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Birthday wishes from Grandma"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="category">Category</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as VoiceClipCategoryType)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {familyMembers.length > 0 && (
              <div>
                <Label htmlFor="familyMember">From Family Member (optional)</Label>
                <Select value={familyMemberId} onValueChange={setFamilyMemberId}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select family member" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {familyMembers.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                placeholder="Add a note about this recording..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1"
                rows={2}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!canSave}>
            {isUploading || createVoiceClip.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
