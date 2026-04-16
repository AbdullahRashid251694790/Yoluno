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

// Tabs matching loveable: All, Stories, Messages, Songs
const CATEGORY_TABS = ['All', 'Stories', 'Messages', 'Songs'] as const;
type CategoryTab = typeof CATEGORY_TABS[number];

// Map each loveable tab to the backend categories it includes
const TAB_TO_CATEGORIES: Record<CategoryTab, VoiceCategory[]> = {
  All: [],
  Stories: ['story', 'memory'],
  Messages: ['message', 'encouragement', 'praise', 'greeting'],
  Songs: ['celebration', 'other'],
};

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
  const [activeTab, setActiveTab] = useState<CategoryTab>('All');
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
    if (activeTab === 'All') return allClips;
    const cats = TAB_TO_CATEGORIES[activeTab];
    return allClips.filter((c) => cats.includes(c.category as VoiceCategory));
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

  const totalRecordings = allClips.length;
  const totalDurationSec = allClips.reduce((sum, c) => sum + (c.duration_seconds || 0), 0);
  const totalDurationLabel = totalDurationSec >= 60
    ? `${Math.floor(totalDurationSec / 60)} minutes`
    : `${totalDurationSec} seconds`;
  const uniqueMembers = new Set(allClips.map((c) => c.family_member_name).filter(Boolean)).size;

  return (
    <div style={{ fontFamily: "'DM Sans', 'Segoe UI', sans-serif" }}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-[28px] mb-1" style={{ fontWeight: 600, color: '#2A2926' }}>
            Family Voices
          </h1>
          <p className="text-[15px] max-w-xl" style={{ color: '#6B675E' }}>
            Record the voices your child loves most. Bedtime stories, family memories,
            lullabies, and messages — saved here and available to your child through Loti.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="relative">
            <select
              value={selectedFamilyMemberId}
              onChange={(e) => setSelectedFamilyMemberId(e.target.value)}
              className="appearance-none pr-8 pl-4 py-2 rounded-lg text-[13px] border cursor-pointer"
              style={{ background: '#FFFFFF', borderColor: '#E8E6E1', color: '#6B675E' }}
            >
              <option value="all">All members</option>
              {familyMembers.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#9B978E' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6"/></svg>
            </span>
          </div>
          <button
            onClick={() => setIsRecordDialogOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full text-white text-[14px] transition hover:-translate-y-0.5"
            style={{ background: '#D4A843', fontWeight: 600 }}
          >
            <Mic size={16} /> Record
          </button>
        </div>
      </div>

      {/* Tabs + stats */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div className="flex gap-1 p-1 rounded-xl" style={{ background: '#F5F3EE' }}>
          {CATEGORY_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="px-4 py-2 rounded-lg text-[13px] transition whitespace-nowrap"
              style={{
                fontWeight: activeTab === tab ? 600 : 400,
                background: activeTab === tab ? '#FFFFFF' : 'transparent',
                color: activeTab === tab ? '#2A2926' : '#9B978E',
                boxShadow: activeTab === tab ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
              }}
            >
              {tab}
            </button>
          ))}
        </div>
        <p className="text-[13px]" style={{ color: '#9B978E' }}>
          {totalRecordings} recordings · {totalDurationLabel} of family voices · {uniqueMembers} family members
        </p>
      </div>

      {/* Invite banner */}
      <div
        className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl mb-6"
        style={{ background: '#FDF6E8' }}
      >
        <div>
          <p className="text-[14px]" style={{ fontWeight: 600, color: '#2A2926' }}>
            Family members can record from anywhere
          </p>
          <p className="text-[13px] mt-0.5" style={{ color: '#6B675E' }}>
            Share a link — they can record without a Yoluno account.
          </p>
        </div>
        <button
          onClick={() => setIsInviteDialogOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-full text-[13px] transition hover:bg-amber-50 mt-3 sm:mt-0"
          style={{ border: '2px solid #D4A843', color: '#D4A843', fontWeight: 600, background: 'transparent' }}
        >
          <Send size={14} /> Send Recording Link
        </button>
      </div>

      {/* Recording cards */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : filteredClips.length === 0 ? (
        <div className="text-center py-20 max-w-xl mx-auto">
          <div
            className="flex items-center justify-center rounded-full mx-auto mb-6"
            style={{ width: 120, height: 120, background: '#FDF6E8' }}
          >
            <Mic size={48} style={{ color: '#D4A843' }} />
          </div>
          <h2 className="text-[28px] mb-4" style={{ fontFamily: "'DM Serif Display', serif", fontWeight: 600, color: '#2A2926' }}>
            Your family's voices belong here
          </h2>
          <p className="text-[16px] mb-10" style={{ color: '#6B675E', lineHeight: 1.7 }}>
            Record a bedtime story. Sing a favourite lullaby. Share a memory from when you were young.
            Your child can listen anytime through Loti.
          </p>
          <button
            onClick={() => setIsRecordDialogOpen(true)}
            className="px-8 py-3.5 rounded-full text-white text-[15px] transition hover:-translate-y-0.5 hover:shadow-lg mb-4"
            style={{ background: '#D4A843', fontWeight: 600 }}
          >
            Record Your First Voice Message
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-10">
          {filteredClips.map((clip) => {
            const isPlaying = playingClipId === clip.id;
            const isFav = clip.is_favorite;
            const pillLabel =
              clip.category === 'story' || clip.category === 'memory' ? 'Story'
              : clip.category === 'celebration' || clip.category === 'other' ? 'Song'
              : 'Message';
            const dateLabel = new Date(clip.created_at).toLocaleDateString(undefined, {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            });

            return (
              <div
                key={clip.id}
                className="rounded-2xl p-6 transition hover:-translate-y-0.5 hover:shadow-md"
                style={{ background: '#FFFFFF', border: '1px solid #E8E6E1', borderLeft: '4px solid #D4A843' }}
              >
                {/* Waveform */}
                <div className="mb-4 cursor-pointer" onClick={() => handlePlay(clip.id, clip.audio_url, clip.duration_seconds)}>
                  <Waveform active={isPlaying} seed={clip.id} />
                  {isPlaying && (
                    <div className="h-1 rounded-full overflow-hidden mt-1" style={{ background: '#F5F3EE' }}>
                      <div
                        className="h-full transition-all"
                        style={{ width: `${playbackProgress}%`, background: '#D4A843' }}
                      />
                    </div>
                  )}
                </div>

                {/* Play + info */}
                <div className="flex items-start gap-4">
                  <button
                    onClick={() => handlePlay(clip.id, clip.audio_url, clip.duration_seconds)}
                    className="flex-shrink-0 flex items-center justify-center rounded-full transition hover:scale-105"
                    style={{ width: 48, height: 48, background: '#D4A843' }}
                  >
                    {isPlaying ? <Pause size={20} color="white" /> : <Play size={20} color="white" style={{ marginLeft: 2 }} />}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-[16px] truncate" style={{ fontWeight: 600, color: '#2A2926' }}>
                        {clip.title}
                      </h3>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button
                          onClick={() => toggleFavorite.mutate(clip.id)}
                          className="p-1 transition hover:scale-110"
                        >
                          <Heart
                            size={16}
                            fill={isFav ? '#D4A843' : 'none'}
                            style={{ color: '#D4A843' }}
                          />
                        </button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="p-1 rounded-full hover:bg-gray-100 transition">
                              <MoreHorizontal size={16} style={{ color: '#9B978E' }} />
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

                    <p className="text-[13px] mt-0.5" style={{ color: '#9B978E' }}>
                      {clip.family_member_name
                        ? `Recorded by ${clip.family_member_name}`
                        : clip.description || 'Voice recording'}
                    </p>

                    <div className="flex items-center gap-3 mt-3 flex-wrap">
                      <span className="text-[12px]" style={{ color: '#9B978E' }}>
                        {formatDuration(clip.duration_seconds)} · {dateLabel}
                      </span>
                      <span
                        className="px-2.5 py-0.5 rounded-full text-[11px]"
                        style={{ background: '#FDF6E8', color: '#D4A843', fontWeight: 600 }}
                      >
                        {pillLabel}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mt-3">
                      <button
                        onClick={() => handleDownload(clip.audio_url, clip.title)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] transition hover:bg-gray-50"
                        style={{ border: '1px solid #E8E6E1', color: '#6B675E', fontWeight: 500 }}
                      >
                        <Download size={12} /> Download
                      </button>
                    </div>
                  </div>
                </div>
              </div>
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
