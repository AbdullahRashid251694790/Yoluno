/**
 * Boundaries at a Glance
 *
 * Compact summary row for each child showing topics enabled, Luno personality,
 * and a time placeholder. Visual style mirrors the loveable reference exactly.
 * Edit button jumps to the Luno Settings tab in the Safety dashboard for that
 * child.
 */

import { Link } from 'react-router-dom';
import { Pencil } from 'lucide-react';
import { useChatBuddy } from '@/hooks/queries/useBuddyChat';
import { useChildTopicSettings } from '@/hooks/queries/useTopics';
import { getUploadUrl } from '@/integrations/api/client';
import { getInitials } from '@/lib/utils';
import type { ChildProfileWithAvatar } from '@/services/childProfiles';

const ACCENT_BGS = ['#E8F6F4', '#F3EFF8', '#FEF0EA'];

interface BoundariesRowProps {
  child: ChildProfileWithAvatar;
  bg: string;
}

function BoundariesRow({ child, bg }: BoundariesRowProps) {
  const { data: topicSettings } = useChildTopicSettings(child.id);
  const { data: buddy } = useChatBuddy(child.id);

  const limitMin = child.session_time_limit_minutes;
  const timeLabel = limitMin
    ? limitMin >= 60
      ? `${Math.floor(limitMin / 60)}h ${limitMin % 60 > 0 ? `${limitMin % 60}m` : ''}/day`.trim()
      : `${limitMin} min/day`
    : 'No time limit set';

  // Defensive second filter on the frontend: only count topics whose age
  // range actually includes this child's age.
  const allReturnedTopics = topicSettings?.topics ?? [];
  const topics = allReturnedTopics.filter(
    (t) => child.age >= t.age_appropriate_min && child.age <= t.age_appropriate_max
  );
  const totalTopics = topics.length;
  const topicsEnabled = topics.filter((t) => t.is_allowed).length;

  const traits = buddy?.personality_traits;
  const personalityLabel = traits
    ? `Curious ${traits.curious ?? 7} · Patient ${traits.patient ?? 8} · Playful ${traits.playful ?? 5}`
    : 'Default personality';

  const avatarUrl = getUploadUrl(child.avatarUrl || child.custom_avatar_url);

  return (
    <div
      className="rounded-xl px-6 py-4 flex flex-col md:flex-row md:items-center gap-3 md:gap-6"
      style={{ background: '#FFFFFF', border: '1px solid #E8E6E1' }}
    >
      <div className="flex items-center gap-3 md:w-[140px] shrink-0">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={child.name}
            className="w-8 h-8 rounded-full object-cover"
            style={{ background: bg }}
          />
        ) : (
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-[12px]"
            style={{ background: bg, fontWeight: 600, color: '#2A2926' }}
          >
            {getInitials(child.name)}
          </div>
        )}
        <span className="text-[15px]" style={{ fontWeight: 600, color: '#2A2926' }}>
          {child.name}
        </span>
      </div>

      <div
        className="flex flex-col md:flex-row md:items-center gap-2 md:gap-6 flex-1 text-[13px]"
        style={{ color: '#6B675E' }}
      >
        <span>
          Topics: {topicSettings ? `${topicsEnabled}/${totalTopics} enabled` : '…'}
        </span>
        <span className="hidden md:inline" style={{ color: '#E8E6E1' }}>
          ·
        </span>
        <span>Luno style: {personalityLabel}</span>
        <span className="hidden md:inline" style={{ color: '#E8E6E1' }}>
          ·
        </span>
        <span>Time: {timeLabel}</span>
      </div>

      <Link
        to={`/dashboard/safety?child=${child.id}&tab=buddy`}
        className="flex items-center gap-1 text-[13px] shrink-0 hover:underline"
        style={{ color: '#3ECDC6', fontWeight: 600 }}
      >
        <Pencil size={12} /> Edit
      </Link>
    </div>
  );
}

interface BoundariesAtAGlanceProps {
  children: ChildProfileWithAvatar[];
}

export function BoundariesAtAGlance({ children }: BoundariesAtAGlanceProps) {
  if (children.length === 0) return null;

  return (
    <>
      <div className="mb-2">
        <h2 className="text-[20px] mb-1" style={{ fontWeight: 600, color: '#2A2926' }}>
          Boundaries at a Glance
        </h2>
        <p className="text-[14px] mb-5" style={{ color: '#9B978E' }}>
          A summary of each child's current settings. Tap to adjust.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {children.map((child, i) => (
          <BoundariesRow
            key={child.id}
            child={child}
            bg={ACCENT_BGS[i % ACCENT_BGS.length]}
          />
        ))}
      </div>
    </>
  );
}
