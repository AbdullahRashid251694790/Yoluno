/**
 * Family Member Detail Modal
 *
 * Kid-friendly, scrollable detail card for family members.
 * Shows photo, name, relationship, multiple stories, hobbies, and video carousel.
 */

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { apiClient, getUploadUrl } from '@/integrations/api/client';
import { cn } from '@/lib/utils';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import type { FamilyMemberRow } from '@/types/database';
import type { ChildProfileRow as ChildProfile } from '@/types/database';
import type { RelationType } from './FamilyMemberCard';

interface FamilyMemberDetailProps {
  member: FamilyMemberRow | ChildProfile | null;
  type: RelationType;
  isOpen: boolean;
  onClose: () => void;
}

const THEME: Record<RelationType, { emoji: string; bg: string; accent: string; badge: string }> = {
  self:       { emoji: '💖', bg: 'from-lolo/10 via-primary/10 to-lolo/10',    accent: 'text-lolo',   badge: 'bg-lolo/10 text-lolo' },
  parent:     { emoji: '👑', bg: 'from-gold/20 via-gold/10 to-gold/5',  accent: 'text-gold',  badge: 'bg-gold/10 text-gold' },
  sibling:    { emoji: '🎯', bg: 'from-primary/20 via-primary/10 to-primary/5',      accent: 'text-primary',   badge: 'bg-primary/10 text-primary' },
  grandparent:{ emoji: '🏠', bg: 'from-primary/20 via-primary/10 to-primary/10',accent: 'text-primary', badge: 'bg-primary/10 text-primary' },
  aunt_uncle: { emoji: '🎁', bg: 'from-primary/10 via-primary/10 to-primary/10',    accent: 'text-primary',   badge: 'bg-primary/10 text-primary' },
  cousin:     { emoji: '🎮', bg: 'from-primary via-primary/10 to-primary/5', accent: 'text-primary',  badge: 'bg-primary/10 text-primary' },
  other:      { emoji: '⭐', bg: 'from-muted via-secondary to-muted',     accent: 'text-muted-foreground',   badge: 'bg-muted text-foreground/70' },
};

function isFamilyMember(member: FamilyMemberRow | ChildProfile): member is FamilyMemberRow {
  return 'relationship' in member;
}

export function FamilyMemberDetail({ member, type, isOpen, onClose }: FamilyMemberDetailProps) {
  if (!member) return null;

  const theme = THEME[type];
  const name = member.name;

  // Resolve avatar
  let avatarUrl: string | undefined;
  if (isFamilyMember(member)) {
    avatarUrl = member.photo_url ? getUploadUrl(member.photo_url) : undefined;
  } else {
    const child = member as ChildProfile & { avatarUrl?: string };
    const url = child.avatarUrl || child.custom_avatar_url;
    avatarUrl = url ? (url.startsWith('http') ? url : getUploadUrl(url)) : undefined;
  }

  const relationship = isFamilyMember(member) ? member.relationship : null;
  const connectionDescription = isFamilyMember(member) ? member.connection_description : null;
  const occupation = isFamilyMember(member) ? member.occupation : null;
  const hobbies = isFamilyMember(member) ? (member.hobbies || []) : ((member as any).interests || []);
  const isAlive = isFamilyMember(member) ? member.is_alive !== false : true;

  // Child profile extras
  const age = !isFamilyMember(member) ? (member as any).age : null;
  const gender = !isFamilyMember(member) ? (member as any).gender : null;

  // Fetch multiple videos, stories, and photos for family members
  const [videos, setVideos] = useState<{ id: string; video_url: string; title: string | null; created_at: string }[]>([]);
  const [stories, setStories] = useState<{ id: string; content: string; created_at: string }[]>([]);
  const [photos, setPhotos] = useState<{ id: string; photo_url: string; caption: string | null; created_at: string }[]>([]);
  const [videoIndex, setVideoIndex] = useState(0);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [storyIndex, setStoryIndex] = useState(0);

  useEffect(() => {
    if (isOpen && isFamilyMember(member)) {
      apiClient.get(`/family/members/${member.id}/videos`).then((r) => {
        setVideos(r.data || []);
        setVideoIndex(0);
      }).catch(() => setVideos([]));
      apiClient.get(`/family/members/${member.id}/stories`).then((r) => {
        setStories(r.data || []);
        setStoryIndex(0);
      }).catch(() => setStories([]));
      apiClient.get(`/family/members/${member.id}/photos`).then((r) => {
        setPhotos(r.data || []);
        setPhotoIndex(0);
      }).catch(() => setPhotos([]));
    } else {
      setVideos([]);
      setStories([]);
      setPhotos([]);
      setVideoIndex(0);
      setPhotoIndex(0);
      setStoryIndex(0);
    }
  }, [isOpen, member]);

  // Fallback: use old single fun_facts if no stories in new table
  const funFacts = isFamilyMember(member) ? member.fun_facts : null;
  const allStories = stories.length > 0 ? stories : (funFacts ? [{ id: 'legacy', content: funFacts, created_at: '' }] : []);

  const hasDetails = connectionDescription || occupation || (hobbies && hobbies.length > 0) || allStories.length > 0 || videos.length > 0 || photos.length > 0 || age;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="max-w-sm mx-auto rounded-3xl border-0 p-0 overflow-hidden [&>button:last-child]:hidden"
      >
        {/* Scrollable container */}
        <div className="max-h-[85vh] overflow-y-auto scrollbar-hide">

          {/* Hero header with gradient */}
          <div className={cn('relative pt-12 pb-6 px-6 bg-gradient-to-b', theme.bg)}>
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute right-4 top-4 z-10 w-8 h-8 rounded-full bg-white/70 hover:bg-white flex items-center justify-center transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Avatar */}
            <div className="flex flex-col items-center">
              <div className="relative">
                <div className="w-28 h-28 rounded-full border-4 border-white shadow-lg overflow-hidden bg-white">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-h2 font-bold text-muted-foreground/30">
                      {name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <span className="absolute -bottom-1 -right-1 text-h4 bg-white rounded-full p-1.5 shadow-md">
                  {theme.emoji}
                </span>
              </div>

              {/* Name */}
              <h2 className="mt-4 text-h4 font-display font-bold text-center text-foreground">
                {name}
              </h2>

              {/* Relationship badge */}
              {(connectionDescription || relationship) && (
                <span className={cn('mt-2 px-4 py-1 rounded-full text-body-sm font-semibold', theme.badge)}>
                  {connectionDescription || relationship}
                </span>
              )}

              {!isAlive && (
                <p className="mt-2 text-body-sm text-muted-foreground">Remembered with love 💕</p>
              )}
            </div>
          </div>

          {/* Details cards */}
          {hasDetails && (
            <div className="px-5 py-4 space-y-3">

              {/* Age & Gender (for siblings/self) */}
              {age && (
                <div className="flex items-center gap-3 bg-white rounded-2xl p-4 shadow-sm">
                  <span className="text-h4">🎂</span>
                  <div>
                    <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Age</p>
                    <p className="text-body-sm font-medium text-foreground">
                      {age} years old {gender === 'boy' ? '👦' : gender === 'girl' ? '👧' : ''}
                    </p>
                  </div>
                </div>
              )}

              {/* Occupation */}
              {occupation && (
                <div className="flex items-center gap-3 bg-white rounded-2xl p-4 shadow-sm">
                  <span className="text-h4">💼</span>
                  <div>
                    <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Works as</p>
                    <p className="text-body-sm font-medium text-foreground">{occupation}</p>
                  </div>
                </div>
              )}

              {/* Hobbies */}
              {hobbies && hobbies.length > 0 && (
                <div className="bg-white rounded-2xl p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-h4">🌟</span>
                    <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Loves</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {hobbies.map((hobby, i) => (
                      <span
                        key={i}
                        className={cn(
                          'px-3 py-1.5 rounded-full text-caption font-semibold',
                          theme.badge
                        )}
                      >
                        {hobby}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Photo Carousel */}
              {photos.length > 0 && (
                <div className="bg-white rounded-2xl p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-h4">📸</span>
                      <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                        {photos.length === 1 ? 'Photo' : `Photos (${photoIndex + 1}/${photos.length})`}
                      </p>
                    </div>
                    {photos.length > 1 && (
                      <div className="flex gap-1">
                        <button
                          onClick={() => setPhotoIndex((i) => (i - 1 + photos.length) % photos.length)}
                          className="w-7 h-7 rounded-full bg-muted flex items-center justify-center hover:bg-muted-foreground/20"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setPhotoIndex((i) => (i + 1) % photos.length)}
                          className="w-7 h-7 rounded-full bg-muted flex items-center justify-center hover:bg-muted-foreground/20"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                  <img
                    key={photos[photoIndex]?.id}
                    src={getUploadUrl(photos[photoIndex]?.photo_url) || ''}
                    alt={photos[photoIndex]?.caption || `Photo of ${name}`}
                    className="w-full rounded-xl object-cover max-h-64"
                  />
                  {(photos[photoIndex]?.caption || photos[photoIndex]?.created_at) && (
                    <div className="mt-2 text-center">
                      {photos[photoIndex]?.caption && (
                        <p className="text-caption text-muted-foreground">{photos[photoIndex].caption}</p>
                      )}
                      {photos[photoIndex]?.created_at && (
                        <p className="text-[10px] text-muted-foreground/50 mt-1">
                          {new Date(photos[photoIndex].created_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Stories / Fun Facts Carousel */}
              {allStories.length > 0 && (
                <div className="bg-white rounded-2xl p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-h4">✨</span>
                      <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                        {allStories.length === 1 ? 'Fun Fact' : `Fun Facts (${storyIndex + 1}/${allStories.length})`}
                      </p>
                    </div>
                    {allStories.length > 1 && (
                      <div className="flex gap-1">
                        <button
                          onClick={() => setStoryIndex((i) => (i - 1 + allStories.length) % allStories.length)}
                          className="w-7 h-7 rounded-full bg-muted flex items-center justify-center hover:bg-muted-foreground/20"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setStoryIndex((i) => (i + 1) % allStories.length)}
                          className="w-7 h-7 rounded-full bg-muted flex items-center justify-center hover:bg-muted-foreground/20"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="text-body-sm text-foreground leading-relaxed">
                    {allStories[storyIndex]?.content}
                    {allStories[storyIndex]?.created_at && (
                      <p className="text-[10px] text-muted-foreground/50 mt-2">
                        {new Date(allStories[storyIndex].created_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Video Carousel */}
              {videos.length > 0 && (
                <div className="bg-white rounded-2xl p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-h4">🎬</span>
                      <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                        {videos.length === 1 ? 'Video' : `Videos (${videoIndex + 1}/${videos.length})`}
                      </p>
                    </div>
                    {videos.length > 1 && (
                      <div className="flex gap-1">
                        <button
                          onClick={() => setVideoIndex((i) => (i - 1 + videos.length) % videos.length)}
                          className="w-7 h-7 rounded-full bg-muted flex items-center justify-center hover:bg-muted-foreground/20"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setVideoIndex((i) => (i + 1) % videos.length)}
                          className="w-7 h-7 rounded-full bg-muted flex items-center justify-center hover:bg-muted-foreground/20"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                  <video
                    key={videos[videoIndex]?.id}
                    autoPlay
                    loop
                    muted
                    controls
                    playsInline
                    className="w-full rounded-xl"
                  >
                    <source src={getUploadUrl(videos[videoIndex]?.video_url) || ''} type="video/mp4" />
                  </video>
                  {(videos[videoIndex]?.title || videos[videoIndex]?.created_at) && (
                    <div className="mt-2 text-center">
                      {videos[videoIndex]?.title && (
                        <p className="text-caption text-muted-foreground">{videos[videoIndex].title}</p>
                      )}
                      {videos[videoIndex]?.created_at && (
                        <p className="text-[10px] text-muted-foreground/50 mt-1">
                          {new Date(videos[videoIndex].created_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Close button */}
          <div className="px-5 pb-5 pt-2">
            <Button
              onClick={onClose}
              className={cn(
                'w-full rounded-full h-12 font-display font-bold text-body shadow-md',
                'bg-white hover:bg-white/90 text-foreground'
              )}
            >
              {theme.emoji} Got it!
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
