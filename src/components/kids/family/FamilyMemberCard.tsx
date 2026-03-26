/**
 * Family Member Card
 *
 * Kid-friendly card with large photo, name, relationship,
 * and fun facts prominently displayed.
 */

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getUploadUrl } from '@/integrations/api/client';
import { cn } from '@/lib/utils';
import type { FamilyMemberRow } from '@/types/database';
import type { ChildProfileRow as ChildProfile } from '@/types/database';

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
  gradientFrom: string;
  gradientTo: string;
}> = {
  self: {
    emoji: '💖',
    borderColor: 'border-pink-400',
    bgColor: 'bg-pink-100',
    textColor: 'text-pink-600',
    gradientFrom: 'from-pink-50',
    gradientTo: 'to-purple-50',
  },
  parent: {
    emoji: '👑',
    borderColor: 'border-amber-400',
    bgColor: 'bg-amber-100',
    textColor: 'text-amber-600',
    gradientFrom: 'from-amber-50',
    gradientTo: 'to-orange-50',
  },
  sibling: {
    emoji: '🎯',
    borderColor: 'border-cyan-400',
    bgColor: 'bg-cyan-100',
    textColor: 'text-cyan-600',
    gradientFrom: 'from-cyan-50',
    gradientTo: 'to-blue-50',
  },
  grandparent: {
    emoji: '🏠',
    borderColor: 'border-purple-400',
    bgColor: 'bg-purple-100',
    textColor: 'text-purple-600',
    gradientFrom: 'from-purple-50',
    gradientTo: 'to-indigo-50',
  },
  aunt_uncle: {
    emoji: '🎁',
    borderColor: 'border-blue-400',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-600',
    gradientFrom: 'from-blue-50',
    gradientTo: 'to-indigo-50',
  },
  cousin: {
    emoji: '🎮',
    borderColor: 'border-green-400',
    bgColor: 'bg-green-100',
    textColor: 'text-green-600',
    gradientFrom: 'from-green-50',
    gradientTo: 'to-emerald-50',
  },
  other: {
    emoji: '⭐',
    borderColor: 'border-gray-400',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-600',
    gradientFrom: 'from-gray-50',
    gradientTo: 'to-slate-50',
  },
};

function isFamilyMember(member: FamilyMemberRow | ChildProfile): member is FamilyMemberRow {
  return 'relationship' in member;
}

export function FamilyMemberCard({ member, type, isSelf, onPress }: FamilyMemberCardProps) {
  const config = RELATIONSHIP_CONFIG[type];
  const name = member.name;

  // Get photo URL
  let photoUrl: string | undefined;
  if (isFamilyMember(member)) {
    photoUrl = member.photo_url ? getUploadUrl(member.photo_url) : undefined;
  } else {
    // For child profiles: avatarUrl may be a relative path (/uploads/...) that needs the API base URL
    const childMember = member as ChildProfile & { avatarUrl?: string };
    photoUrl = childMember.avatarUrl
      ? getUploadUrl(childMember.avatarUrl)
      : undefined;
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

  // Get fun fact and connection description
  const funFact = isFamilyMember(member) ? member.fun_facts : null;
  const connectionDesc = isFamilyMember(member) ? member.connection_description : null;
  const hobbies = isFamilyMember(member) ? member.hobbies : null;

  return (
    <button
      onClick={onPress}
      className={cn(
        'w-full rounded-2xl bg-white/80 backdrop-blur-sm overflow-hidden',
        'shadow-md hover:shadow-lg transition-all duration-200',
        'active:scale-[0.98] hover:scale-[1.02]',
        'focus:outline-none focus:ring-4 focus:ring-purple-200',
        'text-left'
      )}
    >
      {/* Large photo area */}
      <div className={cn(
        'relative w-full aspect-square bg-gradient-to-br',
        config.gradientFrom, config.gradientTo
      )}>
        {photoUrl ? (
          <img
            src={photoUrl}
            alt={name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className={cn(
            'w-full h-full flex items-center justify-center',
            config.bgColor
          )}>
            <span className={cn('text-5xl font-bold', config.textColor)}>
              {name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        {/* Emoji badge */}
        <span className="absolute top-2 right-2 text-2xl bg-white/90 rounded-full p-1.5 shadow-md">
          {config.emoji}
        </span>
      </div>

      {/* Info section */}
      <div className="p-3">
        <h3 className="font-display font-bold text-base text-foreground truncate">
          {name}
        </h3>
        <p className={cn('text-xs font-medium capitalize', config.textColor)}>
          {subtitle}
        </p>

        {/* Connection description */}
        {connectionDesc && (
          <p className="text-xs text-muted-foreground mt-1.5 line-clamp-1">
            {connectionDesc}
          </p>
        )}

        {/* Fun fact - prominently displayed */}
        {funFact && (
          <div className={cn(
            'mt-2 px-2.5 py-1.5 rounded-lg text-xs',
            config.bgColor, config.textColor
          )}>
            <span className="font-medium">Fun fact: </span>
            <span className="line-clamp-2">{funFact}</span>
          </div>
        )}

        {/* Hobbies preview */}
        {hobbies && hobbies.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {hobbies.slice(0, 3).map((hobby, i) => (
              <span
                key={i}
                className="px-2 py-0.5 bg-gray-100 rounded-full text-[10px] text-muted-foreground"
              >
                {hobby}
              </span>
            ))}
            {hobbies.length > 3 && (
              <span className="px-2 py-0.5 text-[10px] text-muted-foreground">
                +{hobbies.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
    </button>
  );
}
