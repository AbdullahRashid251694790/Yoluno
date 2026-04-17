/**
 * Buddy Settings Panel Component
 *
 * Allows parents to customize their child's buddy personality and name.
 * Styled to match the Safety Dashboard loveable design.
 */

import { useState, useEffect } from 'react';
import { useChatBuddy, useUpdateBuddyName, useUpdateBuddyPersonality } from '@/hooks/queries/useBuddyChat';
import { useChildProfile, useUpdateChildProfile } from '@/hooks/queries/useChildProfiles';
import { LoadingSpinner } from '@/components/shared/feedback/LoadingState';
import { Loader2, Save, Sparkles, Clock, RotateCcw } from 'lucide-react';
import type { ChatBuddy } from '@/services/buddyChat';
import lunoImage from '@/assets/landing/luno.png';
import { toast } from 'sonner';

/* ─── Range slider CSS — grey unfilled track ─── */
const sliderCSS = `
.luno-slider { -webkit-appearance: none; appearance: none; width: 100%; height: 6px; border-radius: 3px; background: #E8E6E1; outline: none; }
.luno-slider::-webkit-slider-runnable-track { height: 6px; border-radius: 3px; background: transparent; }
.luno-slider::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 18px; height: 18px; border-radius: 50%; background: #3ECDC6; cursor: pointer; margin-top: -6px; border: 2px solid #fff; box-shadow: 0 1px 3px rgba(0,0,0,0.15); }
.luno-slider::-moz-range-track { height: 6px; border-radius: 3px; background: #E8E6E1; border: none; }
.luno-slider::-moz-range-progress { height: 6px; border-radius: 3px; background: #3ECDC6; }
.luno-slider::-moz-range-thumb { width: 18px; height: 18px; border-radius: 50%; background: #3ECDC6; cursor: pointer; border: 2px solid #fff; box-shadow: 0 1px 3px rgba(0,0,0,0.15); }
`;

/* ─── Shared inline style constants (match SafetyDashboard) ─── */
const FONT = "'DM Sans', sans-serif";
const C = {
  heading: '#2A2926',
  body: '#6B675E',
  muted: '#9B978E',
  border: '#E8E6E1',
  bg: '#F5F3EE',
  teal: '#3ECDC6',
  white: '#FFFFFF',
};

function SessionTimeLimitControl({ childId, childName }: { childId: string; childName: string }) {
  const { data: child } = useChildProfile(childId);
  const updateChild = useUpdateChildProfile();

  const totalMin = child?.session_time_limit_minutes ?? 0;
  const [hours, setHours] = useState(Math.floor(totalMin / 60));
  const [minutes, setMinutes] = useState(totalMin % 60);
  const [enabled, setEnabled] = useState(totalMin > 0);

  useEffect(() => {
    const val = child?.session_time_limit_minutes ?? 0;
    setHours(Math.floor(val / 60));
    setMinutes(val % 60);
    setEnabled(val > 0);
  }, [child?.session_time_limit_minutes]);

  const handleSave = async () => {
    const total = enabled ? hours * 60 + minutes : null;
    if (enabled && (total === 0 || total === null)) {
      toast.error('Please enter at least 1 minute');
      return;
    }
    try {
      await updateChild.mutateAsync({
        id: childId,
        updates: { session_time_limit_minutes: total },
      });
      toast.success(
        total ? `Daily limit set to ${hours > 0 ? `${hours}h ` : ''}${minutes > 0 ? `${minutes}m` : ''}`.trim() : 'Daily limit removed'
      );
    } catch {
      toast.error('Failed to update session limit');
    }
  };

  return (
    <div
      className="rounded-xl border p-5"
      style={{ borderColor: C.border, background: C.white }}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Clock size={16} style={{ color: C.muted }} />
          <p style={{ fontFamily: FONT, fontSize: 15, fontWeight: 600, color: C.heading }}>
            Daily Screen Time Limit
          </p>
        </div>
        <button
          onClick={async () => {
            const newEnabled = !enabled;
            setEnabled(newEnabled);
            if (!newEnabled) {
              try {
                await updateChild.mutateAsync({
                  id: childId,
                  updates: { session_time_limit_minutes: null },
                });
                toast.success('Daily limit removed');
              } catch {
                toast.error('Failed to update');
                setEnabled(true);
              }
            }
          }}
          className="relative flex-shrink-0 rounded-full transition-colors duration-200 overflow-hidden"
          style={{ minWidth: 44, width: 44, height: 24, background: enabled ? C.teal : C.border }}
        >
          <span
            className="absolute rounded-full bg-white shadow transition-transform duration-200"
            style={{
              width: 20,
              height: 20,
              top: 2,
              left: 0,
              transform: enabled ? 'translateX(22px)' : 'translateX(2px)',
            }}
          />
        </button>
      </div>
      <p style={{ fontFamily: FONT, fontSize: 13, color: C.muted, marginBottom: 12 }}>
        {enabled
          ? `${childName} will see a "Time's up" screen after using the app for this long each day.`
          : `No limit — ${childName} can use the app as long as they want.`}
      </p>
      {enabled && (
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <input
              type="number"
              min={0}
              max={23}
              value={hours}
              onChange={(e) => setHours(Math.max(0, Math.min(23, parseInt(e.target.value) || 0)))}
              className="w-16 text-center rounded-lg border px-2 py-1.5"
              style={{ fontFamily: FONT, fontSize: 14, borderColor: C.border, color: C.heading, outline: 'none' }}
            />
            <span style={{ fontFamily: FONT, fontSize: 13, color: C.muted }}>hrs</span>
          </div>
          <div className="flex items-center gap-1.5">
            <input
              type="number"
              min={0}
              max={59}
              value={minutes}
              onChange={(e) => setMinutes(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
              className="w-16 text-center rounded-lg border px-2 py-1.5"
              style={{ fontFamily: FONT, fontSize: 14, borderColor: C.border, color: C.heading, outline: 'none' }}
            />
            <span style={{ fontFamily: FONT, fontSize: 13, color: C.muted }}>min</span>
          </div>
          <button
            onClick={handleSave}
            disabled={updateChild.isPending}
            className="px-4 py-1.5 rounded-lg transition hover:opacity-90"
            style={{ fontFamily: FONT, fontSize: 13, background: C.teal, color: C.white, fontWeight: 600 }}
          >
            {updateChild.isPending ? 'Saving...' : 'Save'}
          </button>
        </div>
      )}
    </div>
  );
}

interface BuddySettingsPanelProps {
  childId: string;
  childName: string;
}

export function BuddySettingsPanel({ childId, childName }: BuddySettingsPanelProps) {
  const { data: buddy, isLoading } = useChatBuddy(childId);
  const { mutate: updateName, isPending: isUpdatingName } = useUpdateBuddyName();
  const { mutate: updatePersonality, isPending: isUpdatingPersonality } = useUpdateBuddyPersonality();

  const [traits, setTraits] = useState({
    curious: 5,
    patient: 5,
    playful: 5,
    educational: 5,
    empathetic: 5,
  });
  const [useCustom, setUseCustom] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (buddy) {
      setTraits({
        curious: 5,
        patient: 5,
        playful: 5,
        educational: 5,
        empathetic: 5,
        ...buddy.personality_traits,
      });
      setUseCustom(buddy.use_custom_personality ?? false);
    }
  }, [buddy]);

  useEffect(() => {
    if (buddy) {
      const traitsChanged = JSON.stringify(traits) !== JSON.stringify(buddy.personality_traits);
      setHasChanges(traitsChanged);
    }
  }, [traits, buddy]);

  const handleToggleCustom = (enabled: boolean) => {
    setUseCustom(enabled);
    if (buddy) {
      updatePersonality({
        buddyId: buddy.id,
        traits,
        useCustomPersonality: enabled,
      });
    }
  };

  const handleSave = () => {
    if (!buddy) return;
    if (JSON.stringify(traits) !== JSON.stringify(buddy.personality_traits)) {
      updatePersonality({ buddyId: buddy.id, traits, useCustomPersonality: useCustom });
    }
  };

  const handleReset = () => {
    const defaultTraits = {
      curious: 5,
      patient: 5,
      playful: 5,
      educational: 5,
      empathetic: 5,
    };
    setTraits(defaultTraits);
    if (buddy) {
      updatePersonality({
        buddyId: buddy.id,
        traits: defaultTraits,
        useCustomPersonality: useCustom,
      });
    }
  };

  const traitDescriptions: Record<keyof typeof traits, string> = {
    curious: 'How often Luno asks questions and encourages exploration',
    patient: 'How calm and understanding Luno is with repeated questions',
    playful: 'How fun and silly Luno is in conversations',
    educational: 'How focused Luno is on teaching and learning opportunities',
    empathetic: 'How caring and emotionally supportive Luno is',
  };

  if (isLoading) {
    return (
      <div
        className="bg-white rounded-xl border p-10 flex flex-col items-center"
        style={{ borderColor: C.border, fontFamily: FONT }}
      >
        <LoadingSpinner size="lg" className="mb-3" />
        <p style={{ fontFamily: FONT, fontSize: 14, color: C.muted }}>Loading Luno settings...</p>
      </div>
    );
  }

  if (!buddy) {
    return (
      <div
        className="bg-white rounded-xl border p-8 text-center"
        style={{ borderColor: C.border, fontFamily: FONT }}
      >
        <p style={{ fontFamily: FONT, fontSize: 16, fontWeight: 600, color: C.heading, marginBottom: 8 }}>
          No Luno settings found
        </p>
        <p style={{ fontFamily: FONT, fontSize: 14, color: C.muted }}>
          Luno will be automatically set up when {childName} starts their first chat.
        </p>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: FONT }}>
      <style>{sliderCSS}</style>
      {/* Header card — avatar + stats */}
      <div
        className="bg-white rounded-xl border p-6 mb-5"
        style={{ borderColor: C.border }}
      >
        <div className="flex items-center gap-2 mb-1">
          <Sparkles size={18} style={{ color: C.teal }} />
          <h2 style={{ fontFamily: FONT, fontSize: 20, fontWeight: 600, color: C.heading }}>
            {childName}'s Luno Settings
          </h2>
        </div>
        <p style={{ fontFamily: FONT, fontSize: 14, color: C.muted, marginBottom: 20 }}>
          Customize Luno's personality and behavior
        </p>

        {/* Avatar row */}
        <div className="flex items-center gap-4 mb-5">
          <img
            src={buddy.buddy_avatar_url || lunoImage}
            alt="Luno"
            className="rounded-full object-cover"
            style={{ width: 56, height: 56, background: '#E8F6F4' }}
          />
          <div>
            <p style={{ fontFamily: FONT, fontSize: 16, fontWeight: 600, color: C.heading }}>Luno</p>
            <p style={{ fontFamily: FONT, fontSize: 13, color: C.muted }}>{childName}'s AI companion</p>
          </div>
        </div>

      </div>

      {/* Custom personality toggle */}
      <div
        className="bg-white rounded-xl border p-5 mb-5"
        style={{ borderColor: C.border }}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1 mr-4">
            <p style={{ fontFamily: FONT, fontSize: 15, fontWeight: 500, color: C.heading }}>
              Customize Luno's personality
            </p>
            <p style={{ fontFamily: FONT, fontSize: 13, color: C.muted, marginTop: 2 }}>
              {useCustom
                ? `Luno uses the sliders below for ${childName}.`
                : `Luno automatically adapts based on ${childName}'s age. Turn this on to adjust manually.`}
            </p>
          </div>
          <button
            onClick={() => handleToggleCustom(!useCustom)}
            disabled={isUpdatingPersonality}
            className="relative flex-shrink-0 rounded-full transition-colors duration-200 overflow-hidden"
            style={{ minWidth: 44, width: 44, height: 24, background: useCustom ? C.teal : C.border }}
          >
            <span
              className="absolute rounded-full bg-white shadow transition-transform duration-200"
              style={{
                width: 20,
                height: 20,
                top: 2,
                left: 0,
                transform: useCustom ? 'translateX(22px)' : 'translateX(2px)',
              }}
            />
          </button>
        </div>
      </div>

      {/* Personality Traits */}
      <div
        className={`bg-white rounded-xl border p-6 mb-5 ${!useCustom ? 'opacity-50 pointer-events-none select-none' : ''}`}
        style={{ borderColor: C.border }}
      >
        <h3 style={{ fontFamily: FONT, fontSize: 18, fontWeight: 600, color: C.heading, marginBottom: 4 }}>
          Personality Traits
        </h3>
        <p style={{ fontFamily: FONT, fontSize: 13, color: C.muted, marginBottom: 20 }}>
          Adjust the sliders to customize how Luno interacts with {childName}.
        </p>

        <div className="flex flex-col gap-5">
          {Object.entries(traits).map(([trait, value]) => (
            <div key={trait}>
              <div className="flex items-center justify-between mb-2">
                <p className="capitalize" style={{ fontFamily: FONT, fontSize: 14, fontWeight: 500, color: C.heading }}>
                  {trait}
                </p>
                <span style={{ fontFamily: FONT, fontSize: 13, fontWeight: 600, color: C.body }}>
                  {value}/10
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={10}
                step={1}
                value={value}
                onChange={(e) =>
                  setTraits((prev) => ({ ...prev, [trait]: parseInt(e.target.value) }))
                }
                disabled={!useCustom}
                className="luno-slider"
                style={{
                  background: `linear-gradient(to right, #3ECDC6 ${((value - 1) / 9) * 100}%, #E8E6E1 ${((value - 1) / 9) * 100}%)`,
                }}
              />
              <p style={{ fontFamily: FONT, fontSize: 12, color: C.muted, marginTop: 4 }}>
                {traitDescriptions[trait as keyof typeof traits]}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Screen Time Limit */}
      <div className="mb-5">
        <SessionTimeLimitControl childId={childId} childName={childName} />
      </div>

      {/* Unsaved changes banner */}
      {hasChanges && (
        <div
          className="rounded-xl p-4 mb-5"
          style={{ background: '#FDF6E8', borderLeft: '3px solid #D4A843' }}
        >
          <p style={{ fontFamily: FONT, fontSize: 14, color: C.body }}>
            You have unsaved changes. Click <strong>Save Changes</strong> to apply them.
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={handleSave}
          disabled={!useCustom || !hasChanges || isUpdatingName || isUpdatingPersonality}
          className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl transition hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ fontFamily: FONT, fontSize: 14, background: C.teal, color: C.white, fontWeight: 600 }}
        >
          {isUpdatingName || isUpdatingPersonality ? (
            <>
              <Loader2 size={15} className="animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save size={15} />
              Save Changes
            </>
          )}
        </button>
        <button
          onClick={handleReset}
          disabled={!useCustom || isUpdatingName || isUpdatingPersonality}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl border transition hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ fontFamily: FONT, fontSize: 14, borderColor: C.border, color: C.body, fontWeight: 500 }}
        >
          <RotateCcw size={15} />
          Reset
        </button>
      </div>
    </div>
  );
}
