/**
 * Voice Vault Page
 *
 * Manage voice recordings for family members.
 * All data from database - no hardcoding.
 */

import { useState, useRef, useCallback, useEffect } from 'react';
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
import { LoadingSpinner, EmptyState } from '@/components/shared';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Mic,
  Play,
  Pause,
  Star,
  Trash2,
  Filter,
  Heart,
  Clock,
  User,
  Plus,
} from 'lucide-react';
import { RecordVoiceClipDialog } from '@/components/dashboard/voice-vault';

type VoiceCategory = 'all' | 'encouragement' | 'praise' | 'celebration' | 'story' | 'memory' | 'greeting' | 'other';

const CATEGORY_INFO: Record<string, { label: string; color: string }> = {
  encouragement: { label: 'Encouragement', color: 'text-pink-500' },
  praise: { label: 'Praise', color: 'text-yellow-500' },
  celebration: { label: 'Celebration', color: 'text-purple-500' },
  story: { label: 'Story', color: 'text-blue-500' },
  memory: { label: 'Memory', color: 'text-green-500' },
  greeting: { label: 'Greeting', color: 'text-orange-500' },
  other: { label: 'Other', color: 'text-gray-500' },
};

export function VoiceVaultPage() {
  const { user } = useAuth();
  const { data: familyMembers = [] } = useFamilyMembers(user?.id);
  const [selectedFamilyMemberId, setSelectedFamilyMemberId] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<VoiceCategory>('all');
  const [showFavorites, setShowFavorites] = useState(false);
  const [playingClipId, setPlayingClipId] = useState<string | null>(null);
  const [playbackProgress, setPlaybackProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isRecordDialogOpen, setIsRecordDialogOpen] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const location = useLocation();

  // Stop audio on route change or unmount
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

  // Build filters
  const filters: VoiceClipFilters = {
    familyMemberId: selectedFamilyMemberId !== 'all' ? selectedFamilyMemberId : undefined,
    category: selectedCategory !== 'all' ? selectedCategory : undefined,
    favorite: showFavorites || undefined,
    limit: 50,
  };

  const { data: clipData, isLoading } = useVoiceClips(filters);
  const toggleFavorite = useToggleVoiceClipFavorite();
  const deleteClip = useDeleteVoiceClip();
  const recordPlay = useRecordVoiceClipPlay();

  const handleToggleFavorite = (id: string) => {
    toggleFavorite.mutate(id);
  };

  const handleDelete = (id: string) => {
    deleteClip.mutate(id);
  };

  const handlePlay = useCallback((id: string, audioUrl: string, totalSeconds: number) => {
    if (playingClipId === id) {
      audioRef.current?.pause();
      setPlayingClipId(null);
      setPlaybackProgress(0);
      setCurrentTime(0);
      return;
    }

    // Stop any currently playing audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    const fullUrl = getUploadUrl(audioUrl) || audioUrl;
    const audio = new Audio(fullUrl);
    audioRef.current = audio;

    // Use known duration from DB so progress works immediately
    // (webm files often report duration=Infinity until fully loaded)
    const knownDuration = totalSeconds || 1;

    audio.addEventListener('timeupdate', () => {
      // Guard against stale listeners from a previous audio instance
      if (audioRef.current !== audio) return;
      const effectiveDuration = (audio.duration && isFinite(audio.duration))
        ? audio.duration
        : knownDuration;
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

    // Set playing state BEFORE play() so ended/timeupdate have correct state
    setPlayingClipId(id);
    setPlaybackProgress(0);
    setCurrentTime(0);

    audio.play().then(() => {
      recordPlay.mutate(id);
    }).catch((err) => {
      console.error('Failed to play audio:', err);
      setPlayingClipId(null);
      setPlaybackProgress(0);
      setCurrentTime(0);
      audioRef.current = null;
    });
  }, [playingClipId, recordPlay]);

  const handleSeek = useCallback((e: React.MouseEvent<HTMLDivElement>, clipId: string) => {
    if (playingClipId !== clipId || !audioRef.current) return;
    const audio = audioRef.current;
    const effectiveDuration = (audio.duration && isFinite(audio.duration))
      ? audio.duration
      : null;
    if (!effectiveDuration) return;
    const bar = e.currentTarget;
    const rect = bar.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    audio.currentTime = percent * effectiveDuration;
  }, [playingClipId]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Voice Vault</h1>
          <p className="text-muted-foreground mt-1">
            Saved voice recordings from family members.
          </p>
        </div>

        <div className="flex gap-2">
          {familyMembers.length > 0 && (
            <Select value={selectedFamilyMemberId} onValueChange={setSelectedFamilyMemberId}>
              <SelectTrigger className="w-[150px]">
                <Filter className="h-4 w-4 mr-2" />
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
            variant={showFavorites ? 'default' : 'outline'}
            size="icon"
            onClick={() => setShowFavorites(!showFavorites)}
          >
            <Heart className={showFavorites ? 'fill-current' : ''} />
          </Button>

          <Button onClick={() => setIsRecordDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Record
          </Button>
        </div>
      </div>

      {/* Category Tabs */}
      <Tabs value={selectedCategory} onValueChange={(v) => setSelectedCategory(v as VoiceCategory)}>
        <TabsList className="flex-wrap">
          <TabsTrigger value="all" className="gap-2">
            <Mic className="h-4 w-4" />
            All
            {clipData && (
              <Badge variant="secondary" className="ml-1">
                {clipData.total}
              </Badge>
            )}
          </TabsTrigger>
          {Object.entries(CATEGORY_INFO).map(([key, info]) => (
            <TabsTrigger key={key} value={key} className="gap-2">
              <span className={info.color}>{info.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={selectedCategory} className="mt-6">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner />
            </div>
          ) : !clipData?.items.length ? (
            <Card>
              <CardContent className="py-12">
                <EmptyState
                  icon={Mic}
                  title="No voice clips"
                  description={
                    showFavorites
                      ? 'Mark voice clips as favorite to see them here.'
                      : 'Record voice messages from family members to save them here.'
                  }
                />
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {clipData.items.map((clip) => {
                const categoryInfo = CATEGORY_INFO[clip.category];
                const isPlaying = playingClipId === clip.id;

                return (
                  <Card key={clip.id} className="overflow-hidden">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className={`text-xs ${categoryInfo?.color}`}>
                            {categoryInfo?.label || clip.category}
                          </Badge>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleToggleFavorite(clip.id)}
                            disabled={toggleFavorite.isPending}
                          >
                            <Star
                              className={`h-4 w-4 ${
                                clip.is_favorite ? 'fill-yellow-400 text-yellow-400' : ''
                              }`}
                            />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete voice clip?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently delete "{clip.title}". This action cannot
                                  be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(clip.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                      <CardTitle className="text-base mt-2 line-clamp-1">
                        {clip.title}
                      </CardTitle>
                      {clip.family_member_name && (
                        <CardDescription className="text-xs flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {clip.family_member_name}
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent>
                      {/* Audio Player */}
                      <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                        <Button
                          variant="secondary"
                          size="icon"
                          className="h-10 w-10 rounded-full"
                          onClick={() => handlePlay(clip.id, clip.audio_url, clip.duration_seconds)}
                        >
                          {isPlaying ? (
                            <Pause className="h-5 w-5" />
                          ) : (
                            <Play className="h-5 w-5" />
                          )}
                        </Button>
                        <div
                          className="flex-1 cursor-pointer"
                          onClick={(e) => handleSeek(e, clip.id)}
                        >
                          <div className="h-2 bg-background rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full"
                              style={{ width: `${isPlaying ? playbackProgress : 0}%`, transition: 'width 0.1s linear' }}
                            />
                          </div>
                        </div>
                        <span className="text-xs text-muted-foreground tabular-nums">
                          {isPlaying
                            ? `${formatDuration(currentTime)} / ${formatDuration(clip.duration_seconds)}`
                            : formatDuration(clip.duration_seconds)}
                        </span>
                      </div>

                      {clip.description && (
                        <p className="text-sm text-muted-foreground mt-3 line-clamp-2">
                          {clip.description}
                        </p>
                      )}

                      {clip.tags && clip.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-3">
                          {clip.tags.slice(0, 3).map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {clip.tags.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{clip.tags.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}

                      <div className="flex items-center justify-between text-xs text-muted-foreground mt-3">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(clip.created_at).toLocaleDateString()}
                        </span>
                        <span>{clip.play_count} plays</span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Record Voice Clip Dialog */}
      <RecordVoiceClipDialog
        open={isRecordDialogOpen}
        onOpenChange={setIsRecordDialogOpen}
      />
    </div>
  );
}
