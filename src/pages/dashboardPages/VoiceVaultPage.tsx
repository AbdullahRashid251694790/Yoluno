/**
 * Family Voices Page
 *
 * Manage voice recordings for family members.
 * UI inspired by the loveable design — cards with waveforms, gold accent,
 * and a "what your child hears" preview.
 */

import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getUploadUrl } from '@/integrations/api/client';
import { useFamilyMembers } from '@/hooks/queries/useFamily';
import {
  useVoiceClips,
  useToggleVoiceClipFavorite,
  useDeleteVoiceClip,
  useRecordVoiceClipPlay,
  type VoiceClipFilters,
} from '@/hooks/queries/useVoiceVault';
import { LoadingSpinner } from '@/components/shared';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Mic,
  Play,
  Pause,
  Heart,
  MoreHorizontal,
  Download,
  Send,
  Trash2,
  Pencil,
} from 'lucide-react';
import { RecordVoiceClipDialog, SendRecordingLinkDialog, EditVoiceClipDialog } from '@/components/dashboard/voice-vault';
import type { VoiceClip } from '@/services/voiceVault';
import { cn } from '@/lib/utils';

type VoiceCategory = 'all' | 'encouragement' | 'praise' | 'celebration' | 'story' | 'memory' | 'greeting' | 'message' | 'other';

// Original category tabs — all backend categories preserved
const CATEGORY_TABS: { value: VoiceCategory; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'encouragement', label: 'Encouragement' },
  { value: 'praise', label: 'Praise' },
  { value: 'celebration', label: 'Celebration' },
  { value: 'story', label: 'Story' },
  { value: 'memory', label: 'Memory' },
  { value: 'greeting', label: 'Greeting' },
  { value: 'message', label: 'Message' },
  { value: 'other', label: 'Other' },
];

const CATEGORY_PILL_LABEL: Record<string, string> = {
  encouragement: 'Encouragement',
  praise: 'Praise',
  celebration: 'Celebration',
  story: 'Story',
  memory: 'Memory',
  greeting: 'Greeting',
  message: 'Message',
  other: 'Other',
};

// Deterministic waveform based on a clip id
function Waveform({ active, seed }: { active?: boolean; seed: string }) {
  const bars = useMemo(() => {
    const hash = seed.split('').reduce((h, c) => h * 31 + c.charCodeAt(0), 7);
    return Array.from({ length: 40 }).map((_, i) => {
      const v = Math.sin(i * 0.4 + hash * 0.01) * 10 + ((hash >> i) & 7) + 4;
      return Math.abs(v);
    });
  }, [seed]);

  return (
    <svg viewBox="0 0 200 32" className="w-full h-8" preserveAspectRatio="none">
      {bars.map((h, i) => (
        <rect
          key={i}
          x={i * 5}
          y={16 - h / 2}
          width={3}
          height={h}
          rx={1.5}
          fill={active ? 'hsl(var(--gold))' : 'hsl(var(--border))'}
        />
      ))}
    </svg>
  );
}

export function VoiceVaultPage() {
  const { user } = useAuth();
  const { data: familyMembers = [] } = useFamilyMembers(user?.id);
  const [selectedFamilyMemberId, setSelectedFamilyMemberId] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<VoiceCategory>('all');
  const [playingClipId, setPlayingClipId] = useState<string | null>(null);
  const [playbackProgress, setPlaybackProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isRecordDialogOpen, setIsRecordDialogOpen] = useState(false);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [editingClip, setEditingClip] = useState<VoiceClip | null>(null);
  const [deletingClip, setDeletingClip] = useState<VoiceClip | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const location = useLocation();

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
        audioRef.current = null;
      }
      setPlayingClipId(null);
      setPlaybackProgress(0);
      setCurrentTime(0);
    };
  }, [location.pathname]);

  // Fetch all clips for the selected family member (filter client-side by tab)
  const filters: VoiceClipFilters = {
    familyMemberId: selectedFamilyMemberId !== 'all' ? selectedFamilyMemberId : undefined,
    limit: 100,
  };

  const { data: clipData, isLoading } = useVoiceClips(filters);
  const toggleFavorite = useToggleVoiceClipFavorite();
  const deleteClip = useDeleteVoiceClip();
  const recordPlay = useRecordVoiceClipPlay();

  // Filter by tab client-side
  const allClips = clipData?.items || [];
  const filteredClips = useMemo(() => {
    if (activeTab === 'all') return allClips;
    return allClips.filter((c) => c.category === activeTab);
  }, [allClips, activeTab]);


  const handlePlay = useCallback(
    (id: string, audioUrl: string, totalSecondsForClip: number) => {
      if (playingClipId === id) {
        audioRef.current?.pause();
        setPlayingClipId(null);
        setPlaybackProgress(0);
        setCurrentTime(0);
        return;
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      const fullUrl = getUploadUrl(audioUrl) || audioUrl;
      const audio = new Audio(fullUrl);
      audioRef.current = audio;
      const knownDuration = totalSecondsForClip || 1;

      audio.addEventListener('timeupdate', () => {
        if (audioRef.current !== audio) return;
        const effectiveDuration = audio.duration && isFinite(audio.duration) ? audio.duration : knownDuration;
        setPlaybackProgress((audio.currentTime / effectiveDuration) * 100);
        setCurrentTime(Math.floor(audio.currentTime));
      });

      audio.addEventListener('ended', () => {
        if (audioRef.current !== audio) return;
        setPlayingClipId(null);
        setPlaybackProgress(0);
        setCurrentTime(0);
        audioRef.current = null;
      });

      setPlayingClipId(id);
      setPlaybackProgress(0);
      setCurrentTime(0);
      audio.play().then(() => recordPlay.mutate(id)).catch(() => {
        setPlayingClipId(null);
        setPlaybackProgress(0);
        setCurrentTime(0);
        audioRef.current = null;
      });
    },
    [playingClipId, recordPlay]
  );

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins === 0) return `${secs} sec`;
    return `${mins} min ${secs} sec`;
  };

  const handleDownload = async (audioUrl: string, title: string) => {
    const fullUrl = getUploadUrl(audioUrl) || audioUrl;
    try {
      const res = await fetch(fullUrl);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title}.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download failed', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-h3 font-bold text-foreground">Family Voices</h1>
          <p className="text-muted-foreground mt-1 max-w-xl">
            Record the voices your child loves most. Bedtime stories, family memories, lullabies,
            and messages — saved here and available to your child through Loti.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {familyMembers.length > 0 && (
            <Select value={selectedFamilyMemberId} onValueChange={setSelectedFamilyMemberId}>
              <SelectTrigger className="w-[170px]">
                <SelectValue placeholder="All members" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All members</SelectItem>
                {familyMembers.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Button
            onClick={() => setIsRecordDialogOpen(true)}
            className="gap-2 bg-gold text-white hover:bg-gold/90 rounded-full"
          >
            <Mic className="h-4 w-4" />
            Record
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="overflow-x-auto -mx-1 px-1 scrollbar-hide">
        <div className="inline-flex items-center gap-1 p-1 rounded-full bg-muted/50 whitespace-nowrap">
          {CATEGORY_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={cn(
                'px-4 py-1.5 rounded-full text-body-sm font-medium transition whitespace-nowrap',
                activeTab === tab.value
                  ? 'bg-gold text-white shadow-sm'
                  : 'text-muted-foreground hover:text-gold'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Invite banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-gold/10 border border-gold/20">
        <div>
          <p className="text-body-sm font-semibold text-foreground">
            Family members can record from anywhere
          </p>
          <p className="text-caption text-muted-foreground mt-0.5">
            Share a link — they can record without a Yoluno account.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => setIsInviteDialogOpen(true)}
          className="gap-2 border-2 border-gold text-gold hover:bg-gold/10 hover:text-gold rounded-full"
        >
          <Send className="h-3.5 w-3.5" />
          Send Recording Link
        </Button>
      </div>

      {/* Recording cards */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : filteredClips.length === 0 ? (
        <div className="text-center py-20 max-w-xl mx-auto">
          <div className="flex items-center justify-center w-28 h-28 rounded-full bg-gold/10 mx-auto mb-6">
            <Mic className="h-12 w-12 text-gold" />
          </div>
          <h2 className="text-h4 font-bold text-foreground mb-2">
            Your family's voices belong here
          </h2>
          <p className="text-muted-foreground mb-8">
            Record a bedtime story. Sing a favourite lullaby. Share a memory from when you were young.
            Your child can listen anytime through Loti.
          </p>
          <Button
            onClick={() => setIsRecordDialogOpen(true)}
            className="gap-2 bg-gold text-white hover:bg-gold/90 rounded-full px-8 h-12"
          >
            <Mic className="h-4 w-4" />
            Record Your First Voice Message
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredClips.map((clip) => {
            const isPlaying = playingClipId === clip.id;
            const isFav = clip.is_favorite;
            const pillLabel = CATEGORY_PILL_LABEL[clip.category] || 'Voice';
            const dateLabel = new Date(clip.created_at).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            });

            return (
              <Card
                key={clip.id}
                className="bg-white border border-border border-l-[4px] border-l-gold p-6 transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <CardContent className="p-0">
                  {/* Waveform */}
                  <div className="mb-4 cursor-pointer" onClick={() => handlePlay(clip.id, clip.audio_url, clip.duration_seconds)}>
                    <Waveform active={isPlaying} seed={clip.id} />
                    {isPlaying && (
                      <div className="h-1 bg-muted rounded-full overflow-hidden mt-1">
                        <div
                          className="h-full bg-gold transition-all"
                          style={{ width: `${playbackProgress}%` }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Play + info */}
                  <div className="flex items-start gap-4">
                    <button
                      onClick={() => handlePlay(clip.id, clip.audio_url, clip.duration_seconds)}
                      className="flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-full bg-gold text-white hover:scale-105 transition shadow-sm"
                    >
                      {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-body font-semibold text-foreground truncate">
                          {clip.title}
                        </h3>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            onClick={() => toggleFavorite.mutate(clip.id)}
                            className="p-1 transition hover:scale-110"
                          >
                            <Heart
                              className={cn(
                                'h-4 w-4 text-gold',
                                isFav && 'fill-gold'
                              )}
                            />
                          </button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button className="p-1 rounded-full hover:bg-muted transition">
                                <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setEditingClip(clip)}>
                                <Pencil className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => setDeletingClip(clip)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>

                      {clip.family_member_name ? (
                        <p className="text-caption text-muted-foreground mt-1">
                          Recorded by {clip.family_member_name}
                        </p>
                      ) : clip.description ? (
                        <p className="text-caption text-muted-foreground mt-1 line-clamp-1">
                          {clip.description}
                        </p>
                      ) : null}

                      <div className="flex items-center gap-3 mt-3 flex-wrap">
                        <span className="text-caption text-muted-foreground">
                          {formatDuration(clip.duration_seconds)} · {dateLabel}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-gold/10 text-gold">
                          {pillLabel}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 mt-3">
                        <Button
                          variant="outline"
                          size="sm"
                          className="!h-8 gap-1.5 rounded-lg"
                          onClick={() => handleDownload(clip.audio_url, clip.title)}
                        >
                          <Download className="h-3 w-3" />
                          Download
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <RecordVoiceClipDialog open={isRecordDialogOpen} onOpenChange={setIsRecordDialogOpen} />
      <SendRecordingLinkDialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen} />
      <EditVoiceClipDialog
        clip={editingClip}
        open={!!editingClip}
        onOpenChange={(open) => !open && setEditingClip(null)}
      />
      <AlertDialog open={!!deletingClip} onOpenChange={(open) => !open && setDeletingClip(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete voice clip?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{deletingClip?.title}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deletingClip) deleteClip.mutate(deletingClip.id);
                setDeletingClip(null);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
