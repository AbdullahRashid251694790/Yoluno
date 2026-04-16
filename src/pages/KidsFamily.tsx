/**
 * Kids Family Tree Page — Premium Edition
 *
 * Rich, layered, animated family tree with depth, glow effects,
 * decorative frames, and premium glassmorphism.
 */

import { useMemo, useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiClient } from '@/integrations/api/client';
import { useChildProfile, useFamilyMembers } from '@/hooks/queries';
import { useChildProfiles } from '@/hooks/queries/useChildProfiles';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingSpinner, ErrorState } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Trees, Mic, Play, Pause } from 'lucide-react';
import { FamilyMemberDetail, type RelationType } from '@/components/kids/family';
import type { FamilyMemberRow, ChildProfileRow as ChildProfile } from '@/types/database';
import { cn } from '@/lib/utils';
import { ChatAvatar } from '@/components/chat/ChatAvatar';
import { getUploadUrl } from '@/integrations/api/client';
import type { VoiceClip } from '@/services/voiceVault';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const LABELS: Record<string, string> = {
  father: 'Dad', mother: 'Mom',
  paternal_grandfather: 'Grandpa', paternal_grandmother: 'Grandma',
  maternal_grandfather: 'Grandpa', maternal_grandmother: 'Grandma',
  paternal_uncle: 'Uncle', paternal_aunt: 'Aunty',
  paternal_uncle_wife: 'Aunty', paternal_aunt_husband: 'Uncle',
  maternal_uncle: 'Uncle', maternal_aunt: 'Aunty',
  maternal_uncle_wife: 'Aunty', maternal_aunt_husband: 'Uncle',
  brother: 'Brother', sister: 'Sister', cousin: 'Cousin',
};

function getLabel(m: FamilyMemberRow): string {
  const s = (m as any).specific_relationship;
  if (s && LABELS[s]) return LABELS[s];
  // Fallback: try to detect from connection_description
  const desc = (m.connection_description || '').toLowerCase();
  if (desc.includes('uncle') || desc.includes('brother')) {
    const r = m.relationship?.toLowerCase() || '';
    if (r.includes('aunt') || r.includes('uncle')) return 'Uncle';
  }
  if (desc.includes('aunt') || desc.includes('sister')) {
    const r = m.relationship?.toLowerCase() || '';
    if (r.includes('aunt') || r.includes('uncle')) return 'Aunty';
  }
  const r = m.relationship?.toLowerCase() || '';
  if (r.includes('grand')) return 'Grandparent';
  if (r.includes('parent')) return 'Parent';
  if (r.includes('aunt') || r.includes('uncle')) return 'Aunt/Uncle';
  if (r.includes('cousin')) return 'Cousin';
  return r.charAt(0).toUpperCase() + r.slice(1);
}

function getSide(m: FamilyMemberRow): string { return (m as any).side || 'direct'; }
function getRelType(m: FamilyMemberRow): RelationType {
  const r = m.relationship;
  if (r === 'parent' || r === 'step_parent' || r === 'grandparent' || r === 'sibling' || r === 'aunt_uncle' || r === 'cousin') return r === 'step_parent' ? 'parent' : r;
  return 'other';
}

// ─── Premium Person Card ─────────────────────────────────────────────────────

interface PersonProps {
  name: string;
  label: string;
  photoUrl?: string | null;
  isMe?: boolean;
  isDeceased?: boolean;
  color: string;
  glow: string;
  delay?: number;
  onClick?: () => void;
}

function Person({ name, label, photoUrl, isMe, isDeceased, color, glow, delay = 0, onClick }: PersonProps) {
  const resolved = photoUrl ? (photoUrl.startsWith('http') ? photoUrl : getUploadUrl(photoUrl)) : null;
  const sz = isMe ? 96 : 76;

  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-2 group outline-none"
      style={{ animation: `fade-in-up 0.7s cubic-bezier(0.16,1,0.3,1) ${delay}s both` }}
    >
      {/* Frame */}
      <div className="relative" style={{ width: sz, height: sz }}>
        {/* Animated glow ring */}
        <div
          className="absolute -inset-[6px] rounded-full transition-all duration-500 group-hover:scale-105"
          style={{
            background: `conic-gradient(from 0deg, ${color}00, ${color}80, ${color}00, ${color}60, ${color}00)`,
            opacity: isMe ? 0.8 : 0,
            animation: isMe ? 'spin 6s linear infinite' : undefined,
          }}
        />
        <div
          className="absolute -inset-[6px] rounded-full opacity-0 group-hover:opacity-100 transition-all duration-500"
          style={{
            background: `conic-gradient(from 0deg, ${color}00, ${color}80, ${color}00, ${color}60, ${color}00)`,
            animation: 'spin 4s linear infinite',
          }}
        />

        {/* Photo container */}
        <div
          className={cn(
            'relative w-full h-full rounded-full overflow-hidden z-10 transition-all duration-500',
            'group-hover:scale-105 group-hover:-translate-y-1 group-active:scale-95',
            'shadow-[0_4px_20px_rgba(0,0,0,0.15)]',
            'group-hover:shadow-[0_8px_32px_rgba(0,0,0,0.2)]',
            isDeceased && 'opacity-40 grayscale',
          )}
          style={{ border: `3px solid ${color}` }}
        >
          {resolved ? (
            <img src={resolved} alt={name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-body-lg font-black"
              style={{ background: `linear-gradient(135deg, ${color}30, ${color}10)`, color }}>
              {name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        {/* Me crown */}
        {isMe && (
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20 text-h4 drop-shadow-lg"
            style={{ animation: 'float 2.5s ease-in-out infinite' }}>
            👑
          </div>
        )}
      </div>

      {/* Name */}
      <div className="text-center">
        <p className={cn(
          'font-bold leading-tight',
          isMe ? 'text-body-sm' : 'text-caption',
        )} style={{ color: isMe ? color : undefined }}>
          {name}
        </p>
        <p className="text-[10px] font-semibold mt-0.5 px-2 py-0.5 rounded-full inline-block"
          style={{ background: `${color}15`, color }}>
          {label}
        </p>
      </div>

      {isDeceased && (
        <p className="text-[9px] text-muted-foreground/60 -mt-1">In loving memory 💕</p>
      )}
    </button>
  );
}

// ─── Generation Row ──────────────────────────────────────────────────────────

interface GenRowProps {
  title: string;
  emoji: string;
  color: string;
  delay?: number;
  children?: React.ReactNode;
  split?: boolean;
  leftTitle?: string;
  rightTitle?: string;
  leftChildren?: React.ReactNode;
  rightChildren?: React.ReactNode;
}

function GenRow({ title, emoji, color, delay = 0, children, split, leftTitle, rightTitle, leftChildren, rightChildren }: GenRowProps) {
  if (split) {
    return (
      <div style={{ animation: `fade-in-up 0.6s cubic-bezier(0.16,1,0.3,1) ${delay}s both` }}>
        <div className="flex gap-3">
          {leftChildren && (
            <div className="flex-1 glass-card rounded-3xl p-4">
              <p className="text-[9px] font-black uppercase tracking-[0.3em] text-center mb-3 text-primary">{leftTitle}</p>
              <div className="flex justify-center gap-4 flex-wrap">{leftChildren}</div>
            </div>
          )}
          {rightChildren && (
            <div className="flex-1 glass-card rounded-3xl p-4">
              <p className="text-[9px] font-black uppercase tracking-[0.3em] text-center mb-3 text-lolo">{rightTitle}</p>
              <div className="flex justify-center gap-4 flex-wrap">{rightChildren}</div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ animation: `fade-in-up 0.6s cubic-bezier(0.16,1,0.3,1) ${delay}s both` }}>
      <div className="glass-card rounded-3xl p-5">
        <div className="flex items-center justify-center gap-2 mb-4">
          <span className="text-body-lg">{emoji}</span>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">{title}</p>
          <span className="text-body-lg">{emoji}</span>
        </div>
        <div className="flex justify-center gap-5 flex-wrap">{children}</div>
      </div>
    </div>
  );
}

// ─── Connector ───────────────────────────────────────────────────────────────

function Connector({ color = '#3DD6C8', delay = 0 }: { color?: string; delay?: number }) {
  return (
    <div className="flex justify-center py-2" style={{ animation: `fade-in-up 0.3s ease-out ${delay}s both` }}>
      <svg width="40" height="32" viewBox="0 0 40 32">
        <path d="M20 0 C20 8, 12 12, 12 16 C12 20, 20 24, 20 32" fill="none" stroke={color} strokeWidth="2" opacity="0.3" strokeDasharray="4 3">
          <animate attributeName="stroke-dashoffset" from="0" to="-14" dur="2s" repeatCount="indefinite" />
        </path>
        <path d="M20 0 C20 8, 28 12, 28 16 C28 20, 20 24, 20 32" fill="none" stroke={color} strokeWidth="2" opacity="0.3" strokeDasharray="4 3">
          <animate attributeName="stroke-dashoffset" from="0" to="-14" dur="2s" repeatCount="indefinite" />
        </path>
        <circle cx="20" cy="16" r="3" fill={color} opacity="0.5">
          <animate attributeName="r" values="2;4;2" dur="2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.3;0.7;0.3" dur="2s" repeatCount="indefinite" />
        </circle>
      </svg>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export function KidsFamilyPage() {
  const { childId } = useParams<{ childId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: child, isLoading: childLoading } = useChildProfile(childId);
  const { data: siblings = [], isLoading: siblingsLoading } = useChildProfiles(user?.id);
  const { data: familyMembers = [], isLoading: familyLoading } = useFamilyMembers(user?.id);

  const [selectedMember, setSelectedMember] = useState<{
    member: FamilyMemberRow | ChildProfile;
    type: RelationType;
  } | null>(null);
  const [activeTab, setActiveTab] = useState<'tree' | 'voices'>('tree');
  const [voiceClips, setVoiceClips] = useState<VoiceClip[]>([]);
  const [voicesLoading, setVoicesLoading] = useState(false);
  const [playingClipId, setPlayingClipId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handleBack = () => navigate(`/kids/${childId}`);

  // Fetch voice clips when switching to voices tab
  useEffect(() => {
    if (activeTab === 'voices' && user?.id) {
      setVoicesLoading(true);
      apiClient.get('/voice-vault', { params: { limit: 100 } })
        .then((r) => setVoiceClips(r.data?.items || []))
        .catch(() => setVoiceClips([]))
        .finally(() => setVoicesLoading(false));
    }
  }, [activeTab, user?.id]);

  const handlePlayVoice = (clip: VoiceClip) => {
    if (playingClipId === clip.id) {
      audioRef.current?.pause();
      audioRef.current = null;
      setPlayingClipId(null);
      return;
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    const audio = new Audio(getUploadUrl(clip.audio_url));
    audio.play();
    audioRef.current = audio;
    setPlayingClipId(clip.id);
    audio.addEventListener('ended', () => {
      setPlayingClipId(null);
      audioRef.current = null;
    });
    // Record play
    apiClient.post(`/voice-vault/${clip.id}/play`, { childId }).catch(() => {});
  };

  // Group voice clips by family member
  const voicesByMember = useMemo(() => {
    const groups: Record<string, { name: string; clips: VoiceClip[] }> = {};
    for (const clip of voiceClips) {
      const key = clip.family_member_id || 'general';
      const name = clip.family_member_name || 'General';
      if (!groups[key]) groups[key] = { name, clips: [] };
      groups[key].clips.push(clip);
    }
    return Object.values(groups);
  }, [voiceClips]);

  // Log family visit for daily mission tracking
  useEffect(() => {
    if (childId) {
      apiClient.post(`/daily-missions/${childId}/log-visit/family_explored`).catch(() => {});
    }
  }, [childId]);

  const tree = useMemo(() => {
    const pg: FamilyMemberRow[] = [], mg: FamilyMemberRow[] = [],
      parents: FamilyMemberRow[] = [], pe: FamilyMemberRow[] = [],
      me: FamilyMemberRow[] = [], cousins: FamilyMemberRow[] = [],
      other: FamilyMemberRow[] = [];
    const cs = siblings.filter((s) => s.id !== childId);

    for (const m of familyMembers) {
      const side = getSide(m), rel = m.relationship;
      if (rel === 'grandparent') { (side === 'maternal' ? mg : pg).push(m); }
      else if (rel === 'parent' || rel === 'step_parent') { parents.push(m); }
      else if (rel === 'aunt_uncle') { (side === 'maternal' ? me : side === 'paternal' ? pe : other).push(m); }
      else if (rel === 'cousin') { cousins.push(m); }
      else if (rel !== 'sibling') { other.push(m); }
    }
    return { pg, mg, parents, pe, me, cs, cousins, other };
  }, [familyMembers, siblings, childId]);

  const totalMembers = familyMembers.length + tree.cs.length + 1;
  const isLoading = childLoading || siblingsLoading || familyLoading;
  const hasFamily = familyMembers.length > 0 || tree.cs.length > 0;

  if (isLoading) return <div className="min-h-screen bg-kids-gradient flex items-center justify-center"><LoadingSpinner /></div>;
  if (!child) return <ErrorState title="Oops!" message="We couldn't find your profile." onRetry={handleBack} retryLabel="Go Back" fullPage />;

  let d = 0;
  const nd = () => { d += 0.1; return d; };

  // Use CSS variable-based colors
  const PRIMARY = 'hsl(174, 60%, 51%)';
  const GOLD_C = 'hsl(40, 55%, 55%)';
  const LOLO_C = 'hsl(18, 76%, 60%)';
  const LUMI_C = 'hsl(270, 60%, 70%)';

  return (
    <div className="min-h-screen bg-kids-family safe-area-inset relative overflow-hidden">
      {/* Header */}
      <header className="bg-card/95 backdrop-blur-md sticky top-0 z-30 border-b border-border shadow-warm">
        <div className="flex items-center gap-3 px-4 py-3">
          <Button variant="ghost" size="icon" onClick={handleBack} className="rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <ChatAvatar buddyName="Loti" expression="caring" size="sm" />
          <div className="flex-1">
            <h1 className="text-body-lg font-display font-bold text-foreground">
              Loti's World 💛
            </h1>
            <p className="text-[11px] text-muted-foreground">{totalMembers} family members</p>
          </div>
        </div>
        {/* Tab Navigation */}
        <div className="flex px-4 pb-2 gap-2">
          <button
            onClick={() => setActiveTab('tree')}
            className={cn(
              'flex items-center gap-1.5 px-4 py-1.5 rounded-full text-caption font-bold transition-all',
              activeTab === 'tree'
                ? 'bg-lala text-white'
                : 'bg-lala/10 text-lala hover:bg-lala/20'
            )}
          >
            <Trees className="h-3.5 w-3.5" />
            Family Tree
          </button>
          <button
            onClick={() => setActiveTab('voices')}
            className={cn(
              'flex items-center gap-1.5 px-4 py-1.5 rounded-full text-caption font-bold transition-all',
              activeTab === 'voices'
                ? 'bg-lala text-white'
                : 'bg-lala/10 text-lala hover:bg-lala/20'
            )}
          >
            <Mic className="h-3.5 w-3.5" />
            Voice Vault
          </button>
        </div>
      </header>

      {activeTab === 'tree' && !hasFamily && (
        <div className="relative z-10 px-6 pt-12 flex flex-col items-center">
          <div className="glass-card rounded-3xl p-14 text-center">
            <div className="flex justify-center mb-5">
              <ChatAvatar buddyName="Loti" expression="caring" size="xl" showName />
            </div>
            <p className="text-body-lg font-display font-bold text-primary mb-2">Your tree is growing!</p>
            <p className="text-muted-foreground text-body-sm">Ask your parent to add family members</p>
          </div>
        </div>
      )}

      {activeTab === 'tree' && hasFamily && (
        <div className="relative z-10 px-4 pb-16 pt-6 space-y-1 max-w-lg mx-auto scrollbar-hide">

          {/* Grandparents */}
          {(tree.pg.length > 0 || tree.mg.length > 0) && (
            <>
              <GenRow title="" emoji="" color="" delay={nd()} split
                leftTitle="Dad's Parents" rightTitle="Mom's Parents"
                leftChildren={tree.pg.length > 0 ? tree.pg.map((m) => (
                  <Person key={m.id} name={m.name} label={getLabel(m)} photoUrl={m.photo_url}
                    isDeceased={!m.is_alive} color={PRIMARY} glow={PRIMARY} delay={nd()}
                    onClick={() => setSelectedMember({ member: m, type: 'grandparent' })} />
                )) : undefined}
                rightChildren={tree.mg.length > 0 ? tree.mg.map((m) => (
                  <Person key={m.id} name={m.name} label={getLabel(m)} photoUrl={m.photo_url}
                    isDeceased={!m.is_alive} color={LOLO_C} glow={LOLO_C} delay={nd()}
                    onClick={() => setSelectedMember({ member: m, type: 'grandparent' })} />
                )) : undefined}
              />
              <Connector color={GOLD_C} delay={nd()} />
            </>
          )}

          {/* Parents */}
          {tree.parents.length > 0 && (
            <>
              <GenRow title="Parents" emoji="💛" color={GOLD_C} delay={nd()}>
                {tree.parents.map((m) => (
                  <Person key={m.id} name={m.name} label={getLabel(m)} photoUrl={m.photo_url}
                    isDeceased={!m.is_alive} color={GOLD_C} glow={GOLD_C} delay={nd()}
                    onClick={() => setSelectedMember({ member: m, type: 'parent' })} />
                ))}
              </GenRow>
              <Connector color={PRIMARY} delay={nd()} />
            </>
          )}

          {/* Aunts & Uncles */}
          {(tree.pe.length > 0 || tree.me.length > 0) && (
            <>
              <GenRow title="" emoji="" color="" delay={nd()} split
                leftTitle="Dad's Side" rightTitle="Mom's Side"
                leftChildren={tree.pe.length > 0 ? tree.pe.map((m) => (
                  <Person key={m.id} name={m.name} label={getLabel(m)} photoUrl={m.photo_url}
                    isDeceased={!m.is_alive} color={PRIMARY} glow={PRIMARY} delay={nd()}
                    onClick={() => setSelectedMember({ member: m, type: 'aunt_uncle' })} />
                )) : undefined}
                rightChildren={tree.me.length > 0 ? tree.me.map((m) => (
                  <Person key={m.id} name={m.name} label={getLabel(m)} photoUrl={m.photo_url}
                    isDeceased={!m.is_alive} color={LOLO_C} glow={LOLO_C} delay={nd()}
                    onClick={() => setSelectedMember({ member: m, type: 'aunt_uncle' })} />
                )) : undefined}
              />
              <Connector color={LUMI_C} delay={nd()} />
            </>
          )}

          {/* Me + Siblings */}
          <GenRow title="That's Us!" emoji="⭐" color={PRIMARY} delay={nd()}>
            {tree.cs.map((sibling) => (
              <Person key={sibling.id} name={sibling.name} label="Sibling"
                photoUrl={(sibling as any).avatarUrl || (sibling as any).custom_avatar_url}
                color={LUMI_C} glow={LUMI_C} delay={nd()}
                onClick={() => setSelectedMember({ member: sibling, type: 'sibling' })} />
            ))}
            <Person
              name={child.name} label="That's Me!" isMe
              photoUrl={(child as any).avatarUrl || (child as any).custom_avatar_url}
              color={GOLD_C} glow={GOLD_C} delay={nd()}
              onClick={() => setSelectedMember({ member: child, type: 'self' })}
            />
          </GenRow>

          {/* Cousins */}
          {tree.cousins.length > 0 && (
            <>
              <Connector color={PRIMARY} delay={nd()} />
              <GenRow title="Cousins" emoji="🎮" color={PRIMARY} delay={nd()}>
                {tree.cousins.map((m) => (
                  <Person key={m.id} name={m.name} label={getLabel(m)} photoUrl={m.photo_url}
                    isDeceased={!m.is_alive} color={PRIMARY} glow={PRIMARY} delay={nd()}
                    onClick={() => setSelectedMember({ member: m, type: 'cousin' })} />
                ))}
              </GenRow>
            </>
          )}

          {/* Other */}
          {tree.other.length > 0 && (
            <>
              <Connector color={PRIMARY} delay={nd()} />
              <GenRow title="Family" emoji="💜" color={LUMI_C} delay={nd()}>
                {tree.other.map((m) => (
                  <Person key={m.id} name={m.name} label={getLabel(m)} photoUrl={m.photo_url}
                    isDeceased={!m.is_alive} color={LUMI_C} glow={LUMI_C} delay={nd()}
                    onClick={() => setSelectedMember({ member: m, type: getRelType(m) })} />
                ))}
              </GenRow>
            </>
          )}
        </div>
      )}

      {/* Voice Vault Tab */}
      {activeTab === 'voices' && (
        <div className="relative z-10 px-4 pb-16 pt-6 max-w-lg mx-auto">
          {voicesLoading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner />
            </div>
          ) : voiceClips.length === 0 ? (
            <div className="text-center py-12">
              <div className="flex justify-center mb-4">
                <ChatAvatar buddyName="Loti" expression="caring" size="xl" showName />
              </div>
              <p className="text-body-lg font-display font-bold text-foreground mb-2">No voices yet!</p>
              <p className="text-muted-foreground text-body-sm">Ask your parent to record family voices</p>
            </div>
          ) : (
            <div className="space-y-4">
              {voicesByMember.map((group) => (
                <div key={group.name} className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-sm">
                  <h3 className="text-body-sm font-display font-bold text-foreground mb-3 flex items-center gap-2">
                    <Mic className="h-4 w-4 text-lala" />
                    {group.name}
                  </h3>
                  <div className="space-y-2">
                    {group.clips.map((clip) => (
                      <button
                        key={clip.id}
                        onClick={() => handlePlayVoice(clip)}
                        className={cn(
                          'w-full flex items-center gap-3 p-3 rounded-xl transition-all',
                          playingClipId === clip.id
                            ? 'bg-lala/15 border border-lala/30'
                            : 'bg-lala/5 hover:bg-lala/10'
                        )}
                      >
                        <div className={cn(
                          'w-10 h-10 rounded-full flex items-center justify-center shrink-0',
                          playingClipId === clip.id ? 'bg-lala text-white' : 'bg-lala/20 text-lala'
                        )}>
                          {playingClipId === clip.id
                            ? <Pause className="h-5 w-5" />
                            : <Play className="h-5 w-5 ml-0.5" />
                          }
                        </div>
                        <div className="flex-1 text-left min-w-0">
                          <p className="text-body-sm font-medium text-foreground truncate">{clip.title}</p>
                          {clip.description && (
                            <p className="text-caption text-muted-foreground truncate">{clip.description}</p>
                          )}
                          <p className="text-[10px] text-muted-foreground/50 mt-0.5">
                            {clip.duration_seconds ? `${Math.round(clip.duration_seconds)}s` : ''}
                            {clip.category ? ` · ${clip.category}` : ''}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <FamilyMemberDetail
        member={selectedMember?.member || null}
        type={selectedMember?.type || 'other'}
        isOpen={!!selectedMember}
        onClose={() => setSelectedMember(null)}
      />
    </div>
  );
}
