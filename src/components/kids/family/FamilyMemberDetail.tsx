/**
 * Family Member Detail Modal
 *
 * Kid-friendly, scrollable detail card for family members.
 * Shows photo, name, relationship, fun facts, hobbies, and video.
 */

import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { getUploadUrl } from '@/integrations/api/client';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
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
  self:       { emoji: '💖', bg: 'from-pink-200 via-purple-100 to-pink-50',    accent: 'text-pink-600',   badge: 'bg-pink-100 text-pink-700' },
  parent:     { emoji: '👑', bg: 'from-amber-200 via-orange-100 to-amber-50',  accent: 'text-amber-600',  badge: 'bg-amber-100 text-amber-700' },
  sibling:    { emoji: '🎯', bg: 'from-cyan-200 via-blue-100 to-cyan-50',      accent: 'text-cyan-600',   badge: 'bg-cyan-100 text-cyan-700' },
  grandparent:{ emoji: '🏠', bg: 'from-purple-200 via-indigo-100 to-purple-50',accent: 'text-purple-600', badge: 'bg-purple-100 text-purple-700' },
  aunt_uncle: { emoji: '🎁', bg: 'from-blue-200 via-indigo-100 to-blue-50',    accent: 'text-blue-600',   badge: 'bg-blue-100 text-blue-700' },
  cousin:     { emoji: '🎮', bg: 'from-green-200 via-emerald-100 to-green-50', accent: 'text-green-600',  badge: 'bg-green-100 text-green-700' },
  other:      { emoji: '⭐', bg: 'from-gray-200 via-slate-100 to-gray-50',     accent: 'text-gray-600',   badge: 'bg-gray-100 text-gray-700' },
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
  const funFacts = isFamilyMember(member) ? member.fun_facts : null;
  const isAlive = isFamilyMember(member) ? member.is_alive !== false : true;
  const videoUrl = isFamilyMember(member) ? (member as any).video_url : null;
  const resolvedVideoUrl = videoUrl ? getUploadUrl(videoUrl) : null;

  // Child profile extras
  const age = !isFamilyMember(member) ? (member as any).age : null;
  const gender = !isFamilyMember(member) ? (member as any).gender : null;

  const hasDetails = connectionDescription || occupation || (hobbies && hobbies.length > 0) || funFacts || resolvedVideoUrl || age;

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
                    <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-muted-foreground/30">
                      {name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <span className="absolute -bottom-1 -right-1 text-2xl bg-white rounded-full p-1.5 shadow-md">
                  {theme.emoji}
                </span>
              </div>

              {/* Name */}
              <h2 className="mt-4 text-2xl font-display font-bold text-center text-foreground">
                {name}
              </h2>

              {/* Relationship badge */}
              {(connectionDescription || relationship) && (
                <span className={cn('mt-2 px-4 py-1 rounded-full text-sm font-semibold', theme.badge)}>
                  {connectionDescription || relationship}
                </span>
              )}

              {!isAlive && (
                <p className="mt-2 text-sm text-muted-foreground">Remembered with love 💕</p>
              )}
            </div>
          </div>

          {/* Details cards */}
          {hasDetails && (
            <div className="px-5 py-4 space-y-3">

              {/* Age & Gender (for siblings/self) */}
              {age && (
                <div className="flex items-center gap-3 bg-white rounded-2xl p-4 shadow-sm">
                  <span className="text-2xl">🎂</span>
                  <div>
                    <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Age</p>
                    <p className="text-sm font-medium text-foreground">
                      {age} years old {gender === 'boy' ? '👦' : gender === 'girl' ? '👧' : ''}
                    </p>
                  </div>
                </div>
              )}

              {/* Occupation */}
              {occupation && (
                <div className="flex items-center gap-3 bg-white rounded-2xl p-4 shadow-sm">
                  <span className="text-2xl">💼</span>
                  <div>
                    <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Works as</p>
                    <p className="text-sm font-medium text-foreground">{occupation}</p>
                  </div>
                </div>
              )}

              {/* Hobbies */}
              {hobbies && hobbies.length > 0 && (
                <div className="bg-white rounded-2xl p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-2xl">🌟</span>
                    <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Loves</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {hobbies.map((hobby, i) => (
                      <span
                        key={i}
                        className={cn(
                          'px-3 py-1.5 rounded-full text-xs font-semibold',
                          theme.badge
                        )}
                      >
                        {hobby}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Fun facts */}
              {funFacts && (
                <div className="bg-white rounded-2xl p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">✨</span>
                    <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Fun Fact</p>
                  </div>
                  <p className="text-sm text-foreground leading-relaxed">{funFacts}</p>
                </div>
              )}

              {/* Video */}
              {resolvedVideoUrl && (
                <div className="bg-white rounded-2xl p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-2xl">🎬</span>
                    <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Video</p>
                  </div>
                  <video
                    autoPlay
                    loop
                    muted
                    controls
                    playsInline
                    className="w-full rounded-xl"
                  >
                    <source src={resolvedVideoUrl} type="video/mp4" />
                  </video>
                </div>
              )}
            </div>
          )}

          {/* Close button */}
          <div className="px-5 pb-5 pt-2">
            <Button
              onClick={onClose}
              className={cn(
                'w-full rounded-full h-12 font-display font-bold text-base shadow-md',
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
