/**
 * Family Member Detail Modal
 *
 * Full details view when tapping on a family member card.
 * Shows large photo, name, relationship, fun facts, and hobbies.
 */

import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getUploadUrl } from '@/integrations/api/client';
import { cn } from '@/lib/utils';
import { Heart, Briefcase, Sparkles, X } from 'lucide-react';
import type { FamilyMemberRow } from '@/types/database';
import type { ChildProfile } from '@/types/database';
import type { RelationType } from './FamilyMemberCard';

interface FamilyMemberDetailProps {
  member: FamilyMemberRow | ChildProfile | null;
  type: RelationType;
  isOpen: boolean;
  onClose: () => void;
}

// Relationship configuration
const RELATIONSHIP_CONFIG: Record<RelationType, {
  emoji: string;
  borderColor: string;
  bgColor: string;
  gradientFrom: string;
  gradientTo: string;
}> = {
  self: {
    emoji: '💖',
    borderColor: 'border-pink-400',
    bgColor: 'bg-pink-100',
    gradientFrom: 'from-pink-100',
    gradientTo: 'to-purple-100',
  },
  parent: {
    emoji: '👑',
    borderColor: 'border-amber-400',
    bgColor: 'bg-amber-100',
    gradientFrom: 'from-amber-100',
    gradientTo: 'to-orange-100',
  },
  sibling: {
    emoji: '🎯',
    borderColor: 'border-cyan-400',
    bgColor: 'bg-cyan-100',
    gradientFrom: 'from-cyan-100',
    gradientTo: 'to-blue-100',
  },
  grandparent: {
    emoji: '🏠',
    borderColor: 'border-purple-400',
    bgColor: 'bg-purple-100',
    gradientFrom: 'from-purple-100',
    gradientTo: 'to-indigo-100',
  },
  aunt_uncle: {
    emoji: '🎁',
    borderColor: 'border-blue-400',
    bgColor: 'bg-blue-100',
    gradientFrom: 'from-blue-100',
    gradientTo: 'to-indigo-100',
  },
  cousin: {
    emoji: '🎮',
    borderColor: 'border-green-400',
    bgColor: 'bg-green-100',
    gradientFrom: 'from-green-100',
    gradientTo: 'to-emerald-100',
  },
  other: {
    emoji: '⭐',
    borderColor: 'border-gray-400',
    bgColor: 'bg-gray-100',
    gradientFrom: 'from-gray-100',
    gradientTo: 'to-slate-100',
  },
};

function isFamilyMember(member: FamilyMemberRow | ChildProfile): member is FamilyMemberRow {
  return 'relationship' in member;
}

export function FamilyMemberDetail({ member, type, isOpen, onClose }: FamilyMemberDetailProps) {
  if (!member) return null;

  const config = RELATIONSHIP_CONFIG[type];
  const name = member.name;

  // Get avatar URL
  let avatarUrl: string | undefined;
  if (isFamilyMember(member)) {
    avatarUrl = member.photo_url ? getUploadUrl(member.photo_url) : undefined;
  } else {
    avatarUrl = member.avatarUrl || undefined;
  }

  // Get details
  const relationship = isFamilyMember(member) ? member.relationship : null;
  const occupation = isFamilyMember(member) ? member.occupation : null;
  const hobbies = isFamilyMember(member) ? member.hobbies : null;
  const funFacts = isFamilyMember(member) ? member.fun_facts : null;
  const connectionDescription = isFamilyMember(member) ? member.connection_description : null;
  const isAlive = isFamilyMember(member) ? member.is_alive !== false : true;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className={cn(
          'max-w-sm mx-auto rounded-3xl border-0 p-0 overflow-hidden',
          'bg-gradient-to-b',
          config.gradientFrom,
          config.gradientTo
        )}
      >
        {/* Close button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="absolute right-3 top-3 z-10 rounded-full bg-white/50 hover:bg-white/80"
        >
          <X className="h-5 w-5" />
        </Button>

        <div className="p-6 space-y-6">
          {/* Avatar */}
          <div className="flex flex-col items-center">
            <div className="relative">
              <Avatar className={cn('h-32 w-32 border-4 shadow-lg', config.borderColor)}>
                <AvatarImage src={avatarUrl} alt={name} />
                <AvatarFallback className={cn('text-4xl font-bold', config.bgColor)}>
                  {name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="absolute -bottom-2 -right-2 text-3xl bg-white rounded-full p-2 shadow-md">
                {config.emoji}
              </span>
            </div>

            {/* Name & Relationship */}
            <h2 className="mt-4 text-2xl font-display font-bold text-center">
              {name}
            </h2>
            {relationship && (
              <p className="text-muted-foreground capitalize">{relationship}</p>
            )}
            {!isAlive && (
              <p className="text-sm text-muted-foreground mt-1">
                Remembered with love 💕
              </p>
            )}
          </div>

          {/* Details */}
          <div className="space-y-4">
            {/* Connection description */}
            {connectionDescription && (
              <div className="bg-white/60 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Heart className="h-4 w-4 text-pink-500" />
                  <span className="text-sm font-medium text-muted-foreground">About</span>
                </div>
                <p className="text-foreground">{connectionDescription}</p>
              </div>
            )}

            {/* Occupation */}
            {occupation && (
              <div className="bg-white/60 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Briefcase className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium text-muted-foreground">Works as</span>
                </div>
                <p className="text-foreground">{occupation}</p>
              </div>
            )}

            {/* Hobbies */}
            {hobbies && hobbies.length > 0 && (
              <div className="bg-white/60 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-4 w-4 text-amber-500" />
                  <span className="text-sm font-medium text-muted-foreground">Likes</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {hobbies.map((hobby, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-white/80 rounded-full text-sm text-foreground"
                    >
                      {hobby}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Fun facts */}
            {funFacts && (
              <div className="bg-white/60 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-base">✨</span>
                  <span className="text-sm font-medium text-muted-foreground">Fun fact</span>
                </div>
                <p className="text-foreground">{funFacts}</p>
              </div>
            )}
          </div>

          {/* Close button */}
          <Button
            onClick={onClose}
            className="w-full rounded-full h-12 bg-white hover:bg-white/90 text-foreground font-display font-bold"
          >
            <Heart className="mr-2 h-5 w-5 text-pink-500 fill-pink-500" />
            Love it!
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
