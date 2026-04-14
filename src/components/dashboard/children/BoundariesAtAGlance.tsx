/**
 * Boundaries at a Glance
 *
 * Compact summary row for each child showing topics enabled and Luno
 * personality. Edit button navigates to the Luno Settings tab in the Safety
 * dashboard pre-selected for that child.
 */

import { Link } from 'react-router-dom';
import { Pencil } from 'lucide-react';
import { useChatBuddy } from '@/hooks/queries/useBuddyChat';
import { useChildTopicSettings } from '@/hooks/queries/useTopics';
import { getUploadUrl } from '@/integrations/api/client';
import type { ChildProfileWithAvatar } from '@/services/childProfiles';

interface BoundariesRowProps {
  child: ChildProfileWithAvatar;
  accentColor: string;
}

function BoundariesRow({ child, accentColor }: BoundariesRowProps) {
  const { data: topicSettings } = useChildTopicSettings(child.id);
  const { data: buddy } = useChatBuddy(child.id);

  const initials = child.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  // Defensive second filter on the frontend: even if the backend returns
  // anything broader than this child's age, only count topics that actually
  // include their age in the [min, max] range.
  const allReturnedTopics = topicSettings?.topics ?? [];
  const topics = allReturnedTopics.filter(
    (t) =>
      child.age >= t.age_appropriate_min &&
      child.age <= t.age_appropriate_max
  );
  const totalTopics = topics.length;
  const topicsEnabled = topics.filter((t) => t.is_allowed).length;

  const traits = buddy?.personality_traits;
  const personalityLabel = traits
    ? `Curious ${traits.curious ?? 7} · Patient ${traits.patient ?? 8} · Playful ${traits.playful ?? 5}`
    : 'Default personality';

  // Use the library avatar URL if available, otherwise the uploaded custom image
  const avatarUrl = getUploadUrl(child.avatarUrl || child.custom_avatar_url);

  return (
    <div className="rounded-xl px-6 py-4 flex flex-col md:flex-row md:items-center gap-3 md:gap-6 bg-white border border-border shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3 md:w-[180px] shrink-0">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={child.name}
            className="w-9 h-9 rounded-full object-cover ring-2 ring-white shadow-sm"
            style={{ background: accentColor }}
          />
        ) : (
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-caption font-semibold text-foreground"
            style={{ background: accentColor }}
          >
            {initials}
          </div>
        )}
        <span className="text-body-sm font-semibold text-foreground truncate">{child.name}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-6 flex-1 text-caption text-muted-foreground min-w-0">
        <span className="truncate">
          Topics: {topicSettings ? `${topicsEnabled}/${totalTopics} enabled` : '…'}
        </span>
        <span className="truncate">Luno style: {personalityLabel}</span>
      </div>

      <Link
        to={`/dashboard/safety?child=${child.id}&tab=buddy`}
        className="flex items-center gap-1.5 text-caption shrink-0 text-primary font-semibold hover:text-primary/80 hover:underline"
      >
        <Pencil className="h-3.5 w-3.5" />
        Edit
      </Link>
    </div>
  );
}

const ACCENT_COLORS = [
  'hsl(var(--primary) / 0.15)',
  'hsl(var(--lumi) / 0.2)',
  'hsl(var(--lolo) / 0.2)',
  'hsl(var(--lala) / 0.2)',
];

interface BoundariesAtAGlanceProps {
  children: ChildProfileWithAvatar[];
}

export function BoundariesAtAGlance({ children }: BoundariesAtAGlanceProps) {
  if (children.length === 0) return null;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-body-lg font-semibold text-foreground">Boundaries at a Glance</h2>
        <p className="text-body-sm text-muted-foreground">
          A summary of each child's current settings. Tap to adjust.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {children.map((child, i) => (
          <BoundariesRow
            key={child.id}
            child={child}
            accentColor={ACCENT_COLORS[i % ACCENT_COLORS.length]}
          />
        ))}
      </div>
    </div>
  );
}
