/**
 * Family Member Card
 *
 * Enhanced card for displaying family members with larger photos,
 * decorative borders, and tap-to-view interaction.
 */

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getUploadUrl } from '@/integrations/api/client';
import { cn } from '@/lib/utils';
import type { FamilyMemberRow } from '@/types/database';
import type { ChildProfile } from '@/types/database';

export type RelationType = 'self' | 'parent' | 'sibling' | 'grandparent' | 'aunt_uncle' | 'cousin' | 'other';

interface FamilyMemberCardProps {
  member: FamilyMemberRow | ChildProfile;
  type: RelationType;
  isSelf?: boolean;
  onPress?: () => void;
}

// Relationship configuration with emojis and colors
const RELATIONSHIP_CONFIG: Record<RelationType, {
  emoji: string;
  borderColor: string;
  bgColor: string;
  textColor: string;
}> = {
  self: {
    emoji: '💖',
    borderColor: 'border-pink-400',
    bgColor: 'bg-pink-100',
    textColor: 'text-pink-600',
  },
  parent: {
    emoji: '👑',
    borderColor: 'border-amber-400',
    bgColor: 'bg-amber-100',
    textColor: 'text-amber-600',
  },
  sibling: {
    emoji: '🎯',
    borderColor: 'border-cyan-400',
    bgColor: 'bg-cyan-100',
    textColor: 'text-cyan-600',
  },
  grandparent: {
    emoji: '🏠',
    borderColor: 'border-purple-400',
    bgColor: 'bg-purple-100',
    textColor: 'text-purple-600',
  },
  aunt_uncle: {
    emoji: '🎁',
    borderColor: 'border-blue-400',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-600',
  },
  cousin: {
    emoji: '🎮',
    borderColor: 'border-green-400',
    bgColor: 'bg-green-100',
    textColor: 'text-green-600',
  },
  other: {
    emoji: '⭐',
    borderColor: 'border-gray-400',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-600',
  },
};

function isFamilyMember(member: FamilyMemberRow | ChildProfile): member is FamilyMemberRow {
  return 'relationship' in member;
}

export function FamilyMemberCard({ member, type, isSelf, onPress }: FamilyMemberCardProps) {
  const config = RELATIONSHIP_CONFIG[type];
  const name = member.name;

  // Get avatar URL
  let avatarUrl: string | undefined;
  if (isFamilyMember(member)) {
    avatarUrl = member.photo_url ? getUploadUrl(member.photo_url) : undefined;
  } else {
    avatarUrl = member.avatarUrl || undefined;
  }

  // Get subtitle
  let subtitle: string;
  if (isSelf) {
    subtitle = "That's me!";
  } else if (isFamilyMember(member)) {
    subtitle = member.relationship || 'Family';
  } else {
    subtitle = `${member.age} years old`;
  }

  // Get fun fact or description
  const funFact = isFamilyMember(member)
    ? member.fun_facts || member.connection_description
    : null;

  return (
    <button
      onClick={onPress}
      className={cn(
        'w-full p-4 rounded-2xl bg-white/80 backdrop-blur-sm',
        'shadow-md hover:shadow-lg transition-all duration-200',
        'active:scale-[0.98] hover:scale-[1.02]',
        'focus:outline-none focus:ring-4 focus:ring-purple-200',
        'flex items-center gap-4 text-left',
        isSelf && 'bg-gradient-to-r from-pink-50 to-purple-50'
      )}
    >
      {/* Avatar with decorative border */}
      <div className="relative">
        <Avatar className={cn('h-20 w-20 border-4', config.borderColor)}>
          <AvatarImage src={avatarUrl} alt={name} />
          <AvatarFallback className={cn('text-2xl font-bold', config.bgColor, config.textColor)}>
            {name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        {/* Emoji badge */}
        <span className="absolute -bottom-1 -right-1 text-xl bg-white rounded-full p-1 shadow-sm">
          {config.emoji}
        </span>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h3 className="font-display font-bold text-lg text-foreground truncate">
          {name}
        </h3>
        <p className={cn('text-sm font-medium capitalize', config.textColor)}>
          {subtitle}
        </p>
        {funFact && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
            {funFact}
          </p>
        )}
      </div>
    </button>
  );
}
