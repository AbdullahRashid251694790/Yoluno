/**
 * Record For Family Page
 *
 * Public page accessible via an invite token — lets a non-user (grandparent,
 * aunt, etc.) record a voice message that lands in a parent's voice vault.
 * No authentication required.
 */

import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
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
import { Loader2, Mic, Square, Play, Pause, Send, Heart, RotateCcw, Check } from 'lucide-react';
import { toast } from 'sonner';
import { apiClient } from '@/integrations/api/client';
import lotiAvatar from '@/assets/landing/loti.png';

const CATEGORIES = [
  { value: 'encouragement', label: 'Encouragement' },
  { value: 'praise', label: 'Praise' },
  { value: 'celebration', label: 'Celebration' },
  { value: 'story', label: 'Story' },
  { value: 'memory', label: 'Memory' },
  { value: 'greeting', label: 'Greeting' },
  { value: 'message', label: 'Message' },
  { value: 'other', label: 'Other' },
];

type Status = 'loading' | 'ready' | 'invalid' | 'submitted';

interface FamilyMember {
  id: string;
  name: string;
  relationship: string;
  photo_url: string | null;
}

const OTHER_VALUE = '__other__';

export default function RecordForFamilyPage() {
  const { token } = useParams<{ token: string }>();
  const [status, setStatus] = useState<Status>('loading');
  const [parentName, setParentName] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);

  const [title, setTitle] = useState('');
  const [familyMemberId, setFamilyMemberId] = useState<string>('');
  const [recordedBy, setRecordedBy] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('message');
  const [submitting, setSubmitting] = useState(false);
  const [playing, setPlaying] = useState(false);
  const audioElRef = useRef<HTMLAudioElement | null>(null);

  const recorder = useAudioRecorder({ maxDuration: 5 * 60 * 1000 });

  // Verify invite on mount
  useEffect(() => {
    if (!token) {
      setStatus('invalid');
      setErrorMessage('Invalid link');
      return;
    }
    apiClient
      .get<{
        parent_name: string;
        uses_remaining: number;
        family_members: FamilyMember[];
      }>(`/invite/${token}`)
      .then(({ data }) => {
        setParentName(data.parent_name || 'their family');
        setFamilyMembers(data.family_members || []);
        setStatus('ready');
      })
      .catch((err) => {
        const msg =
          err?.response?.data?.error ||
          err?.response?.data?.message ||
          err?.message ||
          'Invalid or expired link';
        setErrorMessage(msg);
        setStatus('invalid');
      });
  }, [token]);

  const handlePlayToggle = () => {
    if (!recorder.audioUrl) return;
    if (playing) {
      audioElRef.current?.pause();
      setPlaying(false);
      return;
    }
    const audio = new Audio(recorder.audioUrl);
    audio.addEventListener('ended', () => setPlaying(false));
    audio.play();
    audioElRef.current = audio;
    setPlaying(true);
  };

  const handleSubmit = async () => {
    if (!recorder.audioBlob || !title.trim() || !token) return;
    setSubmitting(true);
    try {
      const formData = new FormData();
      const ext = recorder.audioBlob.type.includes('webm') ? '.webm' : '.mp4';
      formData.append('audio', recorder.audioBlob, `recording${ext}`);
      formData.append('title', title.trim());
      formData.append('category', category);
      if (description.trim()) formData.append('description', description.trim());
      // Either link to a known family member or send a free-text name
      if (familyMemberId && familyMemberId !== OTHER_VALUE) {
        formData.append('family_member_id', familyMemberId);
      } else if (recordedBy.trim()) {
        formData.append('recorded_by', recordedBy.trim());
      }
      formData.append('duration_seconds', String(recorder.duration));

      await apiClient.post(`/invite/${token}/record`, formData);
      setStatus('submitted');
    } catch (err: any) {
      const msg =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        'Failed to submit recording';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // ────────────────────────────── UI ──────────────────────────────

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAF7]">
        <Loader2 className="h-8 w-8 animate-spin text-gold" />
      </div>
    );
  }

  if (status === 'invalid') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-[#FAFAF7]">
        <div className="max-w-md text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-destructive/10 flex items-center justify-center">
            <Heart className="h-10 w-10 text-destructive" />
          </div>
          <h1 className="text-h3 font-bold text-foreground mb-3">Link not available</h1>
          <p className="text-muted-foreground">{errorMessage}</p>
          <p className="text-caption text-muted-foreground/70 mt-6">
            Please ask whoever shared the link with you for a new one.
          </p>
        </div>
      </div>
    );
  }

  if (status === 'submitted') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-[#FAFAF7]">
        <div className="max-w-md text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gold/10 flex items-center justify-center">
            <Check className="h-10 w-10 text-gold" />
          </div>
          <h1 className="text-h3 font-bold text-foreground mb-3">Thank you! 💛</h1>
          <p className="text-muted-foreground leading-relaxed">
            Your recording has been saved. It will now appear in {parentName}'s Family Voices.
          </p>
          <Button
            className="mt-8 bg-gold text-white hover:bg-gold/90 rounded-full"
            onClick={() => {
              recorder.reset();
              setTitle('');
              setFamilyMemberId('');
              setRecordedBy('');
              setDescription('');
              setCategory('message');
              setStatus('ready');
            }}
          >
            Record another
          </Button>
        </div>
      </div>
    );
  }

  // Main ready state
  return (
    <div className="min-h-screen bg-[#FAFAF7] py-10 px-4">
      <div className="max-w-xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <img src={lotiAvatar} alt="Loti" className="w-20 h-20 mx-auto mb-4" />
          <h1 className="text-h3 font-bold text-foreground mb-2">A gift for a little one</h1>
          <p className="text-muted-foreground leading-relaxed">
            {parentName} has invited you to record a voice message for their family. Record a
            story, a song, a memory, or a sweet message — whatever feels right.
          </p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl border border-border shadow-sm p-6 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="e.g., Grandma's bedtime story"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={100}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="whoIsRecording">Who is recording?</Label>
            {familyMembers.length > 0 ? (
              <>
                <Select value={familyMemberId} onValueChange={setFamilyMemberId}>
                  <SelectTrigger id="whoIsRecording">
                    <SelectValue placeholder="Select yourself from the family" />
                  </SelectTrigger>
                  <SelectContent>
                    {familyMembers.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.name}
                        {m.relationship ? ` — ${m.relationship}` : ''}
                      </SelectItem>
                    ))}
                    <SelectItem value={OTHER_VALUE}>Someone else…</SelectItem>
                  </SelectContent>
                </Select>
                {familyMemberId === OTHER_VALUE && (
                  <Input
                    id="recordedBy"
                    className="mt-2"
                    placeholder="Your name (e.g., Grandma Rosa)"
                    value={recordedBy}
                    onChange={(e) => setRecordedBy(e.target.value)}
                    maxLength={80}
                  />
                )}
                <p className="text-caption text-muted-foreground">
                  Picking your name helps the kids know who the message is from.
                </p>
              </>
            ) : (
              <Input
                id="recordedBy"
                placeholder="e.g., Grandma Rosa"
                value={recordedBy}
                onChange={(e) => setRecordedBy(e.target.value)}
                maxLength={80}
              />
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Type of recording</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">A note (optional)</Label>
            <Textarea
              id="description"
              placeholder="Anything you'd like to add…"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          {/* Recorder */}
          <div className="rounded-xl bg-gold/5 border border-gold/20 p-5 flex flex-col items-center gap-3">
            {recorder.error && (
              <p className="text-destructive text-caption text-center">{recorder.error}</p>
            )}
            {!recorder.audioBlob ? (
              <>
                {recorder.isRecording ? (
                  <>
                    <div className="flex items-center gap-2 text-destructive">
                      <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75" />
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-destructive" />
                      </span>
                      <span className="font-mono text-body-lg font-semibold">
                        {formatDuration(recorder.duration)}
                      </span>
                    </div>
                    <Button
                      onClick={recorder.stopRecording}
                      className="rounded-full w-16 h-16 bg-destructive hover:bg-destructive/90 text-white"
                    >
                      <Square className="h-6 w-6" />
                    </Button>
                    <p className="text-caption text-muted-foreground">Tap to stop</p>
                  </>
                ) : (
                  <>
                    <Button
                      onClick={recorder.startRecording}
                      className="rounded-full w-16 h-16 bg-gold hover:bg-gold/90 text-white"
                    >
                      <Mic className="h-6 w-6" />
                    </Button>
                    <p className="text-caption text-muted-foreground">
                      Tap to record (up to 5 minutes)
                    </p>
                  </>
                )}
              </>
            ) : (
              <>
                <div className="flex items-center gap-3">
                  <Button
                    onClick={handlePlayToggle}
                    variant="outline"
                    className="rounded-full w-12 h-12 border-gold text-gold hover:bg-gold/10"
                  >
                    {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                  </Button>
                  <span className="font-mono text-body-lg">
                    {formatDuration(recorder.duration)}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (playing) {
                      audioElRef.current?.pause();
                      setPlaying(false);
                    }
                    recorder.reset();
                  }}
                  className="gap-2 text-muted-foreground"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Re-record
                </Button>
              </>
            )}
          </div>

          <Button
            onClick={handleSubmit}
            disabled={!recorder.audioBlob || !title.trim() || submitting}
            className="w-full bg-gold hover:bg-gold/90 text-white rounded-full h-12 gap-2"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Send Recording
              </>
            )}
          </Button>
        </div>

        <p className="text-center text-caption text-muted-foreground mt-6">
          Powered by <span className="font-semibold text-gold">Yoluno</span> — a safe world for kids
        </p>
      </div>
    </div>
  );
}
